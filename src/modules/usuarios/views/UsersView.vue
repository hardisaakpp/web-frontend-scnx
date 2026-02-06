<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Vista de usuarios para gestion basica.</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ totalCount }}</span>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              v-model.trim="searchQuery"
              type="text"
              placeholder="Buscar por usuario, nombre o email"
              class="w-full sm:w-64 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <select
              v-model.number="pageSize"
              class="w-full sm:w-32 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
        <div v-if="loading" class="text-sm text-gray-600 dark:text-gray-300">Cargando usuarios...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="users.length === 0" class="text-sm text-gray-600 dark:text-gray-300">Sin usuarios.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in pagedUsers" :key="getValue(user, ['id', 'userId'])">
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['id', 'userId']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['userName', 'username']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['fullName', 'name']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['email', 'mail']) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredUsers.length > 0" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {{ pageStart }} - {{ pageEnd }} de {{ filteredUsers.length }}
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50"
              :disabled="page === 1"
              @click="page--"
            >
              Anterior
            </button>
            <div class="text-xs text-gray-600 dark:text-gray-300">{{ page }} / {{ totalPages }}</div>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50"
              :disabled="page === totalPages"
              @click="page++"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'

type UserRecord = Record<string, unknown>

const users = ref<UserRecord[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(10)

const getValue = (user: UserRecord, keys: string[]) => {
  for (const key of keys) {
    if (user[key] !== undefined && user[key] !== null && user[key] !== '') {
      return String(user[key])
    }
  }
  return '-'
}

const totalCount = computed(() => users.value.length)

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) {
    return users.value
  }
  return users.value.filter(user => {
    const values = [
      getValue(user, ['userName', 'username']),
      getValue(user, ['fullName', 'name']),
      getValue(user, ['email', 'mail'])
    ]
    return values.some(value => value.toLowerCase().includes(query))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
  if (filteredUsers.value.length === 0) {
    return 0
  }
  return (page.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = page.value * pageSize.value
  return Math.min(end, filteredUsers.value.length)
})

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('http://192.168.2.12:8080/api/Users')
    const payload = response.data
    if (Array.isArray(payload)) {
      users.value = payload
    } else if (Array.isArray(payload?.data)) {
      users.value = payload.data
    } else if (Array.isArray(payload?.users)) {
      users.value = payload.users
    } else {
      users.value = []
    }
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = message || 'No se pudo cargar la lista de usuarios.'
  } finally {
    loading.value = false
  }
}

watch([searchQuery, pageSize], () => {
  page.value = 1
})

watch(filteredUsers, () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
})

onMounted(loadUsers)
</script>
