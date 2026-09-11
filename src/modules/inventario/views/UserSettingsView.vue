<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 space-y-4">
      <VolverButton
        to="/inventario"
        title="Volver"
        class="shrink-0 self-start"
      />
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Configuración de Usuario</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Parámetros legacy (marca, bodegas, realiza conteo). Los almacenes del combo se filtran por la marca del usuario editado.
        </p>
      </div>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-gray-600 dark:text-gray-300">
      Cargando configuración...
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
      {{ error }}
    </div>

    <form v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6" @submit.prevent="save">
      <div v-if="successMessage" class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
        {{ successMessage }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</span>
          <input v-model="form.userName" class="mt-1 input" required />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Perfil</span>
          <input v-model.number="form.profileId" type="number" class="mt-1 input" required />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Artículos a contar</span>
          <input v-model.number="form.itemsToCount" type="number" min="0" class="mt-1 input" required />
        </label>
      </div>

      <div class="flex items-center gap-3">
        <input id="random-count" v-model="form.performsRandomCount" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600" />
        <label for="random-count" class="text-sm text-gray-700 dark:text-gray-300">Realiza conteo (requerido para ejecutar inventarios, salvo admin)</label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WarehouseSelect label="Almacén cierre" :warehouses="warehouses" :value="form.cashClosingWarehouseId" @update:value="form.cashClosingWarehouseId = $event" />
        <WarehouseSelect label="Almacén inventario" :warehouses="warehouses" :value="form.inventoryWarehouseId" @update:value="form.inventoryWarehouseId = $event" />
        <WarehouseSelect label="Almacén bodega" :warehouses="warehouses" :value="form.bodegaWarehouseId" @update:value="form.bodegaWarehouseId = $event" />
        <WarehouseSelect label="Almacén transitorio" :warehouses="warehouses" :value="form.transitWarehouseId" @update:value="form.transitWarehouseId = $event" />
        <WarehouseSelect label="Centro distribución" :warehouses="warehouses" :value="form.distributionCenterWarehouseId" @update:value="form.distributionCenterWarehouseId = $event" />
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Marca</span>
          <input v-model="form.brand" class="mt-1 input" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Email tienda</span>
          <input v-model="form.storeEmail" type="email" class="mt-1 input" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Email supervisor</span>
          <input v-model="form.supervisorEmail" type="email" class="mt-1 input" />
        </label>
      </div>

      <div class="flex justify-end">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import VolverButton from '@/components/VolverButton.vue'
import { inventarioService } from '../services/inventarioApi'
import type { UpdateUserSettingsRequest, WarehouseDto } from '../types'

const route = useRoute()
const userId = computed(() => Number(route.params.id || 330))
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const warehouses = ref<WarehouseDto[]>([])

const form = reactive<UpdateUserSettingsRequest>({
  userName: '',
  profileId: 0,
  performsRandomCount: false,
  itemsToCount: 0,
  cashClosingWarehouseId: null,
  inventoryWarehouseId: null,
  bodegaWarehouseId: null,
  transitWarehouseId: null,
  distributionCenterWarehouseId: null,
  brand: '',
  storeEmail: '',
  supervisorEmail: ''
})

const WarehouseSelect = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number as PropType<number | null | undefined>, default: null },
    warehouses: { type: Array as () => WarehouseDto[], required: true }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => h('label', { class: 'block' }, [
      h('span', { class: 'text-sm font-medium text-gray-700 dark:text-gray-300' }, props.label),
      h('select', {
        class: 'mt-1 input',
        value: props.value ?? '',
        onChange: (event: Event) => {
          const value = (event.target as HTMLSelectElement).value
          emit('update:value', value ? Number(value) : null)
        }
      }, [
        h('option', { value: '' }, 'Sin asignar'),
        ...props.warehouses.map(warehouse => h('option', { value: warehouse.id }, warehouse.display_name || `${warehouse.code} ${warehouse.name}`))
      ])
    ])
  }
})

function applyUser(data: Awaited<ReturnType<typeof inventarioService.getUserEditData>>) {
  warehouses.value = data.warehouses
  form.userName = data.user.username
  form.profileId = data.user.perfil
  form.performsRandomCount = data.user.realiza_conteo
  form.itemsToCount = data.user.articulos_contar
  form.cashClosingWarehouseId = data.user.fk_id_almacen_cierre ?? null
  form.inventoryWarehouseId = data.user.fk_id_almacen_invs ?? null
  form.bodegaWarehouseId = data.user.fk_id_almacen_bodeg ?? null
  form.transitWarehouseId = data.user.fk_id_almacen_transitorio ?? null
  form.distributionCenterWarehouseId = data.user.fk_id_almacen_cd ?? null
  form.brand = data.user.marca ?? ''
  form.storeEmail = data.user.email ?? ''
  form.supervisorEmail = data.user.email_super ?? ''
}

async function load() {
  loading.value = true
  error.value = null
  try {
    applyUser(await inventarioService.getUserEditData(userId.value))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la configuración del usuario.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = null
  successMessage.value = null
  try {
    await inventarioService.updateUserSettings(userId.value, form)
    successMessage.value = 'Configuración actualizada correctamente.'
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la configuración.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.input {
  @apply block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed;
}
</style>
