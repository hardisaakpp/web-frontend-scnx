<template>
  <Teleport to="body">
    <dialog
      v-if="open"
      ref="dialogRef"
      :aria-labelledby="tituloId"
      class="modal-contacto-notificacion-dialog relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-0 m-auto focus:outline-none"
      @cancel.prevent="cerrar"
      @click="onBackdropClick"
    >
      <header class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 :id="tituloId" class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <EnvelopeIcon class="h-5 w-5 text-indigo-500" aria-hidden="true" />
          {{ esEdicion ? 'Editar destinatario' : 'Nuevo destinatario' }}
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          @click="cerrar"
        >
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-5 py-4">
        <form id="form-contacto-notificacion" class="space-y-4" @submit.prevent="confirmar">
          <div>
            <label for="nombreCompleto" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombres y Apellidos <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="nombreCompleto"
              v-model="nombreCompleto"
              type="text"
              autofocus
              maxlength="150"
              placeholder="Ej. Ana Torres"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 focus:ring-2"
              :class="errorNombre
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'"
            />
            <p v-if="errorNombre" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorNombre }}</p>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo Institucional <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              v-model.trim="email"
              type="email"
              maxlength="150"
              placeholder="nombre.apellido@mabeltrading.com.ec"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 focus:ring-2"
              :class="errorEmail
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'"
            />
            <p v-if="errorEmail" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorEmail }}</p>
            <p v-else class="mt-1 text-xs text-gray-400">Dominios admitidos: @mabeltrading.com.ec, @cosmec.com.ec</p>
          </div>

          <div>
            <label for="cargo" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo en el Área</label>
            <input
              id="cargo"
              v-model.trim="cargo"
              type="text"
              maxlength="100"
              placeholder="Ej. Jefa de Contabilidad"
              class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div v-if="esEdicion" class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Destinatario activo</span>
            <button
              type="button"
              role="switch"
              :aria-checked="activo"
              class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              :class="activo ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'"
              @click="activo = !activo"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="activo ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </form>
      </div>

      <footer class="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-5 py-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="cerrar"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="form-contacto-notificacion"
          :disabled="!formularioValido || guardando"
          :aria-busy="guardando"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg v-if="guardando" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {{ guardando ? 'Guardando…' : (esEdicion ? 'Guardar cambios' : 'Agregar destinatario') }}
        </button>
      </footer>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { EnvelopeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type {
  ActualizarContactoNotificacionPayload,
  ContactoNotificacionDto,
  CrearContactoNotificacionPayload
} from '../types/tesoreria.types'

const PATRON_CORREO_CORPORATIVO = /^[^\s@]+@(mabeltrading\.com\.ec|cosmec\.com\.ec)$/i

const props = defineProps<{
  open: boolean
  contacto: ContactoNotificacionDto | null
  guardando: boolean
  erroresCampo?: Record<string, string> | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'guardar', payload: CrearContactoNotificacionPayload | ActualizarContactoNotificacionPayload): void
}>()

const esEdicion = computed(() => props.contacto !== null)
const tituloId = `contacto-notificacion-titulo-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref<HTMLDialogElement | null>(null)

const nombreCompleto = ref('')
const email = ref('')
const cargo = ref('')
const activo = ref(true)
const campoTocado = ref<Record<string, boolean>>({})

function resetFormulario(): void {
  const c = props.contacto
  nombreCompleto.value = c?.nombreCompleto ?? ''
  email.value = c?.email ?? ''
  cargo.value = c?.cargo ?? ''
  activo.value = c?.activo ?? true
  campoTocado.value = {}
}

const errorNombre = computed(() => {
  if (props.erroresCampo?.NombreCompleto) return props.erroresCampo.NombreCompleto
  if (!campoTocado.value.nombreCompleto) return null
  return nombreCompleto.value.trim().length === 0 ? 'El nombre completo es obligatorio.' : null
})

const errorEmail = computed(() => {
  if (props.erroresCampo?.Email) return props.erroresCampo.Email
  if (!campoTocado.value.email) return null
  if (email.value.trim().length === 0) return 'El correo es obligatorio.'
  if (!PATRON_CORREO_CORPORATIVO.test(email.value.trim())) {
    return 'El correo debe pertenecer a un dominio corporativo (@mabeltrading.com.ec o @cosmec.com.ec).'
  }
  return null
})

const formularioValido = computed(() =>
  nombreCompleto.value.trim().length > 0 &&
  PATRON_CORREO_CORPORATIVO.test(email.value.trim())
)

function cerrar(): void {
  dialogRef.value?.close()
  emit('close')
}

function onBackdropClick(evento: MouseEvent): void {
  if (evento.target === dialogRef.value) {
    cerrar()
  }
}

function confirmar(): void {
  campoTocado.value = { nombreCompleto: true, email: true }
  if (!formularioValido.value) return

  const base: CrearContactoNotificacionPayload = {
    nombreCompleto: nombreCompleto.value.trim(),
    email: email.value.trim(),
    cargo: cargo.value.trim() || null
  }

  emit('guardar', esEdicion.value ? { ...base, activo: activo.value } : base)
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    resetFormulario()
    await nextTick()
    dialogRef.value?.showModal()
  }
})
</script>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear (pseudo-elemento fuera del arbol normal),
   por eso el nombre de clase bien especifico y el estilo sin "scoped". Reemplaza al overlay
   manual bg-black/60 que envolvia el modal antes de la migracion a <dialog>. */
.modal-contacto-notificacion-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.6);
}
</style>
