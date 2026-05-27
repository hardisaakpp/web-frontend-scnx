<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <VolverButton to="/admin" title="Volver al Panel de Administración" class="shrink-0" />
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Datos adicionales</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Accesos a almacenes por usuario</p>
      </div>

      <!-- Formulario nueva asignación -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nueva asignación</h2>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Usuario</label>
            <select
              v-model="newUserId"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar usuario</option>
              <option v-for="u in usuarios" :key="String(u.id ?? u.userId)" :value="String(u.id ?? u.userId)">
                {{ u.fullName ?? u.userName ?? u.email ?? u.id }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cód. almacén</label>
            <input
              v-model.trim="newCodAlmacen"
              type="text"
              placeholder="Ej: BYL-NUO"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white uppercase"
              @keyup.enter="createAsignacion"
            />
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Permiso</label>
            <select
              v-model="newAcceso"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar permiso</option>
              <option v-for="key in permisos" :key="key" :value="key">{{ key }}</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              class="w-full sm:w-auto rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
              :disabled="assignLoading || !canAssign"
              @click="createAsignacion"
            >
              {{ assignLoading ? 'Asignando...' : 'Asignar' }}
            </button>
          </div>
        </div>
        <div v-if="assignError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ assignError }}</div>
        <div v-else-if="assignSuccess" class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{{ assignSuccess }}</div>
      </div>

      <!-- Listado -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ asignaciones.length }}</span>
          </span>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            :disabled="loading"
            @click="loadData"
          >
            Recargar
          </button>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="error" class="py-10 text-center text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="asignaciones.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin asignaciones registradas.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacén</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Permiso</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in asignaciones" :key="String(item.id)">
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ resolveUserName(item.userId) }}</td>
                <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-200">{{ item.codAlmacen }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ item.accesoAlmacen }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300 disabled:opacity-50"
                    :disabled="deleteLoadingId === String(item.id)"
                    @click="deleteAsignacion(String(item.id))"
                  >
                    {{ deleteLoadingId === String(item.id) ? 'Eliminando...' : 'Eliminar' }}
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
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import VolverButton from '../components/VolverButton.vue'

interface AsignacionRecord {
  id: string
  userId: string
  codAlmacen: string
  accesoAlmacen: string
}

type UserRecord = Record<string, unknown>

const asignaciones = ref<AsignacionRecord[]>([])
const usuarios = ref<UserRecord[]>([])
const permisos = ref<string[]>(['Lectura', 'Escritura', 'Administrador'])
const loading = ref(false)
const error = ref('')

const newUserId = ref('')
const newCodAlmacen = ref('')
const newAcceso = ref('')
const assignLoading = ref(false)
const assignError = ref('')
const assignSuccess = ref('')
const deleteLoadingId = ref<string | null>(null)

const canAssign = computed(() => newUserId.value && newCodAlmacen.value.trim() && newAcceso.value)

const resolveUserName = (userId: string) => {
  const u = usuarios.value.find(u => String(u.id ?? u.userId) === userId)
  if (!u) return userId
  return String(u.fullName ?? u.userName ?? u.email ?? userId)
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [asignResp, userResp] = await Promise.all([
      api.get('/UsuariosAlmacenes'),
      api.get('/Users')
    ])
    const usersPayload = userResp.data as UserRecord[] | { data?: UserRecord[]; users?: UserRecord[] }
    if (Array.isArray(usersPayload)) {
      usuarios.value = usersPayload
    } else if (Array.isArray(usersPayload?.data)) {
      usuarios.value = usersPayload.data
    } else if (Array.isArray((usersPayload as { users?: UserRecord[] })?.users)) {
      usuarios.value = (usersPayload as { users: UserRecord[] }).users
    }
    asignaciones.value = asignResp.data as AsignacionRecord[]
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo cargar los datos.'
  } finally {
    loading.value = false
  }
}

const createAsignacion = async () => {
  if (!canAssign.value) return
  assignLoading.value = true
  assignError.value = ''
  assignSuccess.value = ''
  try {
    await api.post('/UsuariosAlmacenes', {
      userId: newUserId.value,
      codAlmacen: newCodAlmacen.value.toUpperCase(),
      accesoAlmacen: newAcceso.value
    })
    assignSuccess.value = 'Asignación creada correctamente.'
    newUserId.value = ''
    newCodAlmacen.value = ''
    newAcceso.value = ''
    await loadData()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    assignError.value = e?.response?.data?.message || 'No se pudo crear la asignación.'
  } finally {
    assignLoading.value = false
  }
}

const deleteAsignacion = async (id: string) => {
  deleteLoadingId.value = id
  try {
    await api.delete(`/UsuariosAlmacenes/${id}`)
    asignaciones.value = asignaciones.value.filter(a => String(a.id) !== id)
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo eliminar la asignación.'
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(loadData)
</script>
