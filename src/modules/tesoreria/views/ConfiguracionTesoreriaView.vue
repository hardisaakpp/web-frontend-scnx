<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Navegación superior -->
    <div class="flex items-center justify-between">
      <VolverButton to="/tesoreria" label="Tesorería" />
      <nav aria-label="Ruta de navegación" class="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <router-link to="/" class="hover:text-gray-900 dark:hover:text-gray-200">Inicio</router-link>
        <span aria-hidden="true">/</span>
        <router-link to="/tesoreria" class="hover:text-gray-900 dark:hover:text-gray-200">Tesorería</router-link>
        <span aria-hidden="true">/</span>
        <span class="font-medium text-gray-800 dark:text-gray-200" aria-current="page">Configuración</span>
      </nav>
    </div>

    <!-- Título y descripción -->
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
        Panel de Configuración de Tesorería
      </h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Administre los candados de días de gracia y el catálogo de cuentas bancarias habilitadas para depósitos de tiendas.
      </p>
    </header>

    <!-- Defensa en profundidad: el guard del router ya bloquea la ruta, esto cubre accesos directos al componente -->
    <ForbiddenView v-if="!puedeConfigurar" />

    <template v-else>
      <!-- Estado de carga inicial -->
      <div v-if="cargandoPoliticas || cargandoCuentas" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
        <div class="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
        <div class="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
      </div>

      <!-- Grid ejecutivo de 3 tarjetas -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card 1: Políticas y Días de Gracia -->
        <section
          aria-labelledby="card-politicas-title"
          class="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xs"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <ClockIcon class="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="card-politicas-title" class="text-base font-bold text-gray-900 dark:text-white">
              Políticas y Días de Gracia
            </h2>
          </div>

          <ul class="mt-4 flex-1 space-y-2.5 text-sm">
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">
                Candado nuevos depósitos:
                <strong class="text-gray-900 dark:text-white">
                  {{ form.diasMaximoNuevo }} día{{ form.diasMaximoNuevo === 1 ? '' : 's' }}
                </strong>
              </span>
              <EstadoBadge :activo="form.bloqueoNuevoActivo" />
            </li>
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">
                Candado integración SAP: <strong class="text-gray-900 dark:text-white">{{ form.diasMaximoDeposito }} días</strong>
              </span>
              <EstadoBadge :activo="form.bloqueoDepositoActivo" />
            </li>
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">
                Rango alertas correo: <strong class="text-gray-900 dark:text-white">{{ resumenRangoNotificaciones }}</strong>
              </span>
              <EstadoBadge :activo="form.notificacionesActivas" />
            </li>
            <li class="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Estado:</span>
              <span
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                :class="errorValidacionPoliticas
                  ? 'border-vermilion-300 bg-vermilion-50 text-vermilion-700 dark:border-vermilion-800 dark:bg-vermilion-950/40 dark:text-vermilion-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'"
              >
                <CheckCircleIcon v-if="!errorValidacionPoliticas" class="h-3.5 w-3.5" aria-hidden="true" />
                <ExclamationTriangleIcon v-else class="h-3.5 w-3.5" aria-hidden="true" />
                {{ errorValidacionPoliticas ? 'Requiere revisión' : 'Activo y en regla' }}
              </span>
            </li>
          </ul>

          <button
            type="button"
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
            @click="isDrawerPoliticasOpen = true"
          >
            <Cog6ToothIcon class="h-4 w-4" aria-hidden="true" />
            Modificar Días de Gracia
          </button>
        </section>

        <!-- Card 2: Catálogo de Cuentas Bancarias -->
        <section
          aria-labelledby="card-cuentas-title"
          class="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xs"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <BuildingLibraryIcon class="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="card-cuentas-title" class="text-base font-bold text-gray-900 dark:text-white">
              Catálogo de Cuentas Bancarias
            </h2>
          </div>

          <ul class="mt-4 flex-1 space-y-2.5 text-sm">
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">Total registradas en SAP</span>
              <strong class="text-gray-900 dark:text-white">{{ totalCuentas }}</strong>
            </li>
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">Habilitadas para tiendas</span>
              <strong class="text-gray-900 dark:text-white">{{ cuentasParaTiendas }}</strong>
            </li>
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">Cuentas activas</span>
              <strong class="text-gray-900 dark:text-white">{{ cuentasActivas }}</strong>
            </li>
          </ul>

          <button
            type="button"
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
            @click="isDrawerCuentasOpen = true"
          >
            <BanknotesIcon class="h-4 w-4" aria-hidden="true" />
            Administrar Cuentas Bancarias
          </button>
        </section>

        <!-- Card 3: Destinatarios de Alertas de Contabilidad -->
        <section
          aria-labelledby="card-contactos-title"
          class="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xs"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <EnvelopeIcon class="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="card-contactos-title" class="text-base font-bold text-gray-900 dark:text-white">
              Destinatarios de Alertas de Contabilidad
            </h2>
          </div>

          <ul class="mt-4 flex-1 space-y-2.5 text-sm">
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">Destinatarios registrados</span>
              <strong class="text-gray-900 dark:text-white">{{ totalContactos }}</strong>
            </li>
            <li class="flex items-center justify-between gap-3">
              <span class="text-gray-600 dark:text-gray-300">Activos</span>
              <strong class="text-gray-900 dark:text-white">{{ totalActivos }}</strong>
            </li>
            <li class="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Cobertura:</span>
              <span
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                :class="sinCoberturaDeContactos
                  ? 'border-vermilion-300 bg-vermilion-50 text-vermilion-700 dark:border-vermilion-800 dark:bg-vermilion-950/40 dark:text-vermilion-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'"
              >
                <CheckCircleIcon v-if="!sinCoberturaDeContactos" class="h-3.5 w-3.5" aria-hidden="true" />
                <ExclamationTriangleIcon v-else class="h-3.5 w-3.5" aria-hidden="true" />
                {{ sinCoberturaDeContactos ? 'Sin cobertura' : 'En regla' }}
              </span>
            </li>
          </ul>

          <button
            type="button"
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
            @click="isDrawerContactosOpen = true"
          >
            <UserGroupIcon class="h-4 w-4" aria-hidden="true" />
            Administrar Destinatarios
          </button>
        </section>
      </div>
    </template>

    <!-- Drawers -->
    <DrawerConfiguracionPoliticas
      :is-open="isDrawerPoliticasOpen"
      @close="isDrawerPoliticasOpen = false"
      @saved="isDrawerPoliticasOpen = false"
    />
    <DrawerGestionCuentas :is-open="isDrawerCuentasOpen" @close="isDrawerCuentasOpen = false" />
    <DrawerContactosNotificacion :is-open="isDrawerContactosOpen" @close="isDrawerContactosOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'
import { useConfiguracionTesoreria } from '../composables/useConfiguracionTesoreria'
import { useCuentasFinancieras } from '../composables/useCuentasFinancieras'
import { useContactosNotificacion } from '../composables/useContactosNotificacion'
import { useTesoreriaAccess } from '../composables/useTesoreriaAccess'
import DrawerConfiguracionPoliticas from '../components/DrawerConfiguracionPoliticas.vue'
import DrawerGestionCuentas from '../components/DrawerGestionCuentas.vue'
import DrawerContactosNotificacion from '../components/DrawerContactosNotificacion.vue'
import EstadoBadge from '../components/EstadoBadge.vue'

const {
  form, cargando: cargandoPoliticas, errorValidacion: errorValidacionPoliticas, resumenRangoNotificaciones, cargar: cargarPoliticas
} = useConfiguracionTesoreria()
const {
  cargando: cargandoCuentas, totalCuentas, cuentasParaTiendas, cuentasActivas, cargar: cargarCuentas
} = useCuentasFinancieras()
const {
  contactos, totalContactos, totalActivos, sinCobertura: sinCoberturaDeContactos, cargar: cargarContactos
} = useContactosNotificacion()
const { puedeConfigurar } = useTesoreriaAccess()

const isDrawerPoliticasOpen = ref(false)
const isDrawerCuentasOpen = ref(false)
const isDrawerContactosOpen = ref(false)

onMounted(() => {
  if (puedeConfigurar.value) {
    cargarPoliticas()
    cargarCuentas()
    if (contactos.value.length === 0) cargarContactos()
  }
})
</script>
