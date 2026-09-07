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
