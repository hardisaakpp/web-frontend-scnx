import type { IntensidadParticula, TipoParticula } from '../types'

interface EfectoParticula {
  id: TipoParticula
  etiqueta: string
  descripcion: string
  icono: string
  colores: readonly string[]
}

export const PARTICULAS = [
  { id: 'ninguno', etiqueta: 'Ninguno', descripcion: 'Modo sobrio / ahorro de batería', icono: '○', colores: [] },
  { id: 'nieve', etiqueta: 'Copos de nieve', descripcion: 'Navidad / Temporada invernal', icono: '❄', colores: ['#FFFFFF', '#DDF4FF'] },
  { id: 'chispas', etiqueta: 'Chispas doradas', descripcion: 'Aniversarios / Celebraciones VIP', icono: '✦', colores: ['#F5D061', '#FFE9A8', '#C9A84C'] },
  { id: 'neon', etiqueta: 'Luces neón', descripcion: 'Black Friday / Cyber Days', icono: 'ϟ', colores: ['#00F0FF', '#FF00E5', '#39FF14'] },
  { id: 'confeti', etiqueta: 'Confeti flotante', descripcion: 'Fiesta / Premiación continua', icono: '🎉', colores: ['#F5D061', '#E63946', '#4F46E5', '#22C55E'] },
  { id: 'burbujas', etiqueta: 'Burbujas mágicas', descripcion: 'Verano / Campañas frescas', icono: '🫧', colores: ['#7DD3FC', '#C4B5FD', '#99F6E4'] },
  { id: 'estrellas', etiqueta: 'Estrellas titilantes', descripcion: 'Noche / Gala', icono: '★', colores: ['#FEF3C7', '#FFFFFF', '#C4B5FD'] },
  { id: 'fuegos_artificiales', etiqueta: 'Fuegos artificiales sutiles', descripcion: 'Fin de Año / Aperturas', icono: '🎆', colores: ['#F5D061', '#F9A8D4', '#7DD3FC'] },
  { id: 'hojas', etiqueta: 'Hojas flotantes', descripcion: 'Otoño / Temporada', icono: '🍂', colores: ['#D97706', '#FBBF24', '#84CC16'] },
  { id: 'luces_flotantes', etiqueta: 'Luces flotantes / Bokeh', descripcion: 'Elegancia sutil corporativa', icono: '◌', colores: ['#FEF3C7', '#BFDBFE', '#DDD6FE'] },
] as const satisfies readonly EfectoParticula[]

export const INTENSIDADES: readonly IntensidadParticula[] = ['baja', 'media', 'alta']
export const CANTIDAD_PARTICULAS: Record<IntensidadParticula, number> = { baja: 12, media: 28, alta: 48 }
