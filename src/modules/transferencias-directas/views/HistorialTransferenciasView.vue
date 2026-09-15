<script setup lang="ts">
/**
 * Historial de Solicitudes Enviadas.
 *
 * Esta pantalla consulta únicamente las solicitudes cuyo ORIGEN pertenece
 * a las tiendas autorizadas para el usuario.
 *
 * El filtro de Origen representa las tiendas desde donde se generó la solicitud.
 * El filtro de Destino solo restringe el resultado, pero no define la visibilidad.
 *
 * Si en el futuro se requiere consultar las solicitudes recibidas por una tienda,
 * deberá implementarse una vista independiente ("Solicitudes Recibidas"),
 * ya que sus reglas de negocio y permisos son diferentes.
 */
import { reactive, ref, computed, onMounted } from 'vue'
import { ArrowDownTrayIcon, ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

import transferenciasService from '../services/transferenciasService'
import { type SolicitudResumen, type EstadoTransferencia, type SolicitudDetalle, etiquetaEstado, ErrorSap, type StockFaltante } from '../types'
import { parsearErrorSolicitud } from '../utils/erroresApi'
import TablaHistorial from '../components/TablaHistorial.vue'
import { useRouter } from 'vue-router'
import DetalleSolicitudModal from '../components/DetalleSolicitudModal.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'

import { useFiltroTiendas, FILTRO_INPUT_CLASS, FILTRO_MINI_LABEL } from '../composables/useFiltroTiendas'
import { descargarBlob, mensajeDeErrorBlob } from '../utils/descargas'
import ErroresSapModal from '../components/ErroresSapModal.vue'
import ModalGuiaLaar from '../components/ModalGuiaLaar.vue'

const authStore = useAuthStore()
const router = useRouter()

const { puedeFiltrarTiendas, opcionesOrigen, opcionesDestino, mostrarFiltroOrigen, cargarAlmacenes } =
  useFiltroTiendas()

// Admin visualiza todas, siempre (mismo criterio que el resto del sistema).
// Si no es Admin: el aprobador y quien ve todas las tiendas NO ven Borrador/PendienteAprobacion
// (esos estados viven en la Bandeja de Aprobación, no en el Historial).
const debeExcluirBorradorYPendiente = computed(() => {
  if (authStore.isAdmin) return false
  return authStore.hasPermission('transferenciadirecta.aprobar') || puedeFiltrarTiendas.value
})

const excluirEstadosSegunPerfil = computed<EstadoTransferencia[] | undefined>(() =>
  debeExcluirBorradorYPendiente.value ? ['Borrador', 'PendienteAprobacion'] : undefined
)

const inputClass = FILTRO_INPUT_CLASS
const miniLabel = FILTRO_MINI_LABEL

const ESTADOS_BASE: EstadoTransferencia[] = [
   'PendienteEnvioSap', 'Rechazado', 'TransferenciaCreada', 'ErrorEnvioSap',
]

const ESTADOS = computed<EstadoTransferencia[]>(() =>
  debeExcluirBorradorYPendiente.value
    ? ESTADOS_BASE
    : ['Borrador', 'PendienteAprobacion', ...ESTADOS_BASE]
)

const filtros = reactive({
  estado: '' as EstadoTransferencia | '',
  fechaDesde: '',
  fechaHasta: '',
  tiendaOrigen: '',
  tiendaDestino: '',
  docNum: '' as string,
})

/** El backend espera docNum numérico; el input es texto para poder quedar vacío. */
const docNumFiltro = computed(() => {
  const n = Number(filtros.docNum)
  return filtros.docNum.trim() && !Number.isNaN(n) ? n : undefined
})

const solicitudes = ref<SolicitudResumen[]>([])
const cargando = ref(false)
const error = ref('')

const detalleAbierto = ref(false)
const detalleActual = ref<SolicitudDetalle | null>(null)
const cargandoDetalle = ref(false)

const pagina = ref(1)
const tamanoPagina = ref(20)
const totalPaginas = ref(1)
const totalRegistros = ref(0)

const confirmAbierto = ref(false)
const confirmCargando = ref(false)
type AccionConfirmable = 'definitiva' | 'reenviar' | 'eliminar'
const accionPendiente = ref<AccionConfirmable | null>(null)
const idPendiente = ref<number | null>(null)
const confirmError = ref('')

//errores sap 
const erroresAbierto = ref(false)
const erroresLista = ref<ErrorSap[]>([])
const cargandoErrores = ref(false)

const exportando = ref(false)

// Textos del modal por acción (un mapa evita ternarios anidados al sumar acciones)
const TEXTOS_CONFIRMACION: Record<AccionConfirmable, { titulo: string; mensaje: string; ok: string }> = {
  definitiva: {
    titulo: 'Crear transferencia definitiva',
    mensaje: 'Se generará la transferencia en SAP y no podrá revertirse desde aquí. ¿Desea continuar?',
    ok: 'Crear',
  },
  reenviar: {
    titulo: 'Reintentar envío a SAP',
    mensaje: 'La solicitud se volverá a encolar para enviarse a SAP. ¿Desea continuar?',
    ok: 'Reintentar',
  },
  eliminar: {
    titulo: 'Eliminar borrador',
    mensaje: '¿Seguro que deseas eliminar este borrador? Esta acción no se puede deshacer.',
    ok: 'Eliminar',
  },
}

const textosConfirmacion = computed(() =>
  accionPendiente.value ? TEXTOS_CONFIRMACION[accionPendiente.value] : null
)
const confirmTitulo = computed(() => textosConfirmacion.value?.titulo ?? '')
const confirmMensaje = computed(() => textosConfirmacion.value?.mensaje ?? '')
const confirmTextoOk = computed(() => textosConfirmacion.value?.ok ?? 'Confirmar')
const confirmFaltantes = ref<StockFaltante[]>([])

// Abren el modal
const pedirCrearDefinitiva = (id: number) => { accionPendiente.value = 'definitiva'; idPendiente.value = id; confirmAbierto.value = true }
const pedirReenviarSap = (id: number) => { accionPendiente.value = 'reenviar'; idPendiente.value = id; confirmAbierto.value = true }
const pedirEliminar = (id: number) => { accionPendiente.value = 'eliminar'; idPendiente.value = id; confirmAbierto.value = true }
const cancelarConfirm = () => {
  if (confirmCargando.value) return
  confirmAbierto.value = false
  accionPendiente.value = null
  idPendiente.value = null
  confirmError.value = ''
  confirmFaltantes.value = []
  cargar()
}

// ─── Envío a aprobación: guía LAAR + envío ──────────────────────────────────
// La guía se pide aquí (no en el formulario) porque es el momento en que el
// usuario ya despachó y tiene el número real.
const guiaAbierto = ref(false)
const guiaCargando = ref(false)
const guiaError = ref('')
const guiaFaltantes = ref<StockFaltante[]>([])
const guiaIdPendiente = ref<number | null>(null)
const guiaActual = ref<string | null>(null)

const pedirEnviarAprobacion = (id: number) => {
  guiaIdPendiente.value = id
  guiaActual.value = solicitudes.value.find((s) => s.id === id)?.guiaEnvio ?? ''
  guiaError.value = ''
  guiaFaltantes.value = []
  guiaAbierto.value = true
}

const cerrarGuia = () => {
  if (guiaCargando.value) return
  guiaAbierto.value = false
  guiaIdPendiente.value = null
  guiaError.value = ''
  guiaFaltantes.value = []
}

/**
 * PATCH de la guía (solo si cambió) y luego POST de envío. Secuencial: si el
 * PATCH falla no se envía nada. Si el envío falla por stock, la guía ya quedó
 * persistida, así que el reintento no vuelve a pedirla.
 */
const confirmarGuiaYEnviar = async (guia: string) => {
  const id = guiaIdPendiente.value
  if (id == null || guiaCargando.value) return
  guiaCargando.value = true
  guiaError.value = ''
  guiaFaltantes.value = []
  try {
    if (guia !== (guiaActual.value ?? '').trim().toUpperCase()) {
      await transferenciasService.actualizarGuiaEnvio(id, guia)
      guiaActual.value = guia // persistida: un reintento ya no repite el PATCH
    }
    await transferenciasService.enviarAprobacion(id)
    guiaAbierto.value = false
    guiaIdPendiente.value = null
    await cargar()
  } catch (e: any) {
    const { mensaje, faltantes } = parsearErrorSolicitud(e)
    guiaError.value = mensaje
    guiaFaltantes.value = faltantes ?? []
    const st = e?.response?.status
    // 409/404: otro usuario ya movió la solicitud → refrescar para ver el estado real
    if (st === 409 || st === 404) await cargar()
  } finally {
    guiaCargando.value = false
  }
}

const mostrarFiltros = ref(false)

const ordenarPor = ref('fechaSolicitud')
const direccion = ref<'asc' | 'desc'>('desc')

const ordenarPorColumna = (campo: string) => {
  if (ordenarPor.value === campo) {
    direccion.value = direccion.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenarPor.value = campo
    direccion.value = 'asc'
  }
  pagina.value = 1
  cargar()
}

const cargar = async () => {
  cargando.value = true
  error.value = ''
  try {
    const res = await transferenciasService.listar({
      pagina: pagina.value,
      tamanoPagina: tamanoPagina.value,
      estado: filtros.estado || undefined,
      excluirEstados: excluirEstadosSegunPerfil.value,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      tiendaOrigen: filtros.tiendaOrigen || undefined,
      tiendaDestino: filtros.tiendaDestino || undefined,
      docNum: docNumFiltro.value,
      ordenarPor: ordenarPor.value,
      direccion: direccion.value,
    })
    solicitudes.value = res.datos
    totalPaginas.value = res.totalPaginas
    totalRegistros.value = res.totalRegistros
    pagina.value = res.paginaActual
  } catch {
    error.value = 'No se pudieron cargar las solicitudes.'
    solicitudes.value = []
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargar()
  await cargarAlmacenes()
})

const buscar = () => { pagina.value = 1; cargar() }
const limpiarFiltros = () => {
  filtros.estado = ''
  filtros.fechaDesde = ''
  filtros.fechaHasta = ''
  filtros.tiendaOrigen = ''
  filtros.tiendaDestino = ''
  filtros.docNum = ''
  buscar()
}
const irAPagina = (p: number) => {
  if (p >= 1 && p <= totalPaginas.value && p !== pagina.value) { pagina.value = p; cargar() }
}

const verDetalle = async (id: number) => {
  detalleAbierto.value = true
  detalleActual.value = null
  cargandoDetalle.value = true
  try {
    detalleActual.value = await transferenciasService.obtenerDetalle(id)
  } catch {
    error.value = 'No se pudo cargar el detalle.'
    detalleAbierto.value = false
  } finally {
    cargandoDetalle.value = false
  }
}
const cerrarDetalle = () => { detalleAbierto.value = false }

const editar = (id: number) => {
  router.push(`/transferencias-stock/editar/${id}`)
}

const cambiarTamano = () => { pagina.value = 1; cargar() }

const ejecutarConfirmacion = async () => {
  if (idPendiente.value == null || accionPendiente.value == null) return
  const id = idPendiente.value
  const accion = accionPendiente.value
  confirmCargando.value = true
  confirmError.value = ''
  confirmFaltantes.value = []
  try {
    if (accion === 'reenviar') await transferenciasService.reenviarSap(id)
    else if (accion === 'eliminar') await transferenciasService.eliminar(id)
    else {
      const guiaEnvio = solicitudes.value.find((s) => s.id === id)?.guiaEnvio
      await transferenciasService.crearDefinitiva(id, guiaEnvio)
    }

    confirmAbierto.value = false
    accionPendiente.value = null
    idPendiente.value = null
    await cargar()
  } catch (e: any) {
    const { faltantes } = parsearErrorSolicitud(e)
    confirmError.value = mensajeError(e, accion)
    confirmFaltantes.value = faltantes ?? []
    // 409/404: otro usuario ya actuó (o se eliminó) → refrescar para ver el estado real
    const st = e?.response?.status
    if (st === 409 || st === 404) await cargar()
  } finally {
    confirmCargando.value = false
  }
}

const MENSAJES_FALLBACK: Record<AccionConfirmable, string> = {
  definitiva: 'No se pudo crear la transferencia.',
  reenviar: 'No se pudo reintentar el envío a SAP.',
  eliminar: 'No se pudo eliminar el borrador.',
}

const mensajeError = (e: any, accion: AccionConfirmable): string => {
  const st = e?.response?.status
  const msg = e?.response?.data?.error ?? e?.response?.data?.mensaje
  if (st === 400) return msg ?? 'La solicitud no tiene productos o es inválida.'
  if (st === 409) return msg ?? 'La solicitud ya no está en el estado requerido o no existe.'
  if (st === 422) return msg ?? 'No se pudo crear la transferencia. Intenta nuevamente.'
  if (st === 503) return msg ?? 'SAP no está disponible. Intenta más tarde.'
  if (st === 404) return 'La solicitud no existe.'
  return MENSAJES_FALLBACK[accion]
}

// Menú del botón dividido de exportación
const menuExportar = ref(false)

/** detallado=false → una fila por solicitud · true → una fila por unidad. */
const exportarReporteXls = async (detallado = false) => {
  menuExportar.value = false
  exportando.value = true
  error.value = ''
  try {
    const { blob, filename } = await transferenciasService.exportar({
      estado: filtros.estado || undefined,
      excluirEstados: excluirEstadosSegunPerfil.value,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      tiendaOrigen: filtros.tiendaOrigen || undefined,   // whsCode
      tiendaDestino: filtros.tiendaDestino || undefined,  // uBogTra
      docNum: docNumFiltro.value,
      detallado,
    })
    descargarBlob(blob, filename)
  } catch (e: any) {
    const msg = await mensajeDeErrorBlob(e?.response?.data)
    error.value = msg ?? 'No se pudo exportar el Excel.'
  } finally {
    exportando.value = false
  }
}

//const erroes sap
const verErrores = async (id: number) => {
  erroresAbierto.value = true
  erroresLista.value = []
  cargandoErrores.value = true
  try {
    erroresLista.value = await transferenciasService.obtenerErroresSap(id)
  } catch {
    erroresLista.value = []
  } finally {
    cargandoErrores.value = false
  }
}
const cerrarErrores = () => { erroresAbierto.value = false }

</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <router-link to="/transferencias-stock/transferencias"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Transferencias</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consulta las solicitudes de transferencia enviadas y su estado.
          </p>
        </div>
      </div>

      <button type="button" @click="mostrarFiltros = !mostrarFiltros" :class="[
        mostrarFiltros
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
        'flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all text-sm font-medium']">
        <FunnelIcon class="w-4 h-4" />
        <span>Filtros</span>
      </button>
    </div>

    <section v-if="mostrarFiltros"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs px-5 py-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div v-if="mostrarFiltroOrigen">
          <label for="tiendaOrigen" :class="miniLabel">Tienda Origen</label>
          <select id="tiendaOrigen" v-model="filtros.tiendaOrigen" :class="inputClass">
            <option value="">Todas</option>
            <option v-for="t in opcionesOrigen" :key="t.whsCode" :value="t.whsCode">{{ t.whsNombre }}</option>
          </select>
        </div>

        <div>
          <label for="tiendaDestino" :class="miniLabel">Tienda Destino(Tránsito)</label>
          <select id="tiendaDestino" v-model="filtros.tiendaDestino" :class="inputClass">
            <option value="">Todas</option>
            <option v-for="t in opcionesDestino" :key="t.whsCode" :value="t.uBogTra">{{ t.uBogTra }}</option>
          </select>
        </div>
        <div>
          <label for="fechaDesde" :class="miniLabel">Fecha Desde</label>
          <input id="fechaDesde" v-model="filtros.fechaDesde" type="date" :class="inputClass" />
        </div>
        <div>
          <label for="fechaHasta" :class="miniLabel">Fecha Hasta</label>
          <input id="fechaHasta" v-model="filtros.fechaHasta" type="date" :class="inputClass" />
        </div>

        <div>
          <label for="Estado" :class="miniLabel">Estado</label>
          <select id="Estado" v-model="filtros.estado" :class="inputClass">
            <option value="">Todos</option>
            <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiquetaEstado(e) }}</option>
          </select>
        </div>
        <div>
          <label for="docNum" :class="miniLabel">DocNum SAP</label>
          <input id="docNum" v-model="filtros.docNum" type="text" inputmode="numeric" placeholder="Ej. 12345"
            :class="inputClass" @keyup.enter="buscar" />
        </div>

        <div class="flex items-center gap-3 ">
          <button type="button" @click="buscar"
            class="inline-flex items-center gap-2 h-[35px] px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs">
            <MagnifyingGlassIcon class="w-4 h-4" /> Buscar
          </button>
          <button type="button" @click="limpiarFiltros"
            class="h-[35px] px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>

    <section
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Historial</h2>
        <!-- Botón dividido: la acción común (resumen) es 1 clic; el detalle está en el menú -->
        <div class="relative flex">
          <button type="button" @click="exportarReporteXls(false)" :disabled="exportando || totalRegistros === 0" class="inline-flex items-center justify-center gap-2 h-10 pl-4 pr-3 rounded-l-lg
             bg-emerald-600 hover:bg-emerald-700
             text-white font-bold text-xs
             shadow-sm transition-all
             disabled:opacity-60 disabled:cursor-not-allowed">
            <ArrowDownTrayIcon class="w-4 h-4" />
            {{ exportando ? 'Generando…' : 'Descargar Excel' }}
          </button>
          <button type="button" @click="menuExportar = !menuExportar" :disabled="exportando || totalRegistros === 0"
            title="Más opciones de exportación" class="inline-flex items-center justify-center h-10 px-2 rounded-r-lg
             bg-emerald-600 hover:bg-emerald-700 border-l border-emerald-500
             text-white shadow-sm transition-all
             disabled:opacity-60 disabled:cursor-not-allowed">
            <ChevronDownIcon class="w-4 h-4" />
          </button>

          <!-- Capa invisible: un clic fuera cierra el menú -->
          <div v-if="menuExportar" class="fixed inset-0 z-10" @click="menuExportar = false"></div>

          <!-- Menú de formatos -->
          <div v-if="menuExportar"
            class="absolute right-0 top-11 z-20 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            <button type="button" @click="exportarReporteXls(false)"
              class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span class="block text-xs font-medium text-gray-900 dark:text-white">Resumen por solicitud</span>
              <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Una fila por transferencia</span>
            </button>
            <button type="button" @click="exportarReporteXls(true)"
              class="w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span class="block text-xs font-medium text-gray-900 dark:text-white">Detalle por unidad</span>
              <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Una fila por cada unidad de
                producto</span>
            </button>
          </div>
        </div>
      </div>
      <TablaHistorial :solicitudes="solicitudes" :cargando="cargando" :ordenar-por="ordenarPor" :direccion="direccion"
        @ver="verDetalle" @editar="editar" @eliminar="pedirEliminar" @enviar-aprobacion="pedirEnviarAprobacion"
        @crear-definitiva="pedirCrearDefinitiva" @ver-errores="verErrores" @reenviar-sap="pedirReenviarSap"
        @ordenar="ordenarPorColumna" />
      <ErroresSapModal :abierto="erroresAbierto" :errores="erroresLista" :cargando="cargandoErrores"
        @cerrar="cerrarErrores" />

      <p v-if="error"
        class="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">
        {{ error }}
      </p>

      <div v-if="totalRegistros > 0"
        class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ solicitudes.length }}</span>
            de <span class="font-medium text-gray-900 dark:text-white">{{ totalRegistros }}</span> solicitudes
          </div>
          <div class="flex items-center gap-2">
            <label for="tamanoPagina" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Cantidad por página:
            </label>

            <select id="tamanoPagina" v-model.number="tamanoPagina" @change="cambiarTamano"
              class="h-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs px-2 focus:ring-blue-500 focus:border-blue-500 border bg-white shadow-sm">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button @click="irAPagina(pagina - 1)" :disabled="pagina === 1 || cargando"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
            Anterior
          </button>
          <div
            class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            Página {{ pagina }} de {{ totalPaginas }}
          </div>
          <button @click="irAPagina(pagina + 1)" :disabled="pagina >= totalPaginas || cargando"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
            Siguiente
          </button>
        </div>
      </div>
    </section>
    <DetalleSolicitudModal :abierto="detalleAbierto" :detalle="detalleActual" :cargando="cargandoDetalle"
      @cerrar="cerrarDetalle" />
    <ModalGuiaLaar :abierto="guiaAbierto" :guia-actual="guiaActual" :cargando="guiaCargando" :error="guiaError"
      :faltantes="guiaFaltantes" @confirmar="confirmarGuiaYEnviar" @cancelar="cerrarGuia" />
    <ModalConfirmacion :abierto="confirmAbierto" :titulo="confirmTitulo" :mensaje="confirmMensaje"
      :texto-confirmar="confirmTextoOk" :cargando="confirmCargando" :error="confirmError" :faltantes="confirmFaltantes"
      :variante="accionPendiente === 'eliminar' ? 'peligro' : 'primary'"
      @confirmar="ejecutarConfirmacion" @cancelar="cancelarConfirm"  />

  </div>
</template>
