<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-in-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in-out duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" @click="cerrar"></div>
    </Transition>

    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isOpen"
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-cuentas-title"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-3xl sm:max-w-4xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
        @keydown="onKeydown"
      >
        <!-- Cabecera fija -->
        <header class="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 flex-shrink-0">
          <div class="min-w-0">
            <h2 id="drawer-cuentas-title" class="text-lg font-bold text-white truncate">
              Cuentas Financieras — Mabel Trading
            </h2>
            <p class="mt-0.5 text-xs text-slate-400">
              Active o desactive cuentas para tiendas sin afectar el histórico
            </p>
          </div>
          <button
            ref="botonCerrarRef"
            type="button"
            aria-label="Cerrar panel"
            class="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <!-- Barra de herramientas: buscador + filtro rápido -->
        <div class="flex flex-col gap-3 border-b border-slate-800 px-5 py-3 flex-shrink-0 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar por nombre, código SAP o formato…"
              aria-label="Buscar cuenta financiera"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div role="radiogroup" aria-label="Filtro por estado" class="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 p-1">
            <button
              v-for="opcion in FILTROS_ESTADO"
              :key="opcion.value"
              type="button"
              role="radio"
              :aria-checked="filtroEstado === opcion.value"
              :class="filtroEstado === opcion.value ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'"
              class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              @click="filtroEstado = opcion.value"
            >
              {{ opcion.label }}
            </button>
          </div>
        </div>

        <!-- Cuerpo desplazable -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div v-if="cargando" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-10 rounded-lg bg-slate-800/60 animate-pulse"></div>
          </div>

          <div v-else-if="cuentasFiltradas.length === 0" class="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
            <BuildingLibraryIcon class="h-8 w-8 text-slate-600" aria-hidden="true" />
            <p class="font-medium">No hay cuentas que coincidan con la búsqueda o el filtro.</p>
          </div>

          <div v-else class="overflow-x-auto rounded-lg border border-slate-800">
            <table class="min-w-full divide-y divide-slate-800 text-sm">
              <caption class="sr-only">Cuentas financieras de Mabel Trading</caption>
              <thead class="bg-slate-800/60">
                <tr>
                  <th scope="col" class="px-3 py-2.5 text-left font-semibold text-slate-300">AcctCode</th>
                  <th scope="col" class="px-3 py-2.5 text-left font-semibold text-slate-300">AcctName</th>
                  <th scope="col" class="px-3 py-2.5 text-left font-semibold text-slate-300">FormatCode</th>
                  <th scope="col" class="px-3 py-2.5 text-center font-semibold text-slate-300">Para depósitos</th>
                  <th scope="col" class="px-3 py-2.5 text-center font-semibold text-slate-300">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr v-for="cuenta in cuentasFiltradas" :key="cuenta.id">
                  <td class="px-3 py-2.5 font-mono text-xs text-slate-300">{{ cuenta.codigoCuentaSAP }}</td>
                  <td class="px-3 py-2.5 font-medium text-white">{{ cuenta.nombreCuenta }}</td>
                  <td class="px-3 py-2.5 text-slate-300">{{ cuenta.codigoFormateado }}</td>
                  <td class="px-3 py-2.5">
                    <label class="flex items-center justify-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="cuenta.habilitadaParaTiendas"
                        :disabled="actualizandoIds.has(cuenta.id)"
                        aria-label="Habilitada para depósitos de tiendas"
                        class="h-5 w-5 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        @change="actualizarEstado(cuenta, { activa: cuenta.activa, habilitadaParaTiendas: ($event.target as HTMLInputElement).checked })"
                      />
                      <span class="text-xs font-medium text-slate-300">{{ cuenta.habilitadaParaTiendas ? 'Visible' : 'Oculta' }}</span>
                    </label>
                  </td>
                  <td class="px-3 py-2.5">
                    <label class="flex items-center justify-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="cuenta.activa"
                        :disabled="actualizandoIds.has(cuenta.id)"
                        aria-label="Cuenta activa"
                        class="h-5 w-5 rounded border-slate-600 bg-slate-800 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        @change="actualizarEstado(cuenta, { habilitadaParaTiendas: cuenta.habilitadaParaTiendas, activa: ($event.target as HTMLInputElement).checked })"
                      />
                      <span class="text-xs font-semibold" :class="cuenta.activa ? 'text-emerald-400' : 'text-slate-500'">
                        {{ cuenta.activa ? 'Activa' : 'Inactiva' }}
                      </span>
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pie fijo -->
        <footer class="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/95 px-5 py-3.5 flex-shrink-0">
          <p class="text-xs text-slate-400">
            <strong class="text-slate-200">{{ cuentasFiltradas.length }}</strong> de {{ cuentas.length }} cuenta(s) mostrada(s)
          </p>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cerrar <span class="text-slate-500">(Esc)</span>
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch } from 'vue'
import { BuildingLibraryIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'
import { useCuentasFinancieras, type FiltroEstadoCuenta } from '../composables/useCuentasFinancieras'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const {
  cuentas, cuentasFiltradas, cargando, actualizandoIds, busqueda, filtroEstado, actualizarEstado
} = useCuentasFinancieras()

const FILTROS_ESTADO: Array<{ value: FiltroEstadoCuenta; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'activas', label: 'Solo activas' },
  { value: 'paraTiendas', label: 'Solo para tiendas' }
]

const dialogRef = ref<HTMLElement | null>(null)
const botonCerrarRef = ref<HTMLButtonElement | null>(null)

function cerrar(): void {
  emit('close')
}

const { onKeydown } = useModalFocusTrap(dialogRef, botonCerrarRef, toRef(props, 'isOpen'), cerrar)

watch(
  () => props.isOpen,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
