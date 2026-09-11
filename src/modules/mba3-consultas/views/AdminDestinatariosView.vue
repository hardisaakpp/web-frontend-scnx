<template>
  <div class="space-y-6">
    <VolverButton to="/mba3-consultas" title="Volver al Dashboard" class="shrink-0 self-start" />

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Destinatarios de Notificaciones</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Busca a la persona para crear su tarjeta y luego arrastra (o toca) los correos del
        catálogo que le correspondan. Cada persona recibe solo los correos que aparecen en su tarjeta.
      </p>
    </div>

    <LoadingSpinner v-if="loadingPersonas" message="Cargando personas..." color="violet" />

    <div v-else-if="errorPersonas" class="p-8 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <p class="text-red-600 dark:text-red-400">{{ errorPersonas }}</p>
      <button @click="cargarPersonas" class="mt-4 text-violet-600 dark:text-violet-400 hover:underline">
        Reintentar
      </button>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- Personas -->
      <div class="flex-1 min-w-0 space-y-4">
        <div class="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5">
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </svg>
            <input
              v-model.trim="nuevaPersonaEmail"
              type="text"
              placeholder="Buscar usuario o escribir un correo externo"
              class="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              @focus="personaUsuarioDropdownOpen = true"
              @blur="handlePersonaUsuarioBlur"
              @keydown.enter.prevent="manejarEnterBusqueda"
              @keydown.down.prevent="moverSeleccionSugerencia(1)"
              @keydown.up.prevent="moverSeleccionSugerencia(-1)"
            />
            <button
              v-if="nuevaPersonaEmail.length > 0"
              type="button"
              title="Limpiar"
              aria-label="Limpiar búsqueda"
              @click="limpiarBusquedaPersona"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div
              v-if="personaUsuarioDropdownOpen && nuevaPersonaEmail.length >= 1"
              class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 max-h-48 overflow-y-auto shadow-lg"
            >
              <div v-if="!personaUsuarioSugerencias.length" class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                Sin coincidencias internas — presiona Enter para agregar este correo externo
              </div>
              <button
                v-else
                v-for="(usuario, index) in personaUsuarioSugerencias"
                :key="usuario.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                :class="index === indiceSugerenciaActiva
                  ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-200'"
                @click="elegirPersonaUsuario(usuario)"
              >
                {{ usuario.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            @click="equipoFiltroActivo = null"
            class="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
            :class="equipoFiltroActivo === null
              ? 'border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:bg-gray-700/60'"
          >
            Todos los equipos
          </button>
          <button
            v-for="equipo in equiposDisponibles"
            :key="equipo.tipo"
            type="button"
            @click="equipoFiltroActivo = equipo.tipo"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
            :class="equipoFiltroActivo === equipo.tipo
              ? equipo.paleta.seleccionado
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:bg-gray-700/60'"
          >
            <span class="h-1.5 w-1.5 rounded-full shrink-0" :class="equipo.paleta.punto"></span>
            {{ equipo.etiqueta }}
          </button>
        </div>

        <div
          v-if="personasAgrupadasFiltradas.length === 0"
          class="p-12 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <p class="text-gray-500 dark:text-gray-400">
            {{ personasAgrupadas.length === 0 ? 'Sin personas registradas' : 'Ninguna persona tiene correos de este equipo' }}
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" @dragover.prevent="manejarDragOverGeneral">
          <div
            v-for="persona in personasAgrupadasFiltradas"
            :key="persona.email"
            class="relative bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all"
            :class="[
              personaCardEnDragOver === persona.email
                ? (dropBloqueado(persona)
                    ? 'border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-900/50'
                    : 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900/50')
                : 'border-gray-200 dark:border-gray-700',
              procesandoPersonaId === persona.email ? 'opacity-60' : '',
              correoEnCurso() && dropBloqueado(persona) ? 'cursor-not-allowed' : '',
            ]"
            @dragover.prevent.stop="manejarDragOverTarjeta(persona, $event)"
            @dragleave="salirDeTarjeta(persona.email)"
            @drop.prevent="soltarEnTarjeta(persona)"
            @click="clicEnTarjeta(persona)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span
                  class="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="avatarPaletaPersona(persona)
                    ? `${avatarPaletaPersona(persona)!.circulo} text-white`
                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'"
                >
                  {{ inicialesDe(persona.nombre) }}
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ persona.nombre }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ persona.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <LoadingSpinner
                  v-if="procesandoPersonaId === persona.email"
                  size="xs"
                  color="violet"
                  layout="inline"
                  ariaLabel="Guardando"
                />
                <button
                  type="button"
                  title="Eliminar persona"
                  aria-label="Eliminar persona"
                  :disabled="procesandoPersonaId === persona.email"
                  @click.stop="eliminarPersona(persona)"
                  class="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
              <span v-if="persona.correos.length === 0" class="text-xs text-gray-400 dark:text-gray-500">
                Sin correos asignados
              </span>
              <span
                v-for="correo in persona.correos"
                :key="correo.id"
                :title="correo.descripcion || undefined"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                :class="paletaTipoNotificacion(correo.tipo_notificacion).badge"
              >
                <span class="h-1.5 w-1.5 rounded-full shrink-0" :class="paletaTipoNotificacion(correo.tipo_notificacion).punto"></span>
                {{ correo.tipo_correo }}
                <button
                  type="button"
                  title="Quitar este correo"
                  :disabled="procesandoPersonaId === correo.id"
                  @click.stop="quitarCorreoDePersona(correo)"
                  class="text-current opacity-60 hover:opacity-100 disabled:opacity-40"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Catálogo de correos -->
      <aside
        class="w-full lg:w-80 shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden lg:sticky lg:top-4"
        :class="{ 'catalogo-destacado': catalogoResaltado }"
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-gray-900 dark:text-white">Catálogo de correos</h2>
            <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {{ catalogoFiltradoCount }} de {{ totalCatalogoCount }}
            </span>
          </div>
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              v-model.trim="busquedaCatalogo"
              type="search"
              placeholder="Buscar correo o tipo"
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        <div class="p-3 space-y-3 max-h-[28rem] overflow-y-auto">
          <div v-for="grupo in catalogoFiltrado" :key="grupo.tipo">
            <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5 px-1">
              <span class="h-1.5 w-1.5 rounded-full shrink-0" :class="paletaTipoNotificacion(grupo.tipo).punto"></span>
              {{ etiquetaTipo(grupo.tipo) }}
            </p>
            <div class="space-y-1">
              <button
                v-for="correo in grupo.correos"
                :key="correo.id"
                type="button"
                draggable="true"
                :title="correo.descripcion || undefined"
                @dragstart="iniciarDrag(correo, $event)"
                @dragend="finalizarDrag"
                @click="alternarSeleccionCorreo(correo)"
                class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left text-xs cursor-grab active:cursor-grabbing transition-colors"
                :class="correoSeleccionadoParaVincular?.id === correo.id
                  ? paletaTipoNotificacion(grupo.tipo).seleccionado
                  : paletaTipoNotificacion(grupo.tipo).sutil"
              >
                <span class="truncate">{{ correo.tipo_correo }}</span>
              </button>
            </div>
          </div>
          <p v-if="totalCatalogoCount === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            No hay correos en el catálogo todavía.
          </p>
          <p v-else-if="catalogoFiltrado.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            Ningún correo coincide con la búsqueda.
          </p>
        </div>

        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$router.push('/mba3-consultas/admin/catalogo-correos')"
            class="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            → Gestionar catálogo
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import { notificacionTipoCorreoService, type TipoCorreo } from '../services/domains/notificacionTipoCorreo'
import { notificacionPersonaCorreoService, type PersonaCorreoRow } from '../services/domains/notificacionPersonaCorreo'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import VolverButton from '@/components/VolverButton.vue'
import { inicialesDe } from '@/utils/iniciales'

const toast = useToast()

const ETIQUETAS_TIPO: Record<string, string> = {
  OPERACIONES: 'Operaciones (El Rayo)',
  MABEL_TRADING: 'Mabel Trading',
  HOMOLOGACIONES: 'Homologaciones',
  TECNICOS: 'Técnicos',
  PRODUCCION_ELRAYO: 'Producción El Rayo',
}

function etiquetaTipo(tipo: string): string {
  return ETIQUETAS_TIPO[tipo] || tipo
}

// Orden estable para las píldoras de filtro y los grupos del catálogo (mismo orden semántico
// que ETIQUETAS_TIPO, EL RAYO/OPERACIONES primero).
const ORDEN_TIPOS_NOTIFICACION = ['OPERACIONES', 'MABEL_TRADING', 'HOMOLOGACIONES', 'PRODUCCION_ELRAYO', 'TECNICOS']

// Colores por tipo_notificacion, alineados a la paleta por permiso ya establecida en
// styleHelpers.ts (mabel.view = verde/esmeralda/teal, produccion-elrayo.view = ámbar,
// odcsap.view = púrpura): OPERACIONES notifica a EL RAYO (odcsap.view), MABEL_TRADING y
// HOMOLOGACIONES son funcionalidades de mabel.view (mismo tono distinto matiz para
// distinguirlas entre sí), PRODUCCION_ELRAYO es produccion-elrayo.view. TECNICOS no
// depende de un permiso de negocio (son notificaciones de error interno/soporte), así
// que usa 'vermilion', reservado en tailwind.config.js a estados de error.
interface PaletaTipoNotificacion {
  badge: string
  texto: string
  seleccionado: string
  circulo: string
  punto: string
  // Tonalidad muy tenue para el estado "sin seleccionar" de los botones del catálogo:
  // solo insinúa el color del equipo (fondo/borde clarísimos), sin competir con
  // `seleccionado`/`badge` que sí deben leerse como un color fuerte y decidido.
  sutil: string
}

const PALETA_TIPO_NOTIFICACION: Record<string, PaletaTipoNotificacion> = {
  MABEL_TRADING: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    texto: 'text-emerald-600 dark:text-emerald-400',
    seleccionado: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    circulo: 'bg-emerald-600 border-emerald-600',
    punto: 'bg-emerald-500',
    sutil: 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800',
  },
  HOMOLOGACIONES: {
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    texto: 'text-teal-600 dark:text-teal-400',
    seleccionado: 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    circulo: 'bg-teal-600 border-teal-600',
    punto: 'bg-teal-500',
    sutil: 'border-teal-100 dark:border-teal-900/40 bg-teal-50/60 dark:bg-teal-900/10 text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200 dark:hover:border-teal-800',
  },
  OPERACIONES: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    texto: 'text-purple-600 dark:text-purple-400',
    seleccionado: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    circulo: 'bg-purple-600 border-purple-600',
    punto: 'bg-purple-500',
    sutil: 'border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-900/10 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800',
  },
  PRODUCCION_ELRAYO: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    texto: 'text-amber-600 dark:text-amber-400',
    seleccionado: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    circulo: 'bg-amber-600 border-amber-600',
    punto: 'bg-amber-500',
    sutil: 'border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-800',
  },
  TECNICOS: {
    badge: 'bg-vermilion-100 text-vermilion-800 dark:bg-vermilion-900/30 dark:text-vermilion-200',
    texto: 'text-vermilion-600 dark:text-vermilion-400',
    seleccionado: 'border-vermilion-500 bg-vermilion-50 dark:bg-vermilion-900/30 text-vermilion-700 dark:text-vermilion-300',
    circulo: 'bg-vermilion-600 border-vermilion-600',
    punto: 'bg-vermilion-500',
    sutil: 'border-vermilion-100 dark:border-vermilion-900/40 bg-vermilion-50/60 dark:bg-vermilion-900/10 text-gray-700 dark:text-gray-200 hover:bg-vermilion-50 dark:hover:bg-vermilion-900/20 hover:border-vermilion-200 dark:hover:border-vermilion-800',
  },
}

const PALETA_TIPO_NOTIFICACION_DEFECTO: PaletaTipoNotificacion = {
  badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  texto: 'text-gray-600 dark:text-gray-400',
  seleccionado: 'border-gray-500 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  circulo: 'bg-gray-600 border-gray-600',
  punto: 'bg-gray-400',
  sutil: 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:bg-gray-700/60',
}

function paletaTipoNotificacion(tipo: string): PaletaTipoNotificacion {
  return PALETA_TIPO_NOTIFICACION[tipo] || PALETA_TIPO_NOTIFICACION_DEFECTO
}

function extraerMensajeError(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.message || fallback
}

// Búsqueda de usuarios existentes en Core/AD (GET /Users/list, solo Admin), usada por
// el formulario de "Nueva persona". No reemplaza el texto libre: hay destinatarios
// externos (proveedores, El Rayo) sin cuenta en AD.
interface UsuarioOption {
  id: string
  label: string
  fullName: string
  email: string
}

const usuarios = ref<UsuarioOption[]>([])

function normalizeUsuario(user: any): UsuarioOption {
  const id = String(user.id ?? user.Id ?? '')
  const fullName = String(user.fullName ?? user.FullName ?? user.name ?? '').trim()
  const email = String(user.email ?? user.Email ?? '').trim()
  const label = fullName && email ? `${fullName} (${email})` : email || fullName || id
  return { id, label, fullName, email }
}

async function cargarUsuarios() {
  try {
    const response = await api.get('/Users/list')
    const payload = response.data as any
    let items: any[]
    if (Array.isArray(payload)) {
      items = payload
    } else if (Array.isArray(payload?.data)) {
      items = payload.data
    } else {
      items = []
    }
    usuarios.value = items.map(normalizeUsuario).filter((u: UsuarioOption) => u.email)
  } catch {
    // Silencioso: si falla, los campos siguen funcionando como texto libre
    usuarios.value = []
  }
}

// ── Personas y Correos ───────────────────────────────────────────────────
const loadingPersonas = ref(true)
const errorPersonas = ref<string | null>(null)
const personasCorreo = ref<PersonaCorreoRow[]>([])
const tiposCorreoCatalogo = ref<TipoCorreo[]>([])
const nuevaPersonaNombre = ref('')
const nuevaPersonaEmail = ref('')
const procesandoPersonaId = ref<number | string | null>(null)
const personaUsuarioDropdownOpen = ref(false)

const personaUsuarioSugerencias = computed<UsuarioOption[]>(() => {
  const query = nuevaPersonaEmail.value.toLowerCase().trim()
  if (!query) return []
  const yaAgregados = emailsPersonasAgregadas.value
  return usuarios.value
    .filter((u) => !yaAgregados.has(u.email.toLowerCase()) && u.label.toLowerCase().includes(query))
    .slice(0, 8)
})

// Índice resaltado en el desplegable de sugerencias; se reinicia a la primera
// opción cada vez que cambia la lista (nueva búsqueda).
const indiceSugerenciaActiva = ref(0)

watch(personaUsuarioSugerencias, () => {
  indiceSugerenciaActiva.value = 0
})

function moverSeleccionSugerencia(delta: number) {
  const total = personaUsuarioSugerencias.value.length
  if (total === 0) return
  indiceSugerenciaActiva.value = (indiceSugerenciaActiva.value + delta + total) % total
}

function elegirPersonaUsuario(usuario: UsuarioOption) {
  agregarPersonaPendiente(usuario.fullName || usuario.email, usuario.email)
  limpiarBusquedaPersona()
}

function handlePersonaUsuarioBlur() {
  setTimeout(() => {
    personaUsuarioDropdownOpen.value = false
  }, 150)
}

// Buscador de personas (barra superior): Enter sobre un correo externo sin
// coincidencias en AD crea la tarjeta pendiente igual que elegir una sugerencia.
function iniciarAltaDesdeBusqueda() {
  const email = nuevaPersonaEmail.value.trim()
  if (!email) return
  if (!email.includes('@')) {
    toast.error('Correo inválido', `'${email}' no parece un email válido`)
    return
  }
  agregarPersonaPendiente(nuevaPersonaNombre.value, email)
  limpiarBusquedaPersona()
}

// La sugerencia resaltada (flechas arriba/abajo, primera por defecto) se confirma
// con Enter igual que si se le hiciera clic. Sin sugerencias, Enter cae al alta
// por correo externo.
function manejarEnterBusqueda() {
  const sugerenciaActiva = personaUsuarioSugerencias.value[indiceSugerenciaActiva.value]
  if (sugerenciaActiva) {
    elegirPersonaUsuario(sugerenciaActiva)
    return
  }
  iniciarAltaDesdeBusqueda()
}

function limpiarBusquedaPersona() {
  nuevaPersonaEmail.value = ''
  nuevaPersonaNombre.value = ''
  personaUsuarioDropdownOpen.value = false
}

interface GrupoCatalogo {
  tipo: string
  correos: TipoCorreo[]
}

const catalogoAgrupado = computed<GrupoCatalogo[]>(() => {
  const map = new Map<string, TipoCorreo[]>()
  for (const correo of tiposCorreoCatalogo.value) {
    if (!map.has(correo.tipo_notificacion)) map.set(correo.tipo_notificacion, [])
    map.get(correo.tipo_notificacion)!.push(correo)
  }
  return Array.from(map.entries()).map(([tipo, correos]) => ({ tipo, correos }))
})

interface PersonaAgrupada {
  email: string
  nombre: string
  correos: PersonaCorreoRow[]
}

// orden_flujo vive en el catálogo (TipoCorreo), no en cada fila persona-correo,
// así que hay que resolverlo por tipo_correo_id. Sin orden asignado, al final.
const ordenFlujoPorCorreoId = computed<Map<number, number>>(() => {
  const mapa = new Map<number, number>()
  for (const correo of tiposCorreoCatalogo.value) {
    mapa.set(correo.id, correo.orden_flujo ?? Number.MAX_SAFE_INTEGER)
  }
  return mapa
})

const personasAgrupadas = computed<PersonaAgrupada[]>(() => {
  const map = new Map<string, PersonaAgrupada>()
  for (const row of personasCorreo.value) {
    if (!map.has(row.email)) {
      map.set(row.email, { email: row.email, nombre: row.nombre, correos: [] })
    }
    map.get(row.email)!.correos.push(row)
  }
  const ordenFlujo = ordenFlujoPorCorreoId.value
  for (const persona of map.values()) {
    persona.correos.sort(
      (a, b) => (ordenFlujo.get(a.tipo_correo_id) ?? Number.MAX_SAFE_INTEGER) - (ordenFlujo.get(b.tipo_correo_id) ?? Number.MAX_SAFE_INTEGER)
    )
  }
  return Array.from(map.values())
})

// Personas pendientes: tarjeta sin ningún correo asignado (avatar gris = sin correo
// aún), ya sea porque se acaba de crear desde el buscador o porque se le quitó su
// último correo (ver quitarCorreoDePersona). No existen en el backend todavía (o ya
// no tienen ningún link ahí) — se persisten recién al arrastrar/tocar un correo
// (agregarCorreoAPersona), momento en que recargarPersonasCorreo() las quita de aquí
// porque ya aparecen en personasAgrupadas.
const personasPendientes = ref<PersonaAgrupada[]>([])

// Orden estable de aparición de las tarjetas: independiente del orden que devuelva
// el backend, para que una persona NO cambie de posición en el grid justo cuando
// pasa de "pendiente" a persistida (al recibir su primer correo).
const ordenPersonas = ref<string[]>([])

function registrarOrdenPersona(email: string) {
  if (!ordenPersonas.value.includes(email)) {
    ordenPersonas.value.push(email)
  }
}

watch(
  personasAgrupadas,
  (lista) => {
    for (const persona of lista) registrarOrdenPersona(persona.email)
  },
  { immediate: true }
)

function agregarPersonaPendiente(nombre: string, email: string) {
  const emailNorm = email.trim()
  if (!emailNorm) return
  const yaExiste = emailsPersonasAgregadas.value.has(emailNorm.toLowerCase())
  if (yaExiste) return
  personasPendientes.value.push({ email: emailNorm, nombre: nombre.trim() || emailNorm, correos: [] })
  registrarOrdenPersona(emailNorm)
  resaltarCatalogo()
}

// Personas que ya tienen tarjeta (persistidas o pendientes): se ocultan del
// buscador de personas para no ofrecer "agregar" a alguien que ya está agregado.
const emailsPersonasAgregadas = computed<Set<string>>(() => {
  const emails = personasAgrupadas.value.map((p) => p.email.toLowerCase())
  const pendientes = personasPendientes.value.map((p) => p.email.toLowerCase())
  return new Set([...emails, ...pendientes])
})

function correosDisponiblesPara(persona: PersonaAgrupada): TipoCorreo[] {
  const yaAsignados = new Set(persona.correos.map((c) => c.tipo_correo_id))
  return tiposCorreoCatalogo.value.filter((c) => !yaAsignados.has(c.id))
}

function personaTieneCorreo(persona: PersonaAgrupada, correoId: number): boolean {
  return persona.correos.some((c) => c.tipo_correo_id === correoId)
}

// ── Catálogo: búsqueda y contador por correo ──
const busquedaCatalogo = ref('')

// Resalta el panel del catálogo (animación CSS, ver <style>) justo al crear una
// tarjeta nueva, para indicar visualmente el siguiente paso: arrastrar/tocar un correo.
// Se mantiene pulsando en bucle hasta que el usuario interactúa con la interfaz
// (clic/toque o teclado), momento en que se apaga sola.
const catalogoResaltado = ref(false)
let resaltarCatalogoTimeoutId: ReturnType<typeof setTimeout> | null = null

function detenerResaltadoCatalogo() {
  catalogoResaltado.value = false
  window.removeEventListener('pointerdown', detenerResaltadoCatalogo)
  window.removeEventListener('keydown', detenerResaltadoCatalogo)
}

async function resaltarCatalogo() {
  if (resaltarCatalogoTimeoutId !== null) {
    clearTimeout(resaltarCatalogoTimeoutId)
    resaltarCatalogoTimeoutId = null
  }
  catalogoResaltado.value = false
  await nextTick()
  catalogoResaltado.value = true
  // El registro de los listeners se retrasa al siguiente ciclo del event loop (macrotask,
  // no microtask) para no capturar el propio clic/Enter que acaba de crear la tarjeta
  // (que también dispara pointerdown/keydown) como si fuera la interacción que la apaga.
  resaltarCatalogoTimeoutId = setTimeout(() => {
    resaltarCatalogoTimeoutId = null
    window.addEventListener('pointerdown', detenerResaltadoCatalogo)
    window.addEventListener('keydown', detenerResaltadoCatalogo)
  }, 0)
}

const totalCatalogoCount = computed(() => tiposCorreoCatalogo.value.length)

const catalogoFiltrado = computed<GrupoCatalogo[]>(() => {
  const texto = busquedaCatalogo.value.trim().toLowerCase()
  return catalogoAgrupado.value
    .map((grupo) => ({
      tipo: grupo.tipo,
      correos: grupo.correos.filter((correo) => {
        if (!texto) return true
        return (
          correo.tipo_correo.toLowerCase().includes(texto) ||
          etiquetaTipo(correo.tipo_notificacion).toLowerCase().includes(texto)
        )
      }),
    }))
    .filter((grupo) => grupo.correos.length > 0)
})

const catalogoFiltradoCount = computed(() =>
  catalogoFiltrado.value.reduce((total, grupo) => total + grupo.correos.length, 0)
)

const equiposDisponibles = computed(() => {
  const presentes = new Set(tiposCorreoCatalogo.value.map((c) => c.tipo_notificacion))
  return ORDEN_TIPOS_NOTIFICACION
    .filter((tipo) => presentes.has(tipo))
    .map((tipo) => ({ tipo, etiqueta: etiquetaTipo(tipo), paleta: paletaTipoNotificacion(tipo) }))
})

// ── Filtro de equipo (píldoras) sobre las tarjetas de personas ──
const equipoFiltroActivo = ref<string | null>(null)

const personasAgrupadasFiltradas = computed(() => {
  const persistidas = equipoFiltroActivo.value
    ? personasAgrupadas.value.filter((persona) =>
        persona.correos.some((correo) => correo.tipo_notificacion === equipoFiltroActivo.value)
      )
    : personasAgrupadas.value

  // Se combinan pendientes + persistidas (una persona pasa de un grupo al otro sin
  // duplicarse) y se ordenan según ordenPersonas, para que la tarjeta no cambie de
  // posición al recibir su primer correo. Las pendientes no tienen equipo por el
  // cual filtrarlas: siempre se muestran.
  const porEmail = new Map<string, PersonaAgrupada>()
  for (const persona of personasPendientes.value) porEmail.set(persona.email, persona)
  for (const persona of persistidas) porEmail.set(persona.email, persona)

  const indicePorEmail = new Map(ordenPersonas.value.map((email, indice) => [email, indice]))
  return Array.from(porEmail.values()).sort(
    (a, b) => (indicePorEmail.get(a.email) ?? Number.MAX_SAFE_INTEGER) - (indicePorEmail.get(b.email) ?? Number.MAX_SAFE_INTEGER)
  )
})

function avatarPaletaPersona(persona: PersonaAgrupada): PaletaTipoNotificacion | null {
  const primero = persona.correos[0]
  return primero ? paletaTipoNotificacion(primero.tipo_notificacion) : null
}

// ── Vincular un correo con una persona: arrastrar y soltar, o tocar y tocar ──
const correoArrastrando = ref<TipoCorreo | null>(null)
const correoSeleccionadoParaVincular = ref<TipoCorreo | null>(null)
const personaCardEnDragOver = ref<string | null>(null)

function iniciarDrag(correo: TipoCorreo, event: DragEvent) {
  correoArrastrando.value = correo
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', String(correo.id))
  }
}

function finalizarDrag() {
  correoArrastrando.value = null
  personaCardEnDragOver.value = null
}

function salirDeTarjeta(email: string) {
  if (personaCardEnDragOver.value === email) personaCardEnDragOver.value = null
}

// Correo que se está por vincular en este momento (arrastrando o ya seleccionado por
// tap), para saber si la tarjeta bajo el cursor ya lo tiene y bloquear el drop.
function correoEnCurso(): TipoCorreo | null {
  return correoArrastrando.value ?? correoSeleccionadoParaVincular.value
}

function dropBloqueado(persona: PersonaAgrupada): boolean {
  const correo = correoEnCurso()
  return correo ? personaTieneCorreo(persona, correo.id) : false
}

function manejarDragOverTarjeta(persona: PersonaAgrupada, event: DragEvent) {
  personaCardEnDragOver.value = persona.email
  if (!event.dataTransfer) return
  event.dataTransfer.dropEffect = dropBloqueado(persona) ? 'none' : 'copy'
}

// Cursor "permitido" por defecto en todo el área de tarjetas (huecos entre tarjetas,
// bordes del grid). Sin esto, el navegador muestra el símbolo prohibido por defecto en
// cualquier zona sin su propio handler de dragover, dando la falsa sensación de que el
// correo no se puede soltar en ningún lado. manejarDragOverTarjeta usa .stop para que,
// al estar sobre una tarjeta puntual, su propio cálculo (permitido/bloqueado) prevalezca.
function manejarDragOverGeneral(event: DragEvent) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

async function vincularCorreoConPersona(persona: PersonaAgrupada, correo: TipoCorreo) {
  if (personaTieneCorreo(persona, correo.id)) {
    toast.error('Correo ya asignado', `${persona.nombre} ya recibe "${correo.tipo_correo}"`)
    return
  }
  await agregarCorreoAPersona(persona, String(correo.id))
}

async function soltarEnTarjeta(persona: PersonaAgrupada) {
  const correo = correoArrastrando.value
  personaCardEnDragOver.value = null
  correoArrastrando.value = null
  if (!correo) return
  await vincularCorreoConPersona(persona, correo)
}

function alternarSeleccionCorreo(correo: TipoCorreo) {
  correoSeleccionadoParaVincular.value = correoSeleccionadoParaVincular.value?.id === correo.id ? null : correo
}

async function clicEnTarjeta(persona: PersonaAgrupada) {
  const correo = correoSeleccionadoParaVincular.value
  if (!correo) return
  correoSeleccionadoParaVincular.value = null
  await vincularCorreoConPersona(persona, correo)
}

async function cargarPersonas() {
  loadingPersonas.value = true
  errorPersonas.value = null
  try {
    const [personas, catalogo] = await Promise.all([
      notificacionPersonaCorreoService.getPersonasCorreo(),
      notificacionTipoCorreoService.getTiposCorreo(),
    ])
    personasCorreo.value = personas
    tiposCorreoCatalogo.value = catalogo.tipos_correo
  } catch (err: any) {
    errorPersonas.value = extraerMensajeError(err, 'No se pudo cargar Personas y Correos')
  } finally {
    loadingPersonas.value = false
  }
}

// El backend de crearLink solo devuelve id/nombre/email/tipo_correo_id (no
// tipo_correo/tipo_notificacion/descripcion ya resueltos), y reconstruirlos a
// mano localmente quedaba desincronizado en algunos casos (había que refrescar
// la página para verlos bien). Más simple y confiable: recargar desde el
// backend después de cada alta.
async function recargarPersonasCorreo() {
  personasCorreo.value = await notificacionPersonaCorreoService.getPersonasCorreo()
  // Una pendiente que acaba de recibir su primer correo ya viene en la respuesta:
  // deja de ser "pendiente" y pasa a mostrarse desde personasAgrupadas.
  const emailsReales = new Set(personasCorreo.value.map((row) => row.email.toLowerCase()))
  personasPendientes.value = personasPendientes.value.filter((p) => !emailsReales.has(p.email.toLowerCase()))
}

async function agregarCorreoAPersona(persona: PersonaAgrupada, tipoCorreoIdStr: string) {
  const tipoCorreoId = Number(tipoCorreoIdStr)
  if (!tipoCorreoId) return

  procesandoPersonaId.value = persona.email
  try {
    await notificacionPersonaCorreoService.crearLink(persona.nombre, persona.email, tipoCorreoId)
    await recargarPersonasCorreo()
  } catch (err: any) {
    toast.error('No se pudo agregar el correo', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoPersonaId.value = null
  }
}

async function quitarCorreoDePersona(correo: PersonaCorreoRow) {
  procesandoPersonaId.value = correo.id
  try {
    await notificacionPersonaCorreoService.eliminarLink(correo.id)
    personasCorreo.value = personasCorreo.value.filter((c) => c.id !== correo.id)
    // Si era el último correo de la persona, su tarjeta desaparecería del todo (ya no
    // hay fila suya en personasCorreo -> deja de existir en personasAgrupadas). Se
    // conserva como tarjeta "pendiente" (vacía, en gris), igual que al crear una nueva
    // desde el buscador, en vez de esfumarse.
    const sigueTeniendoCorreo = personasCorreo.value.some((c) => c.email === correo.email)
    if (!sigueTeniendoCorreo) {
      agregarPersonaPendiente(correo.nombre, correo.email)
    }
  } catch (err: any) {
    toast.error('No se pudo quitar el correo', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoPersonaId.value = null
  }
}

async function eliminarPersona(persona: PersonaAgrupada) {
  // Pendiente (sin correo asignado aún): solo existe en el cliente, nada que borrar en el backend.
  if (persona.correos.length === 0) {
    personasPendientes.value = personasPendientes.value.filter((p) => p.email !== persona.email)
    return
  }

  if (!window.confirm(`¿Eliminar a ${persona.nombre} (${persona.email}) y todos sus correos asignados?`)) {
    return
  }

  procesandoPersonaId.value = persona.email
  try {
    await notificacionPersonaCorreoService.eliminarPersona(persona.email)
    personasCorreo.value = personasCorreo.value.filter((c) => c.email !== persona.email)
    toast.success('Persona eliminada', persona.email)
  } catch (err: any) {
    toast.error('No se pudo eliminar', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoPersonaId.value = null
  }
}

onMounted(() => {
  cargarUsuarios()
  cargarPersonas()
})

onBeforeUnmount(() => {
  if (resaltarCatalogoTimeoutId !== null) clearTimeout(resaltarCatalogoTimeoutId)
  window.removeEventListener('pointerdown', detenerResaltadoCatalogo)
  window.removeEventListener('keydown', detenerResaltadoCatalogo)
})
</script>

<style scoped>
/* Guía visual: resalta el panel del catálogo al crear una tarjeta de persona nueva,
   para indicar que el siguiente paso es asignarle un correo. Efecto neón (tres capas
   de box-shadow: anillo nítido + resplandor medio + halo difuso amplio, como un foco
   encendiéndose) en vez de un simple anillo, para que realmente contraste y capte la
   atención; pulsa en bucle hasta que el usuario interactúa con la interfaz
   (ver detenerResaltadoCatalogo). */
@keyframes destacar-catalogo {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgba(253, 224, 71, 0),
      0 0 0 0 rgba(251, 191, 36, 0),
      0 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(253, 224, 71, 0.95),
      0 0 22px 8px rgba(251, 191, 36, 0.55),
      0 0 45px 18px rgba(245, 158, 11, 0.3);
  }
}
.catalogo-destacado {
  animation: destacar-catalogo 1.4s ease-in-out infinite;
}
</style>
