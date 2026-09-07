import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/articulo-maestro',
        name: 'articulo-maestro',
        component: () => import('./views/DashboardView.vue'),
        meta: {
            title: 'Artículos Maestros',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.view']
        }

    },
    {
        path: '/articulo-maestro/lista',
        name: 'articulo-maestro-lista',
        component: () => import('./views/GestionArticulos.vue'),
        meta: {
            title: 'Lista de Artículo',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.articulos']
        }

    },
    {
        path: '/articulo-maestro/nuevo',
        name: 'articulo-maestro-nuevo',
        component: () => import('./views/FormularioArticulo.vue'),
        meta: {
            title: 'Nuevo Artículo',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.articulos']
        }

    },
    {
        path: '/articulo-maestro/editar/:itemCode',
        name: 'articulo-maestro-editar',
        component: () => import('./views/FormularioArticulo.vue'),
        meta: {
            title: 'Editar Artículo',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.articulos']
        }

    },
    {
        path: '/articulo-maestro/migracion',
        name: 'articulo-maestro-migracion',
        component: () => import('./views/MigracionSAP.vue'),
        meta: {
            title: 'Monitoreo de Sincronización SAP',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.migracion']
        }

    },
    {
        path: '/articulo-maestro/eliminacion',
        name: 'articulo-maestro-eliminacion',
        component: () => import('./views/EliminacionSAP.vue'),
        meta: {
            title: 'Eliminación en SAP',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.eliminacionSAP']
        }
    },
    {
        path: '/articulo-maestro/historial-locales',
        name: 'articulo-maestro-historial-locales',
        component: () => import('./views/HistorialCRUD.vue'),
        meta: {
            title: 'Historial de Artículos Locales',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.historialCRUD']
        }

    },
    {
        path: '/articulo-maestro/historial-sap',
        name: 'articulo-maestro-historial-sap',
        component: () => import('./views/HistorialSAP.vue'),
        meta: {
            title: 'Historial de Artículos SAP',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.historialSAP']
        }

    },
    {
        path: '/articulo-maestro/catalogos',
        name: 'articulo-maestro-catalogos',
        component: () => import('./views/GestionCatalogos.vue'),
        meta: {
            title: 'Gestión de Catálogos',
            icon: 'CubeIcon',
            requiresAuth: true,
            permissions: ['articulomaestro.catalogos']
        }

    }
]

export default routes
