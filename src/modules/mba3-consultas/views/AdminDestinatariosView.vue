<template>
  <div class="space-y-6">
    <OdcSapVolverButton to="/mba3-consultas" title="Volver al Dashboard" class="shrink-0 self-start" />

    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Destinatarios de Notificaciones</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Correos que reciben cada tipo de notificación del sistema
        </p>
      </div>
      <button
        @click="$router.push('/mba3-consultas/admin/catalogo-correos')"
        class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
      >
        Catálogo de Correos →
      </button>
    </div>

    <!-- Personas y Correos: tabla real que usa el envío de correos -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Personas y Correos</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Vincula a cada persona con los correos específicos del catálogo que debería recibir.
          Esta es la tabla que realmente controla el envío: si alguien no aparece aquí para un
          correo, no lo recibe.
        </p>
      </div>

      <LoadingSpinner v-if="loadingPersonas" message="Cargando personas..." color="violet" />

      <div v-else-if="errorPersonas" class="p-8 text-center">
        <p class="text-red-600 dark:text-red-400">{{ errorPersonas }}</p>
        <button @click="cargarPersonas" class="mt-4 text-violet-600 dark:text-violet-400 hover:underline">
          Reintentar
        </button>
      </div>

      <template v-else>
        <!-- Agregar persona -->
        <form
          @submit.prevent="agregarPersona"
          class="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 min-w-[220px]">
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
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-violet-300 hover:bg-violet-50/60 dark:hover:bg-gray-700'"
                  >
                    <input type="checkbox" :value="correo.id" v-model="nuevaPersonaCorreoIds" class="sr-only" />
                    <span
                      class="flex items-center justify-center h-3.5 w-3.5 rounded-full border shrink-0 transition-colors"
                      :class="nuevaPersonaCorreoIds.includes(correo.id) ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-gray-500'"
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

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="agregandoPersona"
              class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar persona
            </button>
          </div>
        </form>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Correos</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="personasAgrupadas.length === 0">
                <td colspan="5" class="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                  Sin personas registradas
                </td>
              </tr>
              <tr v-for="persona in personasAgrupadas" :key="persona.email" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{{ persona.nombre }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ persona.email }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tipo in tiposDePersona(persona)"
                      :key="tipo"
                      class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 whitespace-nowrap"
                    >
                      {{ etiquetaTipo(tipo) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1.5 items-center">
                    <span
                      v-for="correo in persona.correos"
                      :key="correo.id"
                      :title="correo.descripcion || undefined"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 text-xs"
                    >
                      {{ correo.tipo_correo }}
                      <button
                        type="button"
                        title="Quitar este correo"
                        :disabled="procesandoPersonaId === correo.id"
                        @click="quitarCorreoDePersona(correo)"
                        class="text-violet-500 hover:text-violet-800 dark:hover:text-violet-100 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                    <div class="relative">
                      <button
                        type="button"
                        :disabled="procesandoPersonaId === persona.email"
                        @click="toggleCorreoDropdown(persona.email, $event)"
                        @blur="handleCorreoDropdownBlur"
                        class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-dashed border-violet-300 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 transition-colors"
                      >
                        <span class="text-sm leading-none">+</span> Correo
                      </button>
                      <!-- Teleport a <body>: la tarjeta "Personas y Correos" tiene overflow-hidden
                           (para redondear las esquinas de la tabla), así que un desplegable
                           absolute anidado adentro quedaba recortado. Con posición fixed calculada
                           desde el botón, ya no depende de ningún overflow de sus ancestros. -->
                      <Teleport to="body">
                        <div
                          v-if="correoDropdownAbierto === persona.email && correoDropdownPosition"
                          ref="correoDropdownRef"
                          class="fixed z-50 w-96 max-w-[90vw] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-y-auto shadow-lg"
                          :style="{
                            top: correoDropdownPosition.top !== undefined ? correoDropdownPosition.top + 'px' : undefined,
                            bottom: correoDropdownPosition.bottom !== undefined ? correoDropdownPosition.bottom + 'px' : undefined,
                            right: correoDropdownPosition.right + 'px',
                            maxHeight: correoDropdownPosition.maxHeight + 'px',
                          }"
                        >
                          <div v-if="!correosDisponiblesPara(persona).length" class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                            Ya tiene todos los correos del catálogo
                          </div>
                          <button
                            v-else
                            v-for="correo in correosDisponiblesPara(persona)"
                            :key="correo.id"
                            type="button"
                            class="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-gray-600 leading-snug"
                            @click="agregarCorreoAPersona(persona, String(correo.id)); correoDropdownAbierto = null"
                          >
                            <span class="font-medium text-indigo-600 dark:text-indigo-400">{{ etiquetaTipo(correo.tipo_notificacion) }}</span>
                            · {{ correo.tipo_correo }}
                          </button>
                        </div>
                      </Teleport>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    :disabled="procesandoPersonaId === persona.email"
                    @click="eliminarPersona(persona)"
                    class="text-sm text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

function extraerMensajeError(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.message || fallback
}

// Búsqueda de usuarios existentes en Core/AD (GET /Users/list, solo Admin), usada por
// el formulario de "Personas y Correos". No reemplaza el texto libre: hay destinatarios
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

function tiposDePersona(persona: PersonaAgrupada): string[] {
  return Array.from(new Set(persona.correos.map((c) => c.tipo_notificacion)))
}

interface CorreoDropdownPosition {
  right: number
  maxHeight: number
  top?: number
  bottom?: number
}

const DROPDOWN_MAX_HEIGHT = 288 // equivalente a max-h-72
const DROPDOWN_MIN_ESPACIO = 150 // debajo del botón, por debajo de esto se prueba abrir hacia arriba

const correoDropdownAbierto = ref<string | null>(null)
const correoDropdownPosition = ref<CorreoDropdownPosition | null>(null)
const correoDropdownRef = ref<HTMLElement | null>(null)

function toggleCorreoDropdown(email: string, event: MouseEvent) {
  if (correoDropdownAbierto.value === email) {
    correoDropdownAbierto.value = null
    correoDropdownPosition.value = null
    return
  }
  const boton = event.currentTarget as HTMLElement
  const rect = boton.getBoundingClientRect()
  const gap = 4
  const espacioAbajo = window.innerHeight - rect.bottom - gap
  const espacioArriba = rect.top - gap
  const abrirHaciaArriba = espacioAbajo < DROPDOWN_MIN_ESPACIO && espacioArriba > espacioAbajo

  correoDropdownPosition.value = {
    right: window.innerWidth - rect.right,
    maxHeight: Math.max(120, Math.min(DROPDOWN_MAX_HEIGHT, abrirHaciaArriba ? espacioArriba : espacioAbajo)),
    ...(abrirHaciaArriba ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
  }
  correoDropdownAbierto.value = email
}

function handleCorreoDropdownBlur() {
  setTimeout(() => {
    correoDropdownAbierto.value = null
    correoDropdownPosition.value = null
  }, 150)
}

// Cierra el desplegable teleportado si el usuario hace scroll de la página (su
// posición fixed quedaría desalineada del botón que lo abrió). El scroll interno
// de la lista (overflow-y-auto) también dispara 'scroll' en la fase de captura de
// window, así que se ignora cuando el evento viene de dentro del propio desplegable.
function handleWindowScrollCierraCorreoDropdown(event: Event) {
  if (correoDropdownAbierto.value === null) return
  const target = event.target as Node | null
  if (correoDropdownRef.value && target && correoDropdownRef.value.contains(target)) return
  correoDropdownAbierto.value = null
  correoDropdownPosition.value = null
}

onMounted(() => {
  window.addEventListener('scroll', handleWindowScrollCierraCorreoDropdown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleWindowScrollCierraCorreoDropdown, true)
})

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
