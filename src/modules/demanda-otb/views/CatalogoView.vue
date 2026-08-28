<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/vue/20/solid'
import DemandChart from '../components/DemandChart.vue'
import ProductInfoGrid from '../components/ProductInfoGrid.vue'
import ProductComboBox from '../components/ProductComboBox.vue'
import FilterDropdown from '../components/FilterDropdown.vue'
import { getCatalogo, getSkuDetail } from '../services/demandaOtbApi'
import type { CatalogoFacetas, CatalogoItem, SkuDetail } from '../types'

const route = useRoute()
const negocio = computed(() => route.params.negocio as string)

const busqueda = ref('')
const nivel1 = ref('')
const nivel2 = ref('')
const nivel3 = ref('')
const genero = ref('')
const marcaComercial = ref('')
const coleccion = ref('')
const confianza = ref('')

const items = ref<CatalogoItem[]>([])
const total = ref(0)
const facetas = ref<CatalogoFacetas>({ nivel1: [], nivel2: [], nivel3: [], genero: [], marcaComercial: [], coleccion: [], confianza: [] })
const loadingCatalogo = ref(false)
const errorCatalogo = ref<string | null>(null)

const selected = ref<SkuDetail | null>(null)
const loadingDetail = ref(false)
const errorDetail = ref<string | null>(null)

async function buscar() {
  loadingCatalogo.value = true
  errorCatalogo.value = null
  try {
    const resultado = await getCatalogo(negocio.value, {
      busqueda: busqueda.value || undefined,
      nivel1: nivel1.value || undefined,
      nivel2: nivel2.value || undefined,
      nivel3: nivel3.value || undefined,
      genero: genero.value || undefined,
      marcaComercial: marcaComercial.value || undefined,
      coleccion: coleccion.value || undefined,
      confianza: confianza.value || undefined,
      limite: 50,
    })
    items.value = resultado.items
    total.value = resultado.total
    facetas.value = resultado.facetas
  } catch (e) {
    errorCatalogo.value = e instanceof Error ? e.message : 'Error consultando el catálogo.'
  } finally {
    loadingCatalogo.value = false
  }
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch([busqueda, nivel1, nivel2, nivel3, genero, marcaComercial, coleccion, confianza], () => {
  // La selección actual puede no seguir en la nueva lista filtrada — se limpia de una vez
  // para que el combo y el detalle no queden desincronizados mientras llega la respuesta.
  selectedCodigo.value = ''
  selected.value = null
  errorDetail.value = null
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(buscar, 400)
})

function onComboSearch(texto: string) {
  busqueda.value = texto
}

function handleClearFilters() {
  busqueda.value = ''
  nivel1.value = ''
  nivel2.value = ''
  nivel3.value = ''
  genero.value = ''
  marcaComercial.value = ''
  coleccion.value = ''
  confianza.value = ''
  selectedCodigo.value = ''
  selected.value = null
  buscar()
}

async function seleccionar(item: CatalogoItem) {
  loadingDetail.value = true
  errorDetail.value = null
  selected.value = null
  try {
    selected.value = await getSkuDetail(negocio.value, item.codigoProducto)
  } catch (e) {
    errorDetail.value = e instanceof Error ? e.message : 'Error consultando el producto.'
  } finally {
    loadingDetail.value = false
  }
}

const selectedCodigo = ref('')
function onComboChange(item: CatalogoItem | null) {
  if (item) seleccionar(item)
}

onMounted(buscar)
onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})

// Vue Router reutiliza el componente si solo cambia :negocio en la misma ruta —
// sin esto, se quedaría viendo el catálogo del negocio anterior.
watch(negocio, () => {
  busqueda.value = ''
  nivel1.value = ''
  nivel2.value = ''
  nivel3.value = ''
  genero.value = ''
  marcaComercial.value = ''
  coleccion.value = ''
  confianza.value = ''
  selectedCodigo.value = ''
  selected.value = null
  buscar()
})
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4 items-start">
    <!-- Resultados + detalle -->
    <div class="flex-1 min-w-0 w-full space-y-4">
      <div v-if="errorCatalogo" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
        {{ errorCatalogo }}
      </div>

      <div v-if="errorDetail" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
        {{ errorDetail }}
      </div>

      <div v-if="loadingDetail" class="text-sm text-gray-500 dark:text-gray-400">Cargando producto...</div>

      <div v-if="selected" class="space-y-4">
        <ProductInfoGrid :producto="selected" :negocio="negocio" />

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
          <DemandChart :serie="selected.serie" />
        </div>
      </div>
      <div v-else-if="!loadingCatalogo" class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
          <MagnifyingGlassIcon class="w-6 h-6 text-gray-400" />
        </div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Ningún producto seleccionado</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
          Usa el buscador o los filtros del panel para encontrar un producto y ver su detalle y proyección de demanda.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CheckBadgeIcon class="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            <span>Con proyección de demanda</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <ExclamationTriangleIcon class="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span>Sin proyección para el ciclo actual</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros: siempre visibles, no afectan el rendimiento de la búsqueda -->
    <div class="flex-shrink-0 w-full lg:w-80">
      <div class="flex flex-col bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="p-4 space-y-4">
            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                Producto — mostrando {{ items.length }} de {{ total.toLocaleString() }}
              </label>
              <div class="mt-1">
                <ProductComboBox
                  v-model="selectedCodigo"
                  :items="items"
                  :loading="loadingCatalogo"
                  @change="onComboChange"
                  @search="onComboSearch"
                />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 1</label>
              <div class="mt-1">
                <FilterDropdown v-model="nivel1" :options="facetas.nivel1" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 2</label>
              <div class="mt-1">
                <FilterDropdown v-model="nivel2" :options="facetas.nivel2" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 3</label>
              <div class="mt-1">
                <FilterDropdown v-model="nivel3" :options="facetas.nivel3" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Género</label>
              <div class="mt-1">
                <FilterDropdown v-model="genero" :options="facetas.genero" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Marca comercial</label>
              <div class="mt-1">
                <FilterDropdown v-model="marcaComercial" :options="facetas.marcaComercial" placeholder="Todas" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Colección</label>
              <div class="mt-1">
                <FilterDropdown v-model="coleccion" :options="facetas.coleccion" placeholder="Todas" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Confianza</label>
              <div class="mt-1">
                <FilterDropdown v-model="confianza" :options="facetas.confianza" placeholder="Todas" />
              </div>
            </div>
          </div>

          <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <button @click="handleClearFilters" class="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium">
              <ArrowPathIcon class="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
</template>


