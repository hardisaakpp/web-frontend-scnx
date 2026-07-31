import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/ruleta',
    name: 'ruleta',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      title: 'Ruleta',
      requiresAuth: true,
      icon: 'SparklesIcon',
      permissions: ['ruleta.view', 'ruleta.enrolar', 'ruleta.supervisar', 'ruleta.administrar']
    }
  },
  {
    path: '/ruleta/enrolador',
    name: 'ruleta-enrolador',
    component: () => import('./views/EnroladorView.vue'),
    meta: {
      title: 'Ruleta — Giro',
      requiresAuth: true,
      permissions: ['ruleta.enrolar']
    }
  },
  {
    path: '/ruleta/listado',
    name: 'ruleta-listado',
    component: () => import('./views/ListadoView.vue'),
    meta: {
      title: 'Listado de Ruleta',
      requiresAuth: true,
      permissions: ['ruleta.view']
    }
  },
  {
    path: '/ruleta/supervisor',
    name: 'ruleta-supervisor',
    component: () => import('./views/SupervisorView.vue'),
    meta: {
      title: 'Monitoreo de Enroladores',
      requiresAuth: true,
      permissions: ['ruleta.supervisar', 'ruleta.administrar']
    }
  },
  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    path: '/ruleta/admin',
    name: 'ruleta-admin',
    component: () => import('./views/AdminView.vue'),
    meta: { title: 'Administración — Ruleta', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/campanas',
    name: 'ruleta-admin-campanas',
    component: () => import('./views/admin/CampanasView.vue'),
    meta: { title: 'Gestión de campañas', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/campanas/:campanaId',
    name: 'ruleta-admin-campana-detalle',
    component: () => import('./views/admin/CampanaDetalleView.vue'),
    meta: { title: 'Configuración de premios', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/premios',
    name: 'ruleta-admin-premios',
    component: () => import('./views/admin/PremiosView.vue'),
    meta: { title: 'Premios y probabilidades', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/inventario',
    name: 'ruleta-admin-inventario',
    component: () => import('./views/admin/InventarioView.vue'),
    meta: { title: 'Inventario por tienda', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/dashboard',
    name: 'ruleta-admin-dashboard',
    component: () => import('./views/admin/DashboardGlobalView.vue'),
    meta: { title: 'Dashboard global', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/reportes',
    name: 'ruleta-admin-reportes',
    component: () => import('./views/admin/ReportesView.vue'),
    meta: { title: 'Reportes y exportación', requiresAuth: true, permissions: ['ruleta.administrar'] }
  },
  {
    path: '/ruleta/enroladores',
    name: 'ruleta-enroladores',
    component: () => import('./views/admin/EnroladoresRankingView.vue'),
    meta: { title: 'Enroladores y ranking', requiresAuth: true, permissions: ['ruleta.supervisar', 'ruleta.administrar'] }
  },
  {
    path: '/ruleta/admin/tema',
    name: 'ruleta-admin-tema',
    component: () => import('./views/admin/TemaRuletaView.vue'),
    meta: { title: 'Diseño Visual — Ruleta', requiresAuth: true, permissions: ['ruleta.administrar'] }
  }
]

export default routes
