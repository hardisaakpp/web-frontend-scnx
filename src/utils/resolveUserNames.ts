import api from '@/services/api'

type UserRecord = Record<string, unknown>

let usersByIdCache: Record<string, string> | null = null
let loadUsersPromise: Promise<Record<string, string>> | null = null

const normalizeString = (value: unknown) => String(value ?? '').trim()

const userDisplayName = (user: UserRecord): string => {
  const id = normalizeString(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario)
  const userName = normalizeString(user.userName ?? user.UsuarioNombre ?? user.username)
  const fullName = normalizeString(user.fullName ?? user.Nombre ?? user.name)
  const email = normalizeString(user.email ?? user.Correo ?? user.mail)
  const base = fullName || userName || email || id
  return email && base !== email ? `${base} (${email})` : base
}

async function fetchUsersFromApi(): Promise<Record<string, string>> {
  try {
    const response = await api.get('/Users')
    const payload = response.data as unknown
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown[] })?.data)
        ? (payload as { data: unknown[] }).data
        : []
    const map: Record<string, string> = {}
    for (const item of items) {
      const user = item as UserRecord
      const id = normalizeString(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario)
      if (id) map[id] = userDisplayName(user)
    }
    usersByIdCache = map
    return map
  } catch {
    usersByIdCache = {}
    return {}
  }
}

async function loadUsersById(): Promise<Record<string, string>> {
  if (usersByIdCache) return usersByIdCache
  if (!loadUsersPromise) {
    loadUsersPromise = fetchUsersFromApi()
  }
  try {
    return await loadUsersPromise
  } finally {
    loadUsersPromise = null
  }
}

/** Resuelve IDs de usuario a nombre legible vía Core API /Users. */
export async function resolveUserNames(ids: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.map(normalizeString).filter(Boolean)))
  if (uniqueIds.length === 0) return {}

  const usersById = await loadUsersById()
  const result: Record<string, string> = {}
  for (const id of uniqueIds) {
    result[id] = usersById[id] || id
  }
  return result
}
