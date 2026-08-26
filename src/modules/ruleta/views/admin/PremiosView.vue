<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError } from '../../services/utils/errorHandler'
import type { PremioAdmin, TipoPremio } from '../../types'
import VolverButton from '@/components/VolverButton.vue'

const store = useAdminStore()
const toast = useToast()

// Esta pantalla siempre trabaja sobre la ÚNICA campaña Activa (ver ruletaService.getCampanaActiva,
// que solo devuelve una campaña cuando está disponible-para-giro). Por eso, mientras haya premios
// cargados, la campaña está garantizada Activa: la estructura del premio (nombre, tipo, etc.) queda
// bloqueada — solo se permite ajustar el stock. Para editar la estructura hay que pausarla primero
// desde el Detalle de Campaña.
const campanaEsActiva = computed(() => store.campanaActivaId !== null)
let probInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([
    store.cargarPremios(),
    store.cargarTiendas()
  ])
})

onBeforeUnmount(() => {
  if (probInterval) clearInterval(probInterval)
})

const grupoActivo = ref(0)
const selectedTiendaInfo = ref<string>('')

async function refetchProbabilidades() {
  if (store.campanaActivaId && selectedTiendaInfo.value) {
    await store.cargarProbabilidadesEnVivo(store.campanaActivaId, selectedTiendaInfo.value)
  } else {
    store.probabilidadesEnVivo = []
  }
}

watch(selectedTiendaInfo, async () => {
  if (probInterval) {
    clearInterval(probInterval)
    probInterval = null
  }
  await refetchProbabilidades()
  
  if (selectedTiendaInfo.value) {
     probInterval = setInterval(refetchProbabilidades, 5 * 60 * 1000) // refresca cada 5 min
  }
})

const grupo = computed(() => store.grupos[grupoActivo.value])
const estadoActual = computed(() => grupo.value?.estado ?? 'incompleto')

const currentProbability = computed(() => {
  if (!grupo.value || store.probabilidadesEnVivo.length === 0) return null
  return store.probabilidadesEnVivo.find(p => p.grupo === grupo.value.grupo)?.porcentajeGanar ?? 0
})

const barraColor = computed(() => {
  if (estadoActual.value === 'completo')    return 'bg-emerald-500'
  if (estadoActual.value === 'advertencia') return 'bg-yellow-400'
  return 'bg-red-400'
})

// Modal de edición
const editando = ref<PremioAdmin | null>(null)
const editGrupoIdx = ref(0)
const errorEdit = ref('')

function abrirEdit(p: PremioAdmin, gIdx: number) {
  editando.value = { ...p }
  editGrupoIdx.value = gIdx
  errorEdit.value = ''
}
function cerrarEdit() { editando.value = null }

async function guardarEdit() {
  if (!editando.value || store.guardando) return
  errorEdit.value = ''
  try {
    await store.actualizarPremio(editGrupoIdx.value, editando.value.id, editando.value)
    toast.success('Premio actualizado')
    cerrarEdit()
  } catch (e) {
    // No cerramos el modal: el admin decide si reintenta o recarga (ver toast global).
    errorEdit.value = extraerMensajeError(e, 'No se pudo guardar el premio. Intenta de nuevo.')
  }
}

// Modal añadir premio
const mostrarAgregar = ref(false)
const errorNuevo = ref('')
const nuevoForm = ref<Omit<PremioAdmin, 'id'>>({
  nombre: '', descripcion: '', tipo: 'fisico',
  stock_total: null, valor_referencial: null, es_relleno: false, controla_stock_por_tienda: false
})

function abrirAgregar() {
  nuevoForm.value = {
    nombre: '', descripcion: '', tipo: 'fisico',
    stock_total: null, valor_referencial: null, es_relleno: false, controla_stock_por_tienda: false
  }
  errorNuevo.value = ''
  mostrarAgregar.value = true
}
async function guardarNuevo() {
  if (!nuevoForm.value.nombre.trim() || store.guardando) return
  errorNuevo.value = ''
  try {
    await store.agregarPremio(grupoActivo.value, nuevoForm.value)
    toast.success('Premio agregado')
    mostrarAgregar.value = false
  } catch (e) {
    // No cerramos el modal: el admin decide si reintenta o recarga (ver toast global).
    errorNuevo.value = extraerMensajeError(e, 'No se pudo agregar el premio. Intenta de nuevo.')
  }
}

const estadoBadge: Record<string, { icon: string; cls: string }> = {
  completo:    { icon: '✓', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  incompleto:  { icon: '✗', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  advertencia: { icon: '△', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
}

const TIPO_LABELS: Record<TipoPremio, string> = {
  fisico: 'Premio Físico', digital: 'Cupón digital', descuento: 'Descuento en tienda', relleno: 'Relleno'
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Premios de la Campaña</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configura los premios disponibles por cada grupo de clientes.</p>
    </div>

    <div v-if="store.loadingPremios" class="flex justify-center py-12">
      <div class="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>

    <template v-else-if="store.grupos.length">

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">Estado Global:</span>
          <span v-for="(g, i) in store.grupos" :key="g.grupo"
            @click="grupoActivo = i"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            :class="[estadoBadge[g.estado].cls, { 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-800': grupoActivo === i }]">
            G{{ i + 1 }} {{ estadoBadge[g.estado].icon }}
          </span>
        </div>
        
        <div class="flex items-center gap-3">
           <label for="simulador-probabilidad-tienda" class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Simulador de Probabilidad
           </label>
           <select
             id="simulador-probabilidad-tienda"
             v-model="selectedTiendaInfo"
             class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors">
              <option value="" disabled>Seleccione una tienda...</option>
              <option v-for="t in store.tiendas" :key="t.id" :value="t.codigo">{{ t.nombre }} ({{ t.codigo }})</option>
           </select>
        </div>
      </div>

      <!-- Tabs por grupo -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        <!-- Tab bar -->
        <div class="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 px-4">
          <button v-for="(g, i) in store.grupos" :key="g.grupo"
            @click="grupoActivo = i"
            class="flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors mr-1"
            :class="grupoActivo === i
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
            {{ g.label }}
            <span class="text-xs" :class="estadoBadge[g.estado].cls.split(' ').slice(0,2).join(' ')"
                  style="padding: 1px 5px; border-radius: 9999px;">
              {{ estadoBadge[g.estado].icon }}
            </span>
          </button>
        </div>

        <!-- Contenido tab activo -->
        <div v-if="grupo" class="p-5 space-y-4">

          <!-- Estado del grupo y Probabilidad -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div class="flex items-center gap-3">
              <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                     :class="barraColor"
                     :style="{ width: estadoActual === 'completo' ? '100%' : estadoActual === 'advertencia' ? '50%' : '10%' }"/>
              </div>
              <span class="text-sm font-semibold whitespace-nowrap"
                    :class="estadoActual === 'completo' ? 'text-emerald-600 dark:text-emerald-400' : estadoActual === 'advertencia' ? 'text-yellow-600' : 'text-red-500'">
                <svg v-if="estadoActual === 'completo'" class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ estadoActual === 'completo' ? 'Configuración lista' : estadoActual === 'advertencia' ? 'Falta consolación' : 'Sin premios' }}
              </span>
            </div>

            <!-- Widget Live Probability -->
            <div v-if="selectedTiendaInfo" class="flex flex-col border-l border-gray-100 dark:border-gray-700 pl-6 pb-1">
              <span class="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Live Probability (G{{ grupoActivo + 1 }})</span>
              <div v-if="store.loadingProbabilidades" class="flex items-center gap-2 text-indigo-500 text-xs">
                <div class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
                Calculando tiempo real...
              </div>
              <div v-else class="flex flex-col gap-1.5 w-full">
                 <div class="flex items-center justify-between text-xs font-medium dark:text-gray-200">
                    <span>Oportunidad de Ganar:</span>
                    <span class="text-emerald-600 dark:text-emerald-400 font-bold text-[13px]">{{ currentProbability?.toFixed(1) ?? '0.0' }}%</span>
                 </div>
                 <div class="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700 shadow-inner">
                    <div class="h-full bg-emerald-500 dark:bg-emerald-400 shadow-md transition-all duration-[2000ms] ease-out relative"
                         :style="{ width: `${currentProbability ?? 0}%` }">
                         <div class="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"/>
                    </div>
                 </div>
                 <p class="text-[10px] text-gray-400">Variación depende del pacing actual (refresh 5m).</p>
              </div>
            </div>
            
          </div>

          <!-- Tabla de premios -->
          <div v-if="grupo.premios.length === 0"
               class="py-8 text-center text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
            Sin premios configurados para este grupo.
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-10">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Premio</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tipo</th>

                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Stock total</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">¿Es relleno?</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(p, idx) in grupo.premios" :key="p.id"
                  :class="false
                    ? 'bg-red-50/60 dark:bg-red-900/10'
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'"
                  class="transition-colors">
                <td class="px-4 py-3.5"
                    :class="false ? 'text-red-500' : 'text-gray-400'">
                  {{ idx + 1 }}
                </td>
                <td class="px-4 py-3.5 font-medium"
                    :class="false ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'">
                  {{ p.nombre }}
                </td>
                <td class="px-4 py-3.5 hidden sm:table-cell"
                    :class="false ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'">
                  {{ TIPO_LABELS[p.tipo] }}
                </td>

                <td class="px-4 py-3.5 text-right hidden md:table-cell"
                    :class="false ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'">
                  {{ p.stock_total ?? '—' }}
                </td>
                <td class="px-4 py-3.5 text-center hidden md:table-cell">
                  <span v-if="p.es_relleno"
                    class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Sí
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400">No</span>
                </td>
                <td class="px-4 py-3.5 text-center">
                  <button @click="abrirEdit(p, grupoActivo)"
                    class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    :class="false ? 'text-red-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Aviso: campaña Activa bloquea agregar/estructura de premios -->
          <div v-if="campanaEsActiva" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
            Campaña Activa: solo se puede ajustar stock. Para agregar premios o cambiar su nombre/tipo, pausa la campaña desde el Detalle de Campaña.
          </div>

          <!-- Añadir premio -->
          <div class="flex justify-end">
            <button
              type="button"
              @click="!campanaEsActiva && abrirAgregar()"
              :disabled="campanaEsActiva"
              :title="campanaEsActiva ? 'Pausa la campaña para agregar premios' : undefined"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
              :class="campanaEsActiva
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/40 cursor-not-allowed'
                : 'border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Añadir Premio
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Editar Premio -->
    <Teleport to="body">
      <div v-if="editando"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
           @click.self="cerrarEdit">
        <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-bold text-gray-900 dark:text-white">Editar premio</h3>
            <button @click="cerrarEdit" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div>
              <label for="edit-nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
              <input id="edit-nombre" v-model="editando.nombre" type="text"
                :disabled="campanaEsActiva"
                :title="campanaEsActiva ? 'Pausa la campaña para renombrar el premio' : undefined"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"/>
              <p v-if="campanaEsActiva" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Solo se puede ajustar el stock mientras la campaña está Activa.
              </p>
            </div>
            <div>
              <label for="edit-stock" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock total</label>
              <input id="edit-stock" v-model.number="editando.stock_total" type="number" min="0"
                :placeholder="editando.es_relleno ? 'Ilimitado' : ''"
                :disabled="editando.es_relleno"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"/>
            </div>
            <p v-if="errorEdit" class="text-sm text-red-500">{{ errorEdit }}</p>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="cerrarEdit" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            <button @click="guardarEdit" :disabled="store.guardando" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {{ store.guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Añadir Premio -->
    <Teleport to="body">
      <div v-if="mostrarAgregar"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
           @click.self="mostrarAgregar = false">
        <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-bold text-gray-900 dark:text-white">Añadir premio — {{ grupo?.label }}</h3>
            <button @click="mostrarAgregar = false" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <!-- Nombre -->
            <div>
              <label for="nuevo-nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input id="nuevo-nombre" v-model="nuevoForm.nombre" type="text" placeholder="Ej: Mochila Roland"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"/>
            </div>

            <!-- Descripción -->
            <div>
              <label for="nuevo-descripcion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción <span class="text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea id="nuevo-descripcion" v-model="nuevoForm.descripcion" rows="2" placeholder="Ej: Mochila de tela resistente con logo Roland"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"/>
            </div>

            <!-- Tipo -->
            <div>
              <label for="nuevo-tipo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
              <select id="nuevo-tipo" v-model="nuevoForm.tipo"
                :disabled="nuevoForm.es_relleno"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50">
                <option v-for="(label, val) in TIPO_LABELS" :key="val" :value="val">{{ label }}</option>
              </select>
            </div>

            <!-- Stock total + Valor referencial -->
            <div v-if="!nuevoForm.es_relleno" class="grid grid-cols-2 gap-3">
              <div>
                <label for="nuevo-stock" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock total</label>
                <input id="nuevo-stock" v-model.number="nuevoForm.stock_total" type="number" min="0" placeholder="Ilimitado"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"/>
              </div>
              <div>
                <label for="nuevo-valor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Valor referencial ($)
                  <span class="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input id="nuevo-valor" v-model.number="nuevoForm.valor_referencial" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"/>
                </div>
              </div>
            </div>

            <!-- Es relleno -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="nuevoForm.es_relleno" class="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
              <span class="text-sm text-gray-700 dark:text-gray-300">Es premio de relleno (no consume stock)</span>
            </label>

            <p v-if="errorNuevo" class="text-sm text-red-500">{{ errorNuevo }}</p>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="mostrarAgregar = false" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            <button @click="guardarNuevo" :disabled="store.guardando" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {{ store.guardando ? 'Guardando…' : 'Añadir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
