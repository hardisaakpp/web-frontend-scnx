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
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de liquidaciones de caja chica</p>
        </div>
      </div>

      <!-- Formulario -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Nueva liquidacion</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Completa la cabecera para crear un borrador</p>
          </div>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            :aria-expanded="isCreateOpen"
            @click="isCreateOpen = !isCreateOpen"
          >
            {{ isCreateOpen ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>

        <div v-if="isCreateOpen" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
        <div v-if="isCreateOpen" class="mt-4 flex items-center gap-3">
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

      <!-- Borradores -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Borradores</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Liquidaciones en estado BORRADOR</p>
          </div>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadBorradores"
          >
            Refrescar
          </button>
        </div>

        <div v-if="loadingBorradores" class="text-sm text-gray-500 dark:text-gray-400">Cargando borradores...</div>
        <div v-else-if="borradorError" class="text-sm text-red-600 dark:text-red-400">{{ borradorError }}</div>
        <div v-else-if="borradoresFiltrados.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay borradores para mostrar.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-3">Id</th>
                <th class="py-2 pr-3">Almacen</th>
                <th class="py-2 pr-3">Custodio</th>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in borradoresFiltrados" :key="item.idLiquidacion">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idLiquidacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.codAlmacen }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreCustodio }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.fechaCreacion }}</td>
                <td class="py-2 pr-3">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      @click="startEdit(item)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="text-indigo-600 hover:text-indigo-700 text-xs font-medium disabled:opacity-50"
                      :disabled="sendingId === item.idLiquidacion"
                      @click="sendLiquidacion(item)"
                    >
                      Enviar
                    </button>
                    <router-link
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      :to="`/caja-chica/liquidaciones/${item.idLiquidacion}/detalle`"
                    >
                      Detalles
                    </router-link>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                      @click="deleteLiquidacion(item)"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="sendError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ sendError }}</div>
        <div v-else-if="sendSuccess" class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{{ sendSuccess }}</div>

        <div v-if="editingId" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Editar cabecera</h3>
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacen</label>
              <select
                v-model="editCodAlmacen"
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
                v-model.trim="editNombreCustodio"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cedula custodio</label>
              <input
                v-model.trim="editCedulaCustodio"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Forma de pago</label>
              <select
                v-model="editFormatoDePago"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Empresa</label>
              <input
                v-model="editEmpresa"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Marca</label>
              <input
                v-model="editMarca"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Autorizacion</label>
              <input
                v-model.trim="editAutorizacion"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Datos bancarios</label>
              <input
                v-model.trim="editDatosBancarios"
                type="text"
                class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
              :disabled="!canUpdate"
              @click="updateLiquidacion"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-4 py-2"
              @click="cancelEdit"
            >
              Cancelar
            </button>
            <span v-if="editError" class="text-sm text-red-600 dark:text-red-400">{{ editError }}</span>
            <span v-else-if="editSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ editSuccess }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from '@vue/runtime-core'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

interface UsuarioAlmacenItem {
  codAlmacen: string
}

interface AlmacenItem {
  codAlmacen: string
  nombre: string
  marca: string
}

interface LiquidacionItem {
  idLiquidacion: number
  idUsuario: string
  fechaCreacion: string
  estado: string
  codAlmacen: string
  marca: string
  empresa: string
  cedulaCustodio: string
  nombreCustodio: string
  formatoDePago: string
  numeroLiquidacion: string
  autorizacion: string
  datosBancarios: string
}

const authStore = useAuthStore()
const router = useRouter()
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
const isCreateOpen = ref(false)
const asignados = ref<UsuarioAlmacenItem[]>([])
const almacenes = ref<AlmacenItem[]>([])
const borradores = ref<LiquidacionItem[]>([])
const loadingBorradores = ref(false)
const borradorError = ref('')
const editingId = ref<number | null>(null)
const editCodAlmacen = ref('')
const editNombreCustodio = ref('')
const editCedulaCustodio = ref('')
const editFormatoDePago = ref('Transferencia')
const editEmpresa = ref('')
const editMarca = ref('')
const editAutorizacion = ref('')
const editDatosBancarios = ref('')
const editError = ref('')
const editSuccess = ref('')
const sendError = ref('')
const sendSuccess = ref('')
const sendingId = ref<number | null>(null)

const volver = () => {
  router.back()
}

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
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

const borradoresFiltrados = computed(() => {
  const currentUserId = getCurrentUserId()
  const assignedSet = new Set(asignados.value.map(item => item.codAlmacen))
  return borradores.value.filter(item => {
    const isBorrador = item.estado.toUpperCase() === 'BORRADOR'
    const isAssigned = assignedSet.size === 0 || assignedSet.has(item.codAlmacen)
    const isCurrentUser = item.idUsuario === currentUserId
    return isBorrador && isAssigned && isCurrentUser
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

const canUpdate = computed(() =>
  editingId.value !== null &&
  editCodAlmacen.value.trim() &&
  editNombreCustodio.value.trim() &&
  editCedulaCustodio.value.trim() &&
  editFormatoDePago.value.trim() &&
  editEmpresa.value.trim() &&
  editMarca.value.trim()
)

const updateMarca = () => {
  const selected = almacenes.value.find(item => item.codAlmacen === selectedCodAlmacen.value)
  marca.value = selected?.marca || ''
}

const updateEditMarca = () => {
  const selected = almacenes.value.find(item => item.codAlmacen === editCodAlmacen.value)
  editMarca.value = selected?.marca || editMarca.value
}

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  marca: normalizeString(item.marca ?? item.Marca ?? ''),
  empresa: normalizeString(item.empresa ?? item.Empresa ?? ''),
  cedulaCustodio: normalizeString(item.cedulaCustodio ?? item.CedulaCustodio ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  formatoDePago: normalizeString(item.formatoDePago ?? item.FormatoDePago ?? ''),
  numeroLiquidacion: normalizeString(item.numeroLiquidacion ?? item.NumeroLiquidacion ?? ''),
  autorizacion: normalizeString(item.autorizacion ?? item.Autorizacion ?? ''),
  datosBancarios: normalizeString(item.datosBancarios ?? item.DatosBancarios ?? '')
})

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

const loadBorradores = async () => {
  loadingBorradores.value = true
  borradorError.value = ''
  try {
    const response = await cajaChicaApi.get('/Liquidaciones')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    borradores.value = items.map(normalizeLiquidacion)
  } catch {
    borradorError.value = 'No se pudieron cargar las liquidaciones.'
  } finally {
    loadingBorradores.value = false
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
    await loadBorradores()
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

const startEdit = (item: LiquidacionItem) => {
  editingId.value = item.idLiquidacion
  editCodAlmacen.value = item.codAlmacen
  editNombreCustodio.value = item.nombreCustodio
  editCedulaCustodio.value = item.cedulaCustodio
  editFormatoDePago.value = item.formatoDePago || 'Transferencia'
  editEmpresa.value = item.empresa
  editMarca.value = item.marca
  editAutorizacion.value = item.autorizacion
  editDatosBancarios.value = item.datosBancarios
  editError.value = ''
  editSuccess.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editCodAlmacen.value = ''
  editNombreCustodio.value = ''
  editCedulaCustodio.value = ''
  editFormatoDePago.value = 'Transferencia'
  editEmpresa.value = ''
  editMarca.value = ''
  editAutorizacion.value = ''
  editDatosBancarios.value = ''
  editError.value = ''
  editSuccess.value = ''
}

const updateLiquidacion = async () => {
  if (!canUpdate.value || editingId.value === null) return
  editError.value = ''
  editSuccess.value = ''

  const original = borradores.value.find(item => item.idLiquidacion === editingId.value)
  if (!original) {
    editError.value = 'No se encontro la liquidacion seleccionada.'
    return
  }

  try {
    await cajaChicaApi.put(`/Liquidaciones/${original.idLiquidacion}`, {
      IdLiquidacion: original.idLiquidacion,
      IdUsuario: original.idUsuario,
      FechaCreacion: original.fechaCreacion || new Date().toISOString(),
      FechaUltimaModificacion: new Date().toISOString(),
      CodAlmacen: editCodAlmacen.value,
      Marca: editMarca.value,
      Empresa: editEmpresa.value,
      CedulaCustodio: editCedulaCustodio.value,
      NombreCustodio: editNombreCustodio.value,
      FormatoDePago: editFormatoDePago.value,
      NumeroLiquidacion: original.numeroLiquidacion || '',
      Autorizacion: editAutorizacion.value,
      DatosBancarios: editDatosBancarios.value,
      Estado: original.estado || 'BORRADOR'
    })

    editSuccess.value = 'Cabecera actualizada.'
    await loadBorradores()
    cancelEdit()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    editError.value = message || 'No se pudo actualizar la liquidacion.'
  }
}

const deleteLiquidacion = async (item: LiquidacionItem) => {
  editError.value = ''
  editSuccess.value = ''
  try {
    await cajaChicaApi.delete(`/Liquidaciones/${item.idLiquidacion}`)
    await loadBorradores()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    borradorError.value = message || 'No se pudo eliminar la liquidacion.'
  }
}

const sendLiquidacion = async (item: LiquidacionItem) => {
  sendError.value = ''
  sendSuccess.value = ''
  sendingId.value = item.idLiquidacion

  try {
    const confirmed = window.confirm('Estas seguro de enviar esta liquidacion?')
    if (!confirmed) return

    await cajaChicaApi.post(`/Liquidaciones/${item.idLiquidacion}/enviar`)

    sendSuccess.value = 'Liquidacion enviada.'
    await loadBorradores()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    sendError.value = message || 'No se pudo enviar la liquidacion.'
  } finally {
    sendingId.value = null
  }
}

onMounted(() => {
  loadAlmacenesAsignados()
  loadEmpresas()
  loadBorradores()
})

watch(selectedCodAlmacen, () => {
  updateMarca()
})

watch(editCodAlmacen, () => {
  updateEditMarca()
})
</script>
