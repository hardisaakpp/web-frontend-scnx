export interface OpcionTipografia {
  id: string
  etiqueta: string
  familia: string
  pesos: number[]
}

/** Catálogo extensible compartido por el selector y el cargador de Google Fonts. */
export const TIPOGRAFIAS_DISPONIBLES: OpcionTipografia[] = [
  { id: 'inter', etiqueta: 'Inter', familia: 'Inter', pesos: [400, 800] },
  { id: 'montserrat', etiqueta: 'Montserrat', familia: 'Montserrat', pesos: [400, 800] },
  { id: 'poppins', etiqueta: 'Poppins', familia: 'Poppins', pesos: [400, 800] },
  { id: 'roboto', etiqueta: 'Roboto', familia: 'Roboto', pesos: [400, 800] },
  { id: 'bebas-neue', etiqueta: 'Bebas Neue', familia: 'Bebas Neue', pesos: [400] },
  { id: 'oswald', etiqueta: 'Oswald', familia: 'Oswald', pesos: [400, 700] },
  { id: 'lato', etiqueta: 'Lato', familia: 'Lato', pesos: [400, 900] },
  { id: 'playfair-display', etiqueta: 'Playfair Display', familia: 'Playfair Display', pesos: [400, 800] },
  { id: 'raleway', etiqueta: 'Raleway', familia: 'Raleway', pesos: [400, 800] },
  { id: 'ubuntu', etiqueta: 'Ubuntu', familia: 'Ubuntu', pesos: [400, 700] },
]

/** Solo carga familias del catálogo, una vez por documento. Conserva fuentes de temas antiguos. */
export function cargarTipografia(familia: string): void {
  if (typeof document === 'undefined') return
  const nombre = familia.split(',')[0].trim().replace(/['"]/g, '')
  const fuente = TIPOGRAFIAS_DISPONIBLES.find(f => f.familia === nombre)
  if (!fuente) return
  const id = `ruleta-font-${fuente.id}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fuente.familia)}:wght@${fuente.pesos.join(';')}&display=swap`
  link.onerror = () => link.remove() // permite reintentar en la próxima selección
  document.head.appendChild(link)
}
