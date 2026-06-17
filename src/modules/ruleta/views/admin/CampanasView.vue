<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import type { CrearCampanaDTO, EstadoCampana, SegmentoCliente, Campana } from '../../types'
import VolverButton from '../../components/VolverButton.vue'

const store  = useAdminStore()
const router = useRouter()
onMounted(() => store.cargarCampanas())

// ─── Tipos de vista ──────────────────────────────────────────────────────────
type EstadoVista  = EstadoCampana | 'programada'
type FiltroEstado = EstadoVista   | 'todos'

// ─── "Programada" es estado lógico del frontend: activa pero aún no iniciada
const hoy = new Date().toISOString().slice(0, 10)
function estadoEfectivo(c: Campana): EstadoVista {
  if (c.estado === 'activa' && c.fecha_inicio > hoy) return 'programada'
  return c.estado
}

// ─── Config visual por estado ────────────────────────────────────────────────
const estadoConfig: Record<EstadoVista, { label: string; cls: string; dot: string }> = {
  activa:     { label: 'Activa',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  programada: { label: 'Programada', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             dot: 'bg-blue-500'   },
  pausada:    { label: 'Pausada',    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',     dot: 'bg-orange-500' },
  finalizada: { label: 'Finalizada', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',               dot: 'bg-gray-400'   },
  borrador:   { label: 'Borrador',   cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',    dot: 'bg-yellow-500' },
}

// ─── Filtros ─────────────────────────────────────────────────────────────────
const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos',      label: 'Todos'      },
  { value: 'activa',     label: 'Activa'     },
  { value: 'programada', label: 'Programada' },
  { value: 'pausada',    label: 'Pausada'    },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'borrador',   label: 'Borrador'   },
]

const filtroEstado = ref<FiltroEstado>('todos')

const conteoEstados = computed(() => {
  const r: Record<string, number> = { todos: store.campanas.length }
  for (const c of store.campanas) {
    const e = estadoEfectivo(c)
    r[e] = (r[e] ?? 0) + 1
  }
  return r
})

const campanasFiltradas = computed(() => {
  if (filtroEstado.value === 'todos') return store.campanas
  return store.campanas.filter(c => estadoEfectivo(c) === filtroEstado.value)
})

// ─── Menú de tres puntos (Teleport + overlay fijo) ───────────────────────────
const menuAbierto   = ref<string | null>(null)
const menuStyle     = ref({ top: '0px', right: '0px' })
const menuCampana   = computed(() => store.campanas.find(c => c.id === menuAbierto.value) ?? null)

function abrirMenu(e: MouseEvent, id: string) {
  e.stopPropagation()
  if (menuAbierto.value === id) { menuAbierto.value = null; return }
  const btn  = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  menuStyle.value = {
    top:   `${rect.bottom + window.scrollY + 6}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
  menuAbierto.value = id
}
function cerrarMenu() { menuAbierto.value = null }

function accionConfigurar() {
  if (!menuCampana.value) return
  const id = menuCampana.value.id
  cerrarMenu()
  router.push({ name: 'ruleta-admin-campana-detalle', params: { campanaId: id } })
}

async function accionCambiarEstado(estado: EstadoCampana) {
  if (!menuCampana.value) return
  const id = menuCampana.value.id
  cerrarMenu()
  await store.cambiarEstado(id, estado)
}

// ─── Confirmación de eliminación ─────────────────────────────────────────────
const confirmDelete = ref<{ id: string; nombre: string } | null>(null)
const eliminando    = ref(false)

function pedirConfirmDelete(c: Campana) {
  cerrarMenu()
  confirmDelete.value = { id: c.id, nombre: c.nombre }
}

async function ejecutarEliminar() {
  if (!confirmDelete.value) return
  eliminando.value = true
  try {
    await store.eliminarCampana(confirmDelete.value.id)
    confirmDelete.value = null
  } finally {
    eliminando.value = false
  }
}

// ─── Modal Nueva Campaña ─────────────────────────────────────────────────────
const TODOS_SEGMENTOS: SegmentoCliente[] = ['GRUPO_1','GRUPO_2','GRUPO_3','GRUPO_4','GRUPO_5','GRUPO_6']

const mostrarModal   = ref(false)
const errorModal     = ref('')
const habilitarHoraFeliz = ref(false)
const nombreTouched  = ref(false)
const cooldownTouched = ref(false)
const maxGirosTouched = ref(false)

const form = ref<CrearCampanaDTO>({
  nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '',
  cooldown_dias: 15, max_giros: 1, segmentos_permitidos: [],
  requiere_validacion_onecard: true,
  hora_feliz_inicio: null, hora_feliz_fin: null,
})

const campanaEditando = ref<Campana | null>(null)

function resetForm() {
  form.value = {
    nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '',
    cooldown_dias: 15, max_giros: 1, segmentos_permitidos: [],
    requiere_validacion_onecard: true,
    hora_feliz_inicio: null, hora_feliz_fin: null,
  }
  habilitarHoraFeliz.value = false
  errorModal.value    = ''
  nombreTouched.value  = false
  cooldownTouched.value = false
  maxGirosTouched.value = false
}

function abrirModal()  { 
  campanaEditando.value = null
  resetForm()
  mostrarModal.value = true  
}

function abrirModalEditar(c: Campana) {
  campanaEditando.value = c
  form.value = {
    nombre: c.nombre,
    descripcion: c.descripcion ?? '',
    fecha_inicio: c.fecha_inicio,
    fecha_fin: c.fecha_fin,
    cooldown_dias: c.cooldown_dias,
    max_giros: c.max_giros,
    segmentos_permitidos: [...c.segmentos_permitidos],
    requiere_validacion_onecard: c.requiere_validacion_onecard,
    hora_feliz_inicio: c.hora_feliz_inicio ?? null,
    hora_feliz_fin: c.hora_feliz_fin ?? null,
  }
  habilitarHoraFeliz.value = !!c.hora_feliz_inicio && !!c.hora_feliz_fin
  errorModal.value = ''
  nombreTouched.value = false
  cooldownTouched.value = false
  maxGirosTouched.value = false
  mostrarModal.value = true
  cerrarMenu()
}

function cerrarModal() { 
  mostrarModal.value = false 
  campanaEditando.value = null
}

function toggleSegmento(s: SegmentoCliente) {
  const idx = form.value.segmentos_permitidos.indexOf(s)
  if (idx === -1) form.value.segmentos_permitidos.push(s)
  else            form.value.segmentos_permitidos.splice(idx, 1)
}

const nombreRestante = computed(() => 150 - form.value.nombre.length)

const fechaFinError = computed(() =>
  form.value.fecha_inicio && form.value.fecha_fin && form.value.fecha_fin <= form.value.fecha_inicio
    ? 'La fecha de fin debe ser posterior a la de inicio.'
    : ''
)

const nombreError = computed(() => {
  if (!nombreTouched.value) return ''
  if (!form.value.nombre.trim()) return 'El nombre es requerido.'
  return ''
})

const cooldownError = computed(() => {
  if (!cooldownTouched.value) return ''
  const v = form.value.cooldown_dias
  if (!v || v < 1 || v > 365) return 'Debe estar entre 1 y 365 días.'
  return ''
})

const maxGirosError = computed(() => {
  if (!maxGirosTouched.value) return ''
  const v = form.value.max_giros
  if (!v || v < 1 || v > 100) return 'Debe estar entre 1 y 100 giros.'
  return ''
})

function validarFormulario(): string {
  if (!form.value.nombre.trim()) return 'El nombre es requerido.'
  if (form.value.nombre.length > 150) return 'Máximo 150 caracteres.'
  if (!form.value.fecha_inicio || !form.value.fecha_fin) return 'Las fechas son requeridas.'
  if (fechaFinError.value) return fechaFinError.value
  if (!form.value.cooldown_dias || form.value.cooldown_dias < 1 || form.value.cooldown_dias > 365)
    return 'El cooldown debe estar entre 1 y 365 días.'
  if (!form.value.max_giros || form.value.max_giros < 1 || form.value.max_giros > 100)
    return 'Los giros máximos deben estar entre 1 y 100.'
  return ''
}

function normalizarHoraFeliz(payload: CrearCampanaDTO): string {
  if (!habilitarHoraFeliz.value) {
    payload.hora_feliz_inicio = null
    payload.hora_feliz_fin = null
    return ''
  }
  if (!payload.hora_feliz_inicio || !payload.hora_feliz_fin)
    return 'Debe especificar el inicio y fin de la Hora Feliz.'
  if (payload.hora_feliz_inicio.length === 5) payload.hora_feliz_inicio += ':00'
  if (payload.hora_feliz_fin.length === 5) payload.hora_feliz_fin += ':00'
  return ''
}

async function guardar() {
  nombreTouched.value   = true
  cooldownTouched.value  = true
  maxGirosTouched.value  = true
  errorModal.value = ''

  const errorValidacion = validarFormulario()
  if (errorValidacion) { errorModal.value = errorValidacion; return }

  const payload = { ...form.value }
  const errorHora = normalizarHoraFeliz(payload)
  if (errorHora) { errorModal.value = errorHora; return }

  if (campanaEditando.value) {
    await store.actualizarCampana(campanaEditando.value.id, payload)
  } else {
    await store.crearCampana(payload)
  }
  cerrarModal()
}

// ─── Helpers de presentación ─────────────────────────────────────────────────
function labelSegmentos(segmentos: SegmentoCliente[]): string {
  if (segmentos.length === 0 || segmentos.length === 6) return 'Todos los grupos'
  const noAfil  = segmentos.includes('GRUPO_6')
  const afil    = segmentos.filter(s => s !== 'GRUPO_6')
  const parts   = afil.length ? `G${afil.map(s => s.replace('GRUPO_', '')).join(', ')}` : ''
  if (!noAfil) return parts
  return parts ? `${parts} + No afiliados` : 'No afiliados'
}

const SEGMENTO_LABELS: Record<SegmentoCliente, string> = {
  GRUPO_1: 'Grupo 1', GRUPO_2: 'Grupo 2', GRUPO_3: 'Grupo 3',
  GRUPO_4: 'Grupo 4', GRUPO_5: 'Grupo 5', GRUPO_6: 'Grupo 6 — No afiliados',
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Gestión de campañas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Crea, configura y administra las campañas de ruleta.
        </p>
      </div>
      <button @click="abrirModal"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700
               text-white text-sm font-semibold shadow-sm transition-colors flex-shrink-0">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva campaña
      </button>
    </div>

    <!-- ── Pestañas de filtro ──────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="f in FILTROS" :key="f.value"
        @click="filtroEstado = f.value"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
        :class="filtroEstado === f.value
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
      >
        {{ f.label }}
        <span
          v-if="conteoEstados[f.value]"
          class="text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none"
          :class="filtroEstado === f.value
            ? 'bg-white/20 text-white'
            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'"
        >
          {{ conteoEstados[f.value] }}
        </span>
      </button>
    </div>

    <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

      <div v-if="store.loadingCampanas" class="p-10 text-center">
        <div class="inline-flex items-center gap-2 text-sm text-gray-400">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Cargando campañas…
        </div>
      </div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Campaña
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
              Vigencia
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
              Audiencia
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th class="px-4 py-3 w-10"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <!-- Empty state -->
          <tr v-if="campanasFiltradas.length === 0">
            <td colspan="5" class="px-5 py-12 text-center">
              <div class="flex flex-col items-center gap-2 text-gray-400">
                <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <span class="text-sm">No hay campañas con este filtro.</span>
              </div>
            </td>
          </tr>

          <!-- Filas -->
          <tr
            v-for="c in campanasFiltradas" :key="c.id"
            class="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors group"
          >
            <!-- ── Columna: Nombre ── -->
            <td class="px-5 py-4">
              <div class="flex items-start gap-2.5">
                <!-- Indicador "Sin premios" para borradores -->
                <div
                  v-if="!c.tiene_premios && (c.estado === 'borrador' || c.estado === 'pausada')"
                  class="relative flex-shrink-0 mt-0.5 group/warn"
                >
                  <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                  </svg>
                  <!-- Tooltip -->
                  <div class="absolute z-20 left-full ml-2 top-1/2 -translate-y-1/2 w-44 p-2 rounded-lg
                              bg-gray-900 dark:bg-gray-700 text-white text-xs leading-snug
                              opacity-0 group-hover/warn:opacity-100 transition-opacity pointer-events-none whitespace-normal">
                    Sin premios configurados. No podrás activarla.
                    <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"/>
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                      {{ c.nombre }}
                    </span>
                    <!-- Indicador OneCard -->
                    <div v-if="c.requiere_validacion_onecard" class="relative group/onecard flex-shrink-0">
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
                                   bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/>
                        </svg>
                        OneCard
                      </span>
                      <div class="absolute z-20 left-0 top-full mt-1.5 w-52 p-2.5 rounded-xl
                                  bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed
                                  opacity-0 group-hover/onecard:opacity-100 transition-opacity pointer-events-none">
                        Solo clientes verificados por OneCard pueden participar en esta campaña.
                        <div class="absolute bottom-full left-3 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"/>
                      </div>
                    </div>
                  </div>
                  <!-- Descripción si existe -->
                  <p v-if="c.descripcion" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[240px]">
                    {{ c.descripcion }}
                  </p>
                </div>
              </div>
            </td>

            <!-- ── Columna: Vigencia ── -->
            <td class="px-4 py-4 hidden md:table-cell">
              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ c.fecha_inicio }}
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  {{ c.fecha_fin }}
                </div>
              </div>
            </td>

            <!-- ── Columna: Audiencia ── -->
            <td class="px-4 py-4 hidden lg:table-cell">
              <span class="text-xs text-gray-600 dark:text-gray-300">
                {{ labelSegmentos(c.segmentos_permitidos) }}
              </span>
            </td>

            <!-- ── Columna: Estado ── -->
            <td class="px-4 py-4">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                :class="estadoConfig[estadoEfectivo(c)].cls"
              >
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="estadoConfig[estadoEfectivo(c)].dot" />
                {{ estadoConfig[estadoEfectivo(c)].label }}
              </span>
            </td>

            <!-- ── Columna: Menú ── -->
            <td class="px-3 py-4 text-right">
              <button
                @click="abrirMenu($event, c.id)"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Más opciones"
                title="Más opciones"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Menú flotante (Teleport + overlay) ─────────────────────────────── -->
    <Teleport to="body">
      <!-- Overlay invisible para capturar click fuera -->
      <div v-if="menuAbierto" class="fixed inset-0 z-40" @click="cerrarMenu" />

      <!-- Dropdown del menú -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="menuAbierto && menuCampana"
          class="fixed z-50 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl
                 border border-gray-100 dark:border-gray-700 py-1 origin-top-right"
          :style="menuStyle"
        >
          <!-- Configurar / Editar premios -->
          <button
            @click="accionConfigurar"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <svg class="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Configurar premios
          </button>

          <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

          <!-- Editar general -->
          <button
            v-if="menuCampana.estado === 'borrador' || estadoEfectivo(menuCampana) === 'pausada'"
            @click="abrirModalEditar(menuCampana)"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <svg class="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            Editar configuración
          </button>

          <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

          <!-- Activar -->
          <div class="relative group/activar">
            <button
              @click="menuCampana.tiene_premios ? accionCambiarEstado('activa') : undefined"
              :disabled="!menuCampana.tiene_premios"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
              :class="menuCampana.tiene_premios && (menuCampana.estado === 'borrador' || estadoEfectivo(menuCampana) === 'pausada')
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'"
              v-if="menuCampana.estado === 'borrador' || menuCampana.estado === 'pausada'"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3l14 9-14 9V3z"/>
              </svg>
              Activar campaña
            </button>
            <!-- Tooltip "sin premios" -->
            <div
              v-if="!menuCampana.tiene_premios && (menuCampana.estado === 'borrador' || menuCampana.estado === 'pausada')"
              class="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-44 p-2.5 rounded-xl
                     bg-gray-900 dark:bg-gray-700 text-white text-xs leading-snug
                     opacity-0 group-hover/activar:opacity-100 transition-opacity pointer-events-none z-10"
            >
              Agrega premios antes de activar esta campaña.
              <div class="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-700"/>
            </div>
          </div>

          <!-- Pausar -->
          <button
            v-if="menuCampana.estado === 'activa'"
            @click="accionCambiarEstado('pausada')"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400
                   hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Pausar campaña
          </button>

          <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

          <!-- Eliminar -->
          <button
            @click="pedirConfirmDelete(menuCampana)"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Eliminar
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal Confirmar Eliminación ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="confirmDelete"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             @click.self="confirmDelete = null">
          <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 ring-1 ring-black/5">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Eliminar campaña</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-5">
              ¿Confirmas que deseas eliminar
              <span class="font-semibold text-gray-900 dark:text-white">«{{ confirmDelete.nombre }}»</span>?
            </p>
            <div class="flex gap-3">
              <button @click="confirmDelete = null"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       text-sm font-medium text-gray-600 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button @click="ejecutarEliminar" :disabled="eliminando"
                class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                       transition-colors disabled:opacity-60">
                <svg v-if="eliminando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ eliminando ? 'Eliminando…' : 'Sí, eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal Nueva Campaña ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="mostrarModal"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             @click.self="cerrarModal">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
          >
            <div v-if="mostrarModal" class="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5">

              <!-- Header modal -->
              <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                    <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {{ campanaEditando ? 'Editar campaña' : 'Nueva campaña' }}
                    </h3>
                    <span v-if="!campanaEditando" class="inline-flex items-center gap-1 mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                      </svg>
                      Se guardará como Borrador
                    </span>
                  </div>
                </div>
                <button @click="cerrarModal" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Body modal -->
              <div class="px-6 py-5 space-y-6 max-h-[68vh] overflow-y-auto">

                <!-- Datos generales -->
                <div class="space-y-4">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Datos generales</p>
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label for="campana-nombre" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre <span class="text-red-500">*</span>
                      </label>
                      <span class="text-xs" :class="nombreRestante < 20 ? 'text-amber-500' : 'text-gray-400'">
                        {{ nombreRestante }} restantes
                      </span>
                    </div>
                    <input id="campana-nombre" v-model="form.nombre" type="text" maxlength="150" placeholder="Ej: Campaña Verano 2026"
                      @blur="nombreTouched = true"
                      class="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder:text-gray-300 dark:placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      :class="nombreError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'"/>
                    <p v-if="nombreError" class="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                      {{ nombreError }}
                    </p>
                  </div>
                  <div>
                    <label for="campana-descripcion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Descripción <span class="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                    </label>
                    <textarea id="campana-descripcion" v-model="form.descripcion" rows="2"
                      placeholder="Notas internas sobre esta campaña…"
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 resize-none
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             placeholder:text-gray-300 dark:placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"/>
                  </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-800" />

                <!-- Vigencia -->
                <div class="space-y-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Vigencia</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="campana-inicio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Inicio <span class="text-red-500">*</span>
                      </label>
                      <input id="campana-inicio" v-model="form.fecha_inicio" type="date"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"/>
                    </div>
                    <div>
                      <label for="campana-fin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Fin <span class="text-red-500">*</span>
                      </label>
                      <input id="campana-fin" v-model="form.fecha_fin" type="date"
                        class="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        :class="fechaFinError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'"/>
                    </div>
                  </div>
                  <p v-if="fechaFinError" class="flex items-center gap-1.5 text-xs text-red-500">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    {{ fechaFinError }}
                  </p>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-800" />

                <!-- Reglas de participación -->
                <div class="space-y-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reglas de participación</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <label for="campana-cooldown" class="text-sm font-medium text-gray-700 dark:text-gray-300">Cooldown (días)</label>
                        <div class="relative inline-block group/tip-cd">
                          <button type="button" class="text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                            </svg>
                          </button>
                          <div class="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-56 p-3 rounded-xl shadow-xl pointer-events-none
                                      bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed
                                      opacity-0 group-hover/tip-cd:opacity-100 transition-opacity duration-150">
                            Tiempo mínimo que debe esperar un cliente entre giro y giro. Con 15 días no puede volver hasta pasadas 2 semanas.
                            <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900 dark:border-t-gray-700"/>
                          </div>
                        </div>
                      </div>
                      <input id="campana-cooldown" v-model.number="form.cooldown_dias" type="number" min="1" max="365"
                        @blur="cooldownTouched = true"
                        class="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                        :class="cooldownError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'"/>
                      <p class="mt-1 flex items-center gap-1 text-xs" :class="cooldownError ? 'text-red-500' : 'text-gray-400'">
                        <svg v-if="cooldownError" class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                        {{ cooldownError || '1 – 365 días' }}
                      </p>
                    </div>
                    <div>
                      <label for="campana-max-giros" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Máx. giros por cliente
                      </label>
                      <input id="campana-max-giros" v-model.number="form.max_giros" type="number" min="1" max="100"
                        @blur="maxGirosTouched = true"
                        class="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                        :class="maxGirosError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'"/>
                      <p class="mt-1 flex items-center gap-1 text-xs" :class="maxGirosError ? 'text-red-500' : 'text-gray-400'">
                        <svg v-if="maxGirosError" class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                        {{ maxGirosError || '1 – 100 giros' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-800" />

                <!-- Audiencia -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Audiencia</p>
                    <span class="text-xs text-gray-400">
                      {{ form.segmentos_permitidos.length === 0 ? 'Todos los grupos' : `${form.segmentos_permitidos.length} seleccionados` }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <label v-for="s in TODOS_SEGMENTOS" :key="s" class="flex items-center gap-2.5 cursor-pointer group/seg">
                      <input
                        :id="`seg-${s}`"
                        type="checkbox"
                        class="sr-only"
                        :checked="form.segmentos_permitidos.includes(s)"
                        @change="toggleSegmento(s)"
                      />
                      <div class="flex-shrink-0 w-[18px] h-[18px] rounded border-2 transition-colors flex items-center justify-center
                                  group-hover/seg:border-indigo-400"
                           :class="form.segmentos_permitidos.includes(s)
                             ? 'bg-indigo-600 border-indigo-600'
                             : 'border-gray-300 dark:border-gray-600'">
                        <svg v-if="form.segmentos_permitidos.includes(s)" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover/seg:text-gray-900 dark:group-hover/seg:text-white transition-colors">
                        {{ SEGMENTO_LABELS[s] }}
                      </span>
                    </label>
                  </div>
                  <p class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    Sin selección = aplica para todos los grupos.
                  </p>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-800" />

                <!-- Validación OneCard -->
                <div class="space-y-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Configuración adicional</p>
                  <div class="flex items-center justify-between gap-4 p-4 rounded-xl
                              bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-1.5">
                      <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                          <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Requiere validación OneCard</span>
                          <div class="relative inline-block group/tip-oc">
                            <button type="button" class="text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                              </svg>
                            </button>
                            <div class="absolute z-30 bottom-full right-0 mb-2.5 w-60 p-3 rounded-xl shadow-xl pointer-events-none
                                        bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed
                                        opacity-0 group-hover/tip-oc:opacity-100 transition-opacity duration-150">
                              Consulta la API de OneCard para verificar que el cliente está afiliado y obtener su segmento antes de permitirle girar.
                              <div class="absolute top-full right-4 border-[5px] border-transparent border-t-gray-900 dark:border-t-gray-700"/>
                            </div>
                          </div>
                        </div>
                        <span class="text-xs text-gray-400 mt-0.5">
                          {{ form.requiere_validacion_onecard ? 'Solo clientes verificados por OneCard' : 'Sin verificación de membresía' }}
                        </span>
                      </div>
                    </div>
                    <button type="button" role="switch" :aria-checked="String(form.requiere_validacion_onecard)"
                      @click="form.requiere_validacion_onecard = !form.requiere_validacion_onecard"
                      class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      :class="form.requiere_validacion_onecard ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
                            :class="form.requiere_validacion_onecard ? 'translate-x-5' : 'translate-x-0'" />
                    </button>
                  </div>
                </div>

                <!-- Hora Feliz -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/50">
                    <div class="flex items-center gap-1.5">
                      <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                          <span class="text-sm font-bold text-amber-900 dark:text-amber-200">✨ Habilitar Hora Feliz</span>
                          <div class="relative inline-block group/tip-hf">
                            <button type="button" class="text-amber-400 hover:text-amber-600 transition-colors focus:outline-none">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                              </svg>
                            </button>
                            <div class="absolute z-30 bottom-full right-0 mb-2.5 w-60 p-3 rounded-xl shadow-xl pointer-events-none
                                        bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed
                                        opacity-0 group-hover/tip-hf:opacity-100 transition-opacity duration-150">
                              Durante este rango de horas diario, se incrementará la probabilidad de que los clientes ganen premios reales.
                              <div class="absolute top-full right-4 border-[5px] border-transparent border-t-gray-900 dark:border-t-gray-700"/>
                            </div>
                          </div>
                        </div>
                        <span class="text-xs text-amber-700/70 dark:text-amber-400 mt-0.5">
                          {{ habilitarHoraFeliz ? 'Configura el rango de horas' : 'Aumenta las probabilidades temporalmente' }}
                        </span>
                      </div>
                    </div>
                    <button type="button" role="switch" :aria-checked="String(habilitarHoraFeliz)"
                      @click="habilitarHoraFeliz = !habilitarHoraFeliz"
                      class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      :class="habilitarHoraFeliz ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
                            :class="habilitarHoraFeliz ? 'translate-x-5' : 'translate-x-0'" />
                    </button>
                  </div>
                  
                  <div v-if="habilitarHoraFeliz" class="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <div>
                      <label for="campana-hora-inicio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora Inicio <span class="text-red-500">*</span></label>
                      <input id="campana-hora-inicio" v-model="form.hora_feliz_inicio" type="time"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"/>
                    </div>
                    <div>
                      <label for="campana-hora-fin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora Fin <span class="text-red-500">*</span></label>
                      <input id="campana-hora-fin" v-model="form.hora_feliz_fin" type="time"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"/>
                    </div>
                  </div>
                </div>

                <!-- Error global -->
                <p v-if="errorModal" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ errorModal }}
                </p>
              </div>

              <!-- Footer modal -->
              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800
                          bg-gray-50/60 dark:bg-gray-900/50 rounded-b-2xl">
                <p class="text-xs text-gray-400 hidden sm:block">
                  Podrás activarla después de configurar los premios.
                </p>
                <div class="flex items-center gap-3 ml-auto">
                  <button @click="cerrarModal"
                    class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           text-sm font-medium text-gray-600 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Cancelar
                  </button>
                  <button @click="guardar" :disabled="store.guardando || !!fechaFinError"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                           transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="store.guardando ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'">
                    <svg v-if="store.guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    {{ store.guardando ? 'Guardando…' : (campanaEditando ? 'Guardar cambios' : 'Crear campaña') }}
                  </button>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
