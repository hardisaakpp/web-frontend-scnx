import { describe, it, expect } from 'vitest'
import recepcionRoutes from '@/modules/recepcion-mercaderia/router'
import type { RouteRecordRaw } from 'vue-router'

function findRoute(name: string): RouteRecordRaw {
  const route = recepcionRoutes.find((r) => r.name === name)
  if (!route) throw new Error(`route "${name}" not found in recepcionRoutes`)
  return route
}

describe('recepcionRoutes', () => {
  it('gates the pending-transfers route behind recepcion.reception.view', () => {
    expect(findRoute('recepcion-pendientes').meta?.permissions).toEqual(['recepcion.reception.view'])
  })

  it('gates the in-progress list route behind recepcion.reception.view', () => {
    expect(findRoute('recepcion-en-curso').meta?.permissions).toEqual(['recepcion.reception.view'])
  })

  it('gates the transfer detail route behind recepcion.reception.view', () => {
    expect(findRoute('recepcion-detalle').meta?.permissions).toEqual(['recepcion.reception.view'])
  })

  it('gates the transit-transfers report route behind recepcion.reception.transit.view', () => {
    expect(findRoute('recepcion-transitorias').meta?.permissions).toEqual(['recepcion.reception.transit.view'])
  })

  it('gates the store history route behind recepcion.history.view', () => {
    expect(findRoute('recepcion-historial').meta?.permissions).toEqual(['recepcion.history.view'])
  })

  it('redirects the old admin history path to the merged /historial route, so old bookmarks/links do not 404', () => {
    const redirectRoute = recepcionRoutes.find((r) => r.path === '/recepcion-mercaderia/historial/admin')
    expect(redirectRoute?.redirect).toBe('/recepcion-mercaderia/historial')
  })

  it('requires auth on every named route', () => {
    for (const route of recepcionRoutes) {
      if (!route.name) continue // the historial/admin path is a redirect-only alias, not a real route
      expect(route.meta?.requiresAuth).toBe(true)
    }
  })

  it('does not attach a redundant beforeEnter guard — the global router guard already enforces meta.permissions', () => {
    for (const route of recepcionRoutes) {
      expect(route.beforeEnter).toBeUndefined()
    }
  })
})
