<template>
  <div class="mx-auto max-w-4xl space-y-4 px-4 py-4 pb-24 sm:px-5 sm:py-6">
    <header class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-6 shadow-sm shadow-slate-200/40 ring-1 ring-slate-900/[0.03] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none dark:ring-white/[0.06] sm:px-6 sm:py-7">
      <div class="pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" aria-hidden="true" />
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <span class="mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/60 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-900/5 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400 sm:mx-0 sm:h-24 sm:w-24">
          <!-- Ícono: marco / código de barras / línea de escaneo -->
          <svg class="h-[2.875rem] w-[2.875rem] sm:h-14 sm:w-14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <!-- Esquinas visor -->
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.85"
              d="M9.75 4.75H5v4.75M14.25 4.75H19v4.75M14.25 19.25H19v-4.75M9.75 19.25H5v-4.75"
            />
            <!-- Barras (relleno más denso tipo código) -->
            <g fill="currentColor" opacity="0.92">
              <rect x="10.1" y="8.05" width="0.42" height="7.9" rx="0.06" />
              <rect x="10.82" y="7.85" width="0.72" height="8.35" rx="0.06" />
              <rect x="11.92" y="8.25" width="0.42" height="7.65" rx="0.06" />
              <rect x="12.68" y="7.72" width="0.94" height="8.72" rx="0.06" />
              <rect x="13.98" y="8.08" width="0.52" height="7.94" rx="0.06" />
            </g>
            <!-- Línea láser horizontal -->
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.45"
              d="M8.95 11.97h6.1"
              opacity="0.98"
            />
          </svg>
        </span>
        <div class="min-w-0 flex-1 text-center sm:text-left">
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/90 dark:text-emerald-400/90">Punto de validación</p>
          <h1 class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.75rem]">Validación de artículos</h1>
          <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Verificar productos en el sistema.</p>
        </div>
      </div>
    </header>

    <div
      v-if="store.error && store.status === 'error'"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
    >
      <p class="font-medium">No se pudieron cargar los almacenes</p>
      <p class="mt-1 text-amber-800 dark:text-amber-200/90">{{ store.error.message }}</p>
      <button
        type="button"
        class="mt-3 text-sm font-semibold text-amber-900 underline decoration-amber-700/60 hover:decoration-amber-900 dark:text-amber-100"
        @click="store.loadWarehouses()"
      >
        Reintentar
      </button>
    </div>

    <div class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-none sm:p-5">
      <div class="space-y-4">
        <WarehouseSelect
          v-model="selectedWarehouseModel"
          :warehouses="store.warehouses"
          :disabled="store.loading"
        />

        <ManualCodeInput
          v-model="scanCodeModel"
          :disabled="store.loading || !store.selectedWarehouse"
          :scanner-disabled="!store.selectedWarehouse"
          @submit="onSubmit"
          @open-scanner="openScanner"
        />
      </div>
    </div>

    <ScannerPanel
      :visible="isScannerOpen"
      :disabled="store.loading || !store.selectedWarehouse"
      @detected="onCameraDetected"
      @close="isScannerOpen = false"
    />

    <ArticleInfoModal
      :visible="isArticleModalOpen"
      :loading="store.loading"
      :status="store.status"
      :article="store.article"
      :error-message="store.error?.message"
      :scan-code="store.scanCode"
      :selected-warehouse="store.selectedWarehouse"
      :warehouses="store.warehouses"
      @close="isArticleModalOpen = false"
      @retry-search="onArticleRetrySearch"
      @submit-inline-code="onSubmitInlineCodeFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import WarehouseSelect from '../components/WarehouseSelect.vue'
import ManualCodeInput from '../components/ManualCodeInput.vue'
import ScannerPanel from '../components/ScannerPanel.vue'
import ArticleInfoModal from '../components/ArticleInfoModal.vue'
import { useArticuloScanStore } from '../stores/articuloScanStore'

const store = useArticuloScanStore()
const isScannerOpen = ref(false)
const isArticleModalOpen = ref(false)

const selectedWarehouseModel = computed({
  get: () => store.selectedWarehouse,
  set: (value: string | null) => {
    store.setWarehouse(value)
    store.resetError()
  }
})

const scanCodeModel = computed({
  get: () => store.scanCode,
  set: (value: string) => {
    store.setScanCode(value)
    store.resetError()
  }
})

async function onSubmit() {
  if (!store.canResolve) return
  isArticleModalOpen.value = true
  await store.resolveScan('manual')
}

async function onCameraDetected(code: string) {
  if (!store.selectedWarehouse || store.loading) return
  store.setScanCode(code)
  isArticleModalOpen.value = true
  await store.resolveScan('scanner')
  isScannerOpen.value = false
}

function openScanner() {
  if (!store.selectedWarehouse) {
    store.resetError()
    return
  }
  isScannerOpen.value = true
}

function onArticleRetrySearch() {
  const fromScanner = store.lastResolveSource === 'scanner'
  isArticleModalOpen.value = false
  store.clearResult()
  store.setScanCode('')
  if (fromScanner && store.selectedWarehouse && !store.loading) {
    void nextTick(() => {
      isScannerOpen.value = true
    })
  }
}

async function onSubmitInlineCodeFromModal(code: string) {
  const trimmed = code.trim()
  if (!trimmed || !store.selectedWarehouse || store.loading) return
  store.setScanCode(trimmed)
  isArticleModalOpen.value = true
  await store.resolveScan('manual')
}

onMounted(async () => {
  await store.loadWarehouses()
})
</script>
