<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import VolverButton from '@/components/VolverButton.vue'
import type { ImpactoStock } from '../../types'

const store = useAdminStore()

const campanaSeleccionadaId = ref<string | null>(null)

// La campaña Finalizada es un registro histórico de solo lectura (Regla de Oro): la matriz de
// stock por tienda no debe poder editarse ni por accidente, aunque el usuario todavía tenga la
// pestaña abierta desde antes de que la campaña finalizara.
const campanaSeleccionada = computed(() => store.campanas.find(c => c.id === campanaSeleccionadaId.value))
const campanaInmutable = computed(() => store.esCampanaInmutable(campanaSeleccionada.value))

onMounted(async () => {
  await store.cargarCampanas()
  if (store.campanaInventarioId) {
    campanaSeleccionadaId.value = store.campanaInventarioId
    await store.cargarInventario(store.campanaInventarioId)
  } else if (store.campanas.length > 0) {
    campanaSeleccionadaId.value = store.campanas[0].id
    await store.cargarInventario(store.campanas[0].id)
  }
})

async function onCampanaChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!id) return
  campanaSeleccionadaId.value = id
  await store.cargarInventario(id)
}

const stockTotal = computed(() => store.inventario.reduce((acc, p) => acc + p.stock_total, 0))
const stockAsignado = computed(() =>
  store.inventario.reduce((acc, p) => acc + store.totalAsignadoConEdits(p.premio_id), 0)
)
const stockDisponible = computed(() => stockTotal.value - stockAsignado.value)

function onCeldaChange(premioId: string, tiendaId: number, event: Event) {
  if (campanaInmutable.value) return
  const val = Number.parseInt((event.target as HTMLInputElement).value) || 0
  store.setCelda(premioId, tiendaId, val)
}

// Indicador visual por celda: gris neutro cuando no hay nada asignado, verde/azul sutil cuando
// sí hay stock repartido a esa tienda — así se distingue de un vistazo "sin asignar" de
// "asignado" sin tener que leer el número. filaExcedida() sigue teniendo prioridad (error real).
function claseCelda(item: { premio_id: string; stock_total: number }, tiendaId: number): string {
  const base = 'w-16 text-center px-2 py-1.5 rounded-lg border text-sm focus:outline-none transition-colors'

  if (filaExcedida(item))
    return `${base} border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500 text-red-700 dark:text-red-300 focus:border-red-500`

  if (campanaInmutable.value)
    return `${base} border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed`

  const valor = store.valorCelda(item.premio_id, tiendaId)
  if (valor > 0)
    return `${base} border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 focus:border-emerald-500`

  return `${base} border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 focus:border-indigo-500`
}

function tituloCelda(premioId: string, tiendaId: number): string {
  const valor = store.valorCelda(premioId, tiendaId)
  return valor > 0 ? `Asignado: ${valor} unid.` : 'Sin stock asignado'
}

function totalPorTienda(tiendaId: number): number {
  return store.inventario.reduce((acc, p) => acc + store.valorCelda(p.premio_id, tiendaId), 0)
}

const hayFilaExcedida = computed(() =>
  store.inventario.some(p => store.totalAsignadoConEdits(p.premio_id) > p.stock_total)
)

function filaExcedida(item: { premio_id: string; stock_total: number }): boolean {
  return store.totalAsignadoConEdits(item.premio_id) > item.stock_total
}

function nombreTienda(tiendaCodigo: string): string {
  return store.tiendasInventario.find(t => t.codigo === tiendaCodigo)?.nombre ?? tiendaCodigo
}

// ─── Confirmar antes de guardar si hay unidades que se desbloquean de inmediato ──
// La campaña Activa hace que el pacing recalcule "cuánto debería llevar entregado
// hasta hoy" con el stock nuevo — eso puede desbloquear unidades al instante, no
// gradualmente. Antes de guardar, se previsualiza el impacto para poder avisarle
// al admin y que decida si continuar (ver adminStore.previsualizarImpactoDistribucion).
const impactoPendiente = ref<ImpactoStock[] | null>(null)

async function onGuardarClick() {
  const impacto = await store.previsualizarImpactoDistribucion()
  if (impacto.length === 0) {
    await store.guardarDistribucion()
  } else {
    impactoPendiente.value = impacto
  }
}

function cancelarGuardadoConImpacto() {
  impactoPendiente.value = null
}

async function confirmarGuardadoConImpacto() {
  await store.guardarDistribucion()
  impactoPendiente.value = null
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Distribución de inventario</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Asigna el stock de premios por tienda.</p>
      </div>
      <!-- Selector campaña real -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Campaña:</span>
        <select
          :value="campanaSeleccionadaId"
          @change="onCampanaChange"
          :disabled="store.loadingCampanas"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60">
          <option value="" disabled>Selecciona una campaña</option>
          <option v-for="c in store.campanas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- Estado vacío: sin campañas -->
    <div v-if="!store.loadingCampanas && store.campanas.length === 0"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      No hay campañas disponibles.
    </div>

    <!-- Estado vacío: sin campaña seleccionada -->
    <div v-else-if="!campanaSeleccionadaId && !store.loadingInventario"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      Selecciona una campaña para ver el inventario.
    </div>

    <div v-else-if="store.loadingInventario" class="flex justify-center py-12">
      <div class="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>

    <template v-else-if="store.inventario.length > 0">

      <!-- Aviso: campaña finalizada, matriz de solo lectura -->
      <div v-if="campanaInmutable" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
        🔒 Campaña finalizada: el inventario es de solo lectura y no puede modificarse.
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">Stock total en bodega</p>
          <p class="mt-1 text-3xl font-bold text-gray-800 dark:text-white">{{ stockTotal.toLocaleString() }} <span class="text-base font-normal text-gray-400">unidades</span></p>
        </div>
        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-indigo-600 dark:text-indigo-400">Stock ya asignado</p>
          <p class="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-300">{{ stockAsignado.toLocaleString() }} <span class="text-base font-normal text-indigo-400">unidades</span></p>
        </div>
        <div :class="stockDisponible < 0
               ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40 hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-red-500/10'
               : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-emerald-500/10'"
             class="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <p :class="stockDisponible < 0 ? 'text-sm text-red-600 dark:text-red-400' : 'text-sm text-emerald-600 dark:text-emerald-400'">Disponible por asignar</p>
          <p :class="stockDisponible < 0 ? 'mt-1 text-3xl font-bold text-red-700 dark:text-red-300' : 'mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300'">
            {{ stockDisponible.toLocaleString() }}
            <span :class="stockDisponible < 0 ? 'text-base font-normal text-red-400' : 'text-base font-normal text-emerald-400'">unidades</span>
          </p>
          <span v-if="stockDisponible === 0"
                class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            ✅ Todo asignado
          </span>
          <span v-else
                class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="stockDisponible < 0
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'">
            ⚠️ {{ stockDisponible < 0 ? 'Excede el stock en bodega' : 'Unidades pendientes de asignar' }}
          </span>
        </div>
      </div>

      <!-- Tabla editable -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[160px]">Premio / Tipo</th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock total</th>
                <th v-for="t in store.tiendasInventario" :key="t.id"
                    class="px-3 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                  {{ t.nombre }}
                </th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total asignado</th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Restante bodega</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in store.inventario" :key="item.premio_id"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <td class="px-5 py-3.5">
                  <p class="font-medium text-gray-800 dark:text-gray-200">{{ item.nombre }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ item.tipo }}</p>
                </td>
                <td class="px-3 py-3.5 text-right text-gray-600 dark:text-gray-300">{{ item.stock_total }}</td>
                <td v-for="t in store.tiendasInventario" :key="t.id" class="px-3 py-3.5 text-center">
                  <input
                    type="number" min="0"
                    :value="store.valorCelda(item.premio_id, t.id)"
                    @change="onCeldaChange(item.premio_id, t.id, $event)"
                    :disabled="campanaInmutable"
                    :title="campanaInmutable ? 'Campaña finalizada: solo lectura' : tituloCelda(item.premio_id, t.id)"
                    :class="claseCelda(item, t.id)"
                  />
                </td>
                <td class="px-3 py-3.5 text-right font-medium text-gray-700 dark:text-gray-200">
                  {{ store.totalAsignadoConEdits(item.premio_id) }}
                </td>
                <td class="px-3 py-3.5 text-right font-semibold">
                  <span v-if="item.stock_total - store.totalAsignadoConEdits(item.premio_id) < 0"
                        class="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ item.stock_total - store.totalAsignadoConEdits(item.premio_id) }}
                  </span>
                  <span v-else-if="item.stock_total - store.totalAsignadoConEdits(item.premio_id) <= item.stock_total * 0.1"
                        class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ item.stock_total - store.totalAsignadoConEdits(item.premio_id) }}
                  </span>
                  <span v-else class="text-emerald-600 dark:text-emerald-400">
                    {{ item.stock_total - store.totalAsignadoConEdits(item.premio_id) }}
                  </span>
                </td>
              </tr>
              <!-- Fila totales por tienda -->
              <tr class="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                <td class="px-5 py-3.5 text-gray-700 dark:text-gray-200">Total por tienda</td>
                <td class="px-3 py-3.5 text-right text-gray-400">—</td>
                <td v-for="t in store.tiendasInventario" :key="t.id"
                    class="px-3 py-3.5 text-center text-gray-700 dark:text-gray-200">
                  {{ totalPorTienda(t.id) }}
                </td>
                <td class="px-3 py-3.5 text-right text-gray-700 dark:text-gray-200">{{ stockAsignado }}</td>
                <td class="px-3 py-3.5 text-right text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer acciones -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-xs text-gray-400 dark:text-gray-500">Los premios de relleno no consumen stock y no se muestran en esta tabla.</p>
          <p v-if="store.hayEdicionesPendientes" class="text-xs text-amber-600 dark:text-amber-400">Los cambios no se guardarán hasta presionar 'Guardar distribución'.</p>
          <p v-if="hayFilaExcedida" class="text-xs text-red-600 dark:text-red-400 font-medium">El stock asignado supera el stock total en uno o más premios. Corrige los valores para poder guardar.</p>
          <p v-if="store.errorInventario" class="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ store.errorInventario }}
          </p>
        </div>
        <div v-if="!campanaInmutable" class="flex gap-3 flex-shrink-0">
          <button
            type="button"
            @click="store.restablecerInventario()"
            :disabled="!store.hayEdicionesPendientes"
            class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
            Restablecer
          </button>
          <button
            type="button"
            @click="onGuardarClick"
            :disabled="!store.hayEdicionesPendientes || store.verificandoImpactoStock || store.guardando || hayFilaExcedida"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="store.guardando || store.verificandoImpactoStock" class="inline w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ store.verificandoImpactoStock ? 'Verificando…' : store.guardando ? 'Guardando…' : 'Guardar distribución' }}
          </button>
        </div>
      </div>

    </template>

    <!-- Sin premios para la campaña seleccionada -->
    <div v-else-if="campanaSeleccionadaId && !store.loadingInventario"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      Esta campaña no tiene premios con control de stock por tienda.
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL: IMPACTO EN EL PACING (campaña Activa)
    ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="impactoPendiente" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" @click.self="!store.guardando && cancelarGuardadoConImpacto()">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            appear
          >
            <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
              <div class="p-6 pb-4 text-center flex-shrink-0">
                <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                  <svg class="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Esta campaña está Activa</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Estos cambios aplican de inmediato para los clientes que estén girando ahora mismo:
                </p>
              </div>

              <!-- Lista de cambios: antes -> después -->
              <div class="px-6 pb-2 overflow-y-auto space-y-2">
                <div v-for="(item, idx) in impactoPendiente" :key="idx"
                     class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.premioNombre }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ nombreTienda(item.tiendaCodigo) }}</p>
                  </div>
                  <div class="flex-shrink-0 text-right text-sm">
                    <span class="text-gray-400 dark:text-gray-500">{{ item.disponibleHoyActual }}</span>
                    <span class="mx-1.5 text-gray-300 dark:text-gray-600">→</span>
                    <span :class="item.disponibleHoyNuevo > item.disponibleHoyActual ? 'font-bold text-amber-700 dark:text-amber-400' : 'font-bold text-gray-700 dark:text-gray-300'">
                      {{ item.disponibleHoyNuevo }}
                    </span>
                    <span class="block text-[11px] text-gray-400 dark:text-gray-500">disponibles hoy</span>
                  </div>
                </div>
              </div>

              <div class="px-6 pt-3 pb-1 flex-shrink-0">
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Si no quieres que esto pase ahora, puedes cancelar y guardar más tarde, o ajustar las cantidades.
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                <button
                  type="button"
                  @click="cancelarGuardadoConImpacto"
                  :disabled="store.guardando"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="confirmarGuardadoConImpacto"
                  :disabled="store.guardando"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  <svg v-if="store.guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ store.guardando ? 'Guardando…' : 'Sí, guardar cambios' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
