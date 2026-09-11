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

        <!-- Resumen gráfico + guía de reintento: lote con errores parciales
             (algunos artículos sí se crearon y ya se encolaron a SAP, otros
             se rechazaron por validación). -->
        <div
            v-if="job.estado === 'COMPLETADO_CON_ERRORES'"
            class="space-y-3"
        >
            <div class="flex flex-wrap gap-4 text-sm">
                <span class="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    🟢 {{ job.filasCorrectas }} creado(s) exitosamente (encolado(s) hacia SAP)
                </span>
                <span class="inline-flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-400">
                    🔴 {{ job.filasError }} rechazado(s) por validación
                </span>
            </div>
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                ⚠️ <strong>Atención:</strong> para corregir los artículos rechazados, descargue la plantilla de
                errores, aplique los ajustes necesarios sobre las celdas señaladas y vuelva a subir ese mismo
                archivo corregido con el botón <strong>Cargar archivo de correcciones</strong>. No vuelva a subir el
                archivo completo original: el sistema lo rechazará (error 409) para evitar duplicar el lote.
            </div>
        </div>

        <!-- Trazabilidad de identificadores generados: pestañas Creados/
             Observados solo cuando el lote es MIXTO (algo se creó Y algo
             quedó observado). Con 100% éxito o 100% fallo se muestra
             directo, sin la chrome de pestañas. -->
        <div v-if="mostrarPestanas" class="flex gap-2 border-b border-gray-200 dark:border-gray-700" role="tablist">
            <button
                type="button"
                role="tab"
                :aria-selected="pestanaActiva === 'exitos'"
                :class="tabClass('exitos')"
                @click="pestanaActiva = 'exitos'"
            >
                🟢 Creados Exitosamente ({{ articulosCreados.length }})
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="pestanaActiva === 'errores'"
                :class="tabClass('errores')"
                @click="pestanaActiva = 'errores'"
            >
                🔴 Filas con Observación ({{ job.filasError }})
            </button>
        </div>

        <div v-if="articulosCreados.length && (!mostrarPestanas || pestanaActiva === 'exitos')" class="space-y-3">
            <div class="rounded-lg border border-emerald-200 bg-white p-4 dark:border-emerald-800 dark:bg-gray-900/40">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        Artículos creados ({{ articulosCreados.length }})
                    </p>
                    <button
                        type="button"
                        class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        :disabled="store.downloading"
                        @click="store.descargarReporteExitos"
                    >
                        {{ store.downloading ? 'Descargando...' : `🟢 📥 Descargar Creados (${articulosCreados.length})` }}
                    </button>
                </div>
                <div class="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
                    <table class="w-full text-xs text-left">
                        <thead class="sticky top-0 bg-gray-50 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400">
                            <tr>
                                <th class="px-3 py-1.5 font-medium">Fila</th>
                                <th class="px-3 py-1.5 font-medium">Ref. Prov.</th>
                                <th class="px-3 py-1.5 font-medium">Color</th>
                                <th class="px-3 py-1.5 font-medium">Talla</th>
                                <th class="px-3 py-1.5 font-medium">ItemCode Generado</th>
                                <th class="px-3 py-1.5 font-medium">BarCode</th>
                                <th class="px-3 py-1.5 font-medium">SAP</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="articulo in articulosCreados" :key="articulo.itemCode">
                                <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ articulo.numeroFila }}</td>
                                <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ articulo.codigoProveedor ?? '—' }}</td>
                                <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ articulo.color ?? '—' }}</td>
                                <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ articulo.talla ?? '—' }}</td>
                                <td class="px-3 py-1.5 font-mono font-semibold text-gray-900 dark:text-white">{{ articulo.itemCode }}</td>
                                <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ articulo.barCode ?? '—' }}</td>
                                <td class="px-3 py-1.5">
                                    <span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        {{ articulo.estadoSap }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="!mostrarPestanas || pestanaActiva === 'errores'" class="space-y-4">
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
                    {{ store.downloading ? 'Descargando...' : `📥 Descargar Plantilla de Errores (${store.errores.length})` }}
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
                        {{ store.downloading ? 'Descargando...' : `📥 Descargar Plantilla de Errores (${store.errores.length})` }}
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
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Metric from './ImportacionProgresoMetric.vue'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'
import type { ArticuloCreadoResumen, ImportacionGrupo } from '../services/articuloService'

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

// Trazabilidad de identificadores generados (ItemCode/BarCode/SKU base):
// una fila por artículo COMPLETADO, ya enriquecida por el backend.
const articulosCreados = computed<ArticuloCreadoResumen[]>(
    () => job.value.articulosCreados ?? []
)

const hayObservaciones = computed(
    () =>
        store.erroresEstructurales.length > 0 ||
        store.erroresNoEstructurales.length > 0 ||
        store.gruposObservados.length > 0
)

// Las pestañas solo tienen sentido en un lote MIXTO (algo se creó Y algo
// quedó observado). Con 100% éxito o 100% fallo se muestra el contenido
// directo, sin la chrome de pestañas (ver mockup del enunciado).
const mostrarPestanas = computed(
    () =>
        job.value.estado === 'COMPLETADO_CON_ERRORES' &&
        articulosCreados.value.length > 0 &&
        hayObservaciones.value
)

const pestanaActiva = ref<'exitos' | 'errores'>('exitos')

function tabClass(pestana: 'exitos' | 'errores'): string {
    const base = '-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors'
    if (pestanaActiva.value !== pestana) {
        return `${base} border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
    }
    return pestana === 'exitos'
        ? `${base} border-emerald-600 text-emerald-700 dark:text-emerald-400`
        : `${base} border-red-600 text-red-700 dark:text-red-400`
}
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
