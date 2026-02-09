<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de liquidaciones de caja chica</p>
        </div>
      </div>

      <!-- Formulario -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacen asignado</label>
            <select
              v-model="selectedCodAlmacen"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar almacen</option>
              <option v-for="almacen in assignedAlmacenes" :key="almacen.codAlmacen" :value="almacen.codAlmacen">
                {{ almacen.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre custodio</label>
            <input
              v-model.trim="nombreCustodio"
              type="text"
              placeholder="Nombre completo"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cedula custodio</label>
            <input
              v-model.trim="cedulaCustodio"
              type="text"
              placeholder="Identificacion"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Forma de pago</label>
            <select
              v-model="formatoDePago"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Empresa</label>
            <input
              v-model="empresa"
              type="text"
              readonly
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Marca</label>
            <input
              v-model="marca"
              type="text"
              readonly
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canSubmit"
            @click="createLiquidacion"
          >
            Crear liquidacion
          </button>
          <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
          <span v-else-if="formSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ formSuccess }}</span>
        </div>
      </div>

      <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando almacenes asignados...</div>
      <div v-else-if="loadError" class="text-sm text-red-600 dark:text-red-400">{{ loadError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from '@vue/runtime-core'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

interface UsuarioAlmacenItem {
  codAlmacen: string
}

interface AlmacenItem {
  codAlmacen: string
  nombre: string
  marca: string
}

const authStore = useAuthStore()
const selectedCodAlmacen = ref('')
const nombreCustodio = ref('')
const cedulaCustodio = ref('')
const formatoDePago = ref('Transferencia')
const empresa = ref('')
const marca = ref('')
const formError = ref('')
const formSuccess = ref('')
const loading = ref(false)
const loadError = ref('')
const asignados = ref<UsuarioAlmacenItem[]>([])
const almacenes = ref<AlmacenItem[]>([])

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const getCurrentUserId = (): string => {
  if (authStore.userData?.id) return authStore.userData.id
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const assignedAlmacenes = computed(() => {
  const mapByCod = new Map(almacenes.value.map(item => [item.codAlmacen, item.nombre]))
  return asignados.value.map(item => {
    const nombre = mapByCod.get(item.codAlmacen) || ''
    const label = nombre ? `${nombre} (${item.codAlmacen})` : item.codAlmacen
    return {
      codAlmacen: item.codAlmacen,
      label
    }
  })
})

const canSubmit = computed(() =>
  selectedCodAlmacen.value.trim() &&
  nombreCustodio.value.trim() &&
  cedulaCustodio.value.trim() &&
  formatoDePago.value.trim() &&
  empresa.value.trim() &&
  marca.value.trim()
)

const updateMarca = () => {
  const selected = almacenes.value.find(item => item.codAlmacen === selectedCodAlmacen.value)
  marca.value = selected?.marca || ''
}

const loadEmpresas = async () => {
  try {
    const response = await cajaChicaApi.get('/Empresas')
    let payload = response.data as any
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch {
        payload = []
      }
    }
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    if (items.length > 0) {
      empresa.value = String(items[0].nombre ?? items[0].Nombre ?? '').trim()
    }
  } catch {
    formError.value = 'No se pudo cargar la empresa.'
  }
}

const loadAlmacenesAsignados = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      loadError.value = 'No se encontro el usuario logeado.'
      return
    }

    const response = await cajaChicaApi.get(`/UsuariosAlmacenes/por-usuario/${userId}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    asignados.value = items.map((item: any) => ({
      codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? '')
    }))

    const almacenesResponse = await cajaChicaApi.get('/Almacenes', {
      headers: {
        Accept: 'text/plain'
      },
      responseType: 'text'
    })
    let almacenesPayload = almacenesResponse.data as any
    if (typeof almacenesPayload === 'string') {
      try {
        almacenesPayload = JSON.parse(almacenesPayload)
      } catch {
        almacenesPayload = []
      }
    }
    const almacenesItems = Array.isArray(almacenesPayload) ? almacenesPayload : Array.isArray(almacenesPayload?.data) ? almacenesPayload.data : []
    almacenes.value = almacenesItems.map((item: any) => ({
      codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? '').trim(),
      nombre: String(item.nombre ?? item.Nombre ?? '').trim(),
      marca: String(item.marca ?? item.Marca ?? '').trim()
    }))

    updateMarca()
  } catch {
    loadError.value = 'No se pudieron cargar los almacenes asignados.'
  } finally {
    loading.value = false
  }
}

const createLiquidacion = async () => {
  if (!canSubmit.value) return
  formError.value = ''
  formSuccess.value = ''

  const userId = getCurrentUserId()
  if (!userId) {
    formError.value = 'No se encontro el usuario logeado.'
    return
  }

  try {
    await cajaChicaApi.post('/Liquidaciones', {
      IdUsuario: userId,
      CodAlmacen: selectedCodAlmacen.value,
      Marca: marca.value,
      Empresa: empresa.value,
      CedulaCustodio: cedulaCustodio.value,
      NombreCustodio: nombreCustodio.value,
      FormatoDePago: formatoDePago.value,
      Estado: 'BORRADOR',
      NumeroLiquidacion: '',
      Autorizacion: '',
      DatosBancarios: ''
    })

    formSuccess.value = 'Liquidacion creada.'
    selectedCodAlmacen.value = ''
    updateMarca()
    nombreCustodio.value = ''
    cedulaCustodio.value = ''
    formatoDePago.value = 'Transferencia'
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    formError.value = message || 'No se pudo crear la liquidacion.'
  }
}

onMounted(() => {
  loadAlmacenesAsignados()
  loadEmpresas()
})

watch(selectedCodAlmacen, () => {
  updateMarca()
})
</script>
