<template>
  <div class="space-y-6">
    <OdcSapVolverButton to="/mba3-consultas" title="Volver al Dashboard" class="shrink-0 self-start" />

    <!-- Header -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Administración · MBA3 Consultas
      </p>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">Destinatarios de Notificaciones</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Arrastra un correo del catálogo hasta la tarjeta de la persona, o tócalo y luego toca la
        tarjeta. Cada persona recibe solo los correos que aparecen en su tarjeta.
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
      <!-- Catálogo de correos -->
      <aside class="w-full lg:w-80 shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden lg:sticky lg:top-4">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-gray-900 dark:text-white">Catálogo de correos</h2>
            <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {{ catalogoFiltradoCount }} de {{ totalCatalogoCount }}
            </span>
          </div>
          <input
            v-model.trim="busquedaCatalogo"
            type="search"
            placeholder="Buscar correo o tipo"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <label class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="soloSinDestinatario"
              class="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
            />
            Ver solo los que no tienen destinatario
          </label>
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
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:bg-gray-700/60'"
              >
                <span class="truncate">{{ correo.tipo_correo }}</span>
                <span
                  class="shrink-0 inline-flex items-center justify-center min-w-[1.375rem] h-5 px-1 rounded-full text-[11px] font-semibold"
                  :class="(contadorPorCorreoId.get(correo.id) ?? 0) === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    : 'bg-gray-900/5 dark:bg-white/10 text-gray-700 dark:text-gray-200'"
                >
                  {{ contadorPorCorreoId.get(correo.id) ?? 0 }}
                </span>
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

      <!-- Personas -->
      <div class="flex-1 min-w-0 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Arrastra un correo a una persona, o tócalo y luego toca su tarjeta
          </p>
          <button
            type="button"
            @click="abrirModalNuevaPersona"
            class="shrink-0 px-3 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva persona
          </button>
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

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="persona in personasAgrupadasFiltradas"
            :key="persona.email"
            class="relative bg-white dark:bg-gray-800 rounded-lg border p-4 transition-colors"
            :class="personaCardEnDragOver === persona.email
              ? 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900/50'
              : 'border-gray-200 dark:border-gray-700'"
            @dragover.prevent="personaCardEnDragOver = persona.email"
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
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-xs font-medium text-gray-400 dark:text-gray-500">{{ persona.correos.length }}</span>
                <div class="relative">
                  <button
                    type="button"
                    title="Más acciones"
                    @click.stop="menuAccionesAbierto = menuAccionesAbierto === persona.email ? null : persona.email"
                    @blur="handleMenuAccionesBlur"
                    class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  <div
                    v-if="menuAccionesAbierto === persona.email"
                    class="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 py-1"
                  >
                    <button
                      type="button"
                      :disabled="procesandoPersonaId === persona.email"
                      @click.stop="eliminarPersona(persona)"
                      class="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Eliminar persona
                    </button>
                  </div>
                </div>
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

        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ correosSinDestinatarioCount }} correo{{ correosSinDestinatarioCount === 1 ? '' : 's' }} sin destinatario
        </p>
      </div>
    </div>

    <!-- Modal: Nueva persona -->
    <Teleport to="body">
      <dialog
        ref="modalNuevaPersonaRef"
        v-if="mostrarModalNuevaPersona"
        aria-labelledby="nueva-persona-modal-title"
        class="nueva-persona-dialog p-0 m-auto border-0 relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col focus:outline-none"
        @cancel.prevent="cerrarModalNuevaPersona"
        @click="onBackdropClickNuevaPersona"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 id="nueva-persona-modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">Nueva persona</h3>
          <button
            type="button"
            @click="cerrarModalNuevaPersona"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="agregarPersona" class="px-6 py-4 space-y-3 overflow-y-auto flex-1">
          <div class="relative">
            <input
              v-model.trim="nuevaPersonaEmail"
              type="text"
              required
              placeholder="Buscar usuario o escribir un correo externo"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              @focus="personaUsuarioDropdownOpen = true"
              @blur="handlePersonaUsuarioBlur"
            />
            <div
              v-if="personaUsuarioDropdownOpen && nuevaPersonaEmail.length >= 1"
              class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 max-h-48 overflow-y-auto shadow-lg"
            >
              <div v-if="!personaUsuarioSugerencias.length" class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                Sin coincidencias internas — puedes agregar este correo externo directamente
              </div>
              <button
                v-else
                v-for="usuario in personaUsuarioSugerencias"
                :key="usuario.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                @click="elegirPersonaUsuario(usuario)"
              >
                {{ usuario.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-xs font-medium text-gray-600 dark:text-gray-300">Correos que recibirá</p>
              <span v-if="nuevaPersonaCorreoIds.length" class="text-xs font-medium text-violet-600 dark:text-violet-400">
                {{ nuevaPersonaCorreoIds.length }} seleccionado{{ nuevaPersonaCorreoIds.length === 1 ? '' : 's' }}
              </span>
            </div>
            <div class="space-y-3 max-h-56 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div v-for="grupo in catalogoAgrupado" :key="grupo.tipo">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                  {{ etiquetaTipo(grupo.tipo) }}
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <label
                    v-for="correo in grupo.correos"
                    :key="correo.id"
                    :title="correo.descripcion || undefined"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors select-none"
                    :class="nuevaPersonaCorreoIds.includes(correo.id)
                      ? paletaTipoNotificacion(grupo.tipo).seleccionado
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:bg-gray-700'"
                  >
                    <input type="checkbox" :value="correo.id" v-model="nuevaPersonaCorreoIds" class="sr-only" />
                    <span
                      class="flex items-center justify-center h-3.5 w-3.5 rounded-full border shrink-0 transition-colors"
                      :class="nuevaPersonaCorreoIds.includes(correo.id) ? paletaTipoNotificacion(grupo.tipo).circulo : 'border-gray-300 dark:border-gray-500'"
                    >
                      <svg v-if="nuevaPersonaCorreoIds.includes(correo.id)" class="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {{ correo.tipo_correo }}
                  </label>
                </div>
              </div>
              <span v-if="tiposCorreoCatalogo.length === 0" class="text-xs text-gray-400 dark:text-gray-500">
                No hay correos en el catálogo todavía.
              </span>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <button
              type="button"
              @click="cerrarModalNuevaPersona"
              class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="agregandoPersona"
              class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar persona
            </button>
          </div>
        </form>
      </dialog>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import { notificacionTipoCorreoService, type TipoCorreo } from '../services/domains/notificacionTipoCorreo'
import { notificacionPersonaCorreoService, type PersonaCorreoRow } from '../services/domains/notificacionPersonaCorreo'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'

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
}

const PALETA_TIPO_NOTIFICACION: Record<string, PaletaTipoNotificacion> = {
  MABEL_TRADING: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    texto: 'text-emerald-600 dark:text-emerald-400',
    seleccionado: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    circulo: 'bg-emerald-600 border-emerald-600',
    punto: 'bg-emerald-500',
  },
  HOMOLOGACIONES: {
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    texto: 'text-teal-600 dark:text-teal-400',
    seleccionado: 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    circulo: 'bg-teal-600 border-teal-600',
    punto: 'bg-teal-500',
  },
  OPERACIONES: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    texto: 'text-purple-600 dark:text-purple-400',
    seleccionado: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    circulo: 'bg-purple-600 border-purple-600',
    punto: 'bg-purple-500',
  },
  PRODUCCION_ELRAYO: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    texto: 'text-amber-600 dark:text-amber-400',
    seleccionado: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    circulo: 'bg-amber-600 border-amber-600',
    punto: 'bg-amber-500',
  },
  TECNICOS: {
    badge: 'bg-vermilion-100 text-vermilion-800 dark:bg-vermilion-900/30 dark:text-vermilion-200',
    texto: 'text-vermilion-600 dark:text-vermilion-400',
    seleccionado: 'border-vermilion-500 bg-vermilion-50 dark:bg-vermilion-900/30 text-vermilion-700 dark:text-vermilion-300',
    circulo: 'bg-vermilion-600 border-vermilion-600',
    punto: 'bg-vermilion-500',
  },
}

const PALETA_TIPO_NOTIFICACION_DEFECTO: PaletaTipoNotificacion = {
  badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  texto: 'text-gray-600 dark:text-gray-400',
  seleccionado: 'border-gray-500 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  circulo: 'bg-gray-600 border-gray-600',
  punto: 'bg-gray-400',
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
const nuevaPersonaCorreoIds = ref<number[]>([])
const agregandoPersona = ref(false)
const procesandoPersonaId = ref<number | string | null>(null)
const personaUsuarioDropdownOpen = ref(false)

const personaUsuarioSugerencias = computed<UsuarioOption[]>(() => {
  const query = nuevaPersonaEmail.value.toLowerCase().trim()
  if (!query) return []
  return usuarios.value.filter((u) => u.label.toLowerCase().includes(query)).slice(0, 8)
})

function elegirPersonaUsuario(usuario: UsuarioOption) {
  nuevaPersonaEmail.value = usuario.email
  nuevaPersonaNombre.value = usuario.fullName || usuario.email
  personaUsuarioDropdownOpen.value = false
}

function handlePersonaUsuarioBlur() {
  setTimeout(() => {
    personaUsuarioDropdownOpen.value = false
  }, 150)
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

const personasAgrupadas = computed<PersonaAgrupada[]>(() => {
  const map = new Map<string, PersonaAgrupada>()
  for (const row of personasCorreo.value) {
    if (!map.has(row.email)) {
      map.set(row.email, { email: row.email, nombre: row.nombre, correos: [] })
    }
    map.get(row.email)!.correos.push(row)
  }
  return Array.from(map.values())
})

function correosDisponiblesPara(persona: PersonaAgrupada): TipoCorreo[] {
  const yaAsignados = new Set(persona.correos.map((c) => c.tipo_correo_id))
  return tiposCorreoCatalogo.value.filter((c) => !yaAsignados.has(c.id))
}

// ── Catálogo: búsqueda, filtro "sin destinatario" y contador por correo ──
const busquedaCatalogo = ref('')
const soloSinDestinatario = ref(false)

const contadorPorCorreoId = computed<Map<number, number>>(() => {
  const emailsPorCorreo = new Map<number, Set<string>>()
  for (const row of personasCorreo.value) {
    if (!emailsPorCorreo.has(row.tipo_correo_id)) emailsPorCorreo.set(row.tipo_correo_id, new Set())
    emailsPorCorreo.get(row.tipo_correo_id)!.add(row.email)
  }
  const contador = new Map<number, number>()
  for (const [id, emails] of emailsPorCorreo) contador.set(id, emails.size)
  return contador
})

const totalCatalogoCount = computed(() => tiposCorreoCatalogo.value.length)

const catalogoFiltrado = computed<GrupoCatalogo[]>(() => {
  const texto = busquedaCatalogo.value.trim().toLowerCase()
  return catalogoAgrupado.value
    .map((grupo) => ({
      tipo: grupo.tipo,
      correos: grupo.correos.filter((correo) => {
        if (soloSinDestinatario.value && (contadorPorCorreoId.value.get(correo.id) ?? 0) > 0) return false
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

const correosSinDestinatarioCount = computed(
  () => tiposCorreoCatalogo.value.filter((correo) => (contadorPorCorreoId.value.get(correo.id) ?? 0) === 0).length
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
  if (!equipoFiltroActivo.value) return personasAgrupadas.value
  return personasAgrupadas.value.filter((persona) =>
    persona.correos.some((correo) => correo.tipo_notificacion === equipoFiltroActivo.value)
  )
})

function avatarPaletaPersona(persona: PersonaAgrupada): PaletaTipoNotificacion | null {
  const primero = persona.correos[0]
  return primero ? paletaTipoNotificacion(primero.tipo_notificacion) : null
}

function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

// ── Vincular un correo con una persona: arrastrar y soltar, o tocar y tocar ──
const correoArrastrando = ref<TipoCorreo | null>(null)
const correoSeleccionadoParaVincular = ref<TipoCorreo | null>(null)
const personaCardEnDragOver = ref<string | null>(null)
const menuAccionesAbierto = ref<string | null>(null)

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

async function vincularCorreoConPersona(persona: PersonaAgrupada, correo: TipoCorreo) {
  const yaLoTiene = !correosDisponiblesPara(persona).some((c) => c.id === correo.id)
  if (yaLoTiene) return
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

function handleMenuAccionesBlur() {
  setTimeout(() => {
    menuAccionesAbierto.value = null
  }, 150)
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
}

// ── Modal "Nueva persona" (dialog nativo, ver UploadErrorModal.vue) ──
const mostrarModalNuevaPersona = ref(false)
const modalNuevaPersonaRef = ref<HTMLDialogElement | null>(null)

async function abrirModalNuevaPersona() {
  mostrarModalNuevaPersona.value = true
  await nextTick()
  modalNuevaPersonaRef.value?.showModal()
}

function cerrarModalNuevaPersona() {
  modalNuevaPersonaRef.value?.close()
  mostrarModalNuevaPersona.value = false
}

function onBackdropClickNuevaPersona(evento: MouseEvent) {
  if (evento.target === modalNuevaPersonaRef.value) cerrarModalNuevaPersona()
}

async function agregarPersona() {
  const email = nuevaPersonaEmail.value.trim()
  const nombre = nuevaPersonaNombre.value.trim() || email
  if (!email || nuevaPersonaCorreoIds.value.length === 0) {
    toast.error('Datos incompletos', 'Busca o escribe un correo y selecciona al menos un correo a enviar')
    return
  }
  if (!email.includes('@')) {
    toast.error('Correo inválido', `'${email}' no parece un email válido`)
    return
  }

  agregandoPersona.value = true
  try {
    for (const tipoCorreoId of nuevaPersonaCorreoIds.value) {
      await notificacionPersonaCorreoService.crearLink(nombre, email, tipoCorreoId)
    }
    await recargarPersonasCorreo()
    toast.success('Persona agregada', `${nombre} (${email})`)
    nuevaPersonaNombre.value = ''
    nuevaPersonaEmail.value = ''
    nuevaPersonaCorreoIds.value = []
    cerrarModalNuevaPersona()
  } catch (err: any) {
    toast.error('No se pudo agregar', extraerMensajeError(err, 'Error desconocido'))
    await recargarPersonasCorreo()
  } finally {
    agregandoPersona.value = false
  }
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
  } catch (err: any) {
    toast.error('No se pudo quitar el correo', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoPersonaId.value = null
  }
}

async function eliminarPersona(persona: PersonaAgrupada) {
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
</script>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear (pseudo-elemento fuera del arbol normal),
   por eso el nombre de clase bien especifico y el estilo sin "scoped" (ver UploadErrorModal.vue). */
.nueva-persona-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.5);
}
.dark .nueva-persona-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.7);
}
</style>
