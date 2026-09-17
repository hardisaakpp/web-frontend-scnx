import { describe, it, expect } from 'vitest'
import recepcionProveedoresRoutes from '@/modules/recepcion-proveedores/router'
import type { RouteRecordRaw } from 'vue-router'

function findRoute(name: string): RouteRecordRaw {
  const route = recepcionProveedoresRoutes.find((r) => r.name === name)
  if (!route) throw new Error(`route "${name}" not found in recepcionProveedoresRoutes`)
  return route
}

describe('recepcionProveedoresRoutes', () => {
  it('defines the dashboard, search, detail and picking routes', () => {
    expect(findRoute('recepcion-proveedores-dashboard').path).toBe('/recepcion-proveedores')
    expect(findRoute('recepcion-proveedores-buscar').path).toBe('/recepcion-proveedores/buscar')
    expect(findRoute('recepcion-proveedores-detalle').path).toBe('/recepcion-proveedores/ordenes-compra/:docNum')
    expect(findRoute('recepcion-proveedores-picking').path).toBe('/recepcion-proveedores/picking/:sesionId')
    expect(findRoute('recepcion-proveedores-logs').path).toBe('/recepcion-proveedores/logs')
    expect(findRoute('recepcion-proveedores-pendientes').path).toBe('/recepcion-proveedores/pendientes')
  })

  it('requires auth on every route', () => {
    for (const route of recepcionProveedoresRoutes) {
      expect(route.meta?.requiresAuth).toBe(true)
    }
  })

  // recepcionproveedores.tienda da acceso total a las pantallas operativas de tienda (Buscar +
  // Detalle + Picking + Logs + En Curso/Picking + Historial); recepcionproveedores.view
  // (Supervisor) da acceso a todo eso mas Pendientes, que es exclusiva de Supervisor.
  it('gates the tienda-operational routes behind both tienda and supervisor', () => {
    for (const name of [
      'recepcion-proveedores-buscar',
      'recepcion-proveedores-detalle',
      'recepcion-proveedores-picking',
      'recepcion-proveedores-logs',
      'recepcion-proveedores-parcial',
    ]) {
      expect(findRoute(name).meta?.permissions).toEqual(['recepcionproveedores.tienda', 'recepcionproveedores.view'])
    }
  })

  it('gates the dashboard and historial for both tienda and supervisor', () => {
    for (const name of ['recepcion-proveedores-dashboard', 'recepcion-proveedores-historial']) {
      expect(findRoute(name).meta?.permissions).toEqual(['recepcionproveedores.tienda', 'recepcionproveedores.view'])
    }
  })

  it('gates pendientes behind recepcionproveedores.view only (exclusive to supervisor)', () => {
    expect(findRoute('recepcion-proveedores-pendientes').meta?.permissions).toEqual(['recepcionproveedores.view'])
  })

  it('does not attach a redundant beforeEnter guard — the global router guard already enforces meta.permissions', () => {
    for (const route of recepcionProveedoresRoutes) {
      expect(route.beforeEnter).toBeUndefined()
    }
  })
})
