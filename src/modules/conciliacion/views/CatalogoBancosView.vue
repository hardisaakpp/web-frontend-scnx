<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
            <span class="text-gray-400 dark:text-gray-500">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Catálogo de Bancos</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Catálogo de Bancos</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure cómo se lee el Excel de cada banco para la importación de movimientos</p>
        </div>
        <button
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.catalogo')"
          @click="abrirCrear"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Nuevo banco
        </button>
      </div>

      <!-- Tabla -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table v-if="store.catalogoBancos.length > 0" class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código cuenta SAP</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre Excel</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Formato fecha</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr v-for="banco in store.catalogoBancos" :key="banco.id_banco" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{{ banco.nombre_banco }}</td>
                <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{{ banco.codigo_cuenta_sap }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ banco.nombre_excel || '—' }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{{ banco.config_mapeo?.formato_fecha || '—' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="banco.activo
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'"
                  >
                    {{ banco.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.catalogo')" class="flex justify-end gap-3">
                    <button @click="abrirEditar(banco)" class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Editar</button>
                    <button
                      v-if="banco.activo"
                      @click="pedirDesactivar(banco)"
                      class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Desactivar
                    </button>
                    <button
                      v-else
                      @click="activar(banco)"
                      class="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Activar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>No hay bancos registrados en el catálogo</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <BancoFormModal
      v-if="mostrarFormulario"
      :banco="bancoEditando"
      :guardando="guardando"
      @close="mostrarFormulario = false"
      @submit="handleSubmitBanco"
    />

    <!-- Confirmación de desactivación -->
    <ConfirmModal
      :open="bancoADesactivar !== null"
      title="Desactivar banco"
      :message="`¿Desactivar '${bancoADesactivar?.nombre_banco}'? Ya no aparecerá para seleccionar en la carga de Excel, pero se conserva el historial de movimientos ya importados. Puede reactivarlo luego.`"
      confirm-label="Desactivar"
      @confirm="confirmarDesactivar"
      @cancel="bancoADesactivar = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BancoFormModal from '../components/BancoFormModal.vue'
import ConfirmModal from '@/components/modales/ConfirmModal.vue'
import type { Banco, BancoCatalogoCreate, BancoCatalogoUpdate } from '../types'

const store = useConciliacionStore()
const authStore = useAuthStore()
const toast = useToast()

const mostrarFormulario = ref(false)
const bancoEditando = ref<Banco | null>(null)
const bancoADesactivar = ref<Banco | null>(null)
const guardando = ref(false)

onMounted(async () => {
  try {
    await store.fetchCatalogoBancos()
  } catch {
    // manejado por el store
  }
})

function abrirCrear() {
  bancoEditando.value = null
  mostrarFormulario.value = true
}

function abrirEditar(banco: Banco) {
  bancoEditando.value = banco
  mostrarFormulario.value = true
}

function pedirDesactivar(banco: Banco) {
  bancoADesactivar.value = banco
}

async function confirmarDesactivar() {
  if (!bancoADesactivar.value) return
  const banco = bancoADesactivar.value
  bancoADesactivar.value = null
  try {
    const result = await store.eliminarBanco(banco.id_banco)
    toast.success('Banco desactivado', result.message ?? undefined)
  } catch (e: any) {
    toast.error('Error al desactivar', e.response?.data?.message || e.response?.data?.detail || e.message)
  }
}

async function activar(banco: Banco) {
  try {
    const result = await store.actualizarBanco(banco.id_banco, { activo: true })
    toast.success('Banco activado', result.message ?? undefined)
  } catch (e: any) {
    toast.error('Error al activar', e.response?.data?.message || e.response?.data?.detail || e.message)
  }
}

async function handleSubmitBanco(payload: BancoCatalogoCreate | BancoCatalogoUpdate) {
  guardando.value = true
  try {
    const result = bancoEditando.value
      ? await store.actualizarBanco(bancoEditando.value.id_banco, payload)
      : await store.crearBanco(payload as BancoCatalogoCreate)
    toast.success(bancoEditando.value ? 'Banco actualizado' : 'Banco creado', result.message ?? undefined)
    mostrarFormulario.value = false
  } catch (e: any) {
    toast.error('Error al guardar', e.response?.data?.message || e.response?.data?.detail || e.message)
  } finally {
    guardando.value = false
  }
}
</script>
