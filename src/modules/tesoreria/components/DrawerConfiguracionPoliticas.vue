<template>
  <DrawerPanel
    :open="isOpen"
    title-id="drawer-politicas-title"
    max-width-class="sm:max-w-lg"
    @close="cerrar"
  >
    <template #header>
      <h2 id="drawer-politicas-title" class="text-lg font-bold text-gray-900 dark:text-white truncate">
        Configuración de Políticas y Días de Gracia
      </h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Candados de antigüedad para nuevos depósitos, envío a SAP y alertas por correo
      </p>
    </template>

    <div v-if="cargando" class="space-y-4">
      <div v-for="i in 2" :key="i" class="h-36 rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse"></div>
    </div>

    <form v-else id="form-politicas-tesoreria" class="space-y-5" @submit.prevent="onGuardar">
      <!-- Política 1: Nuevos depósitos -->
      <fieldset class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
        <legend class="px-1 text-sm font-bold text-gray-900 dark:text-white">Candado para nuevos depósitos</legend>

        <label class="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <span class="font-semibold text-sm text-gray-900 dark:text-white">Activar bloqueo por antigüedad de cierre de caja</span>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Impide registrar papeletas para cierres de caja que superen los días de gracia permitidos.
            </p>
          </div>
          <input
            v-model="form.bloqueoNuevoActivo"
            type="checkbox"
            class="mt-1 h-5 w-5 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-200 dark:border-gray-800">
          <label for="diasMaximoNuevo" class="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
              class="w-28 px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">días desde la fecha de venta</span>
          </div>
        </div>
      </fieldset>

      <!-- Política 2: Envío a SAP -->
      <fieldset class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
        <legend class="px-1 text-sm font-bold text-gray-900 dark:text-white">Candado para integración con SAP</legend>

        <label class="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <span class="font-semibold text-sm text-gray-900 dark:text-white">Activar bloqueo para integración extemporánea a SAP</span>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Impide enviar a SAP depósitos registrados hace más de los días configurados.
            </p>
          </div>
          <input
            v-model="form.bloqueoDepositoActivo"
            type="checkbox"
            class="mt-1 h-5 w-5 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-200 dark:border-gray-800">
          <label for="diasMaximoDeposito" class="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
              class="w-28 px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">días desde el depósito bancario</span>
          </div>
        </div>
      </fieldset>

      <!-- Política 3: Notificaciones acumulativas por correo (independiente de los candados de arriba) -->
      <fieldset class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
        <legend class="px-1 text-sm font-bold text-gray-900 dark:text-white">Rango de Notificaciones Acumulativas (Alertas por Correo)</legend>

        <label class="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <span class="font-semibold text-sm text-gray-900 dark:text-white">Activar despacho diario de correos por mora (14:00)</span>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Correo acumulativo por tienda, Lunes a Viernes — independiente del candado de registro en tienda.
            </p>
          </div>
          <input
            v-model="form.notificacionesActivas"
            type="checkbox"
            class="mt-1 h-5 w-5 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <div v-if="form.notificacionesActivas" class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Modalidad del rango de evaluación</span>
            <fieldset class="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/60 p-1">
              <legend class="sr-only">Modalidad del rango de evaluación</legend>
              <label
                v-for="opcion in OPCIONES_MODALIDAD"
                :key="String(opcion.value)"
                class="flex-1 flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                :class="form.usarRangoCalendarioNotificacion === opcion.value ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
              >
                <input
                  v-model="form.usarRangoCalendarioNotificacion"
                  type="radio"
                  name="modalidadRangoNotificacion"
                  :value="opcion.value"
                  class="peer sr-only"
                />
                <span class="rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500">
                  {{ opcion.label }}
                </span>
              </label>
            </fieldset>
          </div>

          <div v-if="!form.usarRangoCalendarioNotificacion" class="flex flex-col gap-1.5">
            <label for="diasVentanaNotificacion" class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Días hacia atrás a evaluar (1 - 90)
            </label>
            <div class="flex items-center gap-3">
              <input
                id="diasVentanaNotificacion"
                v-model.number="form.diasVentanaNotificacion"
                type="number"
                min="1"
                max="90"
                class="w-28 px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400">días desde ayer</span>
            </div>
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="fechaInicioNotificacion" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
              <input
                id="fechaInicioNotificacion"
                v-model="form.fechaInicioNotificacion"
                type="date"
                :max="form.fechaFinNotificacion ?? undefined"
                class="px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="fechaFinNotificacion" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
              <input
                id="fechaFinNotificacion"
                v-model="form.fechaFinNotificacion"
                type="date"
                :min="form.fechaInicioNotificacion ?? undefined"
                class="px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <p class="flex items-start gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/60 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
            <InformationCircleIcon class="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
            <span>La tabla del correo incluirá los cierres con diferencias pendientes de:
              <strong class="text-gray-800 dark:text-gray-200">{{ resumenRangoNotificaciones }}</strong>.</span>
          </p>

          <button
            type="button"
            :disabled="enviandoPrueba"
            :aria-busy="enviandoPrueba"
            class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="enviarPruebaInmediata"
          >
            <svg v-if="enviandoPrueba" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <EnvelopeIcon v-else class="h-4 w-4" aria-hidden="true" />
            {{ enviandoPrueba ? 'Enviando…' : 'Probar y Enviar Notificación Inmediata' }}
          </button>
        </div>
      </fieldset>

      <p
        v-if="errorValidacion"
        role="alert"
        class="rounded-lg bg-vermilion-50 border border-vermilion-300 text-vermilion-800 dark:bg-vermilion-500/10 dark:border-vermilion-600/40 dark:text-vermilion-300 px-3 py-2 text-sm"
      >
        {{ errorValidacion }}
      </p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
    </template>
  </DrawerPanel>
</template>

<script setup lang="ts">
import { EnvelopeIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import DrawerPanel from '@/components/modales/DrawerPanel.vue'
import { useConfiguracionTesoreria } from '../composables/useConfiguracionTesoreria'

const OPCIONES_MODALIDAD: Array<{ value: boolean; label: string }> = [
  { value: false, label: 'Ventana Móvil (Días)' },
  { value: true, label: 'Rango Calendario Fijo' }
]

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const {
  form, cargando, guardando, enviandoPrueba, errorValidacion, resumenRangoNotificaciones, guardar, enviarPruebaInmediata
} = useConfiguracionTesoreria()

function cerrar(): void {
  emit('close')
}

async function onGuardar(): Promise<void> {
  const ok = await guardar()
  if (ok) emit('saved')
}
</script>
