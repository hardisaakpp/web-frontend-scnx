import { jwtDecode } from 'jwt-decode'

const LEGACY_ID_CLAIMS = ['idU', 'idu', 'legacy_user_id', 'legacyUserId', 'idUsuario', 'IdUsuario'] as const

function parsePositiveInt(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

/** ID legacy en dbo.users (claim JWT idU / legacy_user_id). */
export function getLegacyUserIdFromToken(): number | null {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) return null
  try {
    const payload = jwtDecode<Record<string, unknown>>(token)
    for (const key of LEGACY_ID_CLAIMS) {
      const id = parsePositiveInt(payload[key])
      if (id) return id
    }
  } catch {
    return null
  }
  return null
}
