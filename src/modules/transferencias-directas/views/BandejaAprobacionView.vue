<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import transferenciasService from '../services/transferenciasService'
import TablaHistorial from '../components/TablaHistorial.vue'
import DetalleSolicitudModal from '../components/DetalleSolicitudModal.vue'
import type { SolicitudResumen, SolicitudDetalle, StockFaltante } from '../types'
import { parsearErrorSolicitud } from '../utils/erroresApi'
import { useFiltroTiendas, FILTRO_INPUT_CLASS, FILTRO_MINI_LABEL } from '../composables/useFiltroTiendas'

const solicitudes = ref<SolicitudResumen[]>([])
const cargando = ref(false)
const error = ref('')

const pagina = ref(1)
const tamanoPagina = ref(20)
const totalPaginas = ref(1)
const totalRegistros = ref(0)

// ─── Filtros de tienda (mismo criterio que el Historial) ────────────────────
const { opcionesOrigen, opcionesDestino, mostrarFiltroOrigen, cargarAlmacenes } = useFiltroTiendas()

const mostrarFiltros = ref(false)

const filtros = reactive({
  tiendaOrigen: '',
  tiendaDestino: '',
})

const inputClass = FILTRO_INPUT_CLASS
const miniLabel = FILTRO_MINI_LABEL

const cargar = async () => {
  cargando.value = true
  error.value = ''
  try {
    const res = await transferenciasService.listar({
      pagina: pagina.value,
      tamanoPagina: tamanoPagina.value,
      estado: 'PendienteAprobacion',
      tiendaOrigen: filtros.tiendaOrigen || undefined,
      tiendaDestino: filtros.tiendaDestino || undefined,
    })
    solicitudes.value = res.datos
    totalPaginas.value = res.totalPaginas
    totalRegistros.value = res.totalRegistros
    pagina.value = res.paginaActual
  } catch {
    error.value = 'No se pudieron cargar las solicitudes pendientes.'
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
  filtros.tiendaOrigen = ''
  filtros.tiendaDestino = ''
  buscar()
}

const irAPagina = (p: number) => {
  if (p >= 1 && p <= totalPaginas.value && p !== pagina.value) { pagina.value = p; cargar() }
}

// Modal de detalle en modo "bandeja" (con Aprobar/Rechazar)
const detalleAbierto = ref(false)
const detalleActual = ref<SolicitudDetalle | null>(null)
const cargandoDetalle = ref(false)
const procesando = ref(false)
const detalleError = ref('')
const detalleFaltantes = ref<StockFaltante[]>([])

const verDetalle = async (id: number) => {
  detalleAbierto.value = true
  detalleActual.value = null
  detalleError.value = ''
  detalleFaltantes.value = []
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

const aprobar = async (observacion: string) => {
  if (!detalleActual.value) return
  procesando.value = true
  detalleError.value = ''
  detalleFaltantes.value = []
  try {
    await transferenciasService.aprobar(detalleActual.value.id, { observacion: observacion || undefined })
    detalleAbierto.value = false
    await cargar()
  } catch (e: any) {
    // El 400 por stock insuficiente (RN-22) trae además el detalle de faltantes
    const { mensaje, faltantes } = parsearErrorSolicitud(e)
    detalleError.value = mensaje
    detalleFaltantes.value = faltantes ?? []
  } finally {
    procesando.value = false
  }
}

const rechazar = async (motivoRechazo: string) => {
  if (!detalleActual.value) return
  procesando.value = true
  detalleError.value = ''
  detalleFaltantes.value = []
  try {
    await transferenciasService.rechazar(detalleActual.value.id, { motivoRechazo })
    detalleAbierto.value = false
    await cargar()
  } catch (e: any) {
    const { mensaje } = parsearErrorSolicitud(e)
    detalleError.value = mensaje
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <router-link to="/transferencias-stock"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Bandeja de Aprobación</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitudes pendientes de tu aprobación.</p>
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

        <div class="flex items-center gap-3">
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

    <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <TablaHistorial :solicitudes="solicitudes" :cargando="cargando" @ver="verDetalle"
        @editar="() => {}" @enviar-aprobacion="() => {}" @crear-definitiva="() => {}" @ver-errores="() => {}"
        @reenviar-sap="() => {}" />

      <p v-if="error" class="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">{{ error }}</p>

      <div v-if="totalRegistros > 0"
        class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ totalRegistros }} solicitud(es) pendiente(s)
        </div>
        <div class="flex items-center gap-2">
          <button @click="irAPagina(pagina - 1)" :disabled="pagina === 1 || cargando"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
            Anterior
          </button>
          <div class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            Página {{ pagina }} de {{ totalPaginas }}
          </div>
          <button @click="irAPagina(pagina + 1)" :disabled="pagina >= totalPaginas || cargando"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <DetalleSolicitudModal
      :abierto="detalleAbierto"
      :detalle="detalleActual"
      :cargando="cargandoDetalle"
      modo="aprobacion"
      :procesando="procesando"
      :error="detalleError"
      :faltantes="detalleFaltantes"
      @cerrar="cerrarDetalle"
      @aprobar="aprobar"
      @rechazar="rechazar"
    />
  </div>
</template>
