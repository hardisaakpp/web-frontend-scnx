import type { Permiso } from '../types'

/** Mismos límites que valida el Core (RolesController.Validate). */
export const ROL_NOMBRE_MIN = 2
export const ROL_NOMBRE_MAX = 50
export const ROL_DESCRIPCION_MAX = 500

const PATRON_NOMBRE = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u

/** Mensaje de error del nombre de un rol, o '' si es válido. Refleja la validación del Core para avisar antes de enviar. */
export function validarNombreRol(nombre: string): string {
  const limpio = nombre.trim()
  if (limpio.length === 0) return 'Escribe un nombre para el rol.'
  if (limpio.length < ROL_NOMBRE_MIN) return `El nombre debe tener al menos ${ROL_NOMBRE_MIN} caracteres.`
  if (limpio.length > ROL_NOMBRE_MAX) return `El nombre no puede superar ${ROL_NOMBRE_MAX} caracteres.`
  if (!PATRON_NOMBRE.test(limpio)) {
    return 'Usa solo letras, números, espacios, guion, guion bajo y punto; debe empezar por letra o número.'
  }
  return ''
}

/** ¿Ya hay un rol con ese nombre? (el Core compara sin distinguir mayúsculas). `ignorarId` = el rol que se está editando. */
export function nombreRolDuplicado(nombre: string, roles: { id: string; name: string }[], ignorarId?: string): boolean {
  const buscado = nombre.trim().toLowerCase()
  return roles.some(r => r.id !== ignorarId && r.name.trim().toLowerCase() === buscado)
}

/** Agrupa permisos por módulo (módulos y permisos en orden alfabético). */
export function agruparPorModulo(permisos: Permiso[]): { modulo: string; permisos: Permiso[] }[] {
  const mapa = new Map<string, Permiso[]>()
  for (const p of permisos) {
    const modulo = p.module?.trim() || 'general'
    if (!mapa.has(modulo)) mapa.set(modulo, [])
    mapa.get(modulo)!.push(p)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([modulo, lista]) => ({ modulo, permisos: [...lista].sort((a, b) => a.key.localeCompare(b.key)) }))
}

/** Filtra por texto en clave, descripción o módulo (sin distinguir mayúsculas ni tildes). */
export function filtrarPermisos(permisos: Permiso[], texto: string): Permiso[] {
  const q = normalizar(texto)
  if (!q) return permisos
  return permisos.filter(p => normalizar(`${p.key} ${p.description} ${p.module}`).includes(q))
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Mensajes en inglés que el Core aún devuelve en permisos y asignaciones, traducidos para el usuario. */
const MENSAJES_CORE: Record<string, string> = {
  'permission key already exists.': 'Ya existe un permiso con esa clave.',
  'permission not found.': 'El permiso ya no existe. Actualiza la página.',
  'role not found.': 'El rol ya no existe. Actualiza la página.',
  'permission already assigned to role.': 'El rol ya tiene ese permiso.',
  'permission not assigned to role.': 'El rol no tenía ese permiso.',
  'role name is required.': 'Falta el nombre del rol.',
}

export function traducirMensajeCore(mensaje: string): string {
  return MENSAJES_CORE[mensaje.trim().toLowerCase()] ?? mensaje
}

/** Mensaje legible de un error de axios: el `message` que devuelve el Core, o un texto de respaldo. */
export function mensajeDeError(error: unknown, respaldo: string): string {
  const e = error as { response?: { data?: unknown }; message?: string }
  const data = e?.response?.data
  if (typeof data === 'string' && data.trim()) return traducirMensajeCore(data)
  if (data && typeof data === 'object') {
    const m = (data as { message?: unknown; title?: unknown }).message ?? (data as { title?: unknown }).title
    if (typeof m === 'string' && m.trim()) return traducirMensajeCore(m)
  }
  return respaldo
}
