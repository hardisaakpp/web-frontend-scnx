import { ref } from 'vue'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'

// Module-level state: shared singleton across every component that uses this composable,
// keyed by userId so a *different* user logging in within the same browser tab (no full
// page reload between logout/login) triggers a fresh check instead of reusing a stale result.
const hasPickerSessions = ref(false)
const checkedForUserId = ref<string | null>(null)

/**
 * Users added as pickers to a specific inventory session have no 'inventario.*' RBAC
 * permission in CORE — they were only granted access to that one session. Menu visibility
 * can't rely on permissions for them, so this checks /api/inventory-sessions/my directly
 * (it already includes picker-assigned sessions, see GetMyOpenSessionsAsync in the backend).
 */
export function usePickerSessionAccess() {
  async function checkPickerAccess(userId: string) {
    if (checkedForUserId.value === userId) return
    checkedForUserId.value = userId
    try {
      const sesiones = await inventarioSesionesService.getMisSesiones()
      hasPickerSessions.value = sesiones.length > 0
    } catch {
      hasPickerSessions.value = false
    }
  }

  return { hasPickerSessions, checkPickerAccess }
}
