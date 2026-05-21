<template>
  <div class="mx-auto max-w-5xl space-y-4 px-4 py-4 pb-24 sm:px-5 sm:py-6">
    <header class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 sm:px-6">
      <div class="pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700/90 dark:text-violet-400/90">
            Promoción sobres
          </p>
          <h1 class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Monitoreo de entregas
          </h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Premios entregados frente al total de beneficiarios registrados.
          </p>
          <p v-if="consultadoEn" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Última consulta: {{ formatFecha(consultadoEn) }}
          </p>
          <p v-if="origenLabel" class="mt-1 font-mono text-xs text-violet-700/90 dark:text-violet-300/90">
            BD: {{ origenLabel }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-if="canOperate"
            :to="{ name: 'promocion-sobres-entrega' }"
            class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Volver a entrega
          </RouterLink>
          <button
            type="button"
            class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            :disabled="loading"
            @click="actualizar"
          >
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="origenIncorrecto"
      class="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
      role="alert"
    >
      <p class="font-semibold">Base de datos incorrecta</p>
      <p class="mt-1">
        La API está leyendo <strong>{{ monitoreo?.origen?.dataSource }}</strong>, no el servidor de desarrollo (210.17.1.54).
        Reinicie la API con <code class="text-xs">docker compose up -d --build</code> en scnexus-validacionCI (sin docker-compose.local.yml).
      </p>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
    >
      <p class="font-medium">{{ errorTitle }}</p>
      <p class="mt-1">{{ error.message }}</p>
      <p v-if="error.correlationId" class="mt-2 font-mono text-xs opacity-80">ID: {{ error.correlationId }}</p>
    </div>

    <section v-if="monitoreo" class="grid gap-3 sm:grid-cols-3">
      <article class="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/25">
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Entregados</p>
        <p class="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">{{ monitoreo.totalEntregados }}</p>
        <p class="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">{{ porcentajeEntregados }}% del total</p>
      </article>

      <article class="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Pendientes</p>
        <p class="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-100">{{ monitoreo.totalPendientes }}</p>
        <p class="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">Faltan por entregar</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
        <p class="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{{ monitoreo.totalBeneficiarios }}</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Beneficiarios registrados</p>
      </article>
    </section>

    <section
      v-if="monitoreo && monitoreo.totalBeneficiarios > 0"
      class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 sm:p-5"
    >
      <div class="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all duration-500"
          :style="{ width: `${porcentajeEntregados}%` }"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th class="px-3 py-2 font-semibold">Cédula</th>
              <th class="px-3 py-2 font-semibold">Nombre</th>
              <th class="px-3 py-2 font-semibold">Estado</th>
              <th class="px-3 py-2 font-semibold">Fecha modificación</th>
              <th class="px-3 py-2 font-semibold">Modificado por</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in monitoreo.beneficiarios"
              :key="item.identificacion"
              class="border-b border-slate-100 last:border-0 dark:border-slate-700/80"
            >
              <td class="px-3 py-3 font-mono text-slate-700 dark:text-slate-200">{{ item.identificacion }}</td>
              <td class="px-3 py-3 text-slate-900 dark:text-white">{{ item.nombre }}</td>
              <td class="px-3 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="item.entregado === 1 ? entregadoBadgeClass : pendienteBadgeClass"
                >
                  {{ item.entregado === 1 ? 'Entregado' : 'Pendiente' }}
                </span>
              </td>
              <td class="px-3 py-3 text-slate-600 dark:text-slate-300">
                {{ item.fechaModificacion ? formatFecha(item.fechaModificacion) : '—' }}
              </td>
              <td class="px-3 py-3 text-slate-600 dark:text-slate-300">
                {{ item.modificadoPor || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-else-if="!loading && monitoreo && monitoreo.totalBeneficiarios === 0"
      class="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300"
    >
      No hay beneficiarios registrados en la promoción.
    </section>

    <section
      v-else-if="loading && !monitoreo"
      class="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300"
    >
      Cargando monitoreo...
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePromocionSobresPermissions } from '../composables/usePromocionSobresPermissions'
import { mapPromocionSobresApiError, promocionSobresService } from '../services/promocionSobresApi'
import type { EntregadosMonitoreoDto, UiError } from '../types'

const { canOperate } = usePromocionSobresPermissions()
const loading = ref(false)
const monitoreo = ref<EntregadosMonitoreoDto | null>(null)
const error = ref<UiError | null>(null)

const consultadoEn = computed(() => monitoreo.value?.consultadoEn ?? null)

const origenLabel = computed(() => {
  const o = monitoreo.value?.origen
  if (!o?.dataSource) return null
  return `${o.dataSource} / ${o.database} / ${o.tablaBeneficiarios || `${o.schema}.Beneficiarios`}`
})

/** API en SQL Docker local en lugar del .env de desarrollo. */
const origenIncorrecto = computed(() => {
  const ds = monitoreo.value?.origen?.dataSource ?? ''
  return /sqlserver|14333/i.test(ds)
})

const porcentajeEntregados = computed(() => {
  if (!monitoreo.value || monitoreo.value.totalBeneficiarios === 0) return 0
  return Math.round((monitoreo.value.totalEntregados / monitoreo.value.totalBeneficiarios) * 100)
})

const errorTitle = computed(() => {
  if (!error.value) return ''
  if (error.value.code === 'NETWORK') return 'Sin conexión'
  if (error.value.code === 'FORBIDDEN') return 'Sin permiso'
  if (error.value.code === 'SERVER') return 'Error del servidor'
  return 'No se pudo cargar el monitoreo'
})

const entregadoBadgeClass =
  'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
const pendienteBadgeClass =
  'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'

function formatFecha(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

async function actualizar() {
  loading.value = true
  error.value = null

  try {
    monitoreo.value = await promocionSobresService.consultarEntregadosMonitoreo()
  } catch (err) {
    error.value = mapPromocionSobresApiError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  actualizar()
})
</script>
