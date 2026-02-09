<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Detalle de Liquidacion #{{ liquidacionId }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Agregar gastos y revisar el detalle</p>
        </div>
        <router-link
          class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
          to="/caja-chica/liquidaciones"
        >
          Volver
        </router-link>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Agregar detalle</h2>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Gasto *</label>
            <select
              v-model="selectedGastoId"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar gasto</option>
              <option v-for="gasto in catalogoGastos" :key="gasto.idGasto" :value="gasto.idGasto">
                {{ gasto.idGasto }} - {{ gasto.nombreGasto }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre Gasto</label>
            <input
              v-model="nombreGasto"
              type="text"
              readonly
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Consumo</label>
            <input
              v-model="fechaConsumo"
              type="date"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">RUC</label>
            <input
              v-model.trim="ruc"
              type="text"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Proveedor *</label>
            <input
              v-model.trim="proveedor"
              type="text"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">N° Comprobante</label>
            <input
              v-model.trim="numeroComprobante"
              type="text"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">N° Autorizacion</label>
            <input
              v-model.trim="numeroAutorizacion"
              type="text"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Concepto *</label>
            <input
              v-model.trim="concepto"
              type="text"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subtotal con IVA *</label>
            <input
              v-model="subtotalConIva"
              type="number"
              step="0.01"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subtotal sin IVA *</label>
            <input
              v-model="subtotalSinIva"
              type="number"
              step="0.01"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">IVA *</label>
            <input
              v-model="iva"
              type="number"
              step="0.01"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total *</label>
            <input
              v-model="total"
              type="number"
              step="0.01"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canAddDetalle"
            @click="addDetalle"
          >
            Agregar detalle
          </button>
          <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
          <span v-else-if="formSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ formSuccess }}</span>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Detalles actuales</h2>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadDetalles"
          >
            Refrescar
          </button>
        </div>

        <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" />

        <div v-if="loadingDetalles" class="text-sm text-gray-500 dark:text-gray-400">Cargando detalles...</div>
        <div v-else-if="detalleError" class="text-sm text-red-600 dark:text-red-400">{{ detalleError }}</div>
        <div v-else-if="detalles.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay detalles registrados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-3">Nombre Gasto</th>
                <th class="py-2 pr-3">Fecha Consumo</th>
                <th class="py-2 pr-3">RUC</th>
                <th class="py-2 pr-3">Proveedor</th>
                <th class="py-2 pr-3">N° Comprobante</th>
                <th class="py-2 pr-3">N° Autorizacion</th>
                <th class="py-2 pr-3">Concepto</th>
                <th class="py-2 pr-3">Subtotal con IVA</th>
                <th class="py-2 pr-3">Subtotal sin IVA</th>
                <th class="py-2 pr-3">IVA</th>
                <th class="py-2 pr-3">Total</th>
                <th class="py-2 pr-3">Adjuntos</th>
                <th class="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in detalles" :key="item.idDetalle">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatDate(item.fechaConsumo) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.ruc }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreProveedor }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.numeroComprobante }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.numeroAutorizacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.concepto }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.subtotalConIva) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.subtotalSinIva) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.iva) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.total) }}</td>
                <td class="py-2 pr-3">
                  <div class="flex flex-col gap-1">
                    <button
                      type="button"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      @click="triggerUpload(item.idDetalle)"
                    >
                      Adjuntar
                    </button>
                    <div v-if="adjuntosByDetalle[item.idDetalle]?.length" class="flex flex-col">
                      <div
                        v-for="adjunto in adjuntosByDetalle[item.idDetalle]"
                        :key="adjunto.idAdjunto"
                        class="flex items-center gap-2"
                      >
                        <a
                          class="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300"
                          :href="buildAdjuntoUrl(adjunto.rutaArchivo)"
                          target="_blank"
                          rel="noopener"
                        >
                          {{ formatAdjuntoName(adjunto.rutaArchivo) }}
                        </a>
                        <button
                          type="button"
                          class="text-xs text-red-600 hover:text-red-700"
                          @click="deleteAdjunto(adjunto, item.idDetalle)"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-2 pr-3">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      @click="startEditDetalle(item)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                      @click="deleteDetalle(item)"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
              <tr class="bg-gray-50 dark:bg-gray-900">
                <td class="py-2 pr-3 text-right font-semibold text-gray-700 dark:text-gray-200" colspan="7">Totales</td>
                <td class="py-2 pr-3 font-semibold text-gray-700 dark:text-gray-200">{{ formatAmount(totalSubtotalConIva) }}</td>
                <td class="py-2 pr-3 font-semibold text-gray-700 dark:text-gray-200">{{ formatAmount(totalSubtotalSinIva) }}</td>
                <td class="py-2 pr-3 font-semibold text-gray-700 dark:text-gray-200">{{ formatAmount(totalIva) }}</td>
                <td class="py-2 pr-3 font-semibold text-gray-700 dark:text-gray-200">{{ formatAmount(totalTotal) }}</td>
                <td class="py-2 pr-3"></td>
                <td class="py-2 pr-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="editingDetalleId" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Editar detalle</h3>
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Gasto *</label>
              <select
                v-model="editGastoId"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar gasto</option>
                <option v-for="gasto in catalogoGastos" :key="gasto.idGasto" :value="gasto.idGasto">
                  {{ gasto.idGasto }} - {{ gasto.nombreGasto }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre Gasto</label>
              <input
                v-model="editNombreGasto"
                type="text"
                readonly
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Consumo</label>
              <input
                v-model="editFechaConsumo"
                type="date"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">RUC</label>
              <input
                v-model.trim="editRuc"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Proveedor *</label>
              <input
                v-model.trim="editProveedor"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">N° Comprobante</label>
              <input
                v-model.trim="editNumeroComprobante"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">N° Autorizacion</label>
              <input
                v-model.trim="editNumeroAutorizacion"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Concepto *</label>
              <input
                v-model.trim="editConcepto"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subtotal con IVA *</label>
              <input
                v-model="editSubtotalConIva"
                type="number"
                step="0.01"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subtotal sin IVA *</label>
              <input
                v-model="editSubtotalSinIva"
                type="number"
                step="0.01"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">IVA *</label>
              <input
                v-model="editIva"
                type="number"
                step="0.01"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total *</label>
              <input
                v-model="editTotal"
                type="number"
                step="0.01"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
              :disabled="!canUpdateDetalle"
              @click="updateDetalle"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-4 py-2"
              @click="cancelEditDetalle"
            >
              Cancelar
            </button>
            <span v-if="editDetalleError" class="text-sm text-red-600 dark:text-red-400">{{ editDetalleError }}</span>
            <span v-else-if="editDetalleSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ editDetalleSuccess }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from '@vue/runtime-core'
import { useRoute } from 'vue-router'
import axios from 'axios'

interface CatalogoGastoItem {
  idGasto: string
  nombreGasto: string
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  idGasto: string
  nombreGasto: string
  fechaConsumo: string
  ruc: string
  nombreProveedor: string
  numeroComprobante: string
  numeroAutorizacion: string
  concepto: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
  total: number
}

interface AdjuntoItem {
  idAdjunto: number
  idDetalle: number
  rutaArchivo: string
  fechaSubida: string
}

const route = useRoute()
const liquidacionId = computed(() => Number(route.params.id || 0))

const catalogoGastos = ref<CatalogoGastoItem[]>([])
const detalles = ref<LiquidacionDetalleItem[]>([])
const loadingDetalles = ref(false)
const detalleError = ref('')
const formError = ref('')
const formSuccess = ref('')

const selectedGastoId = ref('')
const nombreGasto = ref('')
const fechaConsumo = ref(new Date().toISOString().slice(0, 10))
const ruc = ref('')
const proveedor = ref('')
const numeroComprobante = ref('')
const numeroAutorizacion = ref('')
const concepto = ref('')
const subtotalConIva = ref('')
const subtotalSinIva = ref('')
const iva = ref('')
const total = ref('')
const editingDetalleId = ref<number | null>(null)
const editGastoId = ref('')
const editNombreGasto = ref('')
const editFechaConsumo = ref(new Date().toISOString().slice(0, 10))
const editRuc = ref('')
const editProveedor = ref('')
const editNumeroComprobante = ref('')
const editNumeroAutorizacion = ref('')
const editConcepto = ref('')
const editSubtotalConIva = ref('')
const editSubtotalSinIva = ref('')
const editIva = ref('')
const editTotal = ref('')
const editDetalleError = ref('')
const editDetalleSuccess = ref('')
const adjuntosByDetalle = ref<Record<number, AdjuntoItem[]>>({})
const uploadTargetId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const apiBaseUrl = (import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')
const fileBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl

const hasValue = (value: string | number) => String(value ?? '').trim() !== ''

const canAddDetalle = computed(() =>
  liquidacionId.value > 0 &&
  selectedGastoId.value.trim() &&
  proveedor.value.trim() &&
  concepto.value.trim() &&
  hasValue(subtotalConIva.value) &&
  hasValue(subtotalSinIva.value) &&
  hasValue(iva.value) &&
  hasValue(total.value)
)

const canUpdateDetalle = computed(() =>
  editingDetalleId.value !== null &&
  editGastoId.value.trim() &&
  editProveedor.value.trim() &&
  editConcepto.value.trim() &&
  hasValue(editSubtotalConIva.value) &&
  hasValue(editSubtotalSinIva.value) &&
  hasValue(editIva.value) &&
  hasValue(editTotal.value)
)

const normalizeString = (value: any) => String(value ?? '').trim()
const toNumber = (value: string) => Number(String(value || '0').replace(',', '.')) || 0

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  fechaConsumo: String(item.fechaConsumo ?? item.FechaConsumo ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  numeroComprobante: normalizeString(item.numeroComprobante ?? item.NumeroComprobante ?? ''),
  numeroAutorizacion: normalizeString(item.numeroAutorizacion ?? item.NumeroAutorizacion ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0),
  total: Number(item.total ?? item.Total ?? 0)
})

const totalSubtotalConIva = computed(() => detalles.value.reduce((sum, item) => sum + item.subtotalConIva, 0))
const totalSubtotalSinIva = computed(() => detalles.value.reduce((sum, item) => sum + item.subtotalSinIva, 0))
const totalIva = computed(() => detalles.value.reduce((sum, item) => sum + item.iva, 0))
const totalTotal = computed(() => detalles.value.reduce((sum, item) => sum + item.total, 0))

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => value ? value.substring(0, 10) : ''

const loadCatalogoGastos = async () => {
  try {
    const response = await cajaChicaApi.get('/CatalogoGastos')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    catalogoGastos.value = items.map((item: any) => ({
      idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
      nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? '')
    }))
  } catch {
    formError.value = 'No se pudo cargar el catalogo de gastos.'
  }
}

const loadDetalles = async () => {
  if (liquidacionId.value <= 0) return
  loadingDetalles.value = true
  detalleError.value = ''
  try {
    const response = await cajaChicaApi.get(`/Liquidaciones/${liquidacionId.value}/detalle`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    detalles.value = items.map(normalizeDetalle)
    await loadAdjuntosForDetalles()
  } catch {
    detalleError.value = 'No se pudieron cargar los detalles.'
  } finally {
    loadingDetalles.value = false
  }
}

const loadAdjuntosForDetalle = async (idDetalle: number) => {
  if (!idDetalle) return
  try {
    const response = await cajaChicaApi.get(`/Adjuntos/por-detalle/${idDetalle}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    adjuntosByDetalle.value[idDetalle] = items.map((item: any) => ({
      idAdjunto: Number(item.idAdjunto ?? item.IdAdjunto ?? 0),
      idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? idDetalle),
      rutaArchivo: String(item.rutaArchivo ?? item.RutaArchivo ?? ''),
      fechaSubida: String(item.fechaSubida ?? item.FechaSubida ?? '')
    }))
  } catch {
    adjuntosByDetalle.value[idDetalle] = []
  }
}

const loadAdjuntosForDetalles = async () => {
  const tasks = detalles.value.map(item => loadAdjuntosForDetalle(item.idDetalle))
  await Promise.all(tasks)
}

const addDetalle = async () => {
  if (!canAddDetalle.value) return
  formError.value = ''
  formSuccess.value = ''

  try {
    await cajaChicaApi.post('/LiquidacionesDetalle', {
      IdLiquidacion: liquidacionId.value,
      IdGasto: selectedGastoId.value,
      NombreGasto: nombreGasto.value,
      FechaConsumo: fechaConsumo.value,
      Ruc: ruc.value,
      NombreProveedor: proveedor.value,
      NumeroComprobante: numeroComprobante.value,
      NumeroAutorizacion: numeroAutorizacion.value,
      Concepto: concepto.value,
      Subtotal_Con_Iva: toNumber(subtotalConIva.value),
      Subtotal_Sin_Iva: toNumber(subtotalSinIva.value),
      Iva: toNumber(iva.value),
      Total: toNumber(total.value)
    })

    formSuccess.value = 'Detalle agregado.'
    await loadDetalles()
    selectedGastoId.value = ''
    nombreGasto.value = ''
    ruc.value = ''
    proveedor.value = ''
    numeroComprobante.value = ''
    numeroAutorizacion.value = ''
    concepto.value = ''
    subtotalConIva.value = ''
    subtotalSinIva.value = ''
    iva.value = ''
    total.value = ''
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    formError.value = message || 'No se pudo agregar el detalle.'
  }
}

const startEditDetalle = (item: LiquidacionDetalleItem) => {
  editingDetalleId.value = item.idDetalle
  editGastoId.value = item.idGasto
  editNombreGasto.value = item.nombreGasto
  editFechaConsumo.value = formatDate(item.fechaConsumo) || new Date().toISOString().slice(0, 10)
  editRuc.value = item.ruc
  editProveedor.value = item.nombreProveedor
  editNumeroComprobante.value = item.numeroComprobante
  editNumeroAutorizacion.value = item.numeroAutorizacion
  editConcepto.value = item.concepto
  editSubtotalConIva.value = item.subtotalConIva.toString()
  editSubtotalSinIva.value = item.subtotalSinIva.toString()
  editIva.value = item.iva.toString()
  editTotal.value = item.total.toString()
  editDetalleError.value = ''
  editDetalleSuccess.value = ''
}

const cancelEditDetalle = () => {
  editingDetalleId.value = null
  editGastoId.value = ''
  editNombreGasto.value = ''
  editFechaConsumo.value = new Date().toISOString().slice(0, 10)
  editRuc.value = ''
  editProveedor.value = ''
  editNumeroComprobante.value = ''
  editNumeroAutorizacion.value = ''
  editConcepto.value = ''
  editSubtotalConIva.value = ''
  editSubtotalSinIva.value = ''
  editIva.value = ''
  editTotal.value = ''
  editDetalleError.value = ''
  editDetalleSuccess.value = ''
}

const updateDetalle = async () => {
  if (!canUpdateDetalle.value || editingDetalleId.value === null) return
  editDetalleError.value = ''
  editDetalleSuccess.value = ''

  const original = detalles.value.find(item => item.idDetalle === editingDetalleId.value)
  if (!original) {
    editDetalleError.value = 'No se encontro el detalle seleccionado.'
    return
  }

  try {
    await cajaChicaApi.put(`/LiquidacionesDetalle/${original.idDetalle}`, {
      IdDetalle: original.idDetalle,
      IdLiquidacion: original.idLiquidacion,
      IdGasto: editGastoId.value,
      NombreGasto: editNombreGasto.value,
      FechaConsumo: editFechaConsumo.value,
      Ruc: editRuc.value,
      NombreProveedor: editProveedor.value,
      NumeroComprobante: editNumeroComprobante.value,
      NumeroAutorizacion: editNumeroAutorizacion.value,
      Concepto: editConcepto.value,
      Subtotal_Con_Iva: toNumber(editSubtotalConIva.value),
      Subtotal_Sin_Iva: toNumber(editSubtotalSinIva.value),
      Iva: toNumber(editIva.value),
      Total: toNumber(editTotal.value)
    })

    editDetalleSuccess.value = 'Detalle actualizado.'
    await loadDetalles()
    cancelEditDetalle()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    editDetalleError.value = message || 'No se pudo actualizar el detalle.'
  }
}

const deleteDetalle = async (item: LiquidacionDetalleItem) => {
  editDetalleError.value = ''
  editDetalleSuccess.value = ''
  try {
    await cajaChicaApi.delete(`/LiquidacionesDetalle/${item.idDetalle}`)
    await loadDetalles()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    detalleError.value = message || 'No se pudo eliminar el detalle.'
  }
}

const triggerUpload = (idDetalle: number) => {
  uploadTargetId.value = idDetalle
  uploadError.value = ''
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || uploadTargetId.value === null) return
  uploadError.value = ''

  const formData = new FormData()
  formData.append('idDetalle', String(uploadTargetId.value))
  formData.append('file', file)

  try {
    await cajaChicaApi.post('/Adjuntos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    await loadAdjuntosForDetalle(uploadTargetId.value)
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    uploadError.value = message || 'No se pudo subir el adjunto.'
  } finally {
    input.value = ''
    uploadTargetId.value = null
  }
}

const buildAdjuntoUrl = (ruta: string) => {
  if (!ruta) return '#'
  return ruta.startsWith('http') ? ruta : `${fileBaseUrl}${ruta}`
}

const formatAdjuntoName = (ruta: string) => {
  if (!ruta) return ''
  const parts = ruta.split('/')
  return parts[parts.length - 1]
}

const deleteAdjunto = async (adjunto: AdjuntoItem, idDetalle: number) => {
  uploadError.value = ''
  try {
    await cajaChicaApi.delete(`/Adjuntos/${adjunto.idAdjunto}`)
    await loadAdjuntosForDetalle(idDetalle)
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    uploadError.value = message || 'No se pudo eliminar el adjunto.'
  }
}

watch(selectedGastoId, () => {
  const selected = catalogoGastos.value.find(item => item.idGasto === selectedGastoId.value)
  nombreGasto.value = selected?.nombreGasto || ''
})

watch(editGastoId, () => {
  const selected = catalogoGastos.value.find(item => item.idGasto === editGastoId.value)
  editNombreGasto.value = selected?.nombreGasto || ''
})

onMounted(() => {
  loadCatalogoGastos()
  loadDetalles()
})
</script>
