<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import { storeToRefs } from 'pinia'
import { 
  TrashIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ShoppingCartIcon
} from '@heroicons/vue/24/outline'

const store = useReposicionStore()
const { carrito, loading, filters, almacenes } = storeToRefs(store)

const currentWarehouseName = computed(() => {
  const code = filters.value.whsCode
  const whs = almacenes.value.find(a => a.whsCode === code)
  return whs ? `${code} - ${whs.whsName}` : code
})

onMounted(async () => {
  await store.fetchCarrito()
})

const removeItem = async (itemCode: string) => {
  if (confirm('¿Desea eliminar este artículo de la solicitud?')) {
    await store.updateItemQuantity(itemCode, 0)
  }
}

const handleConfirm = () => {
  // En el sistema actual, el guardado es en tiempo real.
  // Podríamos agregar una pantalla de "Finalización" si fuera necesario.
  alert('Solicitud enviada correctamente (Guardado en tiempo real activado)')
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/reposiciones" class="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeftIcon class="w-6 h-6" />
        </router-link>
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Tu Carrito de Reposición</h1>
          <p class="text-gray-500 mt-1">Revisa los artículos que has seleccionado para <strong class="text-indigo-600">{{ currentWarehouseName }}</strong>.</p>
        </div>
      </div>

      <button 
        @click="handleConfirm"
        :disabled="carrito.length === 0"
        class="bg-green-600 text-white flex items-center gap-2 px-6 py-3 rounded-xl border shadow-sm hover:bg-green-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
      >
        <CheckCircleIcon class="w-5 h-5" />
        <span class="font-bold">Finalizar Solicitud</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="carrito.length === 0" class="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
      <div class="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingCartIcon class="w-12 h-12 text-gray-300" />
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h3>
      <p class="text-gray-500 mb-8 max-w-sm mx-auto">Aún no has agregado ningún artículo a la solicitud de hoy. Vuelve al catálogo para empezar.</p>
      <router-link to="/reposiciones" class="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md">
        Ver catálogo
      </router-link>
    </div>

    <!-- Cart List -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Items List -->
      <div class="lg:col-span-2 space-y-4">
        <div v-for="item in carrito" :key="item.itemCode" class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6">
          <div class="flex-1">
            <h4 class="font-bold text-gray-900">{{ item.itemCode }}</h4>
            <p v-if="item.comment" class="text-xs text-gray-500 mt-1 italic">"{{ item.comment }}"</p>
          </div>
          
          <div class="flex items-center gap-8">
            <div class="text-center">
              <span class="text-[10px] uppercase font-bold text-gray-400 block mb-1">Cantidad</span>
              <div class="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-xl border border-indigo-100 text-lg">
                {{ item.quantity }}
              </div>
            </div>

            <button 
              @click="removeItem(item.itemCode)"
              class="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <TrashIcon class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div class="space-y-6">
        <div class="bg-gray-900 text-white p-8 rounded-3xl shadow-xl">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCartIcon class="w-6 h-6 text-indigo-400" />
            Resumen
          </h3>
          
          <div class="space-y-4 mb-8 border-b border-gray-800 pb-8">
            <div class="flex justify-between text-gray-400">
              <span>Total SKU</span>
              <span class="font-bold text-white">{{ carrito.length }}</span>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Total Unidades</span>
              <span class="font-bold text-white">{{ store.totalSolicitado }}</span>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Almacén Destino</span>
              <span class="font-bold text-white">{{ filters.whsCode }}</span>
            </div>
          </div>

          <div class="flex justify-between items-center mb-8">
            <span class="text-lg text-gray-400 font-medium">Estado</span>
            <span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 uppercase tracking-wider">
              En proceso
            </span>
          </div>

          <p class="text-xs text-center text-gray-500 leading-relaxed">
            Las cantidades guardadas se sincronizarán automáticamente con SAP al cierre del horario de reposición.
          </p>
        </div>

        <router-link 
          to="/reposiciones/historial"
          class="block w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-all group"
        >
          <span class="text-gray-500 font-medium group-hover:text-indigo-600">Ver historial de solicitudes</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
