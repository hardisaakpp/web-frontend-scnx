<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Detalle de Planificación</h1>
        </div>
        <button class="btn-secondary" type="button" @click="router.push('/inventario/planificaciones')">Volver</button>
      </div>

      <div v-if="loading" class="mt-4 text-sm text-gray-600 dark:text-gray-300">Cargando plan...</div>
      <div v-else-if="error" class="mt-4 alert-error">{{ error }}</div>

      <div v-else-if="plan" class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="PlanId" :value="plan.planId" mono />
        <Info label="Bodega" :value="plan.warehouseCode" />
        <Info label="Estado" :value="plan.status" />
        <Info label="Descripción" :value="plan.description || '-'" />
        <Info label="Planned Open" :value="dateOnly(plan.plannedOpenDate)" />
        <Info label="Planned Close" :value="dateOnly(plan.plannedCloseDate)" />
        <Info label="Created At" :value="dateTime(plan.createdAt)" />
        <Info label="Executed At" :value="plan.executedAt ? dateTime(plan.executedAt) : '-'" />
        <Info label="InventorySessionId" :value="plan.inventorySessionId || '-'" mono />
      </div>
    </section>

    <section v-if="plan" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filtros del Plan</h2>
      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">Nivel</th>
              <th class="th">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="filter in plan.filters" :key="`${filter.levelNumber}-${filter.filterValue}`">
              <td class="td">{{ filter.levelNumber }}</td>
              <td class="td">{{ filter.filterValue }}</td>
            </tr>
            <tr v-if="plan.filters.length === 0">
              <td class="td text-center" colspan="2">El plan no tiene filtros configurados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-if="plan.status === 'Planned'"
          class="btn-primary"
          type="button"
          :disabled="executing"
          @click="executePlan"
        >
          {{ executing ? 'Ejecutando...' : 'Ejecutar Planificación' }}
        </button>
        <button
          v-if="plan.inventorySessionId"
          class="btn-secondary"
          type="button"
          @click="router.push(`/inventario/sesiones?sessionId=${plan.inventorySessionId}`)"
        >
          Ir a Toma / Sesión
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type InventoryPlanDto, scnexusInventoryApi } from '../services/scnexusInventoryApi'

const route = useRoute()
const router = useRouter()

const plan = ref<InventoryPlanDto | null>(null)
const loading = ref(false)
const executing = ref(false)
const error = ref<string | null>(null)

const planId = computed(() => String(route.params.planId || ''))

const Info = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    mono: { type: Boolean, default: false }
  },
  setup(props) {
    return () =>
      h('div', { class: 'rounded-lg border border-gray-200 dark:border-gray-700 p-3' }, [
        h('div', { class: 'text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400' }, props.label),
        h('div', { class: props.mono ? 'mt-1 text-sm font-mono text-gray-900 dark:text-gray-100' : 'mt-1 text-sm text-gray-900 dark:text-gray-100' }, props.value)
      ])
  }
})

function dateOnly(value: string) {
  return value?.slice(0, 10) || '-'
}

function dateTime(value: string) {
  return new Date(value).toLocaleString()
}

async function loadPlan() {
  if (!planId.value) return
  loading.value = true
  error.value = null
  try {
    plan.value = await scnexusInventoryApi.getPlan(planId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el detalle del plan.'
  } finally {
    loading.value = false
  }
}

async function executePlan() {
  if (!planId.value) return
  if (!window.confirm('Se creará una sesión de inventario desde este plan. ¿Continuar?')) return

  executing.value = true
  error.value = null
  try {
    plan.value = await scnexusInventoryApi.executePlan(planId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo ejecutar el plan.'
  } finally {
    executing.value = false
  }
}

onMounted(loadPlan)
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50;
}
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700;
}
.th {
  @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.alert-error {
  @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300;
}
</style>
