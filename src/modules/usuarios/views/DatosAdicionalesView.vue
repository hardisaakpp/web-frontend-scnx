<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <VolverButton to="/usuarios/users" title="Volver a Usuarios" class="shrink-0" />

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Accesos a almacenes</h1>
        <p v-if="userName" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Usuario: <span class="font-medium text-gray-700 dark:text-gray-300">{{ userName }}</span>
        </p>
      </div>

      <!-- Formulario nueva asignación -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nueva asignación</h2>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            <p v-if="permisosError" class="mt-1 text-xs text-red-500 dark:text-red-400">{{ permisosError }}</p>
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

      <!-- Listado de asignaciones -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ asignaciones.length }}</span>
          </span>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            :disabled="loading"
            @click="loadAsignaciones"
          >
            Recargar
          </button>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando...
        </div>
        <div v-else-if="error" class="py-10 text-center text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>
        <div v-else-if="asignaciones.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin asignaciones registradas.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacén</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Permiso</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha creación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Modificado por</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in asignaciones" :key="String(item.id)">
                <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-200">{{ item.codAlmacen }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  <template v-if="editingId === String(item.id)">
                    <select
                      v-model="editAcceso"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option v-for="key in permisos" :key="key" :value="key">{{ key }}</option>
                    </select>
                  </template>
                  <template v-else>{{ item.accesoAlmacen }}</template>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleDateString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ item.modificadoPor ?? '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <template v-if="editingId === String(item.id)">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 disabled:opacity-50"
                        :disabled="updateLoadingId === String(item.id)"
                        @click="updateAsignacion(String(item.id))"
                      >
                        {{ updateLoadingId === String(item.id) ? 'Guardando...' : 'Guardar' }}
                      </button>
                      <button
                        type="button"
                        class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        @click="cancelEdit"
                      >
                        Cancelar
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded border border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-xs text-sky-700 dark:text-sky-300 hover:border-sky-300 disabled:opacity-50"
                        :disabled="!!deleteLoadingId"
                        @click="startEdit(item)"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300 disabled:opacity-50"
                        :disabled="deleteLoadingId === String(item.id)"
                        @click="deleteAsignacion(String(item.id))"
                      >
                        {{ deleteLoadingId === String(item.id) ? 'Eliminando...' : 'Eliminar' }}
                      </button>
                    </div>
                  </template>
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
import { useRoute } from 'vue-router'
import api from '@/services/api'
import VolverButton from '../components/VolverButton.vue'

interface AsignacionRecord {
  id: string
  userId: string
  codAlmacen: string
  accesoAlmacen: string
  fechaCreacion: string | null
  modificadoPor: string | null
}

const route = useRoute()
const userId = computed(() => route.params.id as string)

const userName = ref('')
const asignaciones = ref<AsignacionRecord[]>([])
const permisos = ref<string[]>([])
const permisosError = ref('')
const loading = ref(false)
const error = ref('')

const newCodAlmacen = ref('')
const newAcceso = ref('')
const assignLoading = ref(false)
const assignError = ref('')
const assignSuccess = ref('')
const deleteLoadingId = ref<string | null>(null)

// Edit inline state
const editingId = ref<string | null>(null)
const editAcceso = ref('')
const updateLoadingId = ref<string | null>(null)

const startEdit = (item: AsignacionRecord) => {
  editingId.value = String(item.id)
  editAcceso.value = item.accesoAlmacen
}

const cancelEdit = () => {
  editingId.value = null
  editAcceso.value = ''
}

const updateAsignacion = async (id: string) => {
  if (!editAcceso.value) return
  updateLoadingId.value = id
  try {
    await api.put(`/UsuariosAlmacenes/${id}`, { accesoAlmacen: editAcceso.value })
    const item = asignaciones.value.find(a => String(a.id) === id)
    if (item) item.accesoAlmacen = editAcceso.value
    editingId.value = null
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo actualizar la asignación.'
  } finally {
    updateLoadingId.value = null
  }
}

const canAssign = computed(() => newCodAlmacen.value.trim() && newAcceso.value)

const loadUserName = async () => {
  try {
    const response = await api.get(`/Users/${userId.value}`)
    const u = response.data as Record<string, unknown>
    userName.value = String(u.fullName ?? u.userName ?? u.email ?? userId.value)
  } catch {
    // no crítico
  }
}

const loadAsignaciones = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(`/UsuariosAlmacenes/user/${userId.value}`)
    asignaciones.value = response.data as AsignacionRecord[]
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo cargar las asignaciones.'
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
      userId: userId.value,
      codAlmacen: newCodAlmacen.value.toUpperCase(),
      accesoAlmacen: newAcceso.value
    })
    assignSuccess.value = 'Asignación creada correctamente.'
    newCodAlmacen.value = ''
    newAcceso.value = ''
    await loadAsignaciones()
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

const loadPermisos = async () => {
  permisosError.value = ''
  try {
    const response = await api.get('/Permissions')
    const data = response.data as { key?: string }[]
    permisos.value = Array.isArray(data) ? data.map(p => p.key ?? '').filter(Boolean) : []
  } catch {
    permisosError.value = 'No se pudieron cargar los permisos.'
  }
}

onMounted(async () => {
  await Promise.all([loadUserName(), loadAsignaciones(), loadPermisos()])
})
</script>
