import type { TemaVisualConfig } from '../types'

/** Única resolución del fondo para editor, mostrador y modo kiosko. */
export function estiloFondoTema(tema: TemaVisualConfig): string {
  const fondo = tema.fondo
  const gradiente = fondo?.gradiente
  if (gradiente && gradiente.paradas.length >= 2) {
    const paradas = [...gradiente.paradas].sort((a, b) => a.offset - b.offset)
    const stops = paradas.map(p => `${p.color} ${p.offset}%`).join(', ')
    if (gradiente.tipo === 'mesh') {
      const posiciones = ['15% 15%', '85% 15%', '15% 85%', '85% 85%']
      return `background: ${paradas.map((p, i) => `radial-gradient(circle at ${posiciones[i % posiciones.length]}, ${p.color}, transparent 70%)`).join(', ')}, ${paradas[0].color};`
    }
    return gradiente.tipo === 'radial'
      ? `background: radial-gradient(circle, ${stops});`
      : `background: linear-gradient(${gradiente.angulo ?? 135}deg, ${stops});`
  }
  return `background: linear-gradient(135deg, ${tema.color_fondo_inicio}, ${tema.color_fondo_fin});`
}
