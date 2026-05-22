import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { inventarioService } from '../services/inventarioApi'
import { getLegacyUserIdFromToken } from '../utils/legacyUserId'

/**
 * Permisos UI alineados con Security.cs:
 * - Edición: storecontrol.inventory.edit o Admin
 * - Ejecutar: edición + realizaConteo=1 (Admin omiten el flag)
 */
export function useInventarioPermissions() {
  const authStore = useAuthStore()
  const realizaConteo = ref<boolean | null>(null)
  const legacyUserId = ref<number | null>(getLegacyUserIdFromToken())

  const isAdmin = computed(() => authStore.isAdmin)
  const canEdit = computed(
    () => isAdmin.value || authStore.hasPermission('storecontrol.inventory.edit')
  )
  const canExecute = computed(() => {
    if (!canEdit.value) return false
    if (isAdmin.value) return true
    return realizaConteo.value === true
  })

  async function loadOperationalFlags() {
    const id = legacyUserId.value
    if (!id) {
      realizaConteo.value = null
      return
    }
    try {
      const data = await inventarioService.getUserEditData(id)
      realizaConteo.value = data.user.realiza_conteo
    } catch {
      realizaConteo.value = null
    }
  }

  onMounted(loadOperationalFlags)

  return {
    legacyUserId,
    realizaConteo,
    isAdmin,
    canEdit,
    canExecute,
    loadOperationalFlags
  }
}
