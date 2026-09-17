import { computed } from 'vue'
import { useAuthStore, type WarehouseAccessInfo } from '@/stores/auth'
import { TESORERIA_PERMISOS } from '../types/tesoreria.types'

function normalizeAccesses(raw: WarehouseAccessInfo[] | WarehouseAccessInfo | null | undefined): WarehouseAccessInfo[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

/**
 * Deriva, del authStore (roles/permisos/warehouseAccesses ya poblados por api-core-scnexus), el
 * alcance geográfico y de gobierno de Tesorería.
 *
 * Normaliza los roles a minúsculas y aplica un BYPASS TOTAL para el rol Administrador
 * ('Admin', 'Administrador', 'Administrador Principal', etc.), garantizando que Contabilidad y
 * Supervisores también tengan visibilidad fluida según sus funciones.
 */
export function useTesoreriaAccess() {
  const authStore = useAuthStore()

  // ─── 1. Normalización de roles a minúsculas ─────────────────────────────
  const roles = computed<string[]>(() => {
    // Inspeccionar las distintas fuentes posibles en authStore
    const raw: unknown =
      (authStore as unknown as { user?: { roles?: unknown } }).user?.roles ||
      (authStore as unknown as { roles?: unknown }).roles ||
      authStore.userRoles ||
      authStore.userData?.roles ||
      authStore.role ||
      []

    if (Array.isArray(raw)) {
      return raw.map(r => String(r).trim().toLowerCase())
    }
    if (typeof raw === 'string') {
      return [raw.trim().toLowerCase()]
    }
    return []
  })

  // ─── 2. Evaluación de accesos y almacenes ────────────────────────────────
  const accesos = computed(() => normalizeAccesses(authStore.userWarehouseAccesses))

  // ─── 3. Evaluación de Flags de Rol (con soporte para "Administrador Principal") ─
  const esAdmin = computed<boolean>(() => {
    return (
      authStore.isAdmin ||
      roles.value.some(
        r => r === 'admin' || r === 'administrador' || r.includes('admin') || r.includes('administrador')
      )
    )
  })

  const esContabilidad = computed<boolean>(() => {
    return (
      esAdmin.value ||
      roles.value.some(r => r.includes('contab') || r === 'tesoreria') ||
      authStore.hasPermission(TESORERIA_PERMISOS.ConfigurarBloqueos)
    )
  })

  const esSupervisor = computed<boolean>(() => {
    return (
      esAdmin.value ||
      roles.value.some(r => r.includes('supervisor')) ||
      accesos.value.some(a => String(a.accesoAlmacen || '').toLowerCase() === 'supervisor')
    )
  })

  /** Contabilidad Matriz o Admin: ve el consolidado nacional sin restricción territorial. */
  const tieneAccesoGlobal = computed<boolean>(() => {
    return esAdmin.value || esContabilidad.value
  })

  /** Tienda física de adscripción del usuario (fija para el rol Cajero). */
  const almacenBase = computed<string | null>(() => accesos.value[0]?.codAlmacen ?? null)

  /** Unión de almacenBase + todos los almacenes de sus WarehouseGroups. */
  const almacenesAutorizados = computed<string[]>(() => {
    const set = new Set<string>()
    for (const acceso of accesos.value) {
      if (acceso.codAlmacen) set.add(acceso.codAlmacen)
      for (const grupo of acceso.warehouseGroups ?? []) {
        for (const codigo of grupo.almacenes ?? []) set.add(codigo)
      }
    }
    return Array.from(set)
  })

  function tieneAccesoAlmacen(codigoAlmacen: string | null | undefined): boolean {
    if (!codigoAlmacen) return false
    if (tieneAccesoGlobal.value) return true
    return almacenesAutorizados.value.includes(codigoAlmacen)
  }

  /** Opciones para <select> de almacén: "TODOS" solo con acceso global; si no, la unión ya acotada de almacenesAutorizados. */
  const opcionesAlmacenes = computed<{ codigo: string; label: string }[]>(() => {
    const base = almacenesAutorizados.value.map(codigo => ({ codigo, label: codigo }))
    if (!tieneAccesoGlobal.value) return base
    return [{ codigo: '', label: 'TODOS LOS ALMACENES' }, ...base]
  })

  // ─── 4. Bypass en Permisos de UI para Admin / Roles jerárquicos ──────────
  const puedeConsultar = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esContabilidad.value ||
      esSupervisor.value ||
      accesos.value.length > 0 ||
      authStore.hasPermission(TESORERIA_PERMISOS.Consultar)
    )
  })

  const puedeCrear = computed<boolean>(() => {
    return esAdmin.value || authStore.hasPermission(TESORERIA_PERMISOS.Crear)
  })

  const puedeAuditarGlobal = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esContabilidad.value ||
      esSupervisor.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.AuditarGlobal)
    )
  })

  const puedeConfigurar = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esContabilidad.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.ConfigurarBloqueos)
    )
  })

  const puedeAutorizarSobregiro = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esSupervisor.value ||
      esContabilidad.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.AutorizarSobregiro)
    )
  })

  const puedeEliminar = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esSupervisor.value ||
      esContabilidad.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.Eliminar)
    )
  })

  /**
   * Exclusividad contable para anular depósitos YA integrados en SAP (a diferencia de
   * `puedeEliminar`, que también autoriza a Supervisor sobre papeletas no integradas). Cajeros y
   * Supervisores nunca deben poder ejecutar esta reversión — solo Admin, o Contabilidad con
   * permiso explícito de Auditoría Global o Eliminación. Debe reflejar exactamente la regla del
   * backend en AnularDepositoCommandHandler.
   */
  const puedeAnularSap = computed<boolean>(() => {
    return (
      esAdmin.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.AuditarGlobal) ||
      (esContabilidad.value && authStore.hasPermission(TESORERIA_PERMISOS.Eliminar))
    )
  })

  const puedeIntegrarSap = computed<boolean>(() => {
    return (
      esAdmin.value ||
      esContabilidad.value ||
      esSupervisor.value ||
      authStore.hasPermission(TESORERIA_PERMISOS.IntegrarSAP)
    )
  })

  return {
    roles,
    esAdmin,
    esContabilidad,
    esSupervisor,
    tieneAccesoGlobal,
    almacenBase,
    almacenesAutorizados,
    opcionesAlmacenes,
    tieneAccesoAlmacen,
    puedeConsultar,
    puedeCrear,
    puedeAuditarGlobal,
    puedeConfigurar,
    puedeAutorizarSobregiro,
    puedeEliminar,
    puedeAnularSap,
    puedeIntegrarSap
  }
}
