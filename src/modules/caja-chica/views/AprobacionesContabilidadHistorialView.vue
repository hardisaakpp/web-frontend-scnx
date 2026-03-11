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

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o negaciones registradas.
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
                    <th class="py-2 pr-3 pl-4">Detalle</th>
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
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ item.idDetalle }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
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
              Liquidacion #{{ selectedItem?.idLiquidacion || '-' }} · Detalle #{{ selectedItem?.idDetalle || '-' }}
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
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

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
  nombreGasto: string
  concepto: string
  total: number
  estado: string
  montoAprobado: number
  observacion: string
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
  message?: string
}

const loading = ref(false)
const error = ref('')
const historial = ref<HistorialItem[]>([])
const openGroups = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, LiquidacionDetalleItem[]>>({})
const integraciones = ref<Record<number, IntegracionEstadoItem>>({})
const integrationLoading = ref<Record<number, boolean>>({})
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
  baseURL: import.meta.env.VITE_SLAYER_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const apiBaseUrl = (import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api').replace(/\/+$/, '')
const fileBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl

const buildAdjuntoUrl = (ruta: string) => {
  if (!ruta) return '#'
  if (ruta.startsWith('http')) return ruta
  if (ruta.startsWith('/uploads')) return ruta
  return `${fileBaseUrl}${ruta}`
}

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

const getCurrentUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeString = (value: any) => String(value ?? '').trim()

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

const groupedHistorial = computed(() => {
  const groups = new Map<number, HistorialItem[]>()
  historial.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.montoAprobado, 0)
    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '-',
      nombreCustodio: base?.nombreCustodio || '-',
      fechaCreacion: base?.fechaCreacion || ''
    }
  })
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false

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

const buildDocDate = () => {
  const now = new Date()
  return now.toISOString().substring(0, 10)
}

const buildDocumentLines = (detalles: LiquidacionDetalleItem[]) => {
  return detalles.map(detalle => {
    const taxCode = detalle.subtotalConIva > 0 ? 'IVA' : 'IVA0'
    return {
      AccountCode: detalle.idGasto,
      LineTotal: detalle.total,
      TaxCode: taxCode
    }
  })
}

const integrarLiquidacion = async (idLiquidacion: number) => {
  if (integrationLoading.value[idLiquidacion]) return

  const detalles = detallesByLiquidacion.value[idLiquidacion] || []
  if (!detalles.length) {
    error.value = 'No se encontraron detalles para integrar.'
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
    const docDate = buildDocDate()
    const payload = {
      CardCode: liquidacion.cedulaCustodio,
      DocType: 'dDocument_Service',
      DocDate: docDate,
      DocDueDate: docDate,
      TaxDate: docDate,
      Comments: `Liquidacion ${idLiquidacion} Caja Chica`,
      DocumentLines: buildDocumentLines(detalles)
    }

    const response = await slayerApi.post<SlayerIntegracionResponse>('/LiquidacionesCompras', payload)
    const data = response.data as SlayerIntegracionResponse
    const docEntry = data?.docEntry
    const docNum = data?.docNum
    const mensaje = data?.message || 'Integracion exitosa.'

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
  } catch (err: any) {
    const mensaje = err?.response?.data?.message || err?.response?.data || 'No se pudo integrar la liquidacion.'
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
  } finally {
    integrationLoading.value[idLiquidacion] = false
  }
}

const loadIntegraciones = async (idLiquidaciones: number[]) => {
  const entries: Record<number, IntegracionEstadoItem> = {}
  await Promise.all(idLiquidaciones.map(async id => {
    try {
      const response = await cajaChicaApi.get<IntegracionEstadoItem>(`/Integraciones/Compras/${id}`)
      const payload = (response.data || {}) as Partial<IntegracionEstadoItem>
      entries[id] = {
        estado: payload.estado || 'PENDIENTE',
        docEntry: payload.docEntry,
        docNum: payload.docNum,
        mensaje: payload.mensaje
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
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const [aprobacionesRes, detallesRes, liquidacionesRes] = await Promise.all([
      cajaChicaApi.get('/Aprobaciones'),
      cajaChicaApi.get('/LiquidacionesDetalle'),
      cajaChicaApi.get('/Liquidaciones')
    ])

    const aprobacionesPayload = aprobacionesRes.data as any
    const detallesPayload = detallesRes.data as any
    const liquidacionesPayload = liquidacionesRes.data as any

    const aprobaciones = (Array.isArray(aprobacionesPayload) ? aprobacionesPayload : aprobacionesPayload?.data || [])
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.idUsuario === userId)
      .filter((item: AprobacionItem) => item.nivelAprobacion === 2)
      .filter((item: AprobacionItem) => ['APROBADO', 'RECHAZADO'].includes(item.estado.toUpperCase()))

    const detalles: LiquidacionDetalleItem[] = (Array.isArray(detallesPayload) ? detallesPayload : detallesPayload?.data || [])
      .map(normalizeDetalle)

    const liquidaciones: LiquidacionItem[] = (Array.isArray(liquidacionesPayload) ? liquidacionesPayload : liquidacionesPayload?.data || [])
      .map(normalizeLiquidacion)

    const detalleMap = new Map<number, LiquidacionDetalleItem>()
    detalles.forEach((detalle: LiquidacionDetalleItem) => {
      detalleMap.set(detalle.idDetalle, detalle)
    })

    const liquidacionMap = new Map<number, LiquidacionItem>()
    liquidaciones.forEach((liquidacion: LiquidacionItem) => {
      liquidacionMap.set(liquidacion.idLiquidacion, liquidacion)
    })

    liquidacionesMap.value = liquidaciones.reduce<Record<number, LiquidacionItem>>((acc: Record<number, LiquidacionItem>, liquidacion: LiquidacionItem) => {
      acc[liquidacion.idLiquidacion] = liquidacion
      return acc
    }, {})

    detallesByLiquidacion.value = detalles.reduce<Record<number, LiquidacionDetalleItem[]>>((acc: Record<number, LiquidacionDetalleItem[]>, detalle: LiquidacionDetalleItem) => {
      if (!acc[detalle.idLiquidacion]) {
        acc[detalle.idLiquidacion] = []
      }
      acc[detalle.idLiquidacion].push(detalle)
      return acc
    }, {})

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

    historial.value = aprobaciones.map((aprobacion: AprobacionItem) => {
      const detalle = detalleMap.get(aprobacion.idDetalle)
      const liquidacion = detalle ? liquidacionMap.get(detalle.idLiquidacion) : undefined
      return {
        idAprobacion: aprobacion.idAprobacion,
        idDetalle: aprobacion.idDetalle,
        idLiquidacion: detalle?.idLiquidacion || 0,
        nombreGasto: detalle?.nombreGasto || '-',
        concepto: detalle?.concepto || '-',
        total: detalle?.total || 0,
        estado: aprobacion.estado,
        montoAprobado: aprobacion.montoAprobado,
        observacion: aprobacion.observacion,
        fechaAprobacion: aprobacion.fechaAprobacion || '',
        codAlmacen: liquidacion?.codAlmacen || '-',
        nombreCustodio: liquidacion?.nombreCustodio || '-',
        fechaCreacion: liquidacion?.fechaCreacion || ''
      }
    })

    openGroups.value = historial.value.reduce<Record<number, boolean>>((acc, item) => {
      if (item.idLiquidacion && acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})

    const ids = Array.from(new Set(historial.value.map(item => item.idLiquidacion))).filter(id => id > 0)
    await loadIntegraciones(ids)
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

onMounted(() => {
  loadHistorial()
})
</script>
