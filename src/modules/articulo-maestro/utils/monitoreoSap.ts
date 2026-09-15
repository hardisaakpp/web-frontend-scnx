// Lógica pura del panel "Monitoreo de Sincronización SAP" (MigracionSAP.vue),
// extraída a funciones testeables sin depender de la sesión de red, el router
// ni el DOM: ordenamiento por prioridad operativa de la tabla de excepciones,
// progreso agregado de un lote de importación, y el filtro que separa las
// tareas SapSyncTarea sueltas de las que ya se resumen en una tarjeta de lote.
import type { Articulo } from '../types'
import type { ImportacionTrabajoResumen, SapTask } from '../services/articuloService'

export type FiltroEstadoTabla = 'todos' | 'en_cola' | 'error'

// Menor = mayor prioridad visual: lo que está pasando AHORA MISMO (EN_COLA)
// siempre arriba; los estados raros/transitorios (PENDIENTE, BORRADOR) en
// medio; ERROR (requiere acción, pero no es "en curso") al final de la
// prioridad de estado -- aunque dentro de ERROR se ordena por
// fecha_ultimo_intento DESC (ver ordenarPorPrioridadOperativa) para que el
// rechazo más reciente de SAP quede arriba del resto de errores.
const PRIORIDAD_ESTADO: Record<string, number> = {
    EN_COLA: 0,
    PENDIENTE: 1,
    BORRADOR: 2,
    ERROR: 3
}

export function estadoDeArticulo(articulo: Articulo): string {
    return articulo.controlSap?.estado ?? 'BORRADOR'
}

export function ordenarPorPrioridadOperativa(articulos: Articulo[]): Articulo[] {
    return [...articulos].sort((a, b) => {
        const estadoA = estadoDeArticulo(a)
        const estadoB = estadoDeArticulo(b)
        const prioridadA = PRIORIDAD_ESTADO[estadoA] ?? 9
        const prioridadB = PRIORIDAD_ESTADO[estadoB] ?? 9
        if (prioridadA !== prioridadB) return prioridadA - prioridadB

        if (estadoA === 'ERROR') {
            const fechaA = a.controlSap?.fecha_ultimo_intento
                ? new Date(a.controlSap.fecha_ultimo_intento).getTime()
                : 0
            const fechaB = b.controlSap?.fecha_ultimo_intento
                ? new Date(b.controlSap.fecha_ultimo_intento).getTime()
                : 0
            return fechaB - fechaA // más reciente primero
        }
        return 0
    })
}

export function filtrarPorPestana(articulos: Articulo[], filtro: FiltroEstadoTabla): Articulo[] {
    if (filtro === 'en_cola') return articulos.filter(a => estadoDeArticulo(a) === 'EN_COLA')
    if (filtro === 'error') return articulos.filter(a => estadoDeArticulo(a) === 'ERROR')
    return articulos
}

export function contarPorEstado(articulos: Articulo[], estado: string): number {
    return articulos.filter(a => estadoDeArticulo(a) === estado).length
}

export interface ProgresoLote {
    completados: number
    enCola: number
    porcentaje: number
    barraClass: string
}

// filasCorrectas/filasError ya vienen agregados desde el backend
// (ImportacionTrabajoResumen: conteo real de TODAS las filas del archivo,
// sin importar cuántos grupos/SapSyncTarea haya detrás) -- "en cola" es
// simplemente lo que aún no se resolvió del total.
export function calcularProgresoLote(lote: ImportacionTrabajoResumen): ProgresoLote {
    const completados = lote.filasCorrectas + lote.filasError
    const enCola = Math.max(0, lote.totalFilas - completados)
    const porcentaje = lote.totalFilas > 0 ? Math.round((completados / lote.totalFilas) * 100) : 0
    return {
        completados,
        enCola,
        porcentaje,
        barraClass: lote.filasError > 0 ? 'bg-amber-500' : 'bg-blue-500'
    }
}

// El backend arma nombre_tarea = "Importación #<id> (grupo <grupoProducto>):
// N artículo(s)" para CADA grupo que procesa un lote de Excel (ver
// _procesar_grupo_creacion/_procesar_grupo_actualizacion(_precios) en
// importacion_async_service.py) -- una SapSyncTarea por grupo, no por lote.
// Esas tareas ya se resumen en la tarjeta consolidada del lote
// (calcularProgresoLote), así que se excluyen de la lista de "tareas
// sueltas" para no duplicar la misma información dos veces.
// Reconoce creación, precios, estado y nombres de plantilla, incluso si
// cambian las mayúsculas, los acentos o el prefijo de la tarea.
const NOMBRE_TAREA_DE_LOTE = /\b(?:importacion|lote)\b[^#\r\n]*#\s*\d+\b|\bplantilla(?:[_\s.-]|$)|\b(?:carga|importacion)[\s_-]+masiva\b/

export function esTareaDeLote(nombreTarea: string): boolean {
    const nombreNormalizado = nombreTarea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return NOMBRE_TAREA_DE_LOTE.test(nombreNormalizado)
}

export function tareasSinLote(tasks: SapTask[]): SapTask[] {
    return tasks.filter(t => t.total_items === 1 && !esTareaDeLote(t.nombre_tarea))
}

// Se recalcula en cada re-render (cada 2s, por el polling) -- suficiente
// granularidad para un panel de monitoreo; no hace falta un ticker de 1s.
export function formatearTiempoTranscurrido(
    fechaInicio: string | null | undefined,
    fechaFin?: string | null,
    ahora: number = Date.now()
): string {
    if (!fechaInicio) return '--:--'
    const inicio = new Date(fechaInicio).getTime()
    const fin = fechaFin ? new Date(fechaFin).getTime() : ahora
    const segundos = Math.max(0, Math.floor((fin - inicio) / 1000))
    const horas = Math.floor(segundos / 3600)
    const mm = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0')
    const ss = (segundos % 60).toString().padStart(2, '0')
    return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`
}

export function loteBadgeClass(estado: string): string {
    switch (estado) {
        case 'PROCESANDO': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
        case 'ESPERANDO': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
        case 'COMPLETADO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
        case 'COMPLETADO_CON_ERRORES': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
        case 'ERROR': return 'bg-red-100 text-red-700 dark:bg-red-900/30'
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30'
    }
}

export function hayLoteActivo(lotes: ImportacionTrabajoResumen[]): boolean {
    return lotes.some(l => l.estado === 'ESPERANDO' || l.estado === 'PROCESANDO')
}
