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
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Tipos de IVA</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Catálogo de tipos de IVA usados en los detalles de liquidación</p>
      </div>

      <!-- Formulario -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <label for="tipo-iva-codigo" class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Código</label>
            <input
              id="tipo-iva-codigo"
              v-model.trim="codigo"
              type="text"
              placeholder="Ej: IVA_12"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label for="tipo-iva-descripcion" class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
            <input
              id="tipo-iva-descripcion"
              v-model.trim="descripcion"
              type="text"
              placeholder="Ej: IVA 12%"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label for="tipo-iva-porcentaje" class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Porcentaje</label>
            <input
              id="tipo-iva-porcentaje"
              v-model="porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="0.15"
              :disabled="esManual"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-50"
            />
            <label class="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input v-model="esManual" type="checkbox" @change="onEsManualChange" />
              Es manual (sin porcentaje fijo)
            </label>
          </div>
          <div>
            <label for="tipo-iva-taxcode" class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">TaxCode SAP</label>
            <input
              id="tipo-iva-taxcode"
              v-model.trim="taxCodeSap"
              type="text"
              placeholder="Ej: IVA_12"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canSave"
            @click="saveTipoIva"
          >
            {{ editingId ? 'Guardar cambios' : 'Agregar tipo de IVA' }}
          </button>
          <button
            v-if="editingId"
            type="button"
            class="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            @click="resetForm"
          >
            Cancelar
          </button>
          <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
          <span v-else-if="formSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ formSuccess }}</span>
        </div>
      </div>

      <!-- Listado -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ tiposIva.length }}</span>
          </span>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadTiposIva"
          >
            Refrescar
          </button>
        </div>
        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="tiposIva.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin tipos de IVA registrados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Código</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descripción</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Porcentaje</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">TaxCode SAP</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Activo</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="tipo in tiposIva" :key="tipo.id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ tipo.codigo }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ tipo.descripcion }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  {{ tipo.porcentaje === null ? 'Manual' : `${(tipo.porcentaje * 100).toFixed(0)}%` }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ tipo.taxCodeSap }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs"
                    :class="tipo.activo
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                  >
                    {{ tipo.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="mr-2 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:border-blue-300"
                    @click="editTipoIva(tipo)"
                  >
                    Editar
                  </button>
                  <button
                    v-if="tipo.activo"
                    type="button"
                    class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300"
                    @click="desactivarTipoIva(tipo.id)"
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from '@vue/runtime-core'
import axios from 'axios'
import { useRouter } from 'vue-router'

interface TipoIvaItem {
  id: number
  codigo: string
  descripcion: string
  porcentaje: number | null
  taxCodeSap: string
  activo: boolean
}

const router = useRouter()
const tiposIva = ref<TipoIvaItem[]>([])
const loading = ref(false)
const codigo = ref('')
const descripcion = ref('')
const porcentaje = ref('')
const esManual = ref(false)
const taxCodeSap = ref('')
const editingId = ref<number | null>(null)
const formError = ref('')
const formSuccess = ref('')

const volver = () => {
  router.back()
}

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const canSave = computed(() => codigo.value.trim() && descripcion.value.trim() && (esManual.value || porcentaje.value !== ''))

const onEsManualChange = () => {
  if (esManual.value) porcentaje.value = ''
}

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeTipoIva = (item: any): TipoIvaItem => ({
  id: Number(item.id ?? item.Id ?? 0),
  codigo: normalizeString(item.codigo ?? item.Codigo ?? ''),
  descripcion: normalizeString(item.descripcion ?? item.Descripcion ?? ''),
  porcentaje: item.porcentaje ?? item.Porcentaje ?? null,
  taxCodeSap: normalizeString(item.taxCodeSap ?? item.TaxCodeSap ?? ''),
  activo: Boolean(item.activo ?? item.Activo ?? true)
})

const loadTiposIva = async () => {
  loading.value = true
  try {
    const response = await cajaChicaApi.get('/TiposIva/all')
    const payload = response.data as any
    let items: any[]
    if (Array.isArray(payload)) {
      items = payload
    } else if (Array.isArray(payload?.data)) {
      items = payload.data
    } else {
      items = []
    }
    tiposIva.value = items.map(normalizeTipoIva)
  } catch {
    formError.value = 'No se pudieron cargar los tipos de IVA.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  editingId.value = null
  codigo.value = ''
  descripcion.value = ''
  porcentaje.value = ''
  esManual.value = false
  taxCodeSap.value = ''
  formError.value = ''
}

const saveTipoIva = async () => {
  if (!canSave.value) return
  formError.value = ''
  formSuccess.value = ''

  const payload = {
    Codigo: codigo.value.trim(),
    Descripcion: descripcion.value.trim(),
    Porcentaje: esManual.value ? null : Number(porcentaje.value),
    TaxCodeSap: taxCodeSap.value.trim()
  }

  try {
    if (editingId.value) {
      await cajaChicaApi.put(`/TiposIva/${editingId.value}`, payload)
      formSuccess.value = 'Tipo de IVA actualizado.'
    } else {
      await cajaChicaApi.post('/TiposIva', payload)
      formSuccess.value = 'Tipo de IVA agregado.'
    }
    await loadTiposIva()
    resetForm()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    formError.value = message || 'No se pudo guardar el tipo de IVA.'
  }
}

const editTipoIva = (tipo: TipoIvaItem) => {
  editingId.value = tipo.id
  codigo.value = tipo.codigo
  descripcion.value = tipo.descripcion
  esManual.value = tipo.porcentaje === null
  porcentaje.value = tipo.porcentaje === null ? '' : String(tipo.porcentaje)
  taxCodeSap.value = tipo.taxCodeSap
  formError.value = ''
  formSuccess.value = ''
}

const desactivarTipoIva = async (id: number) => {
  formError.value = ''
  try {
    await cajaChicaApi.delete(`/TiposIva/${id}`)
    await loadTiposIva()
  } catch {
    formError.value = 'No se pudo desactivar el tipo de IVA.'
  }
}

onMounted(() => {
  loadTiposIva()
})
</script>
