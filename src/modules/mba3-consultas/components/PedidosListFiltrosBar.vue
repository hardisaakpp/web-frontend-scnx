<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div
      @click="collapsed = !collapsed"
      class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filtros de Búsqueda</h2>
        <svg
          :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200', collapsed ? '' : 'rotate-180']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <div v-show="!collapsed" class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <!-- Estado: slot completo (label + control) -- el default es el <select> que usan 3 de los
             4 listados; RevisarRedistribucionListadoView.vue no filtra por estado individual y
             sobreescribe este slot con su propio texto informativo. -->
        <slot name="estado-field">
          <div>
            <label
              :for="estadoSelectId"
              title="Filtra los pedidos por su estado actual dentro del flujo (ej. Pendiente Confirmación, Confirmado Proveedor)"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Estado
            </label>
            <select
              :id="estadoSelectId"
              v-model="estado"
              @keyup.enter="emit('aplicar')"
              @change="emit('estado-change'); emit('aplicar')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option
                v-for="opt in estadosDisponibles"
                :key="opt.id"
                :value="opt.nombre"
              >
                {{ getEstadoPedidoLabel(opt.nombre) }}
              </option>
            </select>
          </div>
        </slot>

        <!-- Fecha -->
        <div>
          <label
            :for="fechaFiltroId"
            title="Filtra por rango de fechas; elige si se busca por fecha del pedido, de creación, de modificación, de entrega o de facturación"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Fecha
          </label>
          <AppDateFilterInput
            :id="fechaFiltroId"
            v-model:tipo="tipoFecha"
            v-model:desde="fechaDesde"
            v-model:hasta="fechaHasta"
            @change="emit('aplicar')"
            @keyup.enter="emit('aplicar')"
          />
        </div>

        <!-- Proveedor (oculto temporalmente vía MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS, mismo flag global
             que usan hoy los 4 listados -- no es una decisión de esta barra, es un feature flag
             compartido) -->
        <div v-if="MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS">
          <label :for="proveedorInputId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Proveedor
          </label>
          <input
            :id="proveedorInputId"
            type="text"
            v-model="proveedorNombre"
            @keyup.enter="emit('aplicar')"
            placeholder="Buscar por nombre de proveedor..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
          />
        </div>

        <!-- Número de Pedido (filtra en vivo con debounce) -->
        <div>
          <label
            :for="numeroPedidoInputId"
            title="Busca por el número de pedido; se aplica automáticamente mientras escribes"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Número de Pedido
          </label>
          <DebouncedSearchField
            :id="numeroPedidoInputId"
            v-model="numeroPedidoTexto"
            :placeholder="numeroPedidoPlaceholder"
            @input="emit('numero-pedido-input')"
            @keyup-enter="emit('numero-pedido-commit')"
            @clear="emit('numero-pedido-clear')"
          />
        </div>

        <!-- Creado Por: usuario que creó el pedido (fijo desde la creación, no cambia) -->
        <div>
          <label
            :for="creadoPorSelectId"
            title="Filtra por el usuario que creó el pedido"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Creado Por
          </label>
          <select
            :id="creadoPorSelectId"
            v-model="creadoPor"
            @change="emit('aplicar')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm cursor-pointer"
          >
            <option value="">Todos</option>
            <option v-for="usuario in creadoresDisponibles" :key="usuario" :value="usuario">{{ usuario }}</option>
          </select>
        </div>

        <!-- Modificado Por: usuario de la última modificación (puede cambiar con el tiempo, distinto de Creado Por) -->
        <div>
          <label
            :for="modificadoPorSelectId"
            title="Filtra por el usuario que hizo la última modificación al pedido"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Modificado Por
          </label>
          <select
            :id="modificadoPorSelectId"
            v-model="modificadoPor"
            @change="emit('aplicar')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm cursor-pointer"
          >
            <option value="">Todos</option>
            <option v-for="usuario in modificadoresDisponibles" :key="usuario" :value="usuario">{{ usuario }}</option>
          </select>
        </div>

        <!-- Acción: todos los filtros de arriba se aplican solos (auto-apply/debounce/Enter/change); solo
             queda limpiar -->
        <div class="flex items-end gap-2">
          <button
            @click="emit('limpiar')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Barra de filtros de los 4 listados de pedidos del módulo (PedidosListView.vue,
 * CargarPlantillaListadoView.vue, RedistribucionListadoView.vue, RevisarRedistribucionListadoView.vue):
 * contenedor colapsable "Filtros de Búsqueda" + grid de campos (Estado, Fecha, Proveedor, Número de
 * Pedido, Creado Por, Modificado Por, Limpiar).
 *
 * El filtro rápido "Solo pedidos que requieren acción" NO vive aquí -- cada vista lo resuelve con su
 * propio botón en la cabecera (junto al contador "N pedidos requieren acción"), que alterna
 * directamente su propio `filtroSoloPendientes` local y llama a `aplicarFiltroPendientes()`. Antes
 * era un checkbox (y luego un botón) dentro de esta barra; se movió a la cabecera para no duplicar
 * el mismo control dos veces en la misma pantalla.
 *
 * Creado Por / Modificado Por son <select> (no texto libre): alimentados por `creadoresDisponibles`/
 * `modificadoresDisponibles`, listas de valores DISTINCT que cada vista resuelve contra
 * GET /api/pedidos/creadores y GET /api/pedidos/modificadores respectivamente -- mismo criterio que
 * `estadosDisponibles`. Antes "Creado Por" era texto libre con debounce; se cambió a selector porque
 * el usuario no tenía forma de saber qué escribir (el campo guarda email/username exacto, ver
 * src/utils/audit_context.py del backend) ni de distinguirlo de "Modificado Por".
 *
 * PURO shell de UI -- no decide qué estados mostrar (estadosDisponibles llega siempre por prop,
 * ya resuelto por cada vista contra su propio endpoint) ni cuándo disparar la búsqueda al backend
 * (emite `aplicar`/`limpiar`/eventos de debounce; cada vista conecta esos eventos a su propia
 * `aplicarFiltros()`/`limpiarFiltros()`/composable de debounce, tal como hace hoy).
 *
 * Estado colapsado/expandido (`collapsed`) es 100% interno: ninguno de los 4 listados actuales lo
 * lee ni lo controla desde fuera de su propio template, así que no hace falta exponerlo como
 * v-model. Si algún consumidor futuro necesita controlarlo desde afuera, se puede añadir después
 * sin romper a los actuales (un defineModel con default `true` no cambia el comportamiento de nadie
 * que no lo use).
 *
 * ASIMETRÍAS REALES cubiertas, sin forzar comportamiento nuevo en ningún consumidor:
 * - slot `estado-field`: el default (un <select> alimentado por `estadosDisponibles`) cubre a los
 *   3 listados que sí filtran por estado. RevisarRedistribucionListadoView reemplaza el slot
 *   completo por su propio párrafo informativo ("Estados incluidos") -- no es un <select> siquiera,
 *   así que no se puede resolver con una prop dentro del <select> por defecto.
 * - Proveedor: controlado por el feature flag global MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS (mismo import
 *   que ya usan los 4 listados), no por una prop -- es un toggle compartido, no una decisión por vista.
 */
import AppDateFilterInput from './AppDateFilterInput.vue'
import DebouncedSearchField from './DebouncedSearchField.vue'
import { getEstadoPedidoLabel } from '../utils/estadoPedido'
import { MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS } from '../config/featureFlags'
import type { EstadoPedidoOption, TipoFechaFiltro } from '../types'
import { ref } from '@vue/reactivity'
import { useId } from 'vue'

const estadoSelectId = useId()
const fechaFiltroId = useId()
const proveedorInputId = useId()
const numeroPedidoInputId = useId()
const creadoPorSelectId = useId()
const modificadoPorSelectId = useId()

withDefaults(
  defineProps<{
    /** Opciones del <select> de Estado (slot por defecto). Siempre resuelta por la vista contra su
     * propio endpoint -- este componente nunca decide qué estados existen. */
    estadosDisponibles: EstadoPedidoOption[]
    /** Opciones del <select> de "Creado Por": valores distintos de creado_por que existen en la
     * base de datos, resueltos por la vista contra GET /api/pedidos/creadores. */
    creadoresDisponibles?: string[]
    /** Opciones del <select> de "Modificado Por": valores distintos de modificado_por que existen
     * en la base de datos, resueltos por la vista contra GET /api/pedidos/modificadores. */
    modificadoresDisponibles?: string[]
    /** Placeholder del input "Número de Pedido". Default 'Buscar por número de pedido...' (el de 3
     * de los 4 listados); CargarPlantillaListadoView pasa el suyo con ejemplo ('...ej: P-12.08'). */
    numeroPedidoPlaceholder?: string
  }>(),
  {
    creadoresDisponibles: () => [],
    modificadoresDisponibles: () => [],
    numeroPedidoPlaceholder: 'Buscar por número de pedido...'
  }
)

const emit = defineEmits<{
  /** Disparar la búsqueda con los filtros actuales (Estado @change/Enter, Fecha @change/Enter,
   * Proveedor Enter, Creado Por @change, Modificado Por @change) -- conectar a `aplicarFiltros` de
   * la vista. NO se emite para Número de Pedido (ese ya dispara solo vía su propio composable de
   * debounce, ver los eventos `numero-pedido-*`). */
  aplicar: []
  /** Clic en "Limpiar" -- conectar a `limpiarFiltros` de la vista. */
  limpiar: []
  /** El <select> de Estado cambió, ANTES de `aplicar` -- conectar a `actualizarFiltroPendientes`
   * (o equivalente) si la vista necesita reaccionar al cambio de estado antes de recargar. */
  'estado-change': []
  /** Passthrough de los eventos de DebouncedSearchField para "Número de Pedido" -- conectar
   * directo a `handleInput`/`commit`/`clear` del useDebouncedFilterInput de la vista. */
  'numero-pedido-input': []
  'numero-pedido-commit': []
  'numero-pedido-clear': []
}>()

const estado = defineModel<string>('estado', { default: '' })
const tipoFecha = defineModel<TipoFechaFiltro | undefined>('tipoFecha', { default: 'pedido' })
const fechaDesde = defineModel<string | null | undefined>('fechaDesde', { default: '' })
const fechaHasta = defineModel<string | null | undefined>('fechaHasta', { default: '' })
const proveedorNombre = defineModel<string>('proveedorNombre', { default: '' })
const numeroPedidoTexto = defineModel<string>('numeroPedidoTexto', { default: '' })
const creadoPor = defineModel<string>('creadoPor', { default: '' })
const modificadoPor = defineModel<string>('modificadoPor', { default: '' })

/** Colapsado por defecto, igual que `filtrosColapsados` en los 4 listados hoy. 100% interno, ver
 * comentario de archivo. */
const collapsed = ref(true)
</script>
