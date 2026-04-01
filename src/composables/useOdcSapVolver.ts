import { computed } from 'vue'
import { useRoute } from 'vue-router'

const DASHBOARD = '/mba3-consultas'

function resolveOdcSapVolverTarget(route: ReturnType<typeof useRoute>): string | null {
  if (!route.path.startsWith('/mba3-consultas')) return null
  if (route.path === '/mba3-consultas' || route.path === '/mba3-consultas/') return null

  const name = route.name as string | undefined

  if (name === 'mba3-consultas-pedido-detalle') return '/mba3-consultas/pedidos'
  if (name === 'mba3-consultas-cargar-plantilla-detalle') return '/mba3-consultas/cargar-plantilla'
  if (name === 'mba3-consultas-pedido-crear') return '/mba3-consultas/cargar-plantilla'
  if (name === 'mba3-consultas-pedido-redistribucion') {
    return route.query.soloLectura === '1'
      ? '/mba3-consultas/revisar-redistribucion'
      : '/mba3-consultas/redistribucion'
  }
  if (name === 'mba3-consultas-pedido-procesamiento-sap') return '/mba3-consultas/procesamiento-sap'

  if (
    /^\/mba3-consultas\/pedidos\/[^/]+$/.test(route.path) &&
    route.path !== '/mba3-consultas/pedidos/crear'
  ) {
    return '/mba3-consultas/pedidos'
  }
  if (route.path.includes('/pedidos/') && route.path.includes('/redistribucion')) {
    return route.query.soloLectura === '1'
      ? '/mba3-consultas/revisar-redistribucion'
      : '/mba3-consultas/redistribucion'
  }
  if (route.path.includes('/pedidos/') && route.path.includes('/procesamiento-sap')) {
    return '/mba3-consultas/procesamiento-sap'
  }
  if (route.path.startsWith('/mba3-consultas/cargar-plantilla/') && route.path !== '/mba3-consultas/cargar-plantilla') {
    return '/mba3-consultas/cargar-plantilla'
  }

  return DASHBOARD
}

/**
 * Barra fija "Volver" del módulo Gestión ODC SAP: mismo destino lógico que antes en cada pantalla.
 */
export function useOdcSapVolver() {
  const route = useRoute()

  const target = computed(() => resolveOdcSapVolverTarget(route))

  const title = computed(() => {
    const t = target.value
    if (!t) return ''
    if (t === DASHBOARD) return 'Volver al inicio de Gestión ODC SAP'
    return 'Volver'
  })

  return { target, title }
}
