<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="$emit('cancelar')"
    >
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Reserva</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete los datos para reservar la transacción.</p>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4" v-if="transaccion">
          <!-- Detalles solo lectura -->
          <div class="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-72 overflow-y-auto">
            <!-- Monto destacado -->
            <div class="col-span-2 text-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Monto</span>
              <p class="text-3xl font-bold mt-0.5" :class="transaccion.signo === 'C' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                {{ transaccion.signo === 'C' ? '+' : '-' }}{{ formatMonto(transaccion.valorMontoTotal) }}
              </p>
            </div>
            <!-- Referencia -->
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Referencia</span>
              <p class="font-mono font-medium text-gray-900 dark:text-white truncate">{{ transaccion.referenciaTransaccion }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Referencia 2</span>
              <p class="font-mono text-gray-700 dark:text-gray-300 truncate">{{ transaccion.referenciaTransaccion2 || '—' }}</p>
            </div>
            <!-- Tipo y Estado -->
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Tipo</span>
              <p class="text-gray-900 dark:text-white">{{ transaccion.tipoTransaccion || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Estado</span>
              <p class="text-gray-900 dark:text-white">{{ transaccion.estado }}</p>
            </div>
            <!-- Fechas -->
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Fecha Proceso</span>
              <p class="text-gray-900 dark:text-white">{{ formatFecha(transaccion.fechaProceso) }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Fecha Ingreso</span>
              <p class="text-gray-900 dark:text-white">{{ formatFecha(transaccion.fechaIngreso) }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Fecha Mod.</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.fechaModificacion ? formatFecha(transaccion.fechaModificacion) : '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Almacén</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.codigoAlmacen || '—' }}</p>
            </div>
            <!-- Descripciones -->
            <div class="col-span-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">Descripción</span>
              <p class="text-gray-900 dark:text-white">{{ transaccion.descripcionTransaccion || '—' }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">Causal</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.descripcionCausal || '—' }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">Transferencia</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.descripcionTransferencia || '—' }}</p>
            </div>
            <!-- Nombres -->
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Oficina</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.nombreOficina || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Beneficiario</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.nombreBeneficiario || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Establecimiento</span>
              <p class="text-gray-700 dark:text-gray-300">{{ transaccion.nombreEstablecimiento || '—' }}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Cód. Reverso</span>
              <p class="font-mono text-gray-700 dark:text-gray-300">{{ transaccion.codigoReverso || '—' }}</p>
            </div>
          </div>

          <!-- Campos que llena el cajero -->
          <div class="space-y-3">
            <div class="flex flex-col gap-1">
              <label for="codVendedorLocal" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Código de Vendedor <span class="text-red-500">*</span>
              </label>
              <input
                id="codVendedorLocal"
                v-model="codVendedorLocal"
                type="text"
                placeholder="Ingrese su código de vendedor"
                :disabled="cargando"
                class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                :class="!codVendedorLocal.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="tiendaSeleccionada" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tienda <span class="text-red-500">*</span>
              </label>
              <select
                id="tiendaSeleccionada"
                v-model="tiendaSeleccionada"
                :disabled="cargando"
                class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                :class="!tiendaSeleccionada ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'"
              >
                <option value="">Seleccione una tienda</option>
                <option v-for="t in tiendas" :key="t.codigo" :value="t.codigo">
                  {{ t.nombre }} ({{ t.codigo }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            @click="$emit('cancelar')"
            :disabled="cargando"
            class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="confirmar"
            :disabled="cargando || !formularioValido"
            class="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ cargando ? 'Reservando...' : 'Confirmar Reserva' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import type { Transaccion } from '../types'

export interface OpcionTienda {
  codigo: string
  nombre: string
}

const props = defineProps<{
  visible: boolean
  transaccion: Transaccion | null
  tiendas: OpcionTienda[]
  cargando: boolean
  codAlmacenDefault?: string
}>()

const emit = defineEmits<{
  (e: 'confirmar', data: { codVendedor: string; codigoAlmacen: string; nombreAlmacen: string }): void
  (e: 'cancelar'): void
}>()

const codVendedorLocal = ref('')
const tiendaSeleccionada = ref('')

watch(() => props.visible, (visible) => {
  if (visible) {
    tiendaSeleccionada.value = props.codAlmacenDefault ?? ''
  } else {
    codVendedorLocal.value = ''
    tiendaSeleccionada.value = ''
  }
})

const formularioValido = computed(() =>
  codVendedorLocal.value.trim() !== '' && tiendaSeleccionada.value !== ''
)

function confirmar() {
  if (!formularioValido.value) return
  const tienda = props.tiendas.find(t => t.codigo === tiendaSeleccionada.value)
  emit('confirmar', {
    codVendedor: codVendedorLocal.value.trim(),
    codigoAlmacen: tiendaSeleccionada.value,
    nombreAlmacen: tienda?.nombre ?? tiendaSeleccionada.value,
  })
}

function formatMonto(valor: number): string {
  return new Intl.NumberFormat('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)
}

function formatFecha(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
