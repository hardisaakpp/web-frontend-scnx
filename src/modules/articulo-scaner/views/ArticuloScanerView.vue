<template>
  <div class="mx-auto max-w-4xl space-y-3 px-3 py-2 sm:px-4">
    <header class="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 px-5 py-6 shadow-md shadow-slate-200/60 ring-1 ring-white/60 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/30 dark:shadow-none dark:ring-white/10">
      <div class="flex items-center gap-4">
        <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </span>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">Validación de Artículos</h1>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300 sm:text-base">Verifica productos escaneados en el sistema</p>
        </div>
      </div>
    </header>

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
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

onMounted(async () => {
  await store.loadWarehouses()
})
</script>
