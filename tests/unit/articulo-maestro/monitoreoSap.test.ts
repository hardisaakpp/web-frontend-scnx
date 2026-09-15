// Cobertura de la lógica pura del panel "Monitoreo de Sincronización SAP"
// (src/modules/articulo-maestro/utils/monitoreoSap.ts):
// 1. Consolidación de lotes de importación (progreso agregado, exclusión de
//    tareas SapSyncTarea por-grupo ya representadas en la tarjeta de lote).
// 2. Ordenamiento por prioridad operativa + filtros por pestaña de la tabla
//    de excepciones.
import { describe, expect, it } from 'vitest'
import {
    calcularProgresoLote,
    contarPorEstado,
    esTareaDeLote,
    filtrarPorPestana,
    formatearTiempoTranscurrido,
    hayLoteActivo,
    loteBadgeClass,
    ordenarPorPrioridadOperativa,
    tareasSinLote
} from '@/modules/articulo-maestro/utils/monitoreoSap'
import type { Articulo } from '@/modules/articulo-maestro/types'
import type {
    ImportacionTrabajoResumen,
    SapTask
} from '@/modules/articulo-maestro/services/articuloService'

function articulo(overrides: Partial<Articulo> & { itemCode: string }): Articulo {
    return {
        id: 1,
        itemName: 'ARTICULO DE PRUEBA',
        activo: true,
        ...overrides
    } as Articulo
}

function conEstado(
    itemCode: string,
    estado: string,
    fechaUltimoIntento: string | null = null
): Articulo {
    return articulo({
        itemCode,
        controlSap: {
            id: 1,
            id_articulo: 1,
            estado: estado as never,
            item_code_sap: null,
            mensaje_sap: null,
            mensaje_validacion: null,
            fecha_sincronizacion: null,
            intentos: 0,
            usuario_sincroniza: null,
            fecha_ultimo_intento: fechaUltimoIntento
        }
    })
}

function lote(overrides: Partial<ImportacionTrabajoResumen>): ImportacionTrabajoResumen {
    return {
        id: 1,
        nombreArchivo: 'productos.xlsx',
        hashArchivo: 'hash',
        tipo: 'CREAR',
        usuario: 'admin',
        estado: 'PROCESANDO',
        totalGrupos: 1,
        gruposProcesados: 0,
        totalFilas: 0,
        filasCorrectas: 0,
        filasError: 0,
        fechaInicio: null,
        fechaFin: null,
        ...overrides
    }
}

function tarea(overrides: Partial<SapTask> & { nombre_tarea: string }): SapTask {
    return {
        id: 1,
        usuario: 'admin',
        estado: 'PROCESANDO',
        total_items: 1,
        items_procesados: 0,
        fecha_creacion: '2026-01-01T00:00:00Z',
        fecha_fin: null,
        progreso_porcentaje: 0,
        ...overrides
    }
}

describe('ordenarPorPrioridadOperativa', () => {
    it('pone EN_COLA antes que ERROR (lo que está pasando ahora manda)', () => {
        const resultado = ordenarPorPrioridadOperativa([
            conEstado('AR001', 'ERROR'),
            conEstado('AR002', 'EN_COLA')
        ])
        expect(resultado.map(a => a.itemCode)).toEqual(['AR002', 'AR001'])
    })

    it('dentro de ERROR, ordena por fecha_ultimo_intento DESC (el más reciente arriba)', () => {
        const resultado = ordenarPorPrioridadOperativa([
            conEstado('ANTIGUO', 'ERROR', '2026-01-01T00:00:00Z'),
            conEstado('RECIENTE', 'ERROR', '2026-01-05T00:00:00Z'),
            conEstado('MEDIO', 'ERROR', '2026-01-03T00:00:00Z')
        ])
        expect(resultado.map(a => a.itemCode)).toEqual(['RECIENTE', 'MEDIO', 'ANTIGUO'])
    })

    it('respeta la jerarquía completa EN_COLA > PENDIENTE > BORRADOR > ERROR', () => {
        const resultado = ordenarPorPrioridadOperativa([
            conEstado('E', 'ERROR', '2026-01-01T00:00:00Z'),
            articulo({ itemCode: 'B' }), // sin controlSap -> BORRADOR
            conEstado('P', 'PENDIENTE'),
            conEstado('C', 'EN_COLA')
        ])
        expect(resultado.map(a => a.itemCode)).toEqual(['C', 'P', 'B', 'E'])
    })

    it('no muta el arreglo original', () => {
        const original = [conEstado('AR001', 'ERROR'), conEstado('AR002', 'EN_COLA')]
        const copia = [...original]
        ordenarPorPrioridadOperativa(original)
        expect(original).toEqual(copia)
    })
})

describe('filtrarPorPestana', () => {
    const articulos = [
        conEstado('C1', 'EN_COLA'),
        conEstado('E1', 'ERROR'),
        conEstado('E2', 'ERROR'),
        conEstado('B1', 'BORRADOR')
    ]

    it('"todos" no filtra nada', () => {
        expect(filtrarPorPestana(articulos, 'todos')).toHaveLength(4)
    })

    it('"en_cola" deja solo EN_COLA', () => {
        const resultado = filtrarPorPestana(articulos, 'en_cola')
        expect(resultado.map(a => a.itemCode)).toEqual(['C1'])
    })

    it('"error" deja solo ERROR', () => {
        const resultado = filtrarPorPestana(articulos, 'error')
        expect(resultado.map(a => a.itemCode).sort()).toEqual(['E1', 'E2'])
    })
})

describe('contarPorEstado', () => {
    it('cuenta artículos por estado, tratando sin controlSap como BORRADOR', () => {
        const articulos = [
            conEstado('C1', 'EN_COLA'),
            conEstado('C2', 'EN_COLA'),
            articulo({ itemCode: 'B1' })
        ]
        expect(contarPorEstado(articulos, 'EN_COLA')).toBe(2)
        expect(contarPorEstado(articulos, 'BORRADOR')).toBe(1)
        expect(contarPorEstado(articulos, 'ERROR')).toBe(0)
    })
})

describe('calcularProgresoLote', () => {
    it('calcula el porcentaje y desglose de un lote de 100 artículos en curso', () => {
        const resultado = calcularProgresoLote(
            lote({ totalFilas: 100, filasCorrectas: 60, filasError: 5 })
        )
        expect(resultado).toEqual({
            completados: 65,
            enCola: 35,
            porcentaje: 65,
            barraClass: 'bg-amber-500'
        })
    })

    it('usa la barra azul cuando no hay errores todavía', () => {
        const resultado = calcularProgresoLote(
            lote({ totalFilas: 10, filasCorrectas: 3, filasError: 0 })
        )
        expect(resultado.barraClass).toBe('bg-blue-500')
        expect(resultado.porcentaje).toBe(30)
    })

    it('no revienta con totalFilas en 0', () => {
        const resultado = calcularProgresoLote(
            lote({ totalFilas: 0, filasCorrectas: 0, filasError: 0 })
        )
        expect(resultado.porcentaje).toBe(0)
        expect(resultado.enCola).toBe(0)
    })

    it('un lote ya completado (100%) no reporta artículos en cola', () => {
        const resultado = calcularProgresoLote(
            lote({ totalFilas: 20, filasCorrectas: 18, filasError: 2 })
        )
        expect(resultado.porcentaje).toBe(100)
        expect(resultado.enCola).toBe(0)
    })
})

describe('esTareaDeLote / tareasSinLote', () => {
    it('reconoce el patrón que arma el backend por cada grupo de un lote', () => {
        expect(
            esTareaDeLote('Importación #28 (grupo 5 (Gel Ducha Citrus)): 1 artículo(s)')
        ).toBe(true)
    })

    it('no confunde una tarea manual (pull/reintentar) con una de lote', () => {
        expect(esTareaDeLote('Sincronización automática de 3 artículo(s)')).toBe(false)
        expect(esTareaDeLote('Reintentar Fallidos')).toBe(false)
    })

    it('tareasSinLote excluye únicamente las tareas por-grupo de un lote', () => {
        const tareas = [
            tarea({ id: 1, nombre_tarea: 'Importación #28 (grupo 5 (Gel Ducha Citrus)): 1 artículo(s)' }),
            tarea({ id: 2, nombre_tarea: 'Importación #28 (grupo 6): 1 artículo(s)' }),
            tarea({ id: 3, nombre_tarea: 'Sincronización automática de 3 artículo(s)' })
        ]
        const resultado = tareasSinLote(tareas)
        expect(resultado.map(t => t.id)).toEqual([3])
    })
})

describe('formatearTiempoTranscurrido', () => {
    it('formatea minutos:segundos cuando dura menos de una hora', () => {
        const ahora = new Date('2026-01-01T00:01:24Z').getTime()
        const resultado = formatearTiempoTranscurrido('2026-01-01T00:00:00Z', null, ahora)
        expect(resultado).toBe('01:24')
    })

    it('formatea horas:minutos:segundos cuando dura una hora o más', () => {
        const ahora = new Date('2026-01-01T01:02:03Z').getTime()
        const resultado = formatearTiempoTranscurrido('2026-01-01T00:00:00Z', null, ahora)
        expect(resultado).toBe('1:02:03')
    })

    it('usa fechaFin en vez de "ahora" cuando el lote ya terminó', () => {
        const ahora = new Date('2026-01-01T05:00:00Z').getTime()
        const resultado = formatearTiempoTranscurrido(
            '2026-01-01T00:00:00Z',
            '2026-01-01T00:00:30Z',
            ahora
        )
        expect(resultado).toBe('00:30')
    })

    it('retorna un placeholder si no hay fecha de inicio', () => {
        expect(formatearTiempoTranscurrido(null)).toBe('--:--')
    })
})

describe('loteBadgeClass', () => {
    it('distingue en curso (azul), éxito (esmeralda) y error (rojo)', () => {
        expect(loteBadgeClass('PROCESANDO')).toContain('blue')
        expect(loteBadgeClass('COMPLETADO')).toContain('emerald')
        expect(loteBadgeClass('ERROR')).toContain('red')
    })

    it('ESPERANDO y COMPLETADO_CON_ERRORES comparten el mismo tono ámbar (requieren atención)', () => {
        expect(loteBadgeClass('ESPERANDO')).toBe(loteBadgeClass('COMPLETADO_CON_ERRORES'))
        expect(loteBadgeClass('ESPERANDO')).toContain('amber')
    })
})

describe('hayLoteActivo', () => {
    it('es true si algún lote está ESPERANDO o PROCESANDO', () => {
        expect(hayLoteActivo([lote({ estado: 'ESPERANDO' })])).toBe(true)
        expect(hayLoteActivo([lote({ estado: 'PROCESANDO' })])).toBe(true)
    })

    it('es false si todos los lotes ya terminaron', () => {
        expect(
            hayLoteActivo([lote({ estado: 'COMPLETADO' }), lote({ estado: 'ERROR' })])
        ).toBe(false)
    })

    it('es false para una lista vacía', () => {
        expect(hayLoteActivo([])).toBe(false)
    })
})
