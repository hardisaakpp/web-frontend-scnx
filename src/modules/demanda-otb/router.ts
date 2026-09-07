import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/demanda-otb',
    name: 'demanda-otb-dashboard',
    component: () => import('./views/SeleccionNegocioView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Demanda OTB',
      icon: 'ChartBarIcon',
    },
  },
  {
    path: '/demanda-otb/ejemplo',
    name: 'demanda-otb-ejemplo',
    component: () => import('./views/EjemploGraficoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Demanda OTB — Ejemplo',
    },
  },
  {
    path: '/demanda-otb/:negocio',
    component: () => import('./layouts/DemandaOtbLayout.vue'),
    meta: {
      requiresAuth: true,
      title: 'Demanda OTB',
    },
    children: [
      { path: '', redirect: to => ({ name: 'demanda-otb-catalogo', params: to.params }) },
      {
        path: 'catalogo',
        name: 'demanda-otb-catalogo',
        component: () => import('./views/CatalogoView.vue'),
        meta: { requiresAuth: true, title: 'Demanda OTB — Catálogo' },
      },
      {
        path: 'niveles',
        name: 'demanda-otb-niveles',
        component: () => import('./views/NivelesView.vue'),
        meta: { requiresAuth: true, title: 'Demanda OTB — Niveles' },
      },
      {
        path: 'promociones',
        name: 'demanda-otb-promociones',
        component: () => import('./views/PromocionesView.vue'),
        meta: { requiresAuth: true, title: 'Demanda OTB — Promociones' },
      },
      {
        path: 'otb',
        name: 'demanda-otb-otb',
        component: () => import('./views/OtbView.vue'),
        meta: { requiresAuth: true, title: 'Demanda OTB — OTB' },
      },
    ],
  },
]

export default routes
