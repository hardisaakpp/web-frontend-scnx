<template>
  <div class="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:px-5 sm:py-6">
    <header class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 sm:px-6">
      <div class="pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700/90 dark:text-violet-400/90">Punto de caja</p>
      <h1 class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Entrega de obsequio</h1>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Consulta la cédula y escanea el código de la promoción.</p>
    </header>

    <div
      v-if="store.error"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
    >
      <p class="font-medium">{{ errorTitle }}</p>
      <p class="mt-1">{{ store.error.message }}</p>
      <p v-if="store.error.correlationId" class="mt-2 font-mono text-xs opacity-80">ID: {{ store.error.correlationId }}</p>
    </div>

    <div
      v-if="store.step === 'entrega_ok' && store.ultimaEntrega"
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
      role="status"
    >
      <p class="font-semibold">Entrega registrada correctamente</p>
      <p class="mt-1 text-sm">{{ store.ultimaEntrega.nombre }} — {{ store.ultimaEntrega.identificacion }}</p>
      <p v-if="store.ultimaEntrega.fechaEntrega" class="mt-1 text-xs opacity-90">
        {{ formatFechaEntrega(store.ultimaEntrega.fechaEntrega) }}
      </p>
      <p v-if="store.ultimaEntrega.cupoDisponible != null" class="mt-1 text-xs opacity-90">
        Cupo: {{ formatCupo(store.ultimaEntrega.cupoDisponible) }}
      </p>
    </div>

    <section class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 sm:p-5">
      <label for="cedula-input" class="text-sm font-semibold text-slate-800 dark:text-slate-100">Cédula del beneficiario</label>
      <div class="mt-2 flex gap-2">
        <input
          id="cedula-input"
          ref="cedulaInputRef"
          v-model="cedulaModel"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="13"
          placeholder="Ej. 1727448415"
          class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white"
          :disabled="store.loading"
          @keyup.enter="onConsultar"
        />
        <button
          type="button"
          class="shrink-0 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          :disabled="store.loading || !store.identificacionValidaParaConsulta"
          @click="onConsultar"
        >
          Consultar
        </button>
      </div>
      <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Solo dígitos, entre {{ identMin }} y {{ identMax }} caracteres (misma validación que el API).
      </p>
    </section>

    <BeneficiarioCard v-if="store.beneficiario" :beneficiario="store.beneficiario" />

    <section
      v-if="store.beneficiario?.puedeEscanear && !store.beneficiario?.entregado"
      class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 sm:p-5"
    >
      <label for="codigo-input" class="text-sm font-semibold text-slate-800 dark:text-slate-100">Código de la promoción</label>
      <div class="mt-2 space-y-3">
        <div class="flex gap-2">
          <input
            id="codigo-input"
            ref="codigoInputRef"
            v-model="codigoModel"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Escanear o escribir código"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base uppercase tracking-wide text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white"
            :disabled="store.loading"
            @keyup.enter="onRegistrarEntrega"
          />
          <button
            type="button"
            aria-label="Escanear con cámara"
            class="flex shrink-0 items-center justify-center rounded-xl border border-violet-600/30 bg-gradient-to-b from-violet-500 to-fuchsia-600 px-4 text-white disabled:opacity-50"
            :disabled="store.loading"
            @click="isScannerOpen = true"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M4 8a2 2 0 0 1 2-2h2l1.2-2h5.6L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="store.loading || !store.puedeRegistrarEntrega"
          @click="onRegistrarEntrega"
        >
          Confirmar entrega
        </button>
      </div>
    </section>

    <button
      type="button"
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      @click="store.resetFlujo(); focusCedula()"
    >
      Nueva consulta
    </button>

    <ScannerPanel
      :visible="isScannerOpen"
      :disabled="store.loading"
      @detected="onCameraDetected"
      @close="isScannerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import ScannerPanel from '@/modules/articulo-scaner/components/ScannerPanel.vue'
import BeneficiarioCard from '../components/BeneficiarioCard.vue'
import { usePromocionSobresStore } from '../stores/promocionSobresStore'
import type { PromocionSobresErrorCode } from '../types'

const store = usePromocionSobresStore()
const isScannerOpen = ref(false)
const cedulaInputRef = ref<HTMLInputElement | null>(null)
const codigoInputRef = ref<HTMLInputElement | null>(null)

const cedulaModel = computed({
  get: () => store.identificacion,
  set: (value: string) => {
    store.setIdentificacion(value)
    store.resetError()
  }
})

const codigoModel = computed({
  get: () => store.codigoEscaneado,
  set: (value: string) => {
    store.setCodigoEscaneado(value)
    store.resetError()
  }
})

/** Mismo rango que el backend (IdentificacionNormalizer). */
const identMin = 10
const identMax = 13

function formatCupo(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value
  )
}

const ERROR_TITLES: Partial<
  Record<
    PromocionSobresErrorCode | 'NETWORK' | 'TIMEOUT' | 'SERVER' | 'BAD_REQUEST' | 'FORBIDDEN',
    string
  >
> = {
  NO_ENCONTRADO: 'Beneficiario no encontrado',
  YA_ENTREGADO: 'Obsequio ya entregado',
  CODIGO_INVALIDO: 'Código incorrecto',
  IDENTIFICACION_INVALIDA: 'Cédula inválida',
  VALIDATION_ERROR: 'Datos inválidos',
  BAD_REQUEST: 'Sesión o solicitud',
  FORBIDDEN: 'Sin permiso',
  NETWORK: 'Sin conexión',
  TIMEOUT: 'Tiempo de espera agotado',
  SERVER: 'Error del servidor'
}

function formatFechaEntrega(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

const errorTitle = computed(() => {
  if (!store.error) return ''
  return ERROR_TITLES[store.error.code] ?? 'No se pudo completar la operación'
})

async function onConsultar() {
  await store.consultarBeneficiario()
  if (store.beneficiario?.puedeEscanear && !store.beneficiario.entregado) {
    await nextTick()
    codigoInputRef.value?.focus()
  }
}

async function onRegistrarEntrega() {
  await store.registrarEntrega()
}

async function onCameraDetected(code: string) {
  store.setCodigoEscaneado(code)
  isScannerOpen.value = false
  await onRegistrarEntrega()
}

function focusCedula() {
  nextTick(() => cedulaInputRef.value?.focus())
}

onMounted(() => {
  focusCedula()
})
</script>
