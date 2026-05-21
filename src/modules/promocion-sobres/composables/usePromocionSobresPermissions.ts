import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  hasPromocionSobresMonitoreoViewPermission,
  hasPromocionSobresOperatePermission,
  promocionSobresDefaultPath
} from '../permissions'

export function usePromocionSobresPermissions() {
  const authStore = useAuthStore()

  const permissions = computed(() => authStore.userPermissions)

  const canOperate = computed(() => hasPromocionSobresOperatePermission(permissions.value))

  const canViewMonitoreo = computed(() =>
    hasPromocionSobresMonitoreoViewPermission(permissions.value)
  )

  const defaultModulePath = computed(() => promocionSobresDefaultPath(permissions.value))

  return {
    canOperate,
    canViewMonitoreo,
    defaultModulePath
  }
}
