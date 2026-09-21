import { afterEach, describe, expect, it, vi } from 'vitest'

// ruletaStore.ts importa ruletaApi.ts, que crea instancias de axios (con interceptors) al cargar
// el módulo — mismo patrón que tests/unit/modules/ruleta/temaStore.test.ts para evitar llamadas de
// red reales al importar el store solo para probar la función pura resolverIndiceSegmento.
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}))

import { normalizarTexto, resolverIndiceSegmento } from '@/modules/ruleta/stores/ruletaStore'
import type { SegmentoRuleta } from '@/modules/ruleta/types'

afterEach(() => {
  vi.restoreAllMocks()
})

let nextId = 1
function crearSegmentos(
  parciales: Array<Partial<SegmentoRuleta> & Pick<SegmentoRuleta, 'nombre' | 'es_vacio' | 'tipo'>>
): SegmentoRuleta[] {
  return parciales.map((p) => ({
    id: nextId++,
    descripcion: null,
    imagen_url: null,
    color: '#000000',
    es_premio_mayor: false,
    ...p,
  }))
}

function crearPremio(
  parcial: Partial<SegmentoRuleta> & Pick<SegmentoRuleta, 'nombre' | 'es_vacio' | 'tipo'>
): SegmentoRuleta {
  return {
    id: -1, // El mapeo real de ejecutarGiro (ruletaApi.ts) usa Date.now(): nunca coincide con los
    // ids de this.segmentos (index + 1) — se simula ese desacople a propósito.
    descripcion: null,
    imagen_url: null,
    color: '#000000',
    es_premio_mayor: false,
    ...parcial,
  }
}

describe('normalizarTexto', () => {
  it('reduce acentos, signos, mayúsculas y espacios a la misma forma canónica', () => {
    expect(normalizarTexto('¡Sigue Intentando!')).toBe('sigueintentando')
    expect(normalizarTexto('Sigue  intentando')).toBe('sigueintentando')
    expect(normalizarTexto('sigue-intentando')).toBe('sigueintentando')
  })

  it('tolera nulos/undefined sin lanzar', () => {
    expect(normalizarTexto(null)).toBe('')
    expect(normalizarTexto(undefined)).toBe('')
  })
})

describe('resolverIndiceSegmento', () => {
  it('Test A: el comodín de seguridad "Sigue participando" elige aleatoriamente entre los gajos vacíos (posiciones 1 y 4), sin sesgo monótono', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Smart TV 50"', es_vacio: false, tipo: 'fisico' },
      { nombre: '¡Suerte para la próxima!', es_vacio: true, tipo: 'relleno' },
      { nombre: 'Audífonos', es_vacio: false, tipo: 'fisico' },
      { nombre: 'Cupón 10%', es_vacio: false, tipo: 'digital' },
      { nombre: 'Vuelve a intentar', es_vacio: true, tipo: 'relleno' },
      { nombre: 'Power Bank', es_vacio: false, tipo: 'fisico' },
    ])
    // El backend recurrió al comodín genérico de emergencia: ningún nombre de la ruleta visual
    // coincide ("Sigue participando" no es ni "¡Suerte para la próxima!" ni "Vuelve a intentar").
    const premio = crearPremio({ nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' })

    const randomSpy = vi.spyOn(Math, 'random')

    randomSpy.mockReturnValueOnce(0) // primer índice vacío del arreglo [1, 4] -> 1
    expect(resolverIndiceSegmento(segmentos, premio, false)).toBe(1)

    randomSpy.mockReturnValueOnce(0.999) // último índice vacío del arreglo [1, 4] -> 4
    expect(resolverIndiceSegmento(segmentos, premio, false)).toBe(4)
  })

  it('Test B: detecta "¡Sigue intentando!" como el mismo premio que "Sigue Intentando" (match normalizado, tolera signos/mayúsculas)', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Smart TV', es_vacio: false, tipo: 'fisico' },
      { nombre: '¡Sigue intentando!', es_vacio: true, tipo: 'relleno' },
    ])
    const premio = crearPremio({ nombre: 'Sigue Intentando', es_vacio: true, tipo: 'relleno' })

    expect(resolverIndiceSegmento(segmentos, premio, false)).toBe(1)
  })

  it('Test C: un ganador físico con nombre no coincidente jamás recibe un índice de gajo vacío', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' },
      { nombre: 'Smart TV 50"', es_vacio: false, tipo: 'fisico' },
      { nombre: 'Audífonos Pro', es_vacio: false, tipo: 'fisico' },
    ])
    // Nombre deliberadamente distinto (incluso normalizado) al de cualquier segmento visual.
    const premio = crearPremio({ nombre: 'Audífonos Bluetooth Sony', es_vacio: false, tipo: 'fisico' })

    for (let i = 0; i < 50; i++) {
      const indice = resolverIndiceSegmento(segmentos, premio, true)
      expect(segmentos[indice].es_vacio).toBe(false)
      expect(segmentos[indice].tipo).not.toBe('relleno')
    }
  })

  it('Test D: sin ningún gajo vacío configurado, un resultado de consuelo nunca cae en el índice 0 (Premio Mayor)', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Smart TV (Premio Mayor)', es_vacio: false, tipo: 'fisico', es_premio_mayor: true },
      { nombre: 'Audífonos', es_vacio: false, tipo: 'fisico' },
      { nombre: 'Power Bank', es_vacio: false, tipo: 'fisico' },
    ])
    const premio = crearPremio({ nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' })

    const indice = resolverIndiceSegmento(segmentos, premio, false)

    expect(indice).not.toBe(0)
    expect(indice).toBe(segmentos.length - 1)
  })

  it('prioriza la coincidencia exacta de nombre sobre cualquier fallback', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' },
      { nombre: 'Smart TV', es_vacio: false, tipo: 'fisico' },
    ])
    const premio = crearPremio({ nombre: 'Smart TV', es_vacio: false, tipo: 'fisico' })

    expect(resolverIndiceSegmento(segmentos, premio, true)).toBe(1)
  })

  it('usa el id del segmento cuando no hay match de nombre pero sí de id', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' },
      { nombre: 'Premio con nombre distinto en el backend', es_vacio: false, tipo: 'fisico' },
    ])
    const premio = crearPremio({
      id: segmentos[1].id,
      nombre: 'Otro nombre completamente distinto',
      es_vacio: false,
      tipo: 'fisico',
    })

    expect(resolverIndiceSegmento(segmentos, premio, true)).toBe(1)
  })

  it('!resultado.es_ganador fuerza la categoría de consuelo incluso si premio.es_vacio llegara en false', () => {
    const segmentos = crearSegmentos([
      { nombre: 'Smart TV', es_vacio: false, tipo: 'fisico' },
      { nombre: 'Sigue participando', es_vacio: true, tipo: 'relleno' },
    ])
    // Caso defensivo: es_ganador=false debe primar sobre un premio.es_vacio inconsistente.
    const premio = crearPremio({ nombre: 'Nombre no coincidente', es_vacio: false, tipo: 'fisico' })

    expect(resolverIndiceSegmento(segmentos, premio, false)).toBe(1)
  })

  it('devuelve 0 con un arreglo de segmentos vacío en vez de lanzar', () => {
    const premio = crearPremio({ nombre: 'Cualquiera', es_vacio: true, tipo: 'relleno' })
    expect(resolverIndiceSegmento([], premio, false)).toBe(0)
  })
})
