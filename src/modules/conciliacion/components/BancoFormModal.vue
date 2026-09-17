<template>
  <Teleport to="body">
    <dialog
      ref="modalRef"
      aria-labelledby="banco-form-modal-title"
      class="banco-form-modal-dialog relative p-0 m-auto border-0 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      @cancel.prevent="cerrarModal"
      @click="onBackdropClick"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h3 id="banco-form-modal-title" class="text-lg font-semibold text-white">
            {{ esEdicion ? `Editar banco — ${banco?.nombre_banco}` : 'Nuevo banco' }}
          </h3>
          <button type="button" @click="cerrarModal" class="text-white hover:text-gray-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 overflow-y-auto flex-1 space-y-6">
        <!-- Datos generales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="banco-nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del banco <span class="text-red-500">*</span>
            </label>
            <input
              id="banco-nombre"
              v-model="form.nombre_banco"
              type="text"
              placeholder="PRODUBANCO"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label for="banco-codigo-sap" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código cuenta SAP <span class="text-red-500">*</span>
            </label>
            <input
              id="banco-codigo-sap"
              v-model="form.codigo_cuenta_sap"
              type="text"
              placeholder="1.01.01.04"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label for="banco-nombre-excel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Excel (opcional)</label>
            <input
              id="banco-nombre-excel"
              v-model="form.nombre_excel"
              type="text"
              placeholder="Igual al nombre del banco si se deja vacío"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex items-end pb-2">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="form.activo" type="checkbox" class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
              Banco activo
            </label>
          </div>
        </div>

        <!-- Lectura del Excel -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Lectura del archivo Excel</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="banco-formato-fecha" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Formato de fecha <span class="text-red-500">*</span>
              </label>
              <input
                id="banco-formato-fecha"
                v-model="form.formato_fecha"
                type="text"
                placeholder="%d/%m/%Y"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Patrón Python, ej. %d/%m/%Y o %m/%d/%Y %I:%M:%S %p</p>
            </div>
            <div>
              <label for="banco-fila-header" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fila de encabezado</label>
              <input
                id="banco-fila-header"
                v-model.number="form.fila_header"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Filas a saltar antes del encabezado real (metadata)</p>
            </div>
          </div>
        </div>

        <!-- Mapeo de columnas -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Mapeo de columnas</h4>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">Nombre exacto de la columna en el Excel del banco (no distingue mayúsculas ni tildes).</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="campo in campoColumnas" :key="campo.key">
              <label :for="`banco-campo-${campo.key}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ campo.label }} <span v-if="campo.requerido" class="text-red-500">*</span>
              </label>
              <input
                :id="`banco-campo-${campo.key}`"
                v-model="form.columnas[campo.key]"
                type="text"
                :placeholder="campo.placeholder"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p v-if="campo.ayuda" class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ campo.ayuda }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          @click="cerrarModal"
          class="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="!canSave || guardando"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
        >
          <div v-if="guardando" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          {{ guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear banco' }}
        </button>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Banco, BancoCatalogoCreate, BancoCatalogoUpdate, BancoColumnasMapeo } from '../types'

const props = defineProps<{
  banco: Banco | null
  guardando: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: BancoCatalogoCreate | BancoCatalogoUpdate]
}>()

const modalRef = ref<HTMLDialogElement | null>(null)
const esEdicion = computed(() => props.banco !== null)

interface FormState {
  nombre_banco: string
  codigo_cuenta_sap: string
  nombre_excel: string
  activo: boolean
  formato_fecha: string
  fila_header: number | null
  columnas: Record<keyof BancoColumnasMapeo, string>
}

function estadoVacio(): FormState {
  return {
    nombre_banco: '',
    codigo_cuenta_sap: '',
    nombre_excel: '',
    activo: true,
    formato_fecha: '',
    fila_header: null,
    columnas: {
      fecha: '',
      monto: '',
      tipo_movimiento: '',
      referencia1: '',
      referencia2: '',
      ref_bol: '',
      oficina: '',
      cod_transaccion: '',
      descripcion: '',
      saldo_banco: '',
    },
  }
}

const form = ref<FormState>(estadoVacio())

const campoColumnas: Array<{ key: keyof BancoColumnasMapeo; label: string; requerido?: boolean; placeholder?: string; ayuda?: string }> = [
  { key: 'fecha', label: 'Fecha', requerido: true, placeholder: 'FECHA' },
  { key: 'monto', label: 'Monto', requerido: true, placeholder: 'VALOR' },
  { key: 'tipo_movimiento', label: 'Tipo de movimiento', placeholder: 'TIPO' },
  { key: 'referencia1', label: 'Referencia 1', placeholder: 'REFERENCIA' },
  { key: 'referencia2', label: 'Referencia 2', placeholder: 'REFERENCIA2' },
  { key: 'ref_bol', label: 'Referencia Bolivariano', ayuda: 'Solo aplica al banco Bolivariano' },
  { key: 'oficina', label: 'Oficina', placeholder: 'OFICINA' },
  { key: 'cod_transaccion', label: 'Código de transacción', placeholder: 'COD TRANSACCION' },
  { key: 'descripcion', label: 'Descripción', placeholder: 'DESCRIPCION' },
  { key: 'saldo_banco', label: 'Saldo banco', placeholder: 'SALDO CONTABLE' },
]

const canSave = computed(() =>
  form.value.nombre_banco.trim() !== '' &&
  form.value.codigo_cuenta_sap.trim() !== '' &&
  form.value.formato_fecha.trim() !== '' &&
  form.value.columnas.fecha.trim() !== '' &&
  form.value.columnas.monto.trim() !== '',
)

watch(
  () => props.banco,
  (banco) => {
    if (!banco) {
      form.value = estadoVacio()
      return
    }
    const columnas = banco.config_mapeo?.columnas
    form.value = {
      nombre_banco: banco.nombre_banco,
      codigo_cuenta_sap: banco.codigo_cuenta_sap,
      nombre_excel: banco.nombre_excel ?? '',
      activo: banco.activo ?? true,
      formato_fecha: banco.config_mapeo?.formato_fecha ?? '',
      fila_header: banco.config_mapeo?.fila_header ?? null,
      columnas: {
        fecha: columnas?.fecha ?? '',
        monto: columnas?.monto ?? '',
        tipo_movimiento: columnas?.tipo_movimiento ?? '',
        referencia1: columnas?.referencia1 ?? '',
        referencia2: columnas?.referencia2 ?? '',
        ref_bol: columnas?.ref_bol ?? '',
        oficina: columnas?.oficina ?? '',
        cod_transaccion: columnas?.cod_transaccion ?? '',
        descripcion: columnas?.descripcion ?? '',
        saldo_banco: columnas?.saldo_banco ?? '',
      },
    }
  },
  { immediate: true },
)

onMounted(() => {
  modalRef.value?.showModal()
})

function cerrarModal(): void {
  modalRef.value?.close()
  emit('close')
}

function onBackdropClick(evento: MouseEvent): void {
  if (evento.target === modalRef.value) cerrarModal()
}

function handleSubmit(): void {
  if (!canSave.value) return

  const columnas = Object.fromEntries(
    Object.entries(form.value.columnas).filter(([, valor]) => valor.trim() !== ''),
  ) as unknown as BancoColumnasMapeo

  const payload: BancoCatalogoCreate | BancoCatalogoUpdate = {
    nombre_banco: form.value.nombre_banco.trim(),
    codigo_cuenta_sap: form.value.codigo_cuenta_sap.trim(),
    nombre_excel: form.value.nombre_excel.trim() || null,
    activo: form.value.activo,
    config_mapeo: {
      columnas,
      formato_fecha: form.value.formato_fecha.trim(),
      fila_header: form.value.fila_header ?? undefined,
    },
  }

  emit('submit', payload)
}
</script>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear, por eso una clase específica sin scoped. */
.banco-form-modal-dialog::backdrop {
  background-color: rgb(100 116 139 / 0.75);
}
.dark .banco-form-modal-dialog::backdrop {
  background-color: rgb(15 23 42 / 0.8);
}
</style>
