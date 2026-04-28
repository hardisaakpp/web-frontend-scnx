<template>
  <div class="mx-auto min-h-[calc(100vh-5rem)] max-w-4xl space-y-6 px-3 py-6 sm:px-4">
    <header class="rounded-2xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </span>
        Informacion de Articulos
      </h1>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Verificar productos en el sistema
      </p>
    </header>

    <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-none sm:p-6">
      <div class="space-y-6">
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
