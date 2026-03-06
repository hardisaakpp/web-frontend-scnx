import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/articulo-maestro',
        name: 'articulo-maestro',
        component: () => import('./views/DashboardView.vue'),
        meta: {
            title: 'Artículos Maestros',
            icon: 'CubeIcon'

        }
    },
    {
        path: '/articulo-maestro/lista',
        name: 'articulo-maestro-lista',
        component: () => import('./views/GestionArticulos.vue'),
        meta: {
            title: 'Lista de Artículo',
            icon: 'CubeIcon'
        }
    },
    {
        path: '/articulo-maestro/nuevo',
        name: 'articulo-maestro-nuevo',
        component: () => import('./views/FormularioArticulo.vue'),
        meta: {
            title: 'Nuevo Artículo',
            icon: 'CubeIcon'
        }
    },
    {
        path: '/articulo-maestro/editar/:itemCode',
        name: 'articulo-maestro-editar',
        component: () => import('./views/FormularioArticulo.vue'),
        meta: {
            title: 'Editar Artículo',
            icon: 'CubeIcon'
        }
    },
    {
        path: '/articulo-maestro/migracion',
        name: 'articulo-maestro-migracion',
        component: () => import('./views/MigracionSAP.vue'),
        meta: {
            title: 'Sincronización a SAP',
            icon: 'CubeIcon'
        }
    },
    {
        path: '/articulo-maestro/historial-locales',
        name: 'articulo-maestro-historial-locales',
        component: () => import('./views/HistorialCRUD.vue'),
        meta: {
            title: 'Historial de Artículos Locales',
            icon: 'CubeIcon'
        }
    },
    {
        path: '/articulo-maestro/historial-sap',
        name: 'articulo-maestro-historial-sap',
        component: () => import('./views/HistorialSAP.vue'),
        meta: {
            title: 'Historial de Artículos SAP',
            icon: 'CubeIcon'
        }
    }
]

export default routes
