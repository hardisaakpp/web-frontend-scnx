import api from '@/services/api'

/**
 * Resuelve IDs de usuario del Core a un nombre legible.
 *
 * Usa `GET /Users/info/{id}` del Core, que solo exige estar autenticado. El listado `GET /Users`
 * que se usaba antes es solo para Admin: a un supervisor le fallaba en silencio y las pantallas
 * quedaban mostrando el GUID o el login de Active Directory en vez del nombre.
 *
 * Prioridad del texto: nombre completo → usuario → correo → id. Los ids que el Core no conoce
 * (p. ej. logins AD guardados como texto libre) se devuelven tal cual.
 */

type UserRecord = Record<string, unknown>

const nameCache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

const normalizeString = (value: unknown) => String(value ?? '').trim()

function userDisplayName(user: UserRecord, fallbackId: string): string {
  const fullName = normalizeString(user.fullName ?? user.FullName ?? user.Nombre ?? user.name)
  const userName = normalizeString(user.userName ?? user.UserName ?? user.username)
  const email = normalizeString(user.email ?? user.Email ?? user.Correo ?? user.mail)
  return fullName || userName || email || fallbackId
}

async function fetchUserName(id: string): Promise<string> {
  try {
    const response = await api.get(`/Users/info/${encodeURIComponent(id)}`)
    const payload = (response.data ?? {}) as UserRecord
    return userDisplayName(payload, id)
  } catch {
    return id
  }
}

function resolveOne(id: string): Promise<string> {
  const cached = nameCache.get(id)
  if (cached) return Promise.resolve(cached)

  const pending = inflight.get(id)
  if (pending) return pending

  const promise = fetchUserName(id)
    .then((name) => {
      nameCache.set(id, name)
      return name
    })
    .finally(() => {
      inflight.delete(id)
    })
  inflight.set(id, promise)
  return promise
}

export interface CoreUserInfo {
  id: string
  userName: string
  fullName: string | null
  email: string | null
}

/**
 * Busca un usuario en el Core por id o por usuario de red (AD). Devuelve null si no existe.
 * Se usa para aceptar solo usuarios reales al agregar pickers o participantes de reconteo:
 * un login mal escrito no debe quedar guardado como texto libre.
 */
export async function findCoreUser(idOrLogin: string): Promise<CoreUserInfo | null> {
  const key = normalizeString(idOrLogin)
  if (!key) return null
  try {
    const response = await api.get(`/Users/info/${encodeURIComponent(key)}`)
    const info = toCoreUserInfo((response.data ?? {}) as UserRecord)
    if (!info) return null
    nameCache.set(key, info.fullName ?? info.userName)
    nameCache.set(info.userName, info.fullName ?? info.userName)
    return info
  } catch {
    return null
  }
}

function toCoreUserInfo(u: UserRecord): CoreUserInfo | null {
  const userName = normalizeString(u.userName ?? u.UserName)
  if (!userName) return null
  return {
    id: normalizeString(u.id ?? u.Id),
    userName,
    fullName: normalizeString(u.fullName ?? u.FullName) || null,
    email: normalizeString(u.email ?? u.Email) || null,
  }
}

/**
 * Coincidencias de usuarios del Core por usuario de red, nombre o correo (autocompletado).
 * Usa `GET /Users/search`, que solo exige estar autenticado y devuelve datos básicos.
 */
export async function searchCoreUsers(query: string, limit = 10): Promise<CoreUserInfo[]> {
  const q = normalizeString(query)
  if (q.length < 2) return []
  try {
    const response = await api.get('/Users/search', { params: { q, limit } })
    const rows = Array.isArray(response.data) ? (response.data as UserRecord[]) : []
    const users = rows.map(toCoreUserInfo).filter((u): u is CoreUserInfo => u !== null)
    for (const u of users) nameCache.set(u.userName, u.fullName ?? u.userName)
    return users
  } catch {
    return []
  }
}

/** Resuelve IDs de usuario a nombre legible. Devuelve siempre una entrada por id (el id mismo si no se pudo resolver). */
export async function resolveUserNames(ids: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.map(normalizeString).filter(Boolean)))
  if (uniqueIds.length === 0) return {}

  const names = await Promise.all(uniqueIds.map(resolveOne))
  const result: Record<string, string> = {}
  uniqueIds.forEach((id, index) => {
    result[id] = names[index] || id
  })
  return result
}
