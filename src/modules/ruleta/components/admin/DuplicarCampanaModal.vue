<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useAdminStore } from '../../stores/adminStore'
import { extraerMensajeError } from '../../services/utils/errorHandler'
import type { Campana } from '../../types'

const props = defineProps<{
  open: boolean
  campanaId: string
  nombreOrigen: string
}>()

const emit = defineEmits<{
  close: []
  duplicated: [nueva: Campana]
}>()

const store = useAdminStore()
const toast = useToast()

const nombre = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')
const error = ref('')
const nombreTouched = ref(false)

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function resetForm() {
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const finPorDefecto = new Date(manana)
  finPorDefecto.setDate(finPorDefecto.getDate() + 15)

  nombre.value = `${props.nombreOrigen} - Copia`
  fechaInicio.value = fechaISO(manana)
  fechaFin.value = fechaISO(finPorDefecto)
  error.value = ''
  nombreTouched.value = false
}

// Cada vez que se abre el modal (no solo al montar) se regenera el formulario con los
// valores por defecto — si el admin lo cierra a medio llenar y lo reabre, no debe arrastrar
// texto de un intento anterior.
watch(() => props.open, (isOpen) => {
  if (isOpen) resetForm()
})

const hoyISO = fechaISO(new Date())

const nombreError = computed(() =>
  nombreTouched.value && !nombre.value.trim() ? 'El nombre es requerido.' : ''
)

const fechaFinError = computed(() =>
  fechaInicio.value && fechaFin.value && fechaFin.value <= fechaInicio.value
    ? 'La fecha de fin debe ser posterior a la fecha de inicio.'
    : ''
)

function cerrar() {
  if (store.guardando) return
  emit('close')
}

async function confirmar() {
  nombreTouched.value = true
  error.value = ''

  if (!nombre.value.trim()) { error.value = 'El nombre es requerido.'; return }
  if (fechaInicio.value < hoyISO) { error.value = 'La fecha de inicio debe ser hoy o una fecha futura.'; return }
  if (fechaFin.value <= fechaInicio.value) { error.value = 'La fecha de fin debe ser posterior a la fecha de inicio.'; return }

  try {
    const nueva = await store.duplicarCampana(props.campanaId, {
      nombre: nombre.value.trim(),
      fecha_inicio: fechaInicio.value,
      fecha_fin: fechaFin.value
    })
    if (!nueva) return // guardando ya en curso, otra llamada en vuelo
    toast.success('¡Campaña duplicada con éxito!', 'Ahora puedes asignar el nuevo inventario.')
    emit('duplicated', nueva)
  } catch (e) {
    error.value = extraerMensajeError(e, 'No se pudo duplicar la campaña. Intenta de nuevo.')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="open"
           class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
           @click.self="cerrar">
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          appear
        >
          <div v-if="open" class="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-2M8 7h8v8"/>
                  </svg>
                </div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white leading-tight">Duplicar campaña</h3>
              </div>
              <button type="button" @click="cerrar" :disabled="store.guardando"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-4">
              <p class="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-xs text-indigo-700 dark:text-indigo-400">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Se copiarán todos los premios, sucursales asignadas y parámetros de la campaña original.
                El stock se reinicia en 0 y la nueva campaña arranca en <strong>Borrador</strong>, sin
                giros ni historial previo.
              </p>

              <div>
                <label for="dup-nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre de la nueva campaña <span class="text-red-500">*</span>
                </label>
                <input id="dup-nombre" v-model="nombre" type="text" maxlength="150"
                  @blur="nombreTouched = true"
                  class="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  :class="nombreError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'"/>
                <p v-if="nombreError" class="mt-1 text-xs text-red-500">{{ nombreError }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="dup-inicio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Fecha inicio <span class="text-red-500">*</span>
                  </label>
                  <input id="dup-inicio" v-model="fechaInicio" type="date" :min="hoyISO"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"/>
                </div>
                <div>
                  <label for="dup-fin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Fecha fin <span class="text-red-500">*</span>
                  </label>
                  <input id="dup-fin" v-model="fechaFin" type="date"
                    class="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    :class="fechaFinError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'"/>
                </div>
              </div>
              <p v-if="fechaFinError" class="text-xs text-red-500">{{ fechaFinError }}</p>

              <p v-if="error" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                {{ error }}
              </p>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800
                        bg-gray-50/60 dark:bg-gray-900/50 rounded-b-2xl">
              <button type="button" @click="cerrar" :disabled="store.guardando"
                class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       text-sm font-medium text-gray-600 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" @click="confirmar" :disabled="store.guardando"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                       disabled:opacity-50 disabled:cursor-not-allowed"
                :class="store.guardando ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'">
                <svg v-if="store.guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                </svg>
                {{ store.guardando ? 'Duplicando…' : 'Duplicar campaña' }}
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
