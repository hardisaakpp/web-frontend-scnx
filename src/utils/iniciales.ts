/**
 * Iniciales (nombre + apellido) a partir de un nombre completo, para avatares.
 * Ignora sufijos entre paréntesis (ej. "Carlos Ortiz (SIS-MBL)" -> "CO", no "C(").
 */
export function inicialesDe(nombre: string): string {
  const sinSufijo = nombre.replace(/\([^)]*\)/g, ' ')
  const partes = sinSufijo.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}
