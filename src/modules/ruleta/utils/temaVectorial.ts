import type { TemaVisualConfig } from '../types'

/** Proyecta los bloques visuales permitidos; descarta campos antiguos en cachés y presets. */
export function configurarTemaVectorial(tema: TemaVisualConfig): TemaVisualConfig {
  return {
    ...tema,
    hub: tema.hub ? {
      escala: tema.hub.escala,
      rotacion_fija: tema.hub.rotacion_fija,
      borde_decorativo: tema.hub.borde_decorativo,
    } : undefined,
    fondo: tema.fondo ? {
      tipo: 'gradiente',
      overlay_opacidad: tema.fondo.overlay_opacidad,
      gradiente: tema.fondo.gradiente ? {
        tipo: tema.fondo.gradiente.tipo,
        angulo: tema.fondo.gradiente.angulo ?? 135,
        paradas: tema.fondo.gradiente.paradas.map(({ color, offset }) => ({ color, offset })),
      } : {
        tipo: 'lineal', angulo: 135,
        paradas: [
          { color: tema.color_fondo_inicio, offset: 0 },
          { color: tema.color_fondo_fin, offset: 100 },
        ],
      },
    } : undefined,
  }
}
