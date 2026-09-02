<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Squares2X2Icon } from '@heroicons/vue/24/outline'
import DemandChart from '../components/DemandChart.vue'
import FilterDropdown from '../components/FilterDropdown.vue'
import DesgloseChart from '../components/DesgloseChart.vue'
import { getNiveles, getAgregado, getDesgloseGenero, getDesgloseMarcaComercial } from '../services/demandaOtbApi'
import type { NivelesTree, AgregadoResponse, DesgloseResponse } from '../types'

const route = useRoute()
const negocio = computed(() => route.params.negocio as string)

const tree = ref<NivelesTree | null>(null)
const loadingTree = ref(false)
const errorTree = ref<string | null>(null)

const nivel1 = ref('')
const nivel2 = ref('')
const nivel3 = ref('')

const nivel1Options = computed(() => tree.value?.nivel1.map(n => n.nombre) ?? [])

// Mientras Nivel 1 esté en "Todos", Nivel 2 muestra las opciones de TODO el árbol, no vacío —
// se va acotando solo cuando el usuario elige un Nivel 1 específico.
const nivel2Options = computed(() => {
  if (!tree.value) return []
  const alcanceNivel1 = nivel1.value
    ? tree.value.nivel1.filter(n => n.nombre === nivel1.value)
    : tree.value.nivel1
  const nombres = alcanceNivel1.flatMap(n => n.nivel2.map(n2 => n2.nombre))
  return [...new Set(nombres)].sort()
})

// Mismo criterio para Nivel 3: se acota por Nivel 1 y/o Nivel 2 si están elegidos, pero
// nunca queda vacío solo porque el nivel padre siga en "Todos".
const nivel3Options = computed(() => {
  if (!tree.value) return []
  const alcanceNivel1 = nivel1.value
    ? tree.value.nivel1.filter(n => n.nombre === nivel1.value)
    : tree.value.nivel1
  const nodosNivel2 = alcanceNivel1.flatMap(n => n.nivel2)
  const alcanceNivel2 = nivel2.value
    ? nodosNivel2.filter(n2 => n2.nombre === nivel2.value)
    : nodosNivel2
  const nombres = alcanceNivel2.flatMap(n2 => n2.nivel3)
  return [...new Set(nombres)].sort()
})

// Es una jerarquía real (Nivel2 pertenece a un solo Nivel1 padre) — al cambiar un nivel
// superior, las selecciones de los niveles hijos ya no aplican.
watch(nivel1, () => { nivel2.value = ''; nivel3.value = '' })
watch(nivel2, () => { nivel3.value = '' })

const agregado = ref<AgregadoResponse | null>(null)
const loadingAgregado = ref(false)
const errorAgregado = ref<string | null>(null)

async function cargarAgregado(campo: string, valor: string) {
  loadingAgregado.value = true
  errorAgregado.value = null
  agregado.value = null
  try {
    agregado.value = await getAgregado(negocio.value, campo, valor)
  } catch (e) {
    errorAgregado.value = e instanceof Error ? e.message : 'Error consultando el agregado.'
  } finally {
    loadingAgregado.value = false
  }
}

const desgloseGenero = ref<DesgloseResponse | null>(null)
const loadingGenero = ref(false)
const errorGenero = ref<string | null>(null)

const desgloseMarca = ref<DesgloseResponse | null>(null)
const loadingMarca = ref(false)
const errorMarca = ref<string | null>(null)

async function cargarDesgloseGenero(campo: string, valor: string) {
  loadingGenero.value = true
  errorGenero.value = null
  desgloseGenero.value = null
  try {
    desgloseGenero.value = await getDesgloseGenero(negocio.value, campo, valor)
  } catch (e) {
    errorGenero.value = e instanceof Error ? e.message : 'Error consultando el desglose por género.'
  } finally {
    loadingGenero.value = false
  }
}

async function cargarDesgloseMarca(campo: string, valor: string) {
  loadingMarca.value = true
  errorMarca.value = null
  desgloseMarca.value = null
  try {
    desgloseMarca.value = await getDesgloseMarcaComercial(negocio.value, campo, valor)
  } catch (e) {
    errorMarca.value = e instanceof Error ? e.message : 'Error consultando el desglose por marca comercial.'
  } finally {
    loadingMarca.value = false
  }
}

// El nodo "activo" es el más profundo que tenga valor — no hace falta llegar a Nivel3
// para ver un agregado, cualquier nivel se puede consultar por sí solo.
watch([nivel1, nivel2, nivel3], () => {
  let campo: 'Nivel3' | 'Nivel2' | 'Nivel1' | null
  if (nivel3.value) campo = 'Nivel3'
  else if (nivel2.value) campo = 'Nivel2'
  else if (nivel1.value) campo = 'Nivel1'
  else campo = null

  const valor = nivel3.value || nivel2.value || nivel1.value

  if (campo) {
    cargarAgregado(campo, valor)
    cargarDesgloseGenero(campo, valor)
    cargarDesgloseMarca(campo, valor)
  } else {
    agregado.value = null
    errorAgregado.value = null
    desgloseGenero.value = null
    errorGenero.value = null
    desgloseMarca.value = null
    errorMarca.value = null
  }
})

onMounted(async () => {
  loadingTree.value = true
  errorTree.value = null
  try {
    tree.value = await getNiveles(negocio.value)
  } catch (e) {
    errorTree.value = e instanceof Error ? e.message : 'Error consultando el árbol de niveles.'
  } finally {
    loadingTree.value = false
  }
})
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4 items-start">
    <!-- Resultados -->
    <div class="flex-1 min-w-0 w-full space-y-4">
      <div v-if="errorTree" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
        {{ errorTree }}
      </div>
      <div v-if="errorAgregado" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
        {{ errorAgregado }}
      </div>

      <div v-if="loadingAgregado" class="text-sm text-gray-500 dark:text-gray-400">Cargando agregado...</div>

      <div v-if="agregado" class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h4 class="text-[14px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-3">Detalle del nivel</h4>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Granulidad</span>
              <span class="font-bold text-blue-700 dark:text-blue-400">{{ agregado.campo }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Grupo</span>
              <span class="font-bold text-blue-700 dark:text-blue-400">{{ agregado.valor }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">SKU</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ agregado.nSkus }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Stock inicial</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ agregado.stockInicial ?? '—' }} uds</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Confianza</span>
              <span class="font-bold text-gray-900 dark:text-white">{{ agregado.confianza ?? '—' }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Rango 80%</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ agregado.rangoMin80Total?.toFixed(2) ?? '—' }} – {{ agregado.rangoMax80Total?.toFixed(2) ?? '—' }} uds</span>
            </div>
            <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5 col-span-2">
              <span class="text-gray-500 dark:text-gray-400">Próximo mes ({{ agregado.proximoMes }})</span>
              <span class="font-semibold text-gray-900 dark:text-white">
                <template v-if="agregado.catalogoNuevoProximoMes != null">
                  {{ agregado.prediccionProximoMesTotal?.toFixed(1) ?? '—' }} uds
                  <span class="font-normal text-gray-500 dark:text-gray-400 text-xs">
                    ({{ agregado.prediccionProximoMes?.toFixed(1) ?? '—' }} de productos actuales + {{ agregado.catalogoNuevoProximoMes }} de catálogo nuevo)
                  </span>
                </template>
                <template v-else>{{ agregado.prediccionProximoMes ?? '—' }} uds</template>
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
          <DemandChart :serie="agregado.serie" />
        </div>

        <div v-if="errorGenero" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
          {{ errorGenero }}
        </div>
        <div v-if="loadingGenero" class="text-sm text-gray-500 dark:text-gray-400">Cargando desglose por género...</div>
        <DesgloseChart v-if="desgloseGenero" titulo="Género" :desglose="desgloseGenero" />

        <div v-if="errorMarca" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
          {{ errorMarca }}
        </div>
        <div v-if="loadingMarca" class="text-sm text-gray-500 dark:text-gray-400">Cargando desglose por marca comercial...</div>
        <DesgloseChart v-if="desgloseMarca" titulo="Marca comercial" :desglose="desgloseMarca" />
      </div>

      <div v-else-if="!loadingAgregado" class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
          <Squares2X2Icon class="w-6 h-6 text-gray-400" />
        </div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Ningún nivel seleccionado</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
          Elige un Nivel 1, 2 o 3 en el panel para ver la demanda agregada de ese grupo de productos.
        </p>
      </div>
    </div>

    <!-- Selector de niveles -->
    <div class="flex-shrink-0 w-full lg:w-80">
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-4">
        <div>
          <label for="niveles-filtro-nivel1" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 1</label>
          <div class="mt-1">
            <FilterDropdown id="niveles-filtro-nivel1" v-model="nivel1" :options="nivel1Options" :placeholder="loadingTree ? 'Cargando...' : 'Todos'" />
          </div>
        </div>

        <div>
          <label for="niveles-filtro-nivel2" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 2</label>
          <div class="mt-1">
            <FilterDropdown id="niveles-filtro-nivel2" v-model="nivel2" :options="nivel2Options" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label for="niveles-filtro-nivel3" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nivel 3</label>
          <div class="mt-1">
            <FilterDropdown id="niveles-filtro-nivel3" v-model="nivel3" :options="nivel3Options" placeholder="Todos" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
