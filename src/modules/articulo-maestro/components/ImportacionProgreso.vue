<template>
    <div class="space-y-4" aria-live="polite">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <div class="mb-2 flex items-center justify-between text-sm">
                <span class="font-semibold text-gray-900 dark:text-white">{{ statusLabel }}</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">{{ store.progress }} %</span>
            </div>
            <div
                class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                role="progressbar"
                aria-label="Progreso de importación"
                :aria-valuenow="store.progress"
                aria-valuemin="0"
                aria-valuemax="100"
            >
                <div
                    class="h-full rounded-full bg-blue-600 transition-all duration-500"
                    :style="{ width: `${store.progress}%` }"
                ></div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="Procesados" :value="`${job.gruposProcesados} de ${job.totalGrupos} grupos`" />
                <Metric label="Filas correctas" :value="job.filasCorrectas" tone="success" />
                <Metric label="Filas con error" :value="job.filasError" tone="error" />
                <Metric label="Grupos correctos" :value="store.gruposCorrectos" tone="success" />
                <Metric label="Grupos pendientes" :value="store.gruposPendientes" tone="warning" />
                <Metric label="Imágenes con error" :value="store.imagenesConError" tone="error" />
            </div>
            <p
                v-if="(job.estado === 'COMPLETADO' || job.estado === 'COMPLETADO_CON_ERRORES') && job.filasCorrectas > 0"
                class="mt-3 text-xs text-gray-500 dark:text-gray-400"
            >
                Los artículos guardados correctamente ya se encolaron y se están sincronizando con SAP en segundo plano.
                Puedes seguir el avance en
                <router-link to="/articulo-maestro/migracion" class="underline hover:no-underline">Monitoreo de Sincronización SAP</router-link>.
            </p>
        </div>

        <div
            v-if="store.errores.length"
            class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-semibold text-red-800 dark:text-red-300">
                        {{ store.errores.length }} error(es) disponibles
                    </p>
                    <p class="text-xs text-red-600 dark:text-red-400">
                        Descarga la plantilla con las filas observadas. Los motivos de error están señalados como
                        notas en las celdas correspondientes. Corrige los datos en este mismo archivo y súbelo
                        directamente.
                    </p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1">
                    <button
                        type="button"
                        class="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        :disabled="store.downloading"
                        @click="store.descargarErroresPlantilla"
                    >
                        {{ store.downloading ? 'Descargando...' : 'Descargar filas para corregir' }}
                    </button>
                    <button
                        type="button"
                        class="text-xs font-semibold text-red-700 underline disabled:opacity-60 dark:text-red-300"
                        :disabled="store.downloading"
                        @click="store.descargarErrores"
                    >
                        Descargar log técnico completo
                    </button>
                </div>
            </div>
            <ul class="mt-3 max-h-36 space-y-2 overflow-y-auto text-xs text-red-700 dark:text-red-300">
                <li
                    v-for="(error, index) in store.errores.slice(0, 10)"
                    :key="`${error.tipo}-${error.numeroFila}-${index}`"
                >
                    Fila {{ error.numeroFila ?? '—' }} · {{ error.grupoProducto }} · {{ error.mensaje }}
                </li>
            </ul>
            <button
                v-if="job.estado === 'ERROR' || job.estado === 'COMPLETADO_CON_ERRORES'"
                type="button"
                class="mt-3 text-xs font-semibold text-red-700 underline disabled:opacity-60 dark:text-red-300"
                :disabled="store.loading"
                @click="store.reintentar"
            >
                Reintentar grupos con error
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Metric from './ImportacionProgresoMetric.vue'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'

const store = useImportacionArticulosStore()
const { trabajo } = storeToRefs(store)
const job = computed(() => {
    if (!trabajo.value) {
        throw new Error('ImportacionProgreso requiere un trabajo activo.')
    }
    return trabajo.value
})
const statusLabel = computed(() => {
    const labels = {
        ESPERANDO: 'En espera',
        PROCESANDO: 'Procesando',
        COMPLETADO: 'Completado',
        COMPLETADO_CON_ERRORES: 'Completado con errores',
        ERROR: 'Error'
    }
    return labels[job.value.estado]
})
</script>
