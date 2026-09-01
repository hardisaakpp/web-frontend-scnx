<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArchiveBoxIcon, ArrowLeftIcon, CheckCircleIcon, CubeIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useContenedorStore } from '../stores/contenedorStore'
import { useToast } from '@/composables/useToast'

// P-017 — Contenedores Virtuales: trazabilidad picking → empaque de una solicitud puntual.
// Concepto nuevo (no existe en el legacy) — la caja/pallet física que un operador arma para
// esta tienda, con seguimiento de qué ítems (y cuánto) terminaron adentro.

const route = useRoute()
const router = useRouter()
const store = useContenedorStore()
const toast = useToast()

const grupoId = computed(() => route.params.grupoId as string)
const solicitudId = computed(() => route.params.solicitudId as string)

const itemAEmpacar = ref('')
const cantidadAEmpacar = ref(1)

const contenedorActivo = computed(() =>
  store.trazabilidad?.contenedores.find(c => c.id === store.contenedorActivoId) ?? null)

async function onCrearContenedor() {
  try {
    const contenedor = await store.crearContenedor(grupoId.value, solicitudId.value)
    toast.success('Contenedor creado', contenedor.codigo)
  } catch (e: any) {
    toast.error('No se pudo crear el contenedor', e?.response?.data?.message)
  }
}

async function onEmpacar() {
  const itemCode = itemAEmpacar.value.trim()
  const cantidad = Number(cantidadAEmpacar.value) || 0
  if (!itemCode || cantidad <= 0) return

  try {
    await store.empacar(grupoId.value, solicitudId.value, itemCode, cantidad)
    toast.success('Empacado', `${cantidad} de "${itemCode}" en ${contenedorActivo.value?.codigo}.`)
    itemAEmpacar.value = ''
    cantidadAEmpacar.value = 1
  } catch (e: any) {
    toast.error('No se pudo empacar', e?.response?.data?.message)
  }
}

async function onCerrarContenedor(contenedorId: string) {
  try {
    await store.cerrarContenedor(grupoId.value, solicitudId.value, contenedorId)
    toast.success('Contenedor cerrado')
  } catch (e: any) {
    toast.error('No se pudo cerrar el contenedor', e?.response?.data?.message)
  }
}

onMounted(() => store.cargar(grupoId.value, solicitudId.value))
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      @click="router.push(`/cedi/distribucion/grupos/${grupoId}`)"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver al grupo
    </button>

    <div v-if="store.loading && !store.trazabilidad" class="text-center text-gray-400 py-12">Cargando...</div>

    <template v-else-if="store.trazabilidad">
      <div class="flex items-center gap-3 mb-6">
        <ArchiveBoxIcon class="w-6 h-6 text-blue-600" />
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Empaque — {{ store.trazabilidad.numDoc }}</h1>
      </div>

      <!-- Trazabilidad: picking vs. empaque por ítem -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Picking vs. empaque</h2>
        </div>
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">Ítem</th>
              <th class="px-4 py-3">Escaneado</th>
              <th class="px-4 py-3">Empacado</th>
              <th class="px-4 py-3">Pendiente</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="item in store.trazabilidad.items.filter(i => i.cantidadEscaneada > 0)" :key="item.itemCode">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900 dark:text-white">{{ item.itemCode }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.descripcion }}</p>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ item.cantidadEscaneada }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ item.cantidadEmpacada }}</td>
              <td class="px-4 py-3">
                <span v-if="item.pendienteDeEmpaque > 0" class="font-semibold text-amber-600 dark:text-amber-400">{{ item.pendienteDeEmpaque }}</span>
                <CheckCircleIcon v-else class="w-4 h-4 text-emerald-500" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empacar en el contenedor activo -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Empacar</h2>
          <button
            type="button"
            :disabled="store.creando"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
            @click="onCrearContenedor"
          >
            <CubeIcon class="w-4 h-4" /> Nuevo contenedor
          </button>
        </div>

        <div v-if="!contenedorActivo" class="text-sm text-gray-400 text-center py-4">
          Creá un contenedor para empezar a empacar.
        </div>
        <form v-else class="flex flex-wrap gap-3" @submit.prevent="onEmpacar">
          <span class="inline-flex items-center px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
            {{ contenedorActivo.codigo }}
          </span>
          <input
            v-model="itemAEmpacar"
            type="text"
            placeholder="Código de artículo"
            class="flex-1 min-w-[160px] px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model.number="cantidadAEmpacar"
            type="number"
            min="0.0001"
            step="any"
            class="w-24 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            :disabled="store.empacando"
            class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold shadow-sm"
          >
            Empacar
          </button>
        </form>
      </div>

      <!-- Contenedores de esta solicitud -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contenedores</h2>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-if="store.trazabilidad.contenedores.length === 0" class="p-4 text-sm text-gray-400 text-center">
            Todavía no hay contenedores.
          </li>
          <li
            v-for="c in store.trazabilidad.contenedores"
            :key="c.id"
            class="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': c.id === store.contenedorActivoId }"
            @click="c.estado === 'Abierto' && (store.contenedorActivoId = c.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-900 dark:text-white">{{ c.codigo }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="c.estado === 'Abierto' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'"
                >
                  {{ c.estado }}
                </span>
              </div>
              <button
                v-if="c.estado === 'Abierto'"
                type="button"
                :disabled="store.cerrando"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
                @click.stop="onCerrarContenedor(c.id)"
              >
                <LockClosedIcon class="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ c.lineas.length }} línea(s) · {{ c.cantidadTotal }} unidad(es) en total
            </p>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
