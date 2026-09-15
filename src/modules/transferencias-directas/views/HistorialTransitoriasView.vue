<script setup lang="ts">
/**
 * Historial de Transitorias.
 *
 * A diferencia del historial de transferencias (que filtra por tienda ORIGEN),
 * este filtra por tienda DESTINO: quien gestiona una recepción parcial es quien
 * recibe. El backend resuelve el alcance con el token; el front no manda nada extra.
 */
import { reactive, ref, computed, onMounted } from 'vue'
import { ArrowDownTrayIcon, ArrowLeftIcon, ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { descargarBlob, mensajeDeErrorBlob } from '../utils/descargas'
import { useAuthStore } from '@/stores/auth'
import { useWarehouseAccessType } from '@/modules/inventario/composables/useWarehouseAccessType'
import transitoriasService from '../services/transitoriasService'
import almacenesService from '../services/almacenesServices'
import TablaTransitorias from '../components/TablaTransitorias.vue'
import DetalleTransitoriaModal from '../components/DetalleTransitoriaModal.vue'
import {
    ErrorSap,
    etiquetaEstadoRecepcion,
    TransitoriaReverso,
    type CampoOrdenTransitoria,
    type EstadoRecepcion,
    type TiendaDestino,
    type TransitoriaDetalle,
    type TransitoriaResumen,
} from '../types'
import transferenciasService from '../services/transferenciasService'
import DetalleReversoModal from '../components/DetalleReversoModal.vue'
import ConfirmarRegularizarModal from '../components/ConfirmarRegularizarModal.vue'

const authStore = useAuthStore()
const { accesses, isTienda } = useWarehouseAccessType()

const puedeFiltrarTiendas = computed(() =>
    authStore.hasPermission('transferenciadirecta.filtro_todastiendas')
)

const inputClass =
    'w-full h-[35px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'
const miniLabel = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const ESTADOS: EstadoRecepcion[] = [
    'PendienteVerificar', 'TransitoriaAbierta', 'RecepcionParcial',
    'Cerrada', 'RegularizadaAutomatica', 'RegularizadaManual', 'RequiereRevisionManual',
]

// ── Tiendas para los filtros ─────────────────────────────────────────────────
const almacenes = ref<TiendaDestino[]>([])

const tiendasDelUsuario = computed<Set<string>>(() => {
    const codes = new Set<string>()
    accesses.value.forEach((a) => {
        if (a?.codAlmacen) codes.add(a.codAlmacen)
        a?.warehouseGroups?.forEach((g) => g?.almacenes?.forEach((c) => codes.add(c)))
    })
    return codes
})

// Espejo de Fase 1: aquí el DESTINO es lo propio del usuario, el ORIGEN es libre
const opcionesOrigen = computed(() => almacenes.value)
const opcionesDestino = computed(() =>
    puedeFiltrarTiendas.value
        ? almacenes.value
        : almacenes.value.filter((t) => tiendasDelUsuario.value.has(t.whsCode))
)
const mostrarFiltroDestino = computed(() => puedeFiltrarTiendas.value || !isTienda.value)

// ── Estado ───────────────────────────────────────────────────────────────────
const filtros = reactive({
    estado: '' as EstadoRecepcion | '',
    tiendaOrigen: '',
    tiendaDestino: '',
    fechaDesde: '',
    fechaHasta: '',
    docNum: '' as string,
})

const docNumFiltro = computed(() => {
    const n = Number(filtros.docNum)
    return filtros.docNum.trim() && !Number.isNaN(n) ? n : undefined
})

const transitorias = ref<TransitoriaResumen[]>([])
const cargando = ref(false)
const error = ref('')
const mostrarFiltros = ref(false)

const pagina = ref(1)
const tamanoPagina = ref(20)
const totalPaginas = ref(1)
const totalRegistros = ref(0)

const ordenarPor = ref<CampoOrdenTransitoria>('FechaEnvioSap')
const direccion = ref<'Asc' | 'Desc'>('Desc')

const cargar = async () => {
    cargando.value = true
    error.value = ''
    try {
        const res = await transitoriasService.listar({
            pagina: pagina.value,
            tamanoPagina: tamanoPagina.value,
            estadosRecepcion: filtros.estado ? [filtros.estado] : undefined,
            tiendaOrigen: filtros.tiendaOrigen || undefined,
            tiendaDestino: filtros.tiendaDestino || undefined,
            fechaDesde: filtros.fechaDesde || undefined,
            fechaHasta: filtros.fechaHasta || undefined,
            docNum: docNumFiltro.value,
            ordenarPor: ordenarPor.value,
            direccion: direccion.value,
        })
        transitorias.value = res.datos
        totalPaginas.value = res.totalPaginas
        totalRegistros.value = res.totalRegistros
        pagina.value = res.paginaActual
    } catch {
        error.value = 'No se pudieron cargar las transitorias.'
        transitorias.value = []
    } finally {
        cargando.value = false
    }
}

onMounted(async () => {
    await cargar()
    try {
        almacenes.value = await almacenesService.listar('Destino')
    } catch { }
})

const buscar = () => { pagina.value = 1; cargar() }
const limpiarFiltros = () => {
    filtros.estado = ''
    filtros.tiendaOrigen = ''
    filtros.tiendaDestino = ''
    filtros.fechaDesde = ''
    filtros.fechaHasta = ''
    filtros.docNum = ''
    buscar()
}
const irAPagina = (p: number) => {
    if (p >= 1 && p <= totalPaginas.value && p !== pagina.value) { pagina.value = p; cargar() }
}
const cambiarTamano = () => { pagina.value = 1; cargar() }

const ordenarPorColumna = (campo: CampoOrdenTransitoria) => {
    if (ordenarPor.value === campo) {
        direccion.value = direccion.value === 'Asc' ? 'Desc' : 'Asc'
    } else {
        ordenarPor.value = campo
        direccion.value = 'Asc'
    }
    pagina.value = 1
    cargar()
}

// ── Detalle ──────────────────────────────────────────────────────────────────
const detalleAbierto = ref(false)
const detalleActual = ref<TransitoriaDetalle | null>(null)
const cargandoDetalle = ref(false)
const detalleError = ref('')

const verDetalle = async (id: number) => {
    detalleAbierto.value = true
    detalleActual.value = null
    detalleError.value = ''
    cargandoDetalle.value = true
    try {
        detalleActual.value = await transitoriasService.obtenerDetalle(id)
    } catch {
        error.value = 'No se pudo cargar el detalle.'
        detalleAbierto.value = false
    } finally {
        cargandoDetalle.value = false
    }
}
const cerrarDetalle = () => { detalleAbierto.value = false }

// ── Sincronizar con SAP ──────────────────────────────────────────────────────
const sincronizandoId = ref<number | null>(null)

const sincronizar = async (id: number) => {
    sincronizandoId.value = id
    error.value = ''
    detalleError.value = ''
    try {
        await transitoriasService.sincronizar(id)
        await cargar()
        // Si el modal está abierto sobre esa transitoria, se refresca su detalle
        if (detalleAbierto.value && detalleActual.value?.id === id) {
            detalleActual.value = await transitoriasService.obtenerDetalle(id)
        }
    } catch (e: any) {
        const msg = e?.response?.data?.error
        // 503 = SAP no respondió a tiempo; el backend manda un mensaje explicativo
        const texto = msg ?? 'No se pudo actualizar el estado. Intentalo más tarde'
        if (detalleAbierto.value) detalleError.value = texto
        else error.value = texto
    } finally {
        sincronizandoId.value = null
    }
}

// ── Regularizar (reverso manual) ─────────────────────────────────────────────
const regularizandoId = ref<number | null>(null)
const confirmRegularizarAbierto = ref(false)
const idARegularizar = ref<number | null>(null)
const detalleRegularizar = ref<TransitoriaDetalle | null>(null)
const cargandoDetalleRegularizar = ref(false)
const errorRegularizar = ref('')

const pedirRegularizar = async (id: number) => {
    idARegularizar.value = id
    errorRegularizar.value = ''
    detalleRegularizar.value = null
    confirmRegularizarAbierto.value = true
    cargandoDetalleRegularizar.value = true
    try {
        detalleRegularizar.value = await transitoriasService.obtenerDetalle(id)
    } catch {
        errorRegularizar.value = 'No se pudo cargar el detalle de la transitoria.'
    } finally {
        cargandoDetalleRegularizar.value = false
    }
}
const cancelarRegularizar = () => {
    if (regularizandoId.value !== null) return
    confirmRegularizarAbierto.value = false
    idARegularizar.value = null
    detalleRegularizar.value = null
}

const confirmarRegularizar = async (responsable: string) => {
    if (idARegularizar.value == null) return
    const id = idARegularizar.value
    regularizandoId.value = id
    errorRegularizar.value = ''
    try {
        const res = await transitoriasService.regularizar(id, responsable)
        confirmRegularizarAbierto.value = false
        idARegularizar.value = null
        detalleRegularizar.value = null
        error.value = res.mensaje
        await cargar()
    } catch (e: any) {
        errorRegularizar.value = e?.response?.data?.error ?? 'No se pudo regularizar la transitoria.'
    } finally {
        regularizandoId.value = null
    }
}
//- VER REVEROS (DETALLE DE LA REGULARIZACIÓN) ------------
const reversoAbierto = ref(false)
const reversoActual = ref<TransitoriaReverso | null>(null)
const cargandoReverso = ref(false)
const reversoErrorSap = ref<ErrorSap[]>([])
const cargandoErrorSap = ref(false)
const reintentandoReverso = ref(false)

const verReverso = async (idTransitoria: number) => {
    reversoAbierto.value = true
    reversoActual.value = null
    reversoErrorSap.value = []
    cargandoReverso.value = true
    try {
        const reverso = await transitoriasService.obtenerReverso(idTransitoria)
        reversoActual.value = reverso
        if (reverso.estado === 'ErrorEnvioSap') {
            cargandoErrorSap.value = true
            try {
                reversoErrorSap.value = await transferenciasService.obtenerErroresSap(reverso.id)
            } finally {
                cargandoErrorSap.value = false
            }
        }
    } catch {
        error.value = 'No se pudo cargar el detalle de la regularización.'
        reversoAbierto.value = false
    } finally {
        cargandoReverso.value = false
    }
}
const cerrarReverso = () => { reversoAbierto.value = false }

const reintentarReverso = async () => {
    const reverso = reversoActual.value
    if (!reverso) return
    reintentandoReverso.value = true
    try {
        await transferenciasService.reenviarSap(reverso.id)
        await verReverso(reverso.solicitudOrigenId)
        await cargar()
    } finally {
        reintentandoReverso.value = false
    }
}

// ── Exportar a Excel ─────────────────────────────────────────────────────────
const exportando = ref(false)
const menuExportar = ref(false)

const exportarReporteXls = async (detallado = false) => {
    menuExportar.value = false
    exportando.value = true
    error.value = ''
    try {
        const { blob, filename } = await transitoriasService.exportar({
            estadosRecepcion: filtros.estado ? [filtros.estado] : undefined,
            tiendaOrigen: filtros.tiendaOrigen || undefined,
            tiendaDestino: filtros.tiendaDestino || undefined,
            fechaDesde: filtros.fechaDesde || undefined,
            fechaHasta: filtros.fechaHasta || undefined,
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
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <router-link to="/transferencias-stock/transitorias"
                    class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
                    <ArrowLeftIcon class="w-5 h-5" />
                </router-link>
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Transitorias</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Consulta el historial de transferencias de stock recibidas, unidades en tránsito y su estado.
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
                <div>
                    <label for="estadoRecepcion" :class="miniLabel">Estado</label>
                    <select id="estadoRecepcion" v-model="filtros.estado" :class="inputClass">
                        <option value="">Todos</option>
                        <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiquetaEstadoRecepcion(e) }}</option>
                    </select>
                </div>

                <div>
                    <label for="tOrigen" :class="miniLabel">Tienda Origen</label>
                    <select id="tOrigen" v-model="filtros.tiendaOrigen" :class="inputClass">
                        <option value="">Todas</option>
                        <option v-for="t in opcionesOrigen" :key="t.whsCode" :value="t.whsCode">{{ t.whsNombre }}
                        </option>
                    </select>
                </div>

                <div v-if="mostrarFiltroDestino">
                    <label for="tDestino" :class="miniLabel">Tienda Destino(Tránsito)</label>
                    <select id="tDestino" v-model="filtros.tiendaDestino" :class="inputClass">
                        <option value="">Todas</option>
                        <option v-for="t in opcionesDestino" :key="t.whsCode" :value="t.uBogTra">{{ t.uBogTra }}
                        </option>
                    </select>
                </div>

                <div>
                    <label for="fDesde" :class="miniLabel">Fecha Desde</label>
                    <input id="fDesde" v-model="filtros.fechaDesde" type="date" :class="inputClass" />
                </div>

                <div>
                    <label for="fHasta" :class="miniLabel">Fecha Hasta</label>
                    <input id="fHasta" v-model="filtros.fechaHasta" type="date" :class="inputClass" />
                </div>

                <div>
                    <label for="docNum" :class="miniLabel">N° Documento SAP</label>
                    <input id="docNum" v-model="filtros.docNum" type="text" inputmode="numeric" placeholder="Ej. 169529"
                        :class="inputClass" @keyup.enter="buscar" />
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

        <section
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Transitorias</h2>

                <div class="relative flex">
                    <button type="button" @click="exportarReporteXls(false)"
                        :disabled="exportando || totalRegistros === 0" class="inline-flex items-center justify-center gap-2 h-10 pl-4 pr-3 rounded-l-lg
             bg-emerald-600 hover:bg-emerald-700
             text-white font-bold text-xs
             shadow-sm transition-all
             disabled:opacity-60 disabled:cursor-not-allowed">
                        <ArrowDownTrayIcon class="w-4 h-4" />
                        {{ exportando ? 'Generando…' : 'Descargar Excel' }}
                    </button>
                    <button type="button" @click="menuExportar = !menuExportar"
                        :disabled="exportando || totalRegistros === 0" title="Más opciones de exportación" class="inline-flex items-center justify-center h-10 px-2 rounded-r-lg
             bg-emerald-600 hover:bg-emerald-700 border-l border-emerald-500
             text-white shadow-sm transition-all
             disabled:opacity-60 disabled:cursor-not-allowed">
                        <ChevronDownIcon class="w-4 h-4" />
                    </button>

                    <div v-if="menuExportar" class="fixed inset-0 z-10" @click="menuExportar = false"></div>

                    <div v-if="menuExportar"
                        class="absolute right-0 top-11 z-20 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                        <button type="button" @click="exportarReporteXls(false)"
                            class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <span class="block text-xs font-medium text-gray-900 dark:text-white">Resumen por
                                transitoria</span>
                            <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Una fila por
                                transferencia</span>
                        </button>
                        <button type="button" @click="exportarReporteXls(true)"
                            class="w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <span class="block text-xs font-medium text-gray-900 dark:text-white">Detalle por
                                producto</span>
                            <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Una fila por cada
                                producto de la transferencia</span>
                        </button>
                    </div>
                </div>
            </div>

            <TablaTransitorias :transitorias="transitorias" :cargando="cargando" :ordenar-por="ordenarPor"
                :direccion="direccion" :sincronizando-id="sincronizandoId" :regularizando-id="regularizandoId"
                @ver="verDetalle" @sincronizar="sincronizar" @ordenar="ordenarPorColumna"
                @regularizar="pedirRegularizar" @ver-reverso="verReverso" />

            <p v-if="error"
                class="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">
                {{ error }}
            </p>

            <div v-if="totalRegistros > 0"
                class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-6">
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ transitorias.length
                            }}</span>
                        de <span class="font-medium text-gray-900 dark:text-white">{{ totalRegistros }}</span>
                        transitorias
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="tamPagina" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Cantidad por página:
                        </label>
                        <select id="tamPagina" v-model.number="tamanoPagina" @change="cambiarTamano"
                            class="h-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs px-2 focus:ring-blue-500 focus:border-blue-500 border bg-white shadow-sm">
                            <option :value="10">10</option>
                            <option :value="20">20</option>
                            <option :value="50">50</option>
                            <option :value="100">100</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button type="button" @click="irAPagina(pagina - 1)" :disabled="pagina === 1 || cargando"
                        class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
                        Anterior
                    </button>
                    <div
                        class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                        Página {{ pagina }} de {{ totalPaginas }}
                    </div>
                    <button type="button" @click="irAPagina(pagina + 1)" :disabled="pagina >= totalPaginas || cargando"
                        class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium">
                        Siguiente
                    </button>
                </div>
            </div>
        </section>

        <DetalleTransitoriaModal :abierto="detalleAbierto" :detalle="detalleActual" :cargando="cargandoDetalle"
            :sincronizando="sincronizandoId !== null" :error="detalleError" @cerrar="cerrarDetalle"
            @sincronizar="sincronizar" />
        <ConfirmarRegularizarModal :abierto="confirmRegularizarAbierto" :detalle="detalleRegularizar"
    :cargando="cargandoDetalleRegularizar" :regularizando="regularizandoId !== null" :error="errorRegularizar"
    @confirmar="confirmarRegularizar" @cancelar="cancelarRegularizar" />

        <DetalleReversoModal :abierto="reversoAbierto" :reverso="reversoActual" :cargando="cargandoReverso"
            :errores-sap="reversoErrorSap" :cargando-errores-sap="cargandoErrorSap" :reintentando="reintentandoReverso"
            @cerrar="cerrarReverso" @reintentar="reintentarReverso" />

    </div>
</template>
