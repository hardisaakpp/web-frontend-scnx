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

        <!-- H12: restricciones esperables de SAP (campo estructural con
             movimientos/stock) -- no es un fallo del sistema, así que se
             muestran como advertencia informativa, separadas de los
             errores reales. -->
        <div
            v-if="store.erroresEstructurales.length"
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
            <div class="flex items-center justify-between gap-3">
                <div>
                    <span
                        class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-800/40 dark:text-amber-200"
                    >
                        ⚠️ Restricción SAP (Artículo con Stock)
                    </span>
                    <p class="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {{ store.erroresEstructurales.length }} fila(s) con cambios estructurales omitidos
                    </p>
                </div>
            </div>
            <ul class="mt-3 max-h-36 space-y-2 overflow-y-auto text-xs text-amber-700 dark:text-amber-300">
                <li
                    v-for="(error, index) in store.erroresEstructurales.slice(0, 10)"
                    :key="`${error.tipo}-${error.numeroFila}-${index}`"
                >
                    <span class="font-semibold">{{ error.itemCode ?? error.grupoProducto }}</span>
                    <template v-if="error.campoError"> · Columna(s): {{ error.campoError }}</template>
                    · {{ error.mensaje }}
                </li>
            </ul>
            <p class="mt-3 rounded-md bg-amber-100/60 p-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                💡 Consejo: puede volver a subir este archivo removiendo las columnas estructurales
                (p. ej. manageBatchNumbers) para aplicar precios, descripciones y demás cambios comerciales sin
                restricciones.
            </p>
            <!-- Si NO hay errores reales, el botón de descarga vive aquí --
                 el reporte reimportable ya incluye estas filas igual. -->
            <div v-if="!store.erroresNoEstructurales.length" class="mt-3 flex flex-wrap gap-3">
                <button
                    type="button"
                    class="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    :disabled="store.downloading"
                    @click="store.descargarErroresPlantilla"
                >
                    {{ store.downloading ? 'Descargando...' : 'Descargar filas para corregir' }}
                </button>
                <button
                    type="button"
                    class="text-xs font-semibold text-amber-700 underline disabled:opacity-60 dark:text-amber-300"
                    :disabled="store.downloading"
                    @click="store.descargarErrores"
                >
                    Descargar log técnico completo
                </button>
            </div>
        </div>

        <div
            v-if="store.erroresNoEstructurales.length"
            class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-semibold text-red-800 dark:text-red-300">
                        {{ store.erroresNoEstructurales.length }} error(es) disponibles
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
                    v-for="(error, index) in store.erroresNoEstructurales.slice(0, 10)"
                    :key="`${error.tipo}-${error.numeroFila}-${index}`"
                >
                    Fila {{ error.numeroFila ?? '—' }} · {{ error.grupoProducto }} · {{ error.mensaje }}
                </li>
            </ul>
        </div>

        <!-- H13: grupos observados individuales -- avance de fotos y
             reintento SELECTIVO, sin reabrir todo el trabajo. -->
        <div
            v-if="store.gruposObservados.length"
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40"
        >
            <p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Grupos observados ({{ store.gruposObservados.length }})
            </p>
            <ul class="space-y-2">
                <li
                    v-for="grupo in store.gruposObservados"
                    :key="grupo.id"
                    class="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-2 text-xs dark:border-gray-700"
                >
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200">
                            {{ grupo.grupoProducto }}
                        </p>
                        <p v-if="grupo.imagenes.length" class="text-gray-500 dark:text-gray-400">
                            {{ fotosCompletadas(grupo) }}/{{ grupo.imagenes.length }} fotos subidas
                        </p>
                        <p v-if="grupo.mensajeError" class="text-red-600 dark:text-red-400">
                            {{ grupo.mensajeError }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="shrink-0 rounded-lg bg-gray-700 px-3 py-1.5 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                        :disabled="store.reintentandoGrupoId !== null"
                        @click="store.reintentarGrupo(grupo.id)"
                    >
                        {{ store.reintentandoGrupoId === grupo.id ? 'Reintentando...' : '🔄 Reintentar grupo' }}
                    </button>
                </li>
            </ul>
        </div>

        <button
            v-if="store.errores.length && (job.estado === 'ERROR' || job.estado === 'COMPLETADO_CON_ERRORES')"
            type="button"
            class="text-xs font-semibold text-gray-700 underline disabled:opacity-60 dark:text-gray-300"
            :disabled="store.loading"
            @click="store.reintentar"
        >
            Reintentar grupos con error
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Metric from './ImportacionProgresoMetric.vue'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'
import type { ImportacionGrupo } from '../services/articuloService'

function fotosCompletadas(grupo: ImportacionGrupo): number {
    return grupo.imagenes.filter(imagen => imagen.estado === 'COMPLETADA').length
}

const store = useImportacionArticulosStore()
const { trabajo } = storeToRefs(store)
const job = computed(() => {
    if (!trabajo.value) {
        throw new Error('ImportacionProgreso requiere un trabajo activo.')
    }
    return trabajo.value
})
const statusLabel = computed(() => {
    // H09: mientras zipPendiente sea true, el worker todavía está
    // descomprimiendo/subiendo las imágenes a staging -- antes de tocar el
    // primer artículo -- así que "Insertando artículos..." sería engañoso.
    if (job.value.estado === 'PROCESANDO' && job.value.zipPendiente) {
        return 'Procesando imágenes...'
    }
    const labels = {
        ESPERANDO: 'En espera',
        PROCESANDO: 'Insertando artículos...',
        COMPLETADO: 'Completado',
        COMPLETADO_CON_ERRORES: 'Completado con errores',
        ERROR: 'Error'
    }
    return labels[job.value.estado]
})
</script>
