<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-in-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in-out duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" @click="cerrar"></div>
    </Transition>

    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isOpen"
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-politicas-title"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
        @keydown="onKeydown"
      >
        <!-- Cabecera fija -->
        <header class="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 flex-shrink-0">
          <div class="min-w-0">
            <h2 id="drawer-politicas-title" class="text-lg font-bold text-white truncate">
              Configuración de Políticas y Días de Gracia
            </h2>
            <p class="mt-0.5 text-xs text-slate-400">
              Candados de antigüedad para nuevos depósitos y envío a SAP
            </p>
          </div>
          <button
            ref="botonCerrarRef"
            type="button"
            aria-label="Cerrar panel"
            class="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <!-- Cuerpo desplazable -->
        <div class="flex-1 overflow-y-auto px-5 py-5">
          <div v-if="cargando" class="space-y-4">
            <div v-for="i in 2" :key="i" class="h-36 rounded-xl bg-slate-800/60 animate-pulse"></div>
          </div>

          <form v-else id="form-politicas-tesoreria" class="space-y-5" @submit.prevent="onGuardar">
            <!-- Política 1: Nuevos depósitos -->
            <fieldset class="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
              <legend class="px-1 text-sm font-bold text-white">Candado para nuevos depósitos</legend>

              <label class="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span class="font-semibold text-sm text-white">Activar bloqueo por antigüedad de cierre de caja</span>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Impide registrar papeletas para cierres de caja que superen los días de gracia permitidos.
                  </p>
                </div>
                <input
                  v-model="form.bloqueoNuevoActivo"
                  type="checkbox"
                  class="mt-1 h-5 w-5 flex-shrink-0 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <div class="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <label for="diasMaximoNuevo" class="text-xs font-semibold text-slate-300">
                  Días máximos de gracia permitidos (1 - 90)
                </label>
                <div class="flex items-center gap-3">
                  <input
                    id="diasMaximoNuevo"
                    v-model.number="form.diasMaximoNuevo"
                    type="number"
                    min="1"
                    max="90"
                    :disabled="!form.bloqueoNuevoActivo"
                    class="w-28 px-3 py-2 text-sm font-semibold border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                  <span class="text-xs text-slate-400">días desde la fecha de venta</span>
                </div>
              </div>
            </fieldset>

            <!-- Política 2: Envío a SAP -->
            <fieldset class="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
              <legend class="px-1 text-sm font-bold text-white">Candado para integración con SAP</legend>

              <label class="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span class="font-semibold text-sm text-white">Activar bloqueo para integración extemporánea a SAP</span>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Impide enviar a SAP depósitos registrados hace más de los días configurados.
                  </p>
                </div>
                <input
                  v-model="form.bloqueoDepositoActivo"
                  type="checkbox"
                  class="mt-1 h-5 w-5 flex-shrink-0 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <div class="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <label for="diasMaximoDeposito" class="text-xs font-semibold text-slate-300">
                  Días máximos de gracia permitidos (1 - 90)
                </label>
                <div class="flex items-center gap-3">
                  <input
                    id="diasMaximoDeposito"
                    v-model.number="form.diasMaximoDeposito"
                    type="number"
                    min="1"
                    max="90"
                    :disabled="!form.bloqueoDepositoActivo"
                    class="w-28 px-3 py-2 text-sm font-semibold border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                  <span class="text-xs text-slate-400">días desde el depósito bancario</span>
                </div>
              </div>
            </fieldset>

            <p
              v-if="errorValidacion"
              role="alert"
              class="rounded-lg bg-vermilion-500/10 border border-vermilion-600/40 px-3 py-2 text-sm text-vermilion-300"
            >
              {{ errorValidacion }}
            </p>
          </form>
        </div>

        <!-- Pie fijo -->
        <footer class="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/95 px-5 py-3.5 flex-shrink-0">
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-politicas-tesoreria"
            :disabled="cargando || guardando || !!errorValidacion"
            :aria-busy="guardando"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
          >
            <svg v-if="guardando" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {{ guardando ? 'Guardando…' : 'Guardar políticas' }}
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'
import { useConfiguracionTesoreria } from '../composables/useConfiguracionTesoreria'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { form, cargando, guardando, errorValidacion, guardar } = useConfiguracionTesoreria()

const dialogRef = ref<HTMLElement | null>(null)
const botonCerrarRef = ref<HTMLButtonElement | null>(null)

function cerrar(): void {
  emit('close')
}

async function onGuardar(): Promise<void> {
  const ok = await guardar()
  if (ok) emit('saved')
}

const { onKeydown } = useModalFocusTrap(dialogRef, botonCerrarRef, toRef(props, 'isOpen'), cerrar)

watch(
  () => props.isOpen,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
