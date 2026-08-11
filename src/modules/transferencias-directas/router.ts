import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: '/transferencias-stock',
        name: 'transferencias-stock-dashboard',
        component: () => import('./views/DashboardView.vue'),
        meta: {
            requiresAuth: true,
            title: 'Transferencia de Stock',
            icon: 'TruckIcon',
            permissions: ['transferenciadirecta.view'],
        },
    },
    {
        path: '/transferencias-stock/crearsolicitud',
        name: 'transferencias-stock-crearsolicitud',
        component: () => import('./views/CrearTransferenciasView.vue'),
        meta: {
            requiresAuth: true,
            title: 'Crear Transferencia',
            permissions: ['transferenciadirecta.solicitar'],
        },

    },
    {
        path: '/transferencias-stock/historial',
        name: 'transferencias-stock-historial',
        component: () => import('./views/HistorialTransferenciasView.vue'),
        meta: {
            requiresAuth: true,
            title: 'Historial de Transferencias',
            permissions: ['transferenciadirecta.view'],
        },
    },
    {
        path: '/transferencias-stock/editar/:id',
        name: 'transferencias-stock-editar',
        component: () => import('./views/CrearTransferenciasView.vue'),
        meta: {
            requiresAuth: true,
            title: 'Editar Transferencia',
            permissions: ['transferenciadirecta.solicitar'],
        },
    },
    {
        path: '/transferencias-stock/configuracion-envios',
        name: 'transferencias-stock-config-envios',
        component: () => import('./views/ConfiguracionEnviosView.vue'),
        meta: {
            requiresAuth: true,
            title: 'Configuración de Envíos',
            permissions: ['transferenciadirecta.configuracion_envios'],
        },
    },


]

export default routes