<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial contabilidad</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aprobaciones y negaciones realizadas por contabilidad</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadHistorial"
          >
            Refrescar
          </button>
        </div>

        <div class="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label class="text-xs text-gray-600 dark:text-gray-300">
            Desde
            <input
              v-model="fechaDesde"
              type="date"
              class="mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            />
          </label>
          <label class="text-xs text-gray-600 dark:text-gray-300">
            Hasta
            <input
              v-model="fechaHasta"
              type="date"
              class="mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            />
          </label>
          <label class="text-xs text-gray-600 dark:text-gray-300">
            Integracion
            <select
              v-model="filtroIntegracion"
              class="mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            >
              <option value="PENDIENTES">Solo pendientes</option>
              <option value="TODOS">Todos</option>
            </select>
          </label>
          <div class="flex items-end">
            <button
              type="button"
              class="w-full rounded border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm"
              @click="resetFiltros()"
            >
              Reset filtros
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o negaciones registradas.
        </div>
        <div v-else-if="groupedHistorial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay registros para el filtro seleccionado.
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="group in groupedHistorial"
            :key="group.idLiquidacion"
            class="rounded border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <div
                  v-if="getIntegrationMessage(group.idLiquidacion)"
                  class="mt-1 text-xs font-medium rounded px-2 py-0.5 inline-block"
                  :class="getIntegrationMessage(group.idLiquidacion)?.tipo === 'ok'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'"
                >
                  {{ getIntegrationMessage(group.idLiquidacion)?.texto }}
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ group.totalItems }} detalles · Tienda: {{ group.codAlmacen }} · Custodio: {{ group.nombreCustodio }} · Fecha: {{ formatDate(group.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Integracion: {{ getIntegracionEstado(group.idLiquidacion) }}
                </div>
                <div v-if="getIntegracionReferencia(group.idLiquidacion)" class="text-xs text-gray-500 dark:text-gray-400">
                  Ref: {{ getIntegracionReferencia(group.idLiquidacion) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Subtotal: {{ formatAmount(group.subtotalMonto) }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">IVA: {{ formatAmount(group.ivaMonto) }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Total: {{ formatAmount(group.totalMonto) }}</div>
                <button
                  type="button"
                  class="rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 disabled:opacity-50"
                  :disabled="integrationLoading[group.idLiquidacion] || isIntegrado(group.idLiquidacion)"
                  @click="integrarLiquidacion(group.idLiquidacion)"
                >
                  {{ integrationLoading[group.idLiquidacion] ? 'Integrando...' : 'Integrar' }}
                </button>
                <button
                  type="button"
                  class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  @click="downloadLiquidacionPdf(group.idLiquidacion)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  PDF
                </button>
                <button
                  type="button"
                  class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                  @click="toggleGroup(group.idLiquidacion)"
                >
                  {{ isGroupOpen(group.idLiquidacion) ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <div v-if="isGroupOpen(group.idLiquidacion)" class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Concepto</th>
                    <th class="py-2 pr-3">Total</th>
                    <th class="py-2 pr-3">Estado</th>
                    <th class="py-2 pr-3">Monto</th>
                    <th class="py-2 pr-3">Comentario</th>
                    <th class="py-2 pr-3">Fecha</th>
                    <th class="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in group.items" :key="item.idAprobacion">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.concepto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <span
                        :class="item.estado === 'RECHAZADO' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'"
                      >
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.montoAprobado) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.observacion || '-' }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatDate(item.fechaAprobacion) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <button
                        type="button"
                        class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                        @click="openDetalle(item)"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showDetallePanel" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/40" @click="closeDetalle"></div>
      <aside class="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
        <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="min-w-0">
            <div class="text-xs text-gray-500 dark:text-gray-400">Detalle historial contabilidad</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              #{{ selectedItem?.idAprobacion || '-' }}
            </h3>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Liquidacion #{{ selectedItem?.idLiquidacion || '-' }}
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="closeDetalle"
          >
            Cerrar
          </button>
        </div>

        <div class="p-4 overflow-y-auto space-y-5">
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 p-4">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Informacion</div>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Gasto</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.nombreGasto || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Estado</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.estado || '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Concepto</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.concepto || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Total solicitado</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? formatAmount(selectedItem.total) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Monto aprobado</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? formatAmount(selectedItem.montoAprobado) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha aprobacion</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? formatDate(selectedItem.fechaAprobacion) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Tienda</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.codAlmacen || '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Comentario</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.observacion || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Adjuntos</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  <span v-if="selectedItem">{{ adjuntosByDetalle[selectedItem.idDetalle] ?? 0 }}</span>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Detalle de consumo</div>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Subtotal Base 15%</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.subtotalConIva) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Subtotal Base 0%</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.subtotalSinIva) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Total detalle</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.total) : '-' }}</dd>
              </div>
            </dl>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Adjuntos</div>
              <button
                v-if="selectedAdjunto"
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 px-2 py-1 text-[11px] text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click.stop="downloadAdjunto"
              >
                Descargar
              </button>
            </div>
            <div v-if="selectedItem && loadingAdjuntosMap[selectedItem.idDetalle]" class="text-sm text-gray-500 dark:text-gray-400">
              Cargando adjuntos...
            </div>
            <div v-else-if="selectedItem && (adjuntosListByDetalle[selectedItem.idDetalle]?.length)">
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(adj, index) in adjuntosListByDetalle[selectedItem.idDetalle]"
                    :key="adj.idAdjunto"
                    type="button"
                    class="px-2 py-1 rounded-lg border text-xs truncate max-w-[220px] transition-colors"
                    :class="selectedAdjunto?.idAdjunto === adj.idAdjunto
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-200'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700'"
                    :title="formatAdjuntoName(adj.rutaArchivo)"
                    @click="selectedAdjuntoId = adj.idAdjunto"
                  >
                    Adjunto {{ index + 1 }}
                  </button>
                </div>

                <div
                  class="mt-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 min-h-[200px] flex items-center justify-center overflow-hidden cursor-zoom-in"
                  @click="selectedAdjunto && openAdjuntoFull()"
                >
                  <template v-if="selectedAdjunto">
                    <template v-if="isImageFile(selectedAdjunto.rutaArchivo)">
                      <img :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" alt="Vista previa" class="max-h-64 max-w-full object-contain" />
                    </template>
                    <template v-else-if="isPdfFile(selectedAdjunto.rutaArchivo)">
                      <iframe :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" class="w-full h-64 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"></iframe>
                    </template>
                    <template v-else>
                      <div class="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 px-4 text-center">
                        Previsualizacion no disponible. Usa Descargar.
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="text-xs text-gray-500 dark:text-gray-400 text-center px-4">Selecciona un adjunto para previsualizarlo.</div>
                  </template>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">Sin adjuntos.</div>
          </div>
        </div>
      </aside>

      <div v-if="showAdjuntoFull && selectedAdjunto" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4" @click.self="closeAdjuntoFull">
        <div class="relative max-w-5xl w-full max-h-[90vh] bg-gray-900 rounded-xl border border-gray-700 p-3 flex flex-col gap-3">
          <div class="flex items-center justify-between text-xs text-gray-300 gap-3">
            <span class="truncate">{{ formatAdjuntoName(selectedAdjunto.rutaArchivo) }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="px-2 py-1 rounded-md border border-gray-500 text-xs text-gray-100 hover:bg-gray-800" @click="downloadAdjunto">Descargar</button>
              <button type="button" class="px-2 py-1 rounded-md border border-gray-600 text-xs text-gray-200 hover:bg-gray-800" @click="closeAdjuntoFull">Cerrar</button>
            </div>
          </div>
          <div class="flex-1 flex items-center justify-center bg-black/60 rounded-lg p-2 overflow-auto">
            <template v-if="isImageFile(selectedAdjunto.rutaArchivo)">
              <img :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" alt="Adjunto" class="max-h-[80vh] max-w-full object-contain" />
            </template>
            <template v-else-if="isPdfFile(selectedAdjunto.rutaArchivo)">
              <iframe :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" class="w-full h-[80vh] rounded-md bg-white"></iframe>
            </template>
            <template v-else>
              <a :href="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" target="_blank" rel="noopener" class="text-indigo-300 hover:underline">Abrir en nueva pestana</a>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { createBuildAdjuntoUrl } from '../utils/buildAdjuntoUrl'
import { resolveUserNames } from '../utils/resolveUserNames'

interface LiquidacionItem {
  idLiquidacion: number
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
  cedulaCustodio: string
  estado: string
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  idGasto: string
  nombreGasto: string
  concepto: string
  ruc: string
  nombreProveedor: string
  total: number
  subtotalConIva: number
  subtotalSinIva: number
}

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idUsuario: string
  nivelAprobacion: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion?: string
}

interface HistorialItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  idUsuario: string
  usuarioNombre: string
  nombreGasto: string
  concepto: string
  total: number
  estado: string
  montoAprobado: number
  observacion: string
  tipoBase: string
  fechaAprobacion: string
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
}

interface IntegracionEstadoItem {
  estado: string
  docEntry?: string | number
  docNum?: string | number
  mensaje?: string
}

interface AdjuntoItem {
  idAdjunto: number
  idDetalle: number
  rutaArchivo: string
  fechaSubida: string
}

const router = useRouter()

const volver = () => {
  router.back()
}

/** Respuesta de Slayer al integrar liquidación */
interface SlayerIntegracionResponse {
  docEntry?: number
  docNum?: number
  DocEntry?: number
  DocNum?: number
  message?: string
  Message?: string
}

const parseIntegracionResultado = (raw: unknown, fallbackText?: string) => {
  const data = (raw ?? {}) as any

  const extractFromText = (text: string, key: 'DocEntry' | 'DocNum') => {
    const re = new RegExp(`${key}\\s*[:=]\\s*([0-9]+)`, 'i')
    const match = re.exec(text)
    return match?.[1]
  }

  const toValue = (value: unknown) => {
    if (value === null || value === undefined) return undefined
    const normalized = String(value).trim()
    return normalized || undefined
  }

  if (typeof raw === 'string') {
    const msg = raw
    return {
      docEntry: toValue(extractFromText(msg, 'DocEntry')),
      docNum: toValue(extractFromText(msg, 'DocNum')),
      mensaje: msg
    }
  }

  const mensaje = String(data?.message ?? data?.Message ?? '').trim()
  const rawText = String(fallbackText || '').trim()
  const textSource = `${mensaje} ${rawText}`.trim()
  const docEntry = toValue(data?.docEntry ?? data?.DocEntry ?? extractFromText(textSource, 'DocEntry'))
  const docNum = toValue(data?.docNum ?? data?.DocNum ?? extractFromText(textSource, 'DocNum'))

  return {
    docEntry,
    docNum,
    mensaje: mensaje || rawText || 'Integracion exitosa.'
  }
}

const loading = ref(false)
const error = ref('')
const historial = ref<HistorialItem[]>([])
const openGroups = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, LiquidacionDetalleItem[]>>({})
const integraciones = ref<Record<number, IntegracionEstadoItem>>({})
const integrationLoading = ref<Record<number, boolean>>({})
const integrationMessages = ref<Record<number, { tipo: 'ok' | 'error'; texto: string }>>({})
const aprobadorNombreById = ref<Record<string, string>>({})
const adjuntosByDetalle = ref<Record<number, number>>({})
const adjuntosListByDetalle = ref<Record<number, AdjuntoItem[]>>({})
const loadingAdjuntosMap = ref<Record<number, boolean>>({})
const selectedAdjuntoId = ref<number | null>(null)
const showAdjuntoFull = ref(false)
const showDetallePanel = ref(false)
const selectedItem = ref<HistorialItem | null>(null)

const selectedDetalle = computed(() => {
  if (!selectedItem.value) return undefined
  const detalles = detallesByLiquidacion.value[selectedItem.value.idLiquidacion] || []
  return detalles.find(d => d.idDetalle === selectedItem.value?.idDetalle)
})

const selectedAdjunto = computed(() => {
  if (!selectedItem.value) return null
  const detalleId = selectedItem.value.idDetalle
  const list = adjuntosListByDetalle.value[detalleId] || []
  if (!list.length) return null
  const found = list.find(a => a.idAdjunto === selectedAdjuntoId.value)
  return found || list[0]
})

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const slayerApi = axios.create({
  // En desarrollo se fuerza proxy local para evitar CORS del navegador
  baseURL: '/slayer-api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const buildAdjuntoUrl = createBuildAdjuntoUrl()

const formatAdjuntoName = (ruta: string) => {
  if (!ruta) return ''
  const parts = ruta.split('/')
  return parts[parts.length - 1]
}

const isImageFile = (ruta: string) => /\.(png|jpe?g|gif|webp)$/i.test(ruta)
const isPdfFile = (ruta: string) => /\.pdf$/i.test(ruta)

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const getCurrentUser = (): { id: string; name: string } => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return { id: '', name: '' }
    const user = JSON.parse(userStr) as { id?: string; fullName?: string; name?: string; userName?: string; email?: string }
    return {
      id: user.id || '',
      name: normalizeString(user.fullName ?? user.name ?? user.userName ?? user.email ?? '')
    }
  } catch {
    return { id: '', name: '' }
  }
}

const getCurrentUserId = (): string => getCurrentUser().id

const normalizeString = (value: any) => String(value ?? '').trim()

const getAprobadorNombre = (item: HistorialItem) => {
  const nombreDirecto = normalizeString(item.usuarioNombre)
  if (nombreDirecto) return nombreDirecto
  const idUsuario = normalizeString(item.idUsuario)
  if (!idUsuario) {
    // Todos los registros del historial-contabilidad pertenecen al usuario logueado;
    // usar el nombre del localStorage como fallback.
    return getCurrentUser().name || '-'
  }
  const resolved = normalizeString(aprobadorNombreById.value[idUsuario])
  if (resolved) return resolved
  // Si idUsuario coincide con el usuario actual, usar su nombre del localStorage
  const current = getCurrentUser()
  if (current.id && current.id === idUsuario && current.name) return current.name
  return idUsuario
}

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
  cedulaCustodio: normalizeString(item.cedulaCustodio ?? item.CedulaCustodio ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? '')
})

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  total: Number(item.total ?? item.Total ?? 0),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  fechaAprobacion: String(item.fechaAprobacion ?? item.FechaAprobacion ?? '')
})

const formatDateInput = (value: Date) => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const today = new Date()
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(today.getDate() - 2)

const fechaDesde = ref(formatDateInput(threeDaysAgo))
const fechaHasta = ref(formatDateInput(today))
const filtroIntegracion = ref<'PENDIENTES' | 'TODOS'>('PENDIENTES')

const getDateOnly = (value: string) => {
  const normalized = normalizeString(value)
  return normalized ? normalized.substring(0, 10) : ''
}

const resetFiltros = () => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 2)
  fechaDesde.value = formatDateInput(start)
  fechaHasta.value = formatDateInput(now)
  filtroIntegracion.value = 'PENDIENTES'
}

type AprobacionMontosByBase = {
  base15: number
  base0: number
}

const resolveTipoBase = (rawTipoBase: unknown, detalle?: LiquidacionDetalleItem): 'BASE_15' | 'BASE_0' | '' => {
  const raw = normalizeString(rawTipoBase).toUpperCase().replace(/\s+/g, '').replace(/-/g, '_')

  if (raw === 'BASE_15' || raw === 'BASE15' || raw === '15' || raw === 'IVA_15' || raw === 'IVA15') {
    return 'BASE_15'
  }
  if (raw === 'BASE_0' || raw === 'BASE0' || raw === '0' || raw === 'IVA_0' || raw === 'IVA0') {
    return 'BASE_0'
  }

  const hasBase15 = Number(detalle?.subtotalConIva ?? 0) > 0
  const hasBase0 = Number(detalle?.subtotalSinIva ?? 0) > 0
  if (hasBase15 && !hasBase0) return 'BASE_15'
  if (hasBase0 && !hasBase15) return 'BASE_0'

  return ''
}

const calculateTotalsFromBases = (montosByDetalle: Record<number, AprobacionMontosByBase>) => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const base15 = roundAmount(Object.values(montosByDetalle).reduce((acc, montos) => acc + Number(montos.base15 ?? 0), 0))
  const base0 = roundAmount(Object.values(montosByDetalle).reduce((acc, montos) => acc + Number(montos.base0 ?? 0), 0))
  const subtotal = roundAmount(base15 + base0)
  const iva = roundAmount(base15 * 0.15)
  const total = roundAmount(subtotal + iva)
  return { base15, base0, subtotal, iva, total }
}

const buildAprobacionMontosByDetalle = (
  items: HistorialItem[],
  detalleById: Record<number, LiquidacionDetalleItem> = {}
) => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const byDetalle: Record<number, AprobacionMontosByBase> = {}
  const approvedDetalleIds = new Set<number>()

  items.forEach(item => {
    const idDetalle = Number(item.idDetalle ?? 0)
    if (!idDetalle) return
    const estado = normalizeString(item.estado).toUpperCase()
    if (estado.includes('APROBAD')) {
      approvedDetalleIds.add(idDetalle)
    }
  })

  approvedDetalleIds.forEach(idDetalle => {
    const detalle = detalleById[idDetalle]
    if (!detalle) return

    const base15 = roundAmount(Math.max(0, Number(detalle.subtotalConIva ?? 0)))
    const base0 = roundAmount(Math.max(0, Number(detalle.subtotalSinIva ?? 0)))
    if (base15 > 0 || base0 > 0) {
      byDetalle[idDetalle] = { base15, base0 }
    }
  })

  // Fallback: si no vinieron subtotales en detalle, usar monto aprobado por tipo base.
  items.forEach(item => {
    const idDetalle = Number(item.idDetalle ?? 0)
    if (!idDetalle) return

    const estado = normalizeString(item.estado).toUpperCase()
    if (!estado.includes('APROBAD')) return

    if (byDetalle[idDetalle]) return

    const monto = roundAmount(Number(item.montoAprobado ?? 0))
    if (monto <= 0) return

    const detalle = detalleById[idDetalle]
    const tipoBase = resolveTipoBase(item.tipoBase, detalle)
    if (!tipoBase) return

    if (!byDetalle[idDetalle]) {
      byDetalle[idDetalle] = { base15: 0, base0: 0 }
    }

    if (tipoBase === 'BASE_15') {
      byDetalle[idDetalle].base15 = Math.max(byDetalle[idDetalle].base15, monto)
    } else if (tipoBase === 'BASE_0') {
      byDetalle[idDetalle].base0 = Math.max(byDetalle[idDetalle].base0, monto)
    }
  })

  return byDetalle
}

const groupedHistorial = computed(() => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const groups = new Map<number, HistorialItem[]>()
  historial.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  const allGroups = Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const detallesLiquidacion = detallesByLiquidacion.value[idLiquidacion] || []
    const detalleById = detallesLiquidacion.reduce<Record<number, LiquidacionDetalleItem>>((acc, detalle) => {
      acc[detalle.idDetalle] = detalle
      return acc
    }, {})
    const aprobacionesByDetalle = buildAprobacionMontosByDetalle(items, detalleById)

    let subtotalMonto = 0
    let ivaMonto = 0
    Object.values(aprobacionesByDetalle).forEach(montos => {
      const base15 = Number(montos.base15 ?? 0)
      const base0 = Number(montos.base0 ?? 0)

      if (base15 > 0) {
        subtotalMonto += base15
        ivaMonto += roundAmount(base15 * 0.15)
      }
      if (base0 > 0) subtotalMonto += base0
    })

    subtotalMonto = roundAmount(subtotalMonto)
    ivaMonto = roundAmount(ivaMonto)
    const totalMonto = roundAmount(subtotalMonto + ivaMonto)

    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      subtotalMonto,
      ivaMonto,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '-',
      nombreCustodio: base?.nombreCustodio || '-',
      fechaCreacion: base?.fechaCreacion || ''
    }
  })

  return allGroups.filter(group => {
    const fecha = getDateOnly(group.fechaCreacion)
    if (fechaDesde.value && fecha && fecha < fechaDesde.value) return false
    if (fechaHasta.value && fecha && fecha > fechaHasta.value) return false

    if (filtroIntegracion.value === 'PENDIENTES') {
      const estado = getIntegracionEstado(group.idLiquidacion).toUpperCase()
      if (estado === 'INTEGRADO') return false
    }

    return true
  })
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] === true

const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

const isIntegrado = (idLiquidacion: number) => integraciones.value[idLiquidacion]?.estado === 'INTEGRADO'

const getIntegracionEstado = (idLiquidacion: number) => {
  return integraciones.value[idLiquidacion]?.estado || 'PENDIENTE'
}

const getIntegracionReferencia = (idLiquidacion: number) => {
  const entry = integraciones.value[idLiquidacion]
  if (!entry) return ''
  if (entry.docNum) return entry.docNum
  if (entry.docEntry) return entry.docEntry
  return ''
}

const getIntegrationMessage = (idLiquidacion: number) => {
  const runtime = integrationMessages.value[idLiquidacion]
  if (runtime) return runtime

  const persisted = integraciones.value[idLiquidacion]
  if (!persisted) return null

  const estado = String(persisted.estado || '').toUpperCase()
  if (estado === 'INTEGRADO') {
    const textoPersistido = normalizeString(persisted.mensaje)
    if (textoPersistido) return { tipo: 'ok' as const, texto: textoPersistido }

    const docEntry = normalizeString(persisted.docEntry)
    const docNum = normalizeString(persisted.docNum)
    if (docEntry || docNum) {
      return { tipo: 'ok' as const, texto: `Liquidacion creada. DocEntry: ${docEntry || '-'}, DocNum: ${docNum || '-'}.` }
    }

    return { tipo: 'ok' as const, texto: 'Liquidacion integrada correctamente.' }
  }

  if (estado === 'ERROR') {
    return { tipo: 'error' as const, texto: normalizeString(persisted.mensaje) || 'Error en la integracion. Reintenta.' }
  }

  return null
}

const buildDocDate = () => {
  const now = new Date()
  return now.toISOString().substring(0, 10)
}

const CUSTODIO_CARD_CODE_STORAGE_KEY = 'cajaChicaCustodioCardCodes'

const getStoredCardCodeByCedula = (cedula: string) => {
  const cedulaNormalizada = normalizeString(cedula)
  if (!cedulaNormalizada) return ''

  try {
    const raw = localStorage.getItem(CUSTODIO_CARD_CODE_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, string>
    return normalizeString(parsed?.[cedulaNormalizada])
  } catch {
    return ''
  }
}

const saveCardCodeByCedula = (cedula: string, cardCode: string) => {
  const cedulaNormalizada = normalizeString(cedula)
  const cardCodeNormalizado = normalizeString(cardCode)
  if (!cedulaNormalizada || !cardCodeNormalizado) return

  try {
    const raw = localStorage.getItem(CUSTODIO_CARD_CODE_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    const map = typeof existing === 'object' && existing ? existing : {}
    map[cedulaNormalizada] = cardCodeNormalizado
    localStorage.setItem(CUSTODIO_CARD_CODE_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Si no se puede guardar localmente, se mantiene el flujo de integración.
  }
}

const resolveCardCodeByCedula = async (cedula: string) => {
  const cedulaNormalizada = normalizeString(cedula)
  if (!cedulaNormalizada) return ''

  const stored = getStoredCardCodeByCedula(cedulaNormalizada)
  if (stored) return stored

  try {
    const response = await cajaChicaApi.get(`/Liquidaciones/validar-custodio/${encodeURIComponent(cedulaNormalizada)}`)
    const payload = response.data as any
    const cardCode = normalizeString(payload?.cardCode ?? payload?.CardCode ?? '')
    if (cardCode) {
      saveCardCodeByCedula(cedulaNormalizada, cardCode)
      return cardCode
    }
  } catch {
    // Si falla la consulta, se usa cédula como fallback para no bloquear la integración.
  }

  return cedulaNormalizada
}

const fetchMarcaContab = async (codAlmacen: string): Promise<string> => {
  try {
    const response = await cajaChicaApi.get<{ marcaContab: string }>(
      `/Liquidaciones/get-almacen?codAlmacen=${encodeURIComponent(codAlmacen)}`
    )
    return response.data?.marcaContab || ''
  } catch {
    // Si no se encuentra el almacen, se usa el prefijo como fallback
    const prefix = codAlmacen.toUpperCase().split('-')[0]
    return prefix
  }
}

const getUCodSt = (
  detalles: LiquidacionDetalleItem[],
  montosByDetalle: Record<number, AprobacionMontosByBase>
) => {
  return detalles.some(detalle => {
    const montos = montosByDetalle[detalle.idDetalle]
    return Number(montos?.base15 ?? 0) > 0
  }) ? '01' : '02'
}

const buildDocumentLines = (
  detalles: LiquidacionDetalleItem[],
  codAlmacen: string,
  marcaContab: string,
  montosByDetalle: Record<number, AprobacionMontosByBase>
) => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

  const grouped = new Map<string, {
    accountCode: string
    itemDescription: string
    quantity: number
    unitPrice: number
    taxCode: 'IVA_15' | 'IVA_0'
  }>()

  for (const detalle of detalles) {
    const montos = montosByDetalle[detalle.idDetalle]
    if (!montos) continue

    const accountCode = normalizeString(detalle.idGasto)
    if (!accountCode) continue

    const breakdown = [] as Array<{ taxCode: 'IVA_15' | 'IVA_0'; netAmount: number }>
    if (Number(montos.base15 ?? 0) > 0) {
      breakdown.push({
        taxCode: 'IVA_15',
        netAmount: roundAmount(Number(montos.base15))
      })
    }
    if (Number(montos.base0 ?? 0) > 0) {
      breakdown.push({
        taxCode: 'IVA_0',
        netAmount: roundAmount(Number(montos.base0))
      })
    }

    for (const part of breakdown) {
      if (part.netAmount <= 0) continue
      const groupKey = `${accountCode}::${part.taxCode}`

      const current = grouped.get(groupKey)
      if (current) {
        // Para evitar multiplicaciones no deseadas en SAP, agrupamos en una sola línea por cuenta/impuesto.
        current.quantity = 1
        current.unitPrice = current.unitPrice + part.netAmount
      } else {
        grouped.set(groupKey, {
          accountCode,
          itemDescription: detalle.nombreGasto || detalle.concepto || '',
          quantity: 1,
          unitPrice: part.netAmount,
          taxCode: part.taxCode
        })
      }
    }
  }

  return Array.from(grouped.values()).map(item => {
    return {
      AccountCode: item.accountCode,
      ItemDescription: item.itemDescription,
      Quantity: item.quantity,
      UnitPrice: roundAmount(item.unitPrice),
      TaxCode: item.taxCode,
      CostingCode: codAlmacen,
      CostingCode2: marcaContab,
      CostingCode3: 'COME'
    }
  })
}

const calculatePayloadTotals = (documentLines: Array<{ UnitPrice?: number; Quantity?: number; TaxCode?: string }>) => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

  const subtotal = roundAmount(documentLines.reduce((acc, line) => {
    const quantity = Number(line.Quantity ?? 1)
    const unitPrice = Number(line.UnitPrice ?? 0)
    return acc + (quantity * unitPrice)
  }, 0))

  const iva = roundAmount(documentLines.reduce((acc, line) => {
    if (line.TaxCode !== 'IVA_15') return acc
    const quantity = Number(line.Quantity ?? 1)
    const unitPrice = Number(line.UnitPrice ?? 0)
    return acc + (quantity * unitPrice * 0.15)
  }, 0))

  const total = roundAmount(subtotal + iva)

  return { subtotal, iva, total }
}

const calculateAprobacionTotal = (montoAprobadoByDetalle: Record<number, number>) => {
  const roundAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const total = Object.values(montoAprobadoByDetalle).reduce((acc, value) => acc + Number(value ?? 0), 0)
  return roundAmount(total)
}

const downloadJsonPayload = (idLiquidacion: number, payload: unknown) => {
  try {
    const jsonText = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const fileName = `liquidacion-${idLiquidacion}-payload-${stamp}.json`

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    // No bloquear la integración si falla la descarga del respaldo.
  }
}

const integrarLiquidacion = async (idLiquidacion: number) => {
  if (integrationLoading.value[idLiquidacion]) return

  const selectedGroup = groupedHistorial.value.find(group => group.idLiquidacion === idLiquidacion)
  if (!selectedGroup) {
    error.value = 'No se encontro la liquidacion seleccionada en la vista actual.'
    return
  }

  const liquidacion = liquidacionesMap.value[idLiquidacion]
  if (!liquidacion || !liquidacion.cedulaCustodio) {
    error.value = 'No se encontro la cedula del custodio.'
    return
  }

  integrationLoading.value[idLiquidacion] = true
  error.value = ''
  try {
    const aprobacionesLiquidacion = selectedGroup.items

    const detalleIdsAprobacion = new Set(aprobacionesLiquidacion.map(item => item.idDetalle))
    const detalles = (detallesByLiquidacion.value[idLiquidacion] || [])
      .filter(detalle => detalle.idLiquidacion === idLiquidacion && detalleIdsAprobacion.has(detalle.idDetalle))

    if (!detalles.length) {
      error.value = 'No se encontraron detalles para integrar.'
      return
    }

    const docDate = buildDocDate()
    const codAlmacen = normalizeString(liquidacion.codAlmacen)
    const [cardCodeCustodio, marcaContab] = await Promise.all([
      resolveCardCodeByCedula(liquidacion.cedulaCustodio),
      fetchMarcaContab(codAlmacen)
    ])
    const detalleById = detalles.reduce<Record<number, LiquidacionDetalleItem>>((acc, detalle) => {
      acc[detalle.idDetalle] = detalle
      return acc
    }, {})
    const montosByDetalle = buildAprobacionMontosByDetalle(aprobacionesLiquidacion, detalleById)
    const documentLines = buildDocumentLines(detalles, codAlmacen, marcaContab, montosByDetalle)
    if (!documentLines.length) {
      error.value = 'No hay valores aprobados por contabilidad para integrar.'
      return
    }

    const baseTotals = calculateTotalsFromBases(montosByDetalle)
    const totalAprobadoPantalla = baseTotals.total

    const payload = {
      CardCode: cardCodeCustodio,
      Series: 217,
      DocDate: docDate,
      Comments: 'LIQUIDACION DE COMPRA',
      DocType: 'dDocument_Service',
      DocCurrency: 'USD',
      JournalMemo: `REPOSICION CAJA CHICA ${codAlmacen}`.trim(),
      U_COD_ST: getUCodSt(detalles, montosByDetalle),
      U_tipo_comprob: '03',
      U_ORIGEN: 'C',
      U_SER_EST: '001',
      U_SER_PE: '100',
      DocumentLines: documentLines
    }

    // Respaldo del JSON exacto antes de enviar a SAP.
    downloadJsonPayload(idLiquidacion, payload)

    const totals = calculatePayloadTotals(payload.DocumentLines)
    const diferenciaTotal = Number((totals.total - totalAprobadoPantalla).toFixed(2))
    const hayDiferencia = Math.abs(diferenciaTotal) >= 0.01
    const payloadJson = JSON.stringify(payload, null, 2)

    const warningLines = hayDiferencia
      ? [
          '',
          `ADVERTENCIA: Total SAP difiere del total aprobado en ${formatAmount(diferenciaTotal)}.`
        ]
      : []

    const confirmationMessage = [
      'Resumen de montos:',
      `Total aprobado (pantalla): ${formatAmount(totalAprobadoPantalla)}`,
      `Base 15%: ${formatAmount(baseTotals.base15)}`,
      `Base 0%: ${formatAmount(baseTotals.base0)}`,
      `Subtotal base SAP (sin IVA): ${formatAmount(totals.subtotal)}`,
      `IVA SAP: ${formatAmount(totals.iva)}`,
      `Total SAP (subtotal + IVA): ${formatAmount(totals.total)}`,
      `Lineas (JSON): ${payload.DocumentLines.length}`,
      ...warningLines,
      '',
      'JSON a enviar a SAP:',
      payloadJson,
      '',
      'Esta seguro de integrar y enviar?'
    ].join('\n')

    if (!window.confirm(confirmationMessage)) {
      return
    }

    console.log('[Integracion][Payload Liquidaciones]', JSON.stringify(payload, null, 2))

    const response = await slayerApi.post<SlayerIntegracionResponse | string>('/Liquidaciones', payload)
    const responseText = normalizeString((response as any)?.request?.responseText)
    const { docEntry, docNum, mensaje } = parseIntegracionResultado(response.data, responseText)

    console.log('[Integracion][Respuesta OK]', { docEntry, docNum, mensaje })

    await cajaChicaApi.post('/Integraciones/Compras', {
      idLiquidacion,
      estado: 'INTEGRADO',
      docEntry,
      docNum,
      mensaje
    })

    integraciones.value[idLiquidacion] = {
      estado: 'INTEGRADO',
      docEntry,
      docNum,
      mensaje
    }
    const okTexto = docEntry || docNum
      ? `Liquidacion creada. DocEntry: ${docEntry || '-'}, DocNum: ${docNum || '-'}.`
      : mensaje
    integrationMessages.value[idLiquidacion] = {
      tipo: 'ok',
      texto: okTexto
    }
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message || err?.response?.data
    const mensaje = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg) || 'No se pudo integrar la liquidacion.'
    console.error('[Integracion][Error]', { idLiquidacion, mensaje, err })
    error.value = mensaje
    await cajaChicaApi.post('/Integraciones/Compras', {
      idLiquidacion,
      estado: 'ERROR',
      mensaje
    })
    integraciones.value[idLiquidacion] = {
      estado: 'ERROR',
      mensaje
    }
    integrationMessages.value[idLiquidacion] = {
      tipo: 'error',
      texto: mensaje
    }
  } finally {
    integrationLoading.value[idLiquidacion] = false
  }
}

const loadIntegraciones = async (idLiquidaciones: number[]) => {
  const entries: Record<number, IntegracionEstadoItem> = {}
  await Promise.all(idLiquidaciones.map(async id => {
    try {
      const response = await cajaChicaApi.get<IntegracionEstadoItem>(`/Integraciones/Compras/${id}`)
      const payload = (response.data || {}) as any
      entries[id] = {
        estado: payload.estado || payload.Estado || 'PENDIENTE',
        docEntry: payload.docEntry ?? payload.DocEntry,
        docNum: payload.docNum ?? payload.DocNum,
        mensaje: payload.mensaje ?? payload.Mensaje
      }
    } catch {
      entries[id] = {
        estado: 'PENDIENTE'
      }
    }
  }))
  integraciones.value = entries
}

const liquidacionesMap = ref<Record<number, LiquidacionItem>>({})

const loadHistorial = async () => {
  loading.value = true
  error.value = ''
  integrationMessages.value = {}
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const response = await cajaChicaApi.get('/Aprobaciones/historial-contabilidad', {
      params: {
        idUsuario: userId,
        fechaDesde: fechaDesde.value,
        fechaHasta: fechaHasta.value,
        soloPendientes: filtroIntegracion.value === 'PENDIENTES'
      }
    })

    const payload = response.data as any
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []

    const detalles = rows.map((item: any) => ({
      idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
      idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
      idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
      nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
      concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
      total: Number(item.total ?? item.Total ?? 0),
      subtotalConIva: Number(item.subtotalConIva ?? item.SubtotalConIva ?? item.subtotal_Con_Iva ?? 0),
      subtotalSinIva: Number(item.subtotalSinIva ?? item.SubtotalSinIva ?? item.subtotal_Sin_Iva ?? 0)
    })) as LiquidacionDetalleItem[]

    liquidacionesMap.value = (rows as any[]).reduce((acc: Record<number, LiquidacionItem>, item: any) => {
      const idLiquidacion = Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0)
      if (!idLiquidacion || acc[idLiquidacion]) return acc
      acc[idLiquidacion] = {
        idLiquidacion,
        codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
        nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
        fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
        cedulaCustodio: normalizeString(item.cedulaCustodio ?? item.CedulaCustodio ?? ''),
        estado: normalizeString(item.estadoLiquidacion ?? item.EstadoLiquidacion ?? item.estado ?? item.Estado ?? '')
      }
      return acc
    }, {} as Record<number, LiquidacionItem>)

    detallesByLiquidacion.value = detalles.reduce<Record<number, LiquidacionDetalleItem[]>>((acc: Record<number, LiquidacionDetalleItem[]>, detalle: LiquidacionDetalleItem) => {
      if (!acc[detalle.idLiquidacion]) {
        acc[detalle.idLiquidacion] = []
      }
      if (!acc[detalle.idLiquidacion].some(d => d.idDetalle === detalle.idDetalle)) {
        acc[detalle.idLiquidacion].push(detalle)
      }
      return acc
    }, {})

    const integracionByLiquidacion = (rows as any[]).reduce((acc: Record<number, IntegracionEstadoItem>, item: any) => {
      const idLiquidacion = Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0)
      if (!idLiquidacion || acc[idLiquidacion]) return acc
      acc[idLiquidacion] = {
        estado: normalizeString(item.estadoIntegracion ?? item.EstadoIntegracion ?? 'PENDIENTE') || 'PENDIENTE',
        docEntry: item.docEntry ?? item.DocEntry,
        docNum: item.docNum ?? item.DocNum,
        mensaje: normalizeString(item.mensajeIntegracion ?? item.MensajeIntegracion ?? '')
      }
      return acc
    }, {} as Record<number, IntegracionEstadoItem>)
    integraciones.value = integracionByLiquidacion

    // Contador de adjuntos por detalle para mostrar en el panel de solo lectura.
    adjuntosByDetalle.value = {}
    for (const d of detalles) {
      try {
        const adjRes = await cajaChicaApi.get(`/Adjuntos/por-detalle/${d.idDetalle}`)
        const adjPayload = adjRes.data as any
        const adjList = Array.isArray(adjPayload) ? adjPayload : Array.isArray(adjPayload?.data) ? adjPayload.data : []
        adjuntosByDetalle.value[d.idDetalle] = adjList.length
      } catch {
        adjuntosByDetalle.value[d.idDetalle] = 0
      }
    }

    historial.value = rows.map((item: any) => ({
      idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
      idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
      idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
      idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
      usuarioNombre: normalizeString(
        item.usuarioNombre
        ?? item.UsuarioNombre
        ?? item.nombreUsuario
        ?? item.NombreUsuario
        ?? item.aprobadoPor
        ?? item.AprobadoPor
        ?? ''
      ),
      nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? '-'),
      concepto: normalizeString(item.concepto ?? item.Concepto ?? '-'),
      total: Number(item.total ?? item.Total ?? 0),
      estado: normalizeString(item.estado ?? item.Estado ?? ''),
      montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
      observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
      tipoBase: normalizeString(item.tipoBase ?? item.TipoBase ?? ''),
      fechaAprobacion: String(item.fechaAprobacion ?? item.FechaAprobacion ?? ''),
      codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? '-'),
      nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? '-'),
      fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? '')
    }))

    const initialMap = historial.value.reduce<Record<string, string>>((acc, item) => {
      const id = normalizeString(item.idUsuario)
      const nombre = normalizeString(item.usuarioNombre)
      if (id && nombre) acc[id] = nombre
      return acc
    }, {})

    const missingIds = Array.from(new Set(historial.value
      .map(item => normalizeString(item.idUsuario))
      .filter(id => id && !initialMap[id])))

    if (missingIds.length) {
      const resolved = await resolveUserNames(missingIds)
      Object.assign(initialMap, resolved)
    }

    aprobadorNombreById.value = initialMap

    openGroups.value = historial.value.reduce<Record<number, boolean>>((acc, item) => {
      if (item.idLiquidacion && acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = false
      }
      return acc
    }, {})

    const ids = Array.from(new Set(historial.value.map(item => item.idLiquidacion))).filter(id => id > 0)
    ids.forEach(id => {
      if (!integraciones.value[id]) {
        integraciones.value[id] = { estado: 'PENDIENTE' }
      }
    })
  } catch {
    error.value = 'No se pudo cargar el historial de contabilidad.'
  } finally {
    loading.value = false
  }
}

async function loadAdjuntosForDetalle(idDetalle: number) {
  if (!idDetalle) return
  if (adjuntosListByDetalle.value[idDetalle]) return
  if (loadingAdjuntosMap.value[idDetalle]) return
  loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: true }
  try {
    const response = await cajaChicaApi.get(`/Adjuntos/por-detalle/${idDetalle}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    adjuntosListByDetalle.value = {
      ...adjuntosListByDetalle.value,
      [idDetalle]: items.map((item: any) => ({
        idAdjunto: Number(item.idAdjunto ?? item.IdAdjunto ?? 0),
        idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? idDetalle),
        rutaArchivo: String(item.rutaArchivo ?? item.RutaArchivo ?? ''),
        fechaSubida: String(item.fechaSubida ?? item.FechaSubida ?? '')
      }))
    }
  } catch {
    adjuntosListByDetalle.value = { ...adjuntosListByDetalle.value, [idDetalle]: [] }
  } finally {
    loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: false }
  }
}

async function downloadAdjunto() {
  if (!selectedAdjunto.value) return
  try {
    const url = buildAdjuntoUrl(selectedAdjunto.value.rutaArchivo)
    const token = localStorage.getItem('token')
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (!response.ok) throw new Error('No se pudo descargar el archivo.')
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = formatAdjuntoName(selectedAdjunto.value.rutaArchivo) || 'archivo'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch {
    alert('No se pudo descargar el archivo.')
  }
}

function openAdjuntoFull() {
  if (!selectedAdjunto.value) return
  showAdjuntoFull.value = true
}

function closeAdjuntoFull() {
  showAdjuntoFull.value = false
}

const openDetalle = async (item: HistorialItem) => {
  selectedItem.value = item
  selectedAdjuntoId.value = null
  showDetallePanel.value = true
  await loadAdjuntosForDetalle(item.idDetalle)
}

const closeDetalle = () => {
  showDetallePanel.value = false
  selectedItem.value = null
  selectedAdjuntoId.value = null
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

const downloadLiquidacionPdf = (idLiquidacion: number) => {
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string | undefined | null) => (v ? String(v).substring(0, 10) : '-')
  const fmtAmt = (v: number | undefined | null) => {
    const n = Number(v ?? 0)
    return Number.isNaN(n) ? '0.00' : n.toFixed(2)
  }

  const liq = liquidacionesMap.value[idLiquidacion]
  const detalles = detallesByLiquidacion.value[idLiquidacion] || []
  const aprobaciones = historial.value.filter(h => h.idLiquidacion === idLiquidacion)
  const integ = integraciones.value[idLiquidacion]
  const intMessage = integrationMessages.value[idLiquidacion]

  const totalSolicitado = detalles.reduce((a, d) => a + d.total, 0)
  const totalAprobado = aprobaciones.reduce((a, h) => a + h.montoAprobado, 0)
  const aprobCount = aprobaciones.filter(h => h.estado.toUpperCase() === 'APROBADO').length
  const rechazCount = aprobaciones.filter(h => h.estado.toUpperCase() === 'RECHAZADO').length

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:24px}
    .header-doc{border-bottom:3px solid #7c3aed;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
    .header-doc .title-block .label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;font-weight:600}
    .header-doc .title-block h1{font-size:20px;font-weight:800;color:#1e1b4b;line-height:1.1}
    .header-doc .meta-right{text-align:right;font-size:10px;color:#6b7280;line-height:1.6}
    .section{border:1px solid #e5e7eb;border-radius:6px;margin-bottom:20px;overflow:hidden}
    .section-head{background:#7c3aed;color:#fff;padding:9px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;display:flex;justify-content:space-between;align-items:center}
    .section-head.green{background:#065f46}
    .section-head.blue{background:#1e3a5f}
    .section-head .badge{background:rgba(255,255,255,.2);border-radius:3px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:.4px}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr)}
    .grid3{display:grid;grid-template-columns:repeat(3,1fr)}
    .grid2{display:grid;grid-template-columns:repeat(2,1fr)}
    .meta-cell{padding:9px 14px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}
    .meta-cell:last-child{border-right:none}
    .meta-label{font-size:8.5px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
    .meta-value{font-size:11px;font-weight:600;color:#111}
    .meta-value.small{font-size:10px;font-weight:400}
    .integ-bar{background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:7px 14px;font-size:10px;color:#065f46;display:flex;align-items:center;gap:8px}
    .integ-bar.error{background:#fef2f2;border-bottom-color:#fecaca;color:#dc2626}
    .integ-bar.pending{background:#fffbeb;border-bottom-color:#fde68a;color:#92400e}
    .integ-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}
    table{width:100%;border-collapse:collapse}
    th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;border-bottom:1px solid #e5e7eb}
    td{padding:5px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:10px;color:#374151}
    tr:last-child td{border-bottom:none}
    .amount{text-align:right;font-variant-numeric:tabular-nums;font-family:'Courier New',monospace;font-size:10px}
    .aprobado{color:#059669;font-weight:600}
    .rechazado{color:#dc2626;font-weight:600}
    .footer-totals{background:#f9fafb;padding:10px 14px;display:flex;justify-content:flex-end;gap:28px;border-top:2px solid #e5e7eb}
    .total-item{text-align:right}
    .total-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.4px}
    .total-value{font-size:13px;font-weight:700;color:#111}
    .total-value.primary{color:#7c3aed}
    .stats-row{display:flex;gap:20px;font-size:10px;color:rgba(255,255,255,.85)}
    .stats-row span strong{font-weight:700;color:#fff}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}}
  `

  // --- INTEGRACION BAR ---
  const integEstado = String(integ?.estado || 'PENDIENTE').toUpperCase()
  let integBarClass = 'pending'
  if (integEstado === 'INTEGRADO') integBarClass = ''
  else if (integEstado === 'ERROR') integBarClass = 'error'
  const integRef = integ?.docNum ? `DocNum: ${esc(integ.docNum)}` : integ?.docEntry ? `DocEntry: ${esc(integ.docEntry)}` : ''
  const integMsgText = intMessage?.texto || integ?.mensaje || ''
  const integBarHtml = `
    <div class="integ-bar ${integBarClass}">
      <span class="integ-dot"></span>
      <strong>Integración SAP: ${esc(integEstado)}</strong>
      ${integRef ? `&nbsp;&middot;&nbsp;${esc(integRef)}` : ''}
      ${integMsgText ? `&nbsp;&middot;&nbsp;${esc(integMsgText)}` : ''}
    </div>`

  // --- CABECERA ---
  const cabeceraHtml = `
    <div class="section">
      <div class="section-head blue"><span>Cabecera de la liquidación</span><span class="badge">#${esc(idLiquidacion)}</span></div>
      ${integBarHtml}
      <div class="grid4">
        <div class="meta-cell"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(liq?.codAlmacen || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Custodio</div><div class="meta-value">${esc(liq?.nombreCustodio || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(liq?.cedulaCustodio || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(liq?.fechaCreacion)}</div></div>
      </div>
      <div class="grid4">
        <div class="meta-cell"><div class="meta-label">Estado liquidación</div><div class="meta-value">${esc(liq?.estado || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Total solicitado</div><div class="meta-value">$${fmtAmt(totalSolicitado)}</div></div>
        <div class="meta-cell"><div class="meta-label">Total aprobado</div><div class="meta-value primary" style="color:#7c3aed">$${fmtAmt(totalAprobado)}</div></div>
        <div class="meta-cell"><div class="meta-label"># detalles</div><div class="meta-value">${detalles.length}</div></div>
      </div>
    </div>`

  // --- DETALLES ---
  let detallesRows = ''
  detalles.forEach(d => {
    const iva = d.total - d.subtotalConIva - d.subtotalSinIva
    const adjCount = adjuntosByDetalle.value[d.idDetalle] ?? 0
    detallesRows += `<tr>
      <td>${esc(d.idGasto || '-')}</td>
      <td>${esc(d.nombreGasto)}</td>
      <td>${esc(d.concepto)}</td>
      <td>${esc(d.nombreProveedor || '-')}</td>
      <td>${esc(d.ruc || '-')}</td>
      <td class="amount">${fmtAmt(d.subtotalConIva)}</td>
      <td class="amount">${fmtAmt(d.subtotalSinIva)}</td>
      <td class="amount">${fmtAmt(iva < 0 ? 0 : iva)}</td>
      <td class="amount">${fmtAmt(d.total)}</td>
      <td style="text-align:right">${adjCount}</td>
    </tr>`
  })
  const detalleHtml = `
    <div class="section">
      <div class="section-head green"><span>Detalle de gastos</span><span class="stats-row"><span>Items: <strong>${detalles.length}</strong></span><span>Total: <strong>$${fmtAmt(totalSolicitado)}</strong></span></span></div>
      <table><thead><tr>
        <th>Cód. Gasto</th><th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th>
        <th>Base 15%</th><th>Base 0%</th><th>IVA</th><th>Total</th><th>Adj.</th>
      </tr></thead><tbody>${detallesRows || '<tr><td colspan="10" style="color:#9ca3af;font-style:italic;padding:10px">Sin detalles.</td></tr>'}</tbody></table>
      <div class="footer-totals">
        <div class="total-item"><div class="total-label">Total solicitado</div><div class="total-value">$${fmtAmt(totalSolicitado)}</div></div>
      </div>
    </div>`

  // --- APROBACIONES ---
  let aprobRows = ''
  aprobaciones.forEach(h => {
    const estadoClass = h.estado.toUpperCase() === 'RECHAZADO' ? 'rechazado' : 'aprobado'
    aprobRows += `<tr>
      <td>${esc(h.idAprobacion)}</td>
      <td>${esc(getAprobadorNombre(h))}</td>
      <td>${esc(h.nombreGasto)}</td>
      <td>${esc(h.concepto)}</td>
      <td class="amount">${fmtAmt(h.total)}</td>
      <td class="amount">${fmtAmt(h.montoAprobado)}</td>
      <td class="${estadoClass}">${esc(h.estado)}</td>
      <td>${esc(h.observacion || '-')}</td>
      <td>${fmt(h.fechaAprobacion)}</td>
    </tr>`
  })
  const aprobHtml = `
    <div class="section">
      <div class="section-head"><span>Aprobaciones / Rechazos contabilidad</span><span class="stats-row"><span>Aprobados: <strong>${aprobCount}</strong></span><span>Rechazados: <strong>${rechazCount}</strong></span><span>Total aprobado: <strong>$${fmtAmt(totalAprobado)}</strong></span></span></div>
      <table><thead><tr>
        <th>Aprob.</th><th>Aprobado por</th><th>Gasto</th><th>Concepto</th>
        <th>Total</th><th>Monto aprobado</th><th>Estado</th><th>Comentario</th><th>Fecha</th>
      </tr></thead><tbody>${aprobRows || '<tr><td colspan="9" style="color:#9ca3af;font-style:italic;padding:10px">Sin aprobaciones.</td></tr>'}</tbody></table>
      <div class="footer-totals">
        <div class="total-item"><div class="total-label">Total aprobado contabilidad</div><div class="total-value primary">$${fmtAmt(totalAprobado)}</div></div>
      </div>
    </div>`

  const generado = new Date().toLocaleString('es-ES')
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Liquidacion #${idLiquidacion}</title><style>${CSS}</style></head><body>
    <div class="header-doc">
      <div class="title-block">
        <div class="label">Historial Contabilidad</div>
        <h1>Liquidación #${esc(idLiquidacion)}</h1>
      </div>
      <div class="meta-right">
        Tienda: <strong>${esc(liq?.codAlmacen || '-')}</strong><br>
        Custodio: <strong>${esc(liq?.nombreCustodio || '-')}</strong><br>
        Generado: ${generado}
      </div>
    </div>
    ${cabeceraHtml}
    ${detalleHtml}
    ${aprobHtml}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Por favor permite ventanas emergentes para descargar el PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

onMounted(() => {
  loadHistorial()
})

watch([fechaDesde, fechaHasta, filtroIntegracion], () => {
  loadHistorial()
})
</script>
