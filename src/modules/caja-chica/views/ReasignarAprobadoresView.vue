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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Reasignar Aprobador</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Liquidaciones pendientes de aprobación de supervisor y a quién están asignadas
          </p>
        </div>
        <button
          type="button"
          class="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="loadPendientes"
        >
          Refrescar
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando pendientes de supervisor...</div>
        <div v-else-if="loadError" class="text-sm text-red-600 dark:text-red-400">{{ loadError }}</div>
        <div v-else-if="!grupos.length" class="text-sm text-gray-500 dark:text-gray-400">
          No hay liquidaciones pendientes en estado de supervisor.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="grupo in grupos"
            :key="`${grupo.idLiquidacion}-${grupo.idUsuario}`"
            class="rounded border border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-gray-900 dark:text-white">
                  Liquidación #{{ grupo.idLiquidacion }} · Tienda {{ grupo.codAlmacen }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Custodio: {{ grupo.nombreCustodio }} · {{ grupo.detalles }} detalle(s) pendiente(s) · Total: {{ formatAmount(grupo.total) }} · Fecha: {{ formatDate(grupo.fechaCreacion) }}
                </div>
                <div class="mt-2 text-xs">
                  <span class="text-gray-500 dark:text-gray-400">Asignado a:</span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 px-2.5 py-0.5 ml-1">
                    {{ grupo.userLabel }}
                  </span>
                </div>
              </div>

              <div class="relative w-full sm:w-72">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cambiar a</label>
                <input
                  v-model.trim="grupo.query"
                  type="text"
                  placeholder="Buscar nuevo supervisor..."
                  class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  :disabled="grupo.reasignando"
                  @focus="grupo.dropdownOpen = true"
                  @blur="handleBlur(grupo)"
                />
                <div
                  v-if="grupo.dropdownOpen && grupo.query.length >= 1"
                  class="absolute z-10 mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-48 overflow-y-auto shadow-lg"
                >
                  <div v-if="!suggestionsFor(grupo).length" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Sin coincidencias.</div>
                  <button
                    v-else
                    v-for="user in suggestionsFor(grupo)"
                    :key="user.id"
                    type="button"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    @click="reasignar(grupo, user)"
                  >
                    {{ user.label }}
                  </button>
                </div>
                <p v-if="grupo.reasignando" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Reasignando...</p>
                <p v-else-if="grupo.error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ grupo.error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="actionSuccess" class="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{{ actionSuccess }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cajaChicaApi } from '@/lib/http'
import api from '@/services/api'

const router = useRouter()

const volver = () => {
  router.back()
}

interface UserOption {
  id: string
  label: string
}

interface GrupoPendiente {
  idLiquidacion: number
  idUsuario: string
  userLabel: string
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
  detalles: number
  total: number
  query: string
  dropdownOpen: boolean
  reasignando: boolean
  error: string
}

const usuarios = ref<UserOption[]>([])
const grupos = ref<GrupoPendiente[]>([])
const loading = ref(false)
const loadError = ref('')
const actionSuccess = ref('')

// Límite de sugerencias renderizadas: evita pintar cientos de filas mientras se escribe.
const SUGGESTIONS_LIMIT = 8

const usuariosPorId = computed(() => {
  const map = new Map<string, UserOption>()
  usuarios.value.forEach(user => map.set(user.id, user))
  return map
})

const normalizeUser = (user: any): UserOption => {
  const id = String(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario ?? '')
  const userName = String(user.userName ?? user.UsuarioNombre ?? user.username ?? '').trim()
  const fullName = String(user.fullName ?? user.Nombre ?? user.name ?? '').trim()
  const email = String(user.email ?? user.Correo ?? user.mail ?? '').trim()
  const base = fullName || userName || email || id
  const label = email && base !== email ? `${base} (${email})` : base
  return { id, label }
}

const labelForUsuario = (idUsuario: string): string =>
  usuariosPorId.value.get(idUsuario)?.label ?? `Usuario ${idUsuario} (no encontrado)`

const suggestionsFor = (grupo: GrupoPendiente): UserOption[] => {
  const query = grupo.query.toLowerCase().trim()
  if (!query) return []
  return usuarios.value
    .filter(user => user.id !== grupo.idUsuario && user.label.toLowerCase().includes(query))
    .slice(0, SUGGESTIONS_LIMIT)
}

const handleBlur = (grupo: GrupoPendiente) => {
  // Retraso para permitir que el @click de una sugerencia se registre antes de cerrar el dropdown.
  setTimeout(() => {
    grupo.dropdownOpen = false
  }, 150)
}

const loadUsuarios = async () => {
  try {
    const response = await api.get('/Users/list')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    usuarios.value = items.map(normalizeUser)
  } catch {
    usuarios.value = []
  }
}

const loadPendientes = async () => {
  loading.value = true
  loadError.value = ''
  actionSuccess.value = ''
  try {
    const response = await cajaChicaApi.get('/Aprobaciones/pendientes-supervisor')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []

    const grouped = new Map<string, GrupoPendiente>()
    for (const item of items) {
      const idLiquidacion = Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0)
      const idUsuario = String(item.idUsuario ?? item.IdUsuario ?? '')
      const key = `${idLiquidacion}-${idUsuario}`
      const total = Number(item.total ?? item.Total ?? 0)

      const existing = grouped.get(key)
      if (existing) {
        existing.detalles += 1
        existing.total += total
        continue
      }

      grouped.set(key, {
        idLiquidacion,
        idUsuario,
        userLabel: labelForUsuario(idUsuario),
        codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? ''),
        nombreCustodio: String(item.nombreCustodio ?? item.NombreCustodio ?? ''),
        fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
        detalles: 1,
        total,
        query: '',
        dropdownOpen: false,
        reasignando: false,
        error: ''
      })
    }

    grupos.value = Array.from(grouped.values())
  } catch {
    loadError.value = 'No se pudieron cargar las liquidaciones pendientes de supervisor.'
  } finally {
    loading.value = false
  }
}

const reasignar = async (grupo: GrupoPendiente, nuevoUsuario: UserOption) => {
  grupo.error = ''
  grupo.reasignando = true
  grupo.dropdownOpen = false
  actionSuccess.value = ''

  try {
    await cajaChicaApi.post('/Aprobaciones/reasignar', {
      IdLiquidacion: grupo.idLiquidacion,
      NivelAprobacion: 1,
      IdUsuarioActual: grupo.idUsuario,
      IdUsuarioNuevo: nuevoUsuario.id
    })
    actionSuccess.value = `Liquidación #${grupo.idLiquidacion} reasignada de ${grupo.userLabel} a ${nuevoUsuario.label}.`
    await loadPendientes()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    grupo.error = message || 'No se pudo reasignar.'
    grupo.reasignando = false
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

onMounted(async () => {
  await loadUsuarios()
  await loadPendientes()
})
</script>
