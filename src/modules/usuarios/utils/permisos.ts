import type { Permiso } from '../types'

export const PERMISO_CLAVE_MAX = 100
export const PERMISO_MODULO_MAX = 50
export const PERMISO_DESCRIPCION_MAX = 200

// `modulo.accion` (o más niveles: `cajachica.liquidaciones.view`): minúsculas, dígitos, guion y guion bajo.
const PATRON_CLAVE = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/
const PATRON_MODULO = /^[a-z0-9][a-z0-9_-]*$/

/** Las claves nuevas van en minúsculas y sin espacios (el frontend compara permisos en minúsculas). */
export function normalizarClave(clave: string): string {
  return clave.replace(/\s+/g, '').toLowerCase()
}

export function normalizarModulo(modulo: string): string {
  return modulo.trim().toLowerCase().replace(/\s+/g, '-')
}

/** Mensaje de error de una clave de permiso, o '' si es válida. */
export function validarClavePermiso(clave: string): string {
  const k = normalizarClave(clave)
  if (!k) return 'Escribe la clave del permiso.'
  if (k.length > PERMISO_CLAVE_MAX) return `La clave no puede superar ${PERMISO_CLAVE_MAX} caracteres.`
  if (!PATRON_CLAVE.test(k)) return 'Usa el formato módulo.acción, por ejemplo xia.tecnico (letras, números, guion o guion bajo, separados por un punto).'
  return ''
}

export function validarModuloPermiso(modulo: string): string {
  const m = normalizarModulo(modulo)
  if (!m) return 'Elige un módulo o escribe uno nuevo.'
  if (m.length > PERMISO_MODULO_MAX) return `El módulo no puede superar ${PERMISO_MODULO_MAX} caracteres.`
  if (!PATRON_MODULO.test(m)) return 'El módulo solo puede llevar letras, números, guion y guion bajo.'
  return ''
}

export function validarDescripcionPermiso(descripcion: string): string {
  const d = descripcion.trim()
  if (!d) return 'Describe qué permite hacer este permiso.'
  if (d.length > PERMISO_DESCRIPCION_MAX) return `La descripción no puede superar ${PERMISO_DESCRIPCION_MAX} caracteres.`
  return ''
}

/** ¿Ya existe un permiso con esa clave? (sin distinguir mayúsculas). `ignorarId` = el que se está editando. */
export function claveDuplicada(clave: string, permisos: Pick<Permiso, 'id' | 'key'>[], ignorarId?: number): boolean {
  const k = normalizarClave(clave)
  return permisos.some(p => p.id !== ignorarId && p.key.toLowerCase() === k)
}

/** Acciones habituales para sugerir una clave a partir del módulo: `xia` → `xia.view`, `xia.create`… */
export const ACCIONES_SUGERIDAS = [
  { sufijo: 'view', etiqueta: 'ver' },
  { sufijo: 'create', etiqueta: 'crear' },
  { sufijo: 'edit', etiqueta: 'editar' },
  { sufijo: 'delete', etiqueta: 'eliminar' },
] as const

/** Mapa permiso → nombres de los roles que lo tienen, a partir de los permisos de cada rol. */
export function usoPorPermiso(rolesConPermisos: { nombre: string; permisos: Pick<Permiso, 'id'>[] }[]): Map<number, string[]> {
  const mapa = new Map<number, string[]>()
  for (const { nombre, permisos } of rolesConPermisos) {
    for (const p of permisos) {
      const lista = mapa.get(p.id) ?? []
      lista.push(nombre)
      mapa.set(p.id, lista)
    }
  }
  for (const lista of mapa.values()) lista.sort((a, b) => a.localeCompare(b))
  return mapa
}
