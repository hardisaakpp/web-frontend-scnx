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
              <!-- Cabecera -->
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white">
                      Reparto de reconteo
                    </DialogTitle>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <template v-if="paso === 1">Paso 1 de 2 · ¿Quiénes participarán en el reconteo?</template>
                      <template v-else>Paso 2 de 2 · Reparto entre {{ participantesSeleccionados.length }} usuario(s), agrupado por Nivel 2. Ajusta lo que necesites y confirma.</template>
                    </p>
                  </div>
                  <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Cerrar" @click="pedirSalida">
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>

                <!-- Resumen del reparto (paso 2): siempre visible arriba -->
                <div v-if="paso === 2 && !loading" class="mt-3 flex flex-wrap gap-2">
                  <div
                    v-for="userId in participantesSeleccionados"
                    :key="userId"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    :class="countForUser(userId) === 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'"
                  >
                    <span class="font-medium">{{ userLabel(userId) }}</span>
                    <span class="text-xs opacity-80">{{ countForUser(userId) }} art.</span>
                  </div>
                  <div class="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                    Total {{ items.length }} artículos
                  </div>
                </div>
              </div>

              <!-- Cuerpo -->
              <div class="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div v-if="error" class="alert-error">{{ error }}</div>
                <div v-if="loading" class="py-10 text-center text-sm text-gray-400">Cargando...</div>

                <template v-else-if="proposal && items.length === 0">
                  <div class="py-10 text-center text-sm text-gray-400">No hay artículos pendientes de reconteo.</div>
                </template>

                <!-- Paso 1: participantes -->
                <template v-else-if="paso === 1 && proposal">
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Hay <strong>{{ items.length }}</strong> artículos por recontar. Marca quiénes los recontarán; el reparto se calcula solo entre ellos.
                  </p>

                  <div v-if="participantes.length === 0" class="alert-warning">
                    Nadie escaneó en la primera ronda y la toma no tiene usuarios de picking. Agrega abajo a quienes recontarán, o envía sin reparto.
                  </div>

                  <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                    <label
                      v-for="p in participantes"
                      :key="p.userId"
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <input
                        v-model="p.seleccionado"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      >
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ userLabel(p.userId) }}</div>
                        <div v-if="userLabel(p.userId) !== p.userId" class="text-xs text-gray-400 truncate">{{ p.userId }}</div>
                      </div>
                      <div class="flex flex-wrap gap-1 justify-end">
                        <span v-if="p.escaneo > 0" class="tag tag-blue">Escaneó {{ p.escaneo }}</span>
                        <span v-if="p.asignados > 0" class="tag tag-violet">Asignado {{ p.asignados }}</span>
                        <span v-if="p.esPicker" class="tag tag-gray">Picking</span>
                        <span v-if="p.nuevo" class="tag tag-green">Nuevo</span>
                      </div>
                    </label>
                  </div>

                  <div class="flex items-center gap-2">
                    <input
                      v-model="nuevoUsuario"
                      type="text"
                      class="text-input flex-1"
                      placeholder="Agregar otro usuario (usuario de red / AD)"
                      @keydown.enter.prevent="agregarUsuario"
                    >
                    <button type="button" class="btn-secondary" :disabled="!nuevoUsuario.trim()" @click="agregarUsuario">Agregar</button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Un usuario agregado aquí queda también como usuario de picking de la toma para que pueda entrar a recontar.
                    Quitar la marca a alguien solo lo deja fuera del reparto; conserva su acceso a la toma.
                  </p>

                  <div v-if="participantesSeleccionados.length === 0" class="alert-warning">
                    Sin participantes no hay reparto: la toma queda en Reconteo y <strong>cualquier usuario con acceso a la toma podrá recontar todos los artículos</strong>.
                  </div>
                </template>

                <!-- Paso 2: reparto -->
                <template v-else-if="paso === 2 && proposal">
                  <div v-if="sinAsignar > 0" class="alert-warning">
                    {{ sinAsignar }} artículo(s) sin usuario asignado. Elige un usuario en cada uno para poder confirmar.
                  </div>

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
                          <option v-if="!assignments[item.itemCode]" value="" disabled>— Sin asignar —</option>
                          <option v-for="userId in participantesSeleccionados" :key="userId" :value="userId">
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
                <p class="font-semibold mb-1">¿Salir sin guardar?</p>
                <p class="text-xs mb-3">
                  <template v-if="proposal?.hasExistingAssignments">
                    Se descartan los cambios de esta pantalla; el reparto guardado anteriormente se mantiene.
                  </template>
                  <template v-else>
                    La toma queda en Reconteo sin reparto: cualquier usuario con acceso podrá recontar cualquier artículo.
                    Puedes volver desde el menú de la toma con "Repartir reconteo".
                  </template>
                </p>
                <div class="flex justify-end gap-2">
                  <button type="button" class="btn-secondary !py-1.5 text-xs" @click="confirmandoSalida = false">Seguir editando</button>
                  <button type="button" class="btn-warning !py-1.5 text-xs" @click="cerrar">Salir sin guardar</button>
                </div>
              </div>

              <!-- Pie -->
              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <button v-if="paso === 2" type="button" class="btn-secondary" :disabled="confirmando || loading" @click="volverAParticipantes">
                    ← Cambiar participantes
                  </button>
                </div>
                <div class="flex gap-3">
                  <button type="button" class="btn-secondary" :disabled="confirmando" @click="pedirSalida">Cancelar</button>

                  <template v-if="paso === 1">
                    <button
                      v-if="participantesSeleccionados.length === 0"
                      type="button"
                      class="btn-warning"
                      :disabled="loading || confirmando || !proposal || items.length === 0"
                      @click="enviarSinReparto"
                    >
                      {{ confirmando ? 'Guardando...' : 'Enviar sin reparto' }}
                    </button>
                    <button
                      v-else
                      type="button"
                      class="btn-primary"
                      :disabled="loading || confirmando || items.length === 0"
                      @click="continuarAReparto"
                    >
                      Continuar ({{ participantesSeleccionados.length }})
                    </button>
                  </template>

                  <button
                    v-else
                    type="button"
                    class="btn-primary"
                    :disabled="loading || confirmando || items.length === 0 || sinAsignar > 0"
                    @click="confirmar"
                  >
                    {{ confirmando ? 'Guardando...' : (proposal?.hasExistingAssignments ? 'Guardar cambios' : 'Confirmar reparto') }}
                  </button>
                </div>
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

/** `confirmed` lleva un resumen legible para mostrarlo en la pantalla que abrió el modal. */
const emit = defineEmits<{ close: []; confirmed: [resumen: string] }>()

interface Participante {
  userId: string
  seleccionado: boolean
  /** Artículos que escaneó en la primera ronda. */
  escaneo: number
  /** Artículos que ya tiene asignados en un reparto guardado. */
  asignados: number
  esPicker: boolean
  /** Agregado a mano en este modal: al confirmar se registra como picker de la toma. */
  nuevo: boolean
}

const paso = ref<1 | 2>(1)
const loading = ref(false)
const confirmando = ref(false)
const confirmandoSalida = ref(false)
const error = ref<string | null>(null)
const proposal = ref<RecountAssignmentProposalDto | null>(null)
const userNames = ref<Record<string, string>>({})
const participantes = ref<Participante[]>([])
const pickersActuales = ref<string[]>([])
const nuevoUsuario = ref('')

// itemCode -> assigned userId, editable por el supervisor antes de confirmar.
const assignments = reactive<Record<string, string>>({})

const items = computed(() => proposal.value?.items ?? [])
const participantesSeleccionados = computed(() => participantes.value.filter(p => p.seleccionado).map(p => p.userId))
const sinAsignar = computed(() => items.value.filter(i => !assignments[i.itemCode]).length)

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

function countForUser(userId: string): number {
  return Object.values(assignments).filter(u => u === userId).length
}

function mismoUsuario(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
}

// ─── Paso 1: cargar candidatos ───────────────────────────────────────────────

watch(() => props.isOpen, async (open) => {
  if (!open || !props.sessionId) return
  paso.value = 1
  error.value = null
  confirmandoSalida.value = false
  nuevoUsuario.value = ''
  Object.keys(assignments).forEach(k => delete assignments[k])
  loading.value = true
  try {
    const [prop, pickers] = await Promise.all([
      inventarioSesionesService.getRecountAssignmentProposal(props.sessionId),
      inventarioSesionesService.getPickers(props.sessionId),
    ])
    proposal.value = prop
    pickersActuales.value = pickers.map(p => p.userId)

    // Candidatos: quienes escanearon, quienes ya están asignados y los usuarios de picking de la toma.
    const escaneos: Record<string, number> = {}
    const asignados: Record<string, number> = {}
    for (const item of prop.items) {
      for (const u of item.scannedByUserIds) escaneos[u] = (escaneos[u] ?? 0) + 1
      if (item.currentUserId) asignados[item.currentUserId] = (asignados[item.currentUserId] ?? 0) + 1
    }
    participantes.value = prop.candidateUserIds.map(userId => ({
      userId,
      seleccionado: true,
      escaneo: escaneos[userId] ?? 0,
      asignados: asignados[userId] ?? 0,
      esPicker: pickersActuales.value.some(p => mismoUsuario(p, userId)),
      nuevo: false,
    }))
    userNames.value = await resolveUserNames(prop.candidateUserIds)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar la propuesta de reparto.'
  } finally {
    loading.value = false
  }
})

function agregarUsuario() {
  const userId = nuevoUsuario.value.trim()
  if (!userId) return
  const existente = participantes.value.find(p => mismoUsuario(p.userId, userId))
  if (existente) {
    existente.seleccionado = true
  } else {
    participantes.value.push({
      userId,
      seleccionado: true,
      escaneo: 0,
      asignados: 0,
      esPicker: pickersActuales.value.some(p => mismoUsuario(p, userId)),
      nuevo: true,
    })
  }
  nuevoUsuario.value = ''
}

// ─── Paso 2: reparto entre los participantes elegidos ────────────────────────

async function continuarAReparto() {
  if (!props.sessionId || participantesSeleccionados.value.length === 0) return
  error.value = null
  loading.value = true
  try {
    const seleccion = participantesSeleccionados.value
    const prop = await inventarioSesionesService.getRecountAssignmentProposal(props.sessionId, seleccion)
    proposal.value = { ...prop, hasExistingAssignments: proposal.value?.hasExistingAssignments ?? prop.hasExistingAssignments }
    Object.keys(assignments).forEach(k => delete assignments[k])
    for (const item of prop.items) {
      // Lo ya guardado manda, siempre que ese usuario siga participando; si no, la sugerencia.
      const actual = item.currentUserId && seleccion.some(u => mismoUsuario(u, item.currentUserId!)) ? item.currentUserId : null
      assignments[item.itemCode] = actual ?? item.suggestedUserId ?? seleccion[0] ?? ''
    }
    const faltantes = seleccion.filter(u => !userNames.value[u])
    if (faltantes.length > 0) {
      userNames.value = { ...userNames.value, ...(await resolveUserNames(faltantes)) }
    }
    paso.value = 2
  } catch (e: any) {
    error.value = e.message ?? 'Error al calcular el reparto.'
  } finally {
    loading.value = false
  }
}

function volverAParticipantes() {
  error.value = null
  paso.value = 1
}

// ─── Guardar ─────────────────────────────────────────────────────────────────

/** Los agregados a mano se registran como pickers para que puedan abrir la toma y recontar. */
async function registrarNuevosPickers() {
  if (!props.sessionId) return
  const nuevos = participantes.value.filter(p => p.seleccionado && p.nuevo && !p.esPicker)
  for (const p of nuevos) {
    await inventarioSesionesService.addPicker(props.sessionId, p.userId)
    p.esPicker = true
    pickersActuales.value.push(p.userId)
  }
}

async function confirmar() {
  if (!props.sessionId) return
  confirmando.value = true
  error.value = null
  try {
    await registrarNuevosPickers()
    const entries = Object.entries(assignments).map(([itemCode, userId]) => ({ itemCode, userId }))
    await inventarioSesionesService.setRecountAssignments(props.sessionId, entries)
    const detalle = participantesSeleccionados.value.map(u => `${userLabel(u)} (${countForUser(u)})`).join(', ')
    emit('confirmed', `Reparto de reconteo guardado: ${detalle}.`)
    cerrar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al guardar el reparto.'
  } finally {
    confirmando.value = false
  }
}

async function enviarSinReparto() {
  if (!props.sessionId) return
  confirmando.value = true
  error.value = null
  try {
    // Si había un reparto guardado, "sin reparto" significa borrarlo.
    if (proposal.value?.hasExistingAssignments) {
      await inventarioSesionesService.setRecountAssignments(props.sessionId, [])
    }
    emit('confirmed', 'Reconteo sin reparto: cualquier usuario con acceso a la toma podrá recontar todos los artículos.')
    cerrar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al actualizar el reparto.'
  } finally {
    confirmando.value = false
  }
}

// ─── Cierre ──────────────────────────────────────────────────────────────────

/** Clic fuera o Escape no cierran el modal: un cierre accidental dejaba la toma en Reconteo sin reparto. */
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
.btn-warning { @apply inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.alert-warning { @apply rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.text-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.tag { @apply inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium; }
.tag-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.tag-violet { @apply bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300; }
.tag-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300; }
.tag-green { @apply bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300; }
</style>
