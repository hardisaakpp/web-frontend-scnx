import { describe, it, expect } from 'vitest'
import recepcionProveedoresRoutes from '@/modules/recepcion-proveedores/router'
import type { RouteRecordRaw } from 'vue-router'

function findRoute(name: string): RouteRecordRaw {
  const route = recepcionProveedoresRoutes.find((r) => r.name === name)
  if (!route) throw new Error(`route "${name}" not found in recepcionProveedoresRoutes`)
  return route
}

describe('recepcionProveedoresRoutes', () => {
  it('defines the search, detail and picking routes', () => {
    expect(findRoute('recepcion-proveedores-buscar').path).toBe('/recepcion-proveedores')
    expect(findRoute('recepcion-proveedores-detalle').path).toBe('/recepcion-proveedores/ordenes-compra/:docNum')
    expect(findRoute('recepcion-proveedores-picking').path).toBe('/recepcion-proveedores/picking/:sesionId')
    expect(findRoute('recepcion-proveedores-logs').path).toBe('/recepcion-proveedores/logs')
  })

  it('requires auth on every route', () => {
    for (const route of recepcionProveedoresRoutes) {
      expect(route.meta?.requiresAuth).toBe(true)
    }
  })

  // Deliberate for now: 'recepcion-proveedores.*' permission strings don't exist yet in
  // scnexus-core's catalog (new module). Update this once they're added and router.ts gains
  // meta.permissions — see router.ts's comment.
  it('does not gate any route behind meta.permissions yet', () => {
    for (const route of recepcionProveedoresRoutes) {
      expect(route.meta?.permissions).toBeUndefined()
    }
  })

  it('does not attach a redundant beforeEnter guard — the global router guard already enforces meta.permissions', () => {
    for (const route of recepcionProveedoresRoutes) {
      expect(route.beforeEnter).toBeUndefined()
    }
  })
})
