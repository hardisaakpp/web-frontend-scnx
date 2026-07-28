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
import { ArrowDownTrayIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

import transferenciasService from '../services/transferenciasService'
import { type SolicitudResumen, type EstadoTransferencia, type SolicitudDetalle, etiquetaEstado, TiendaDestino, ErrorSap } from '../types'
import TablaHistorial from '../components/TablaHistorial.vue'
import { useRouter } from 'vue-router'
import DetalleSolicitudModal from '../components/DetalleSolicitudModal.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import { useWarehouseAccessType } from '@/modules/inventario/composables/useWarehouseAccessType'
import almacenesService from '../services/almacenesServices'
import { descargarBlob, mensajeDeErrorBlob } from '../utils/descargas'
import ErroresSapModal from '../components/ErroresSapModal.vue'

const authStore = useAuthStore()
const router = useRouter()

const puedeFiltrarTiendas = computed(() =>
  authStore.hasPermission('transferenciadirecta.filtro_todastiendas')
)
const { accesses, isTienda } = useWarehouseAccessType()
const almacenes = ref<TiendaDestino[]>([])

const tiendasDelUsuario = computed<Set<string>>(() => {
  const codes = new Set<string>()
  accesses.value.forEach((a) => {
    if (a?.codAlmacen) codes.add(a.codAlmacen)
    a?.warehouseGroups?.forEach((g) => g?.almacenes?.forEach((c) => codes.add(c)))
  })
  return codes
})

const opcionesOrigen = computed(() =>
  puedeFiltrarTiendas.value
    ? almacenes.value
    : almacenes.value.filter((t) => tiendasDelUsuario.value.has(t.whsCode))
)
const opcionesDestino = computed(() => almacenes.value)
const mostrarFiltroOrigen = computed(() => puedeFiltrarTiendas.value || !isTienda.value)



const inputClass =
  'w-full h-[35px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'
const miniLabel = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const ESTADOS: EstadoTransferencia[] = [
  'Borrador', 'Procesando', 'EnviadoASap', 'PendienteAprobacionSap',
  'Aprobado', 'Rechazado', 'TransferenciaCreada', 'ErrorEnvioSap',
]

const filtros = reactive({
  estado: '' as EstadoTransferencia | '',
  fechaDesde: '',
  fechaHasta: '',
  tiendaOrigen: '',
  tiendaDestino: '',
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
const accionPendiente = ref<'enviar' | 'definitiva' | null>(null)
const idPendiente = ref<number | null>(null)
const confirmError = ref('')

//errores sap 
const erroresAbierto = ref(false)
const erroresLista = ref<ErrorSap[]>([])
const cargandoErrores = ref(false)

const exportando = ref(false)

const confirmTitulo = computed(() =>
  accionPendiente.value === 'enviar' ? 'Enviar a aprobación' : 'Crear transferencia definitiva'
)
const confirmMensaje = computed(() =>
  accionPendiente.value === 'enviar'
    ? 'Una vez enviada, la solicitud no podrá modificarse. ¿Desea continuar?'
    : 'Se generará la transferencia en SAP y no podrá revertirse desde aquí. ¿Desea continuar?'
)
const confirmTextoOk = computed(() => (accionPendiente.value === 'enviar' ? 'Enviar' : 'Crear'))

// Abren el modal
const pedirEnviarAprobacion = (id: number) => { accionPendiente.value = 'enviar'; idPendiente.value = id; confirmAbierto.value = true }
const pedirCrearDefinitiva = (id: number) => { accionPendiente.value = 'definitiva'; idPendiente.value = id; confirmAbierto.value = true }
const cancelarConfirm = () => {
  if (confirmCargando.value) return
  confirmAbierto.value = false
  accionPendiente.value = null
  idPendiente.value = null
  confirmError.value = ''
}

const cargar = async () => {
  cargando.value = true
  error.value = ''
  try {
    const res = await transferenciasService.listar({
      pagina: pagina.value,
      tamanoPagina: tamanoPagina.value,
      estado: filtros.estado || undefined,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      tiendaOrigen: filtros.tiendaOrigen || undefined,
      tiendaDestino: filtros.tiendaDestino || undefined,
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
  try {
    almacenes.value = await almacenesService.listar('Destino')
  } catch {
  }
})

const buscar = () => { pagina.value = 1; cargar() }
const limpiarFiltros = () => {
  filtros.estado = ''
  filtros.fechaDesde = ''
  filtros.fechaHasta = ''
  filtros.tiendaOrigen = ''
  filtros.tiendaDestino = ''
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
// Enviar a aprobación (desde la lista)
const enviandoId = ref<number | null>(null)
const enviarAprobacion = async (id: number) => {
  enviandoId.value = id
  error.value = ''
  try {
    await transferenciasService.enviarAprobacion(id)
    await cargar()
  } catch (e: any) {
    const st = e?.response?.status
    const msg = e?.response?.data?.error ?? e?.response?.data?.mensaje
    if (st === 400) error.value = msg ?? 'La solicitud no tiene productos o es inválida.'
    else if (st === 409) { error.value = 'La solicitud ya no está en Borrador.'; await cargar() }
    else if (st === 404) error.value = 'La solicitud no existe.'
    else error.value = 'No se pudo enviar a aprobación.'
  } finally {
    enviandoId.value = null
  }
}


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
  try {
    if (accion === 'enviar') await transferenciasService.enviarAprobacion(id)
    else await transferenciasService.crearDefinitiva(id)

    confirmAbierto.value = false
    accionPendiente.value = null
    idPendiente.value = null
    await cargar()
  } catch (e: any) {
    confirmError.value = mensajeError(e, accion)
  } finally {
    confirmCargando.value = false
  }
}

const mensajeError = (e: any, accion: 'enviar' | 'definitiva'): string => {
  const st = e?.response?.status
  const msg = e?.response?.data?.mensaje ?? e?.response?.data?.error
  if (st === 400) return msg ?? 'La solicitud no tiene productos o es inválida.'
  if (st === 409) return msg ?? 'La solicitud ya no está en el estado requerido.'
  if (st === 422) return msg ?? 'No se pudo crear la transferencia. Intenta nuevamente.'
  if (st === 503) return msg ?? 'SAP no está disponible. Intenta más tarde.'
  if (st === 404) return 'La solicitud no existe.'
  return accion === 'enviar' ? 'No se pudo enviar a aprobación.' : 'No se pudo crear la transferencia.'
}

const exportarReporteXls = async () => {
  exportando.value = true
  error.value = ''
  try {
    const { blob, filename } = await transferenciasService.exportar({
      estado: filtros.estado || undefined,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      tiendaOrigen: filtros.tiendaOrigen || undefined,   // whsCode
      tiendaDestino: filtros.tiendaDestino || undefined,  // uBogTra
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
    <div class="flex items-center gap-4">
      <router-link to="/transferencias-stock"
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

    <section
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
          <label for="tiendaDestino" :class="miniLabel">Tienda Destino</label>
          <select id="tiendaDestino" v-model="filtros.tiendaDestino" :class="inputClass">
            <option value="">Todas</option>
            <option v-for="t in opcionesDestino" :key="t.whsCode" :value="t.uBogTra">{{ t.whsNombre }}</option>
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
        <button type="button" @click="exportarReporteXls" :disabled="exportando || totalRegistros === 0" class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg
         bg-emerald-600 hover:bg-emerald-700
         text-white font-bold text-xs
         shadow-sm transition-all
         disabled:opacity-60 disabled:cursor-not-allowed">
          <ArrowDownTrayIcon class="w-4 h-4" />
          {{ exportando ? 'Generando…' : 'Descargar Excel' }}
        </button>
      </div>
      <TablaHistorial :solicitudes="solicitudes" :cargando="cargando" @ver="verDetalle" @editar="editar"
        @enviar-aprobacion="pedirEnviarAprobacion" @crear-definitiva="pedirCrearDefinitiva" @ver-errores="verErrores" />
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
    <ModalConfirmacion :abierto="confirmAbierto" :titulo="confirmTitulo" :mensaje="confirmMensaje"
      :texto-confirmar="confirmTextoOk" :cargando="confirmCargando" :error="confirmError"
      @confirmar="ejecutarConfirmacion" @cancelar="cancelarConfirm" />

  </div>
</template>
