<template>
  <div class="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:px-5 sm:py-6">
    <header class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 sm:px-6">
      <div class="pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700/90 dark:text-violet-400/90">Punto de caja</p>
          <h1 class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Entrega de obsequio</h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Consulta la cédula y escanea el código de la promoción.</p>
        </div>
        <RouterLink
          v-if="canViewMonitoreo"
          :to="{ name: 'promocion-sobres-monitoreo' }"
          class="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-950/60"
        >
          Monitorear resultados
        </RouterLink>
      </div>
    </header>

    <div
      v-if="store.error && !esErrorCodigoErroneo"
      class="rounded-xl border px-4 py-3 text-sm"
      :class="errorPanelClass"
      role="alert"
    >
      <p class="font-medium">{{ errorTitle }}</p>
      <p v-if="mostrarDetalleError" class="mt-1">{{ store.error.message }}</p>
      <p v-if="store.error.correlationId" class="mt-2 font-mono text-xs opacity-80">ID: {{ store.error.correlationId }}</p>
    </div>

    <div
      v-if="store.step === 'entrega_ok' && store.ultimaEntrega && textoEntregaExitosa"
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
      role="status"
    >
      <p class="font-semibold">{{ textoEntregaExitosa }}</p>
      <p class="mt-1 text-sm">{{ store.ultimaEntrega.nombre }} — {{ store.ultimaEntrega.identificacion }}</p>
      <p v-if="store.ultimaEntrega.fechaEntrega" class="mt-1 text-xs opacity-90">
        {{ formatFechaEntrega(store.ultimaEntrega.fechaEntrega) }}
      </p>
      <p v-if="store.ultimaEntrega.cupoDisponible != null" class="mt-1 text-xs opacity-90">
        Cupo: {{ formatCupo(store.ultimaEntrega.cupoDisponible) }}
      </p>
    </div>

    <section
      v-if="!store.mostrarYaEntregado"
      class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 sm:p-5"
    >
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

    <BeneficiarioCard
      v-if="store.mostrarYaEntregado"
      :beneficiario="store.beneficiario!"
      variant="ya_entregado"
    />
    <p
      v-if="store.mostrarYaEntregado && store.mensajeFlujoCerrado"
      class="text-center text-sm text-amber-800 dark:text-amber-200"
      role="status"
    >
      {{ store.mensajeFlujoCerrado }}
    </p>

    <BeneficiarioCard
      v-else-if="store.beneficiario && store.step === 'beneficiario'"
      :beneficiario="store.beneficiario"
      variant="consulta"
    />

    <section
      v-if="mostrarPasoEscaneo"
      class="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25 sm:p-5"
      role="region"
      aria-label="Escaneo del código promocional"
    >
      <p class="text-sm font-medium text-violet-900 dark:text-violet-100">
        Escaneá el código de validación del obsequio del cliente.
      </p>
      <p class="mt-2 text-xs text-violet-800/85 dark:text-violet-200/85">
        Se abrió el lector automáticamente. Si lo cerraste, podés volver a abrirlo.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-50"
          :disabled="store.loading"
          @click="isScannerOpen = true"
        >
          Abrir escáner de código
        </button>
      </div>

      <details
        class="group mt-4 rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900/50"
        :open="esErrorCodigoErroneo"
      >
        <summary
          class="cursor-pointer select-none text-sm font-medium text-slate-700 underline decoration-slate-400/70 underline-offset-2 marker:text-violet-600 dark:text-slate-200"
        >
          Sin lector: ingresar código manualmente
        </summary>
        <div class="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div
            v-if="esErrorCodigoErroneo"
            class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            Código erroneo
          </div>
          <label for="codigo-input-promo" class="sr-only">Código promocional</label>
          <input
            id="codigo-input-promo"
            ref="codigoInputRef"
            v-model="codigoModel"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :placeholder="placeholderCodigoManual"
            class="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base uppercase tracking-wide text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white"
            :disabled="store.loading"
            @keyup.enter="onRegistrarEntrega"
          />
          <button
            type="button"
            class="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-violet-600 bg-transparent px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50 dark:border-violet-500 dark:text-violet-300 dark:hover:bg-violet-950/40"
            :disabled="store.loading || !store.puedeRegistrarEntrega"
            @click="onRegistrarEntrega"
          >
            Confirmar con código manual
          </button>
        </div>
      </details>
    </section>

    <button
      type="button"
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      @click="nuevaConsulta"
    >
      Nueva consulta
    </button>

    <ScannerPanel
      :visible="isScannerOpen"
      :disabled="store.loading"
      @detected="onCameraDetected"
      @close="onScannerClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ScannerPanel from '@/components/ScannerPanel.vue'
import BeneficiarioCard from '../components/BeneficiarioCard.vue'
import { usePromocionSobresPermissions } from '../composables/usePromocionSobresPermissions'
import { usePromocionSobresStore } from '../stores/promocionSobresStore'
import { formatPromocionSobresFecha } from '../services/utils/clientLocalDateTime'
import type { PromocionSobresErrorCode } from '../types'

const store = usePromocionSobresStore()
const { canViewMonitoreo } = usePromocionSobresPermissions()
const isScannerOpen = ref(false)
const mostrarPasoEscaneo = computed(() => store.mostrarEscaneo)

const cedulaInputRef = ref<HTMLInputElement | null>(null)
const codigoInputRef = ref<HTMLInputElement | null>(null)

const cedulaModel = computed({
  get: () => store.identificacion,
  set: (value: string) => {
    store.setIdentificacion(value)
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
  YA_ENTREGADO: 'Código erroneo',
  CODIGO_INVALIDO: 'Código erroneo',
  IDENTIFICACION_INVALIDA: 'Cédula inválida',
  VALIDATION_ERROR: 'Datos inválidos',
  BAD_REQUEST: 'Sesión o solicitud',
  FORBIDDEN: 'Sin permiso',
  NETWORK: 'Sin conexión',
  TIMEOUT: 'Tiempo de espera agotado',
  SERVER: 'Error del servidor'
}

const formatFechaEntrega = formatPromocionSobresFecha

const CODIGO_ERRONEO_CODES: PromocionSobresErrorCode[] = ['CODIGO_INVALIDO', 'YA_ENTREGADO']

const errorTitle = computed(() => {
  if (!store.error) return ''
  return ERROR_TITLES[store.error.code] ?? 'No se pudo completar la operación'
})

const esErrorCodigoErroneo = computed(
  () =>
    store.error != null &&
    CODIGO_ERRONEO_CODES.includes(store.error.code as PromocionSobresErrorCode)
)

const mostrarDetalleError = computed(() => store.error != null && !esErrorCodigoErroneo.value)

const errorPanelClass =
  'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100'

const placeholderCodigoManual = 'Codigo impreso en el obsequio o tarjeta del cliente'

const textoEntregaExitosa = computed(() => store.mensajeEntregaExitosa?.trim() ?? '')

/** Espera montaje/layout tras el GET antes de iniciar la cámara (evita arranque en frame incompleto). */
async function waitForRenderSettle() {
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function openScannerAfterConsult() {
  await waitForRenderSettle()
  isScannerOpen.value = true
}

async function onConsultar() {
  isScannerOpen.value = false

  await store.consultarBeneficiario()

  if (store.error) {
    return
  }

  // GET 200: abrir escáner tras render estable; la validación real es POST /entregas.
  if (store.mostrarEscaneo) {
    await openScannerAfterConsult()
  }
}

function nuevaConsulta() {
  isScannerOpen.value = false
  store.resetFlujo()
  focusCedula()
}

async function onRegistrarEntrega() {
  await store.registrarEntrega()
  isScannerOpen.value = false
}

async function onCameraDetected(code: string) {
  if (store.loading) return
  store.setCodigoEscaneado(code)
  await store.registrarEntrega()
  isScannerOpen.value = false
}

/** Cerrar modal sin leer: el cajero puede usar entrada manual o "Abrir escáner de nuevo". */
function onScannerClose() {
  isScannerOpen.value = false
}

function focusCedula() {
  nextTick(() => cedulaInputRef.value?.focus())
}

onMounted(() => {
  focusCedula()
})
</script>
