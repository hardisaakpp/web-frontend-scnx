<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="ignorarCierreExterno">
      <TransitionChild enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center p-4 pt-10">
          <TransitionChild enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-800 shadow-xl">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white">
                    Reparto de reconteo
                  </DialogTitle>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <template v-if="proposal?.hasExistingAssignments">
                      Reparto ya guardado. Ajusta lo que necesites y confirma para reemplazarlo.
                    </template>
                    <template v-else>
                      Propuesta agrupada por Nivel 2. Revisa, reasigna o quita usuarios antes de confirmar.
                    </template>
                  </p>
                </div>
                <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Cerrar" @click="pedirSalida">
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>

              <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div v-if="error" class="alert-error">{{ error }}</div>
                <div v-if="loading" class="py-10 text-center text-sm text-gray-400">Cargando propuesta...</div>

                <template v-else-if="items.length === 0">
                  <div class="py-10 text-center text-sm text-gray-400">No hay artículos pendientes de reconteo.</div>
                </template>

                <template v-else>
                  <!-- Resumen por usuario -->
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="userId in activeUserIds"
                      :key="userId"
                      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm"
                    >
                      <span class="font-medium text-gray-800 dark:text-gray-100">{{ userLabel(userId) }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">({{ countForUser(userId) }})</span>
                      <button
                        type="button"
                        class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs"
                        title="Quitar usuario y reasignar sus artículos"
                        @click="quitarUsuario(userId)"
                      >×</button>
                    </div>
                  </div>

                  <!-- Grupos por Nivel 2 -->
                  <div v-for="group in groupedByLevel2" :key="group.level2" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div class="px-4 py-2 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
                      <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ group.level2 || '(Sin Nivel 2)' }}</span>
                      <span class="text-xs text-gray-400">{{ group.items.length }} artículos</span>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-700">
                      <div v-for="item in group.items" :key="item.itemCode" class="px-4 py-2 flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.itemCode }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description ?? '—' }}</div>
                        </div>
                        <select
                          v-model="assignments[item.itemCode]"
                          class="select-input text-xs flex-shrink-0 w-48"
                          :class="item.scannedByUserIds.includes(assignments[item.itemCode]) ? 'border-amber-400' : ''"
                        >
                          <option v-for="userId in proposal?.candidateUserIds ?? []" :key="userId" :value="userId">
                            {{ userLabel(userId) }}{{ item.scannedByUserIds.includes(userId) ? ' (lo contó)' : '' }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Confirmación de salida sin guardar -->
              <div
                v-if="confirmandoSalida"
                class="mx-6 mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
              >
                <p class="font-semibold mb-1">¿Salir sin guardar el reparto?</p>
                <p class="text-xs mb-3">
                  <template v-if="proposal?.hasExistingAssignments">
                    Se descartan los cambios de esta pantalla; el reparto guardado anteriormente se mantiene.
                  </template>
                  <template v-else>
                    La toma queda en Reconteo sin reparto: cualquier usuario podrá recontar cualquier artículo.
                    Puedes volver a esta pantalla desde el menú de la toma con "Repartir reconteo".
                  </template>
                </p>
                <div class="flex justify-end gap-2">
                  <button type="button" class="btn-secondary !py-1.5 text-xs" @click="confirmandoSalida = false">Seguir editando</button>
                  <button type="button" class="btn-warning !py-1.5 text-xs" @click="cerrar">Salir sin guardar</button>
                </div>
              </div>

              <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" class="btn-secondary" :disabled="confirmando" @click="pedirSalida">Cancelar</button>
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="loading || confirmando || items.length === 0"
                  @click="confirmar"
                >
                  {{ confirmando ? 'Confirmando...' : (proposal?.hasExistingAssignments ? 'Guardar cambios' : 'Confirmar reparto') }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import { resolveUserNames } from '@/utils/resolveUserNames'
import type { RecountAssignmentProposalDto } from '../services/inventarioSesionesApi'

const props = defineProps<{
  isOpen: boolean
  sessionId: string | null
}>()

const emit = defineEmits<{ close: []; confirmed: [] }>()

const loading = ref(false)
const confirmando = ref(false)
const confirmandoSalida = ref(false)
const error = ref<string | null>(null)
const proposal = ref<RecountAssignmentProposalDto | null>(null)
const userNames = ref<Record<string, string>>({})

// itemCode -> assigned userId, mutable so the supervisor can override before confirming.
const assignments = reactive<Record<string, string>>({})

const items = computed(() => proposal.value?.items ?? [])

function userLabel(userId: string): string {
  return userNames.value[userId] || userId
}

const groupedByLevel2 = computed(() => {
  const map = new Map<string, typeof items.value>()
  for (const item of items.value) {
    const key = item.level2 ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([level2, groupItems]) => ({ level2, items: groupItems }))
})

const activeUserIds = computed(() =>
  [...new Set(Object.values(assignments))].sort((a, b) => userLabel(a).localeCompare(userLabel(b)))
)

function countForUser(userId: string): number {
  return Object.values(assignments).filter(u => u === userId).length
}

watch(() => props.isOpen, async (open) => {
  if (!open || !props.sessionId) return
  error.value = null
  confirmandoSalida.value = false
  loading.value = true
  try {
    proposal.value = await inventarioSesionesService.getRecountAssignmentProposal(props.sessionId)
    Object.keys(assignments).forEach(k => delete assignments[k])
    for (const item of proposal.value.items) {
      // Reparto ya guardado manda sobre la sugerencia: al reabrir se ve lo que está vigente.
      assignments[item.itemCode] = item.currentUserId ?? item.suggestedUserId ?? proposal.value.candidateUserIds[0] ?? ''
    }
    userNames.value = await resolveUserNames(proposal.value.candidateUserIds)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar la propuesta de reparto.'
  } finally {
    loading.value = false
  }
})

// Reassign everything currently held by `userId` to other candidates, preferring someone who
// didn't scan that specific item themselves, balancing load — same spirit as the backend's
// initial suggestion, just re-run client-side over whatever candidates remain.
function quitarUsuario(userId: string) {
  const remaining = (proposal.value?.candidateUserIds ?? []).filter(u => u !== userId)
  if (remaining.length === 0) {
    error.value = 'No hay otro usuario candidato para reasignar sus artículos.'
    return
  }
  const load: Record<string, number> = {}
  remaining.forEach(u => { load[u] = countForUser(u) })

  for (const item of items.value) {
    if (assignments[item.itemCode] !== userId) continue
    const eligible = remaining.filter(u => !item.scannedByUserIds.includes(u))
    const pool = eligible.length > 0 ? eligible : remaining
    const chosen = pool.reduce((best, u) => (load[u] < load[best] ? u : best), pool[0])
    assignments[item.itemCode] = chosen
    load[chosen] = (load[chosen] ?? 0) + 1
  }
}

async function confirmar() {
  if (!props.sessionId) return
  confirmando.value = true
  error.value = null
  try {
    const entries = Object.entries(assignments).map(([itemCode, userId]) => ({ itemCode, userId }))
    await inventarioSesionesService.setRecountAssignments(props.sessionId, entries)
    emit('confirmed')
    emit('close')
  } catch (e: any) {
    error.value = e.message ?? 'Error al confirmar el reparto.'
  } finally {
    confirmando.value = false
  }
}

/** Clic fuera o Escape no cierran el modal: un cierre accidental dejaba la toma en Reconteo sin reparto.
 *  Solo Cancelar y la X cierran, y piden confirmación. */
function ignorarCierreExterno() {
  // Intencionalmente vacío.
}

/** Cancelar y la X no cierran directo: primero se confirma, para que el supervisor sepa qué queda guardado. */
function pedirSalida() {
  if (confirmando.value) return
  if (loading.value || items.value.length === 0) {
    cerrar()
    return
  }
  confirmandoSalida.value = true
}

function cerrar() {
  confirmandoSalida.value = false
  emit('close')
}
</script>

<style scoped>
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-warning { @apply inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
