<template>
  <!-- Widget global de SCNEXUS AI (Cool-turito) -->
  <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 print:hidden">
    <!-- Panel del chat -->
    <transition name="ct-panel">
      <div
        v-if="abierto"
        class="w-[min(24rem,calc(100vw-2rem))] h-[min(34rem,calc(100vh-7rem))] flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 bg-[#0c2340]">
          <CoolTurito :expression="expresion" variant="head" :size="38" />
          <div class="min-w-0 flex-1">
            <p class="text-white font-bold text-sm leading-tight">Cool-turito · SCNEXUS AI</p>
            <p class="text-[11px] text-sky-300 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="cargando ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
              Tu asistente inteligente
            </p>
          </div>
          <span
            v-if="cuota"
            class="text-[10px] font-semibold px-2 py-1 rounded-full"
            :class="cuota.advertencia ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-sky-200'"
            :title="`Cuota: ${cuota.usadas}/${cuota.limite} · se renueva ${horaRenueva}`"
          >
            {{ cuota.restantes }} restantes
          </span>
          <button
            class="text-slate-300 hover:text-white transition-colors p-1"
            aria-label="Cerrar asistente"
            @click="abierto = false"
          >
            <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M5 5 L15 15 M15 5 L5 15" />
            </svg>
          </button>
        </div>

        <!-- Aviso de cuota (advertencia: true → no ocultar la bandera) -->
        <div
          v-if="cuota?.advertencia"
          class="px-4 py-2 text-[11.5px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-b border-amber-200 dark:border-amber-500/20"
        >
          Te quedan {{ cuota.restantes }} consultas; se renuevan a las {{ horaRenueva }}.
        </div>

        <!-- Mensajes -->
        <div ref="listaRef" class="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
          <div v-for="(m, i) in mensajes" :key="i" class="flex" :class="m.rol === 'user' ? 'justify-end' : 'justify-start'">
            <!-- Bot -->
            <div v-if="m.rol === 'bot'" class="flex items-end gap-2 max-w-[88%]">
              <CoolTurito :expression="m.error ? 'disculpa' : m.sinContexto ? 'pensativo' : 'normal'" variant="head" :size="26" class="flex-none mb-0.5" />
              <div
                class="rounded-2xl rounded-bl-md px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-line"
                :class="m.error
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100'"
              >
                {{ m.texto }}
                <!-- Fuentes: siempre junto a la respuesta, hacen auditable lo afirmado -->
                <div v-if="m.fuentes?.length" class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="f in m.fuentes"
                    :key="`${f.area}/${f.documento}`"
                    class="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                    :title="f.titulo"
                  >
                    <span class="text-sky-600 dark:text-sky-400">{{ f.area }}</span>
                    <span class="truncate max-w-[11rem]">{{ f.documento }}</span>
                  </span>
                </div>
              </div>
            </div>
            <!-- Usuario -->
            <div v-else class="max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-[12.5px] leading-relaxed bg-blue-600 text-white">
              {{ m.texto }}
            </div>
          </div>

          <!-- Escribiendo… -->
          <div v-if="cargando" class="flex items-end gap-2">
            <CoolTurito expression="procesando" variant="head" :size="26" class="flex-none mb-0.5" />
            <div class="rounded-2xl rounded-bl-md px-3 py-2.5 bg-slate-100 dark:bg-slate-700/60 flex items-center gap-2">
              <span class="text-[12px] text-slate-500 dark:text-slate-300">Estoy consultando la información</span>
              <span class="flex gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:150ms"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:300ms"></span>
              </span>
            </div>
          </div>
        </div>

        <!-- Filtro de áreas (leídas de /v1/areas, nunca hardcodeadas) -->
        <div v-if="areas.length" class="px-3 pb-1 flex flex-wrap gap-1.5">
          <button
            class="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
            :class="!areaSeleccionada
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400'"
            @click="areaSeleccionada = null"
          >Todas</button>
          <button
            v-for="a in areas"
            :key="a.codigo"
            class="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
            :class="areaSeleccionada === a.codigo
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400'"
            @click="areaSeleccionada = areaSeleccionada === a.codigo ? null : a.codigo"
          >{{ a.codigo }}</button>
        </div>

        <!-- Input -->
        <form class="p-3 pt-2 flex gap-2 border-t border-slate-100 dark:border-slate-700" @submit.prevent="enviar">
          <input
            v-model="borrador"
            type="text"
            maxlength="2000"
            :disabled="cargando || !usuarioAd"
            :placeholder="usuarioAd ? 'Escribe tu pregunta…' : 'Inicia sesión para usar el asistente'"
            class="flex-1 min-w-0 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
          />
          <button
            type="submit"
            :disabled="cargando || !puedeEnviar"
            class="flex-none w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
            aria-label="Enviar pregunta"
          >
            <svg viewBox="0 0 20 20" class="w-4 h-4" fill="currentColor"><path d="M3,10 L17,3 L13,10 L17,17 Z" /></svg>
          </button>
        </form>
      </div>
    </transition>

    <!-- Botón flotante: Cool-turito de medio cuerpo, sin círculo contenedor -->
    <div v-if="!abierto" class="flex items-end gap-2">
      <button
        v-if="!globoDescartado"
        class="mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl rounded-br-md shadow-lg px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
        @click="abrir"
      >
        {{ nombreUsuario ? `¡Hola, ${nombreUsuario}!` : '' }} ¿Necesitas ayuda?
      </button>
      <button
        class="relative ct-fab focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-xl"
        aria-label="Abrir asistente SCNEXUS AI"
        @click="abrir"
        @mouseenter="saludar()"
      >
        <CoolTurito :expression="expresionFab" variant="half" :size="76" :animation="animacionFab" :gesture="asistente.gesto ?? 'none'" />
        <span class="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssistantStore } from '@/stores/assistant'
import CoolTurito from './CoolTurito.vue'
import { consultarAreas, consultarCuota, preguntar, MiaApiError, type MiaArea, type MiaCuota, type MiaFuente } from '@/services/miaApi'

interface Mensaje {
  rol: 'user' | 'bot'
  texto: string
  fuentes?: MiaFuente[]
  sinContexto?: boolean
  error?: boolean
}

const authStore = useAuthStore()
const asistente = useAssistantStore()
const route = useRoute()

const abierto = ref(false)
const globoDescartado = ref(false)
const borrador = ref('')
const cargando = ref(false)
const cuota = ref<MiaCuota | null>(null)
const areas = ref<MiaArea[]>([])
const areaSeleccionada = ref<string | null>(null)
const listaRef = ref<HTMLElement | null>(null)
const ultimoError = ref(false)

const mensajes = ref<Mensaje[]>([])

/** Login AD real del usuario autenticado (requisito de mIAApi: nunca un usuario genérico). */
const usuarioAd = computed(() => authStore.userData?.userName || authStore.user || '')

/** Nombre corto para saludar: primer nombre del fullName, o el login. */
const nombreUsuario = computed(() => {
  const completo = authStore.userData?.fullName?.trim()
  if (completo) return completo.split(/\s+/)[0]
  return authStore.userData?.userName || authStore.user || ''
})

/** El botón flotante saluda unos segundos (al cargar y al pasar el mouse) y luego queda flotando. */
const saludando = ref(true)
let saludoTimeout: ReturnType<typeof setTimeout> | null = null
function saludar(duracionMs = 3500): void {
  if (saludoTimeout) clearTimeout(saludoTimeout)
  saludando.value = true
  saludoTimeout = setTimeout(() => { saludando.value = false }, duracionMs)
}

/** Se duerme sin actividad (mouse/teclado) o al ocultar la pestaña; despierta con cualquier movimiento. */
const dormido = ref(false)
const INACTIVIDAD_MS = 120_000 // 2 minutos
let idleTimeout: ReturnType<typeof setTimeout> | null = null
function reiniciarInactividad(): void {
  dormido.value = false
  if (idleTimeout) clearTimeout(idleTimeout)
  idleTimeout = setTimeout(() => { dormido.value = true }, INACTIVIDAD_MS)
}
function onVisibilidad(): void {
  if (document.hidden) {
    dormido.value = true
    if (idleTimeout) clearTimeout(idleTimeout)
  } else {
    reiniciarInactividad()
    saludar(2000)
  }
}

onMounted(() => {
  saludar()
  reiniciarInactividad()
  window.addEventListener('mousemove', reiniciarInactividad, { passive: true })
  window.addEventListener('keydown', reiniciarInactividad)
  window.addEventListener('click', reiniciarInactividad)
  document.addEventListener('visibilitychange', onVisibilidad)
})
onUnmounted(() => {
  if (saludoTimeout) clearTimeout(saludoTimeout)
  if (idleTimeout) clearTimeout(idleTimeout)
  window.removeEventListener('mousemove', reiniciarInactividad)
  window.removeEventListener('keydown', reiniciarInactividad)
  window.removeEventListener('click', reiniciarInactividad)
  document.removeEventListener('visibilitychange', onVisibilidad)
})

const puedeEnviar = computed(() => borrador.value.trim().length > 0 && !!usuarioAd.value)

const horaRenueva = computed(() => {
  if (!cuota.value?.renueva) return ''
  const fecha = new Date(cuota.value.renueva)
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
})

/**
 * Expresión de la mascota según el estado del chat.
 * Prioridad: procesando > reacción pedida por la app > error > advertencia > feliz.
 */
const expresion = computed(() => {
  if (cargando.value) return 'procesando' as const
  if (asistente.reaccion) return asistente.reaccion
  if (ultimoError.value) return 'disculpa' as const
  if (cuota.value?.advertencia) return 'alerta' as const
  return 'normal' as const
})

/** Expresión del botón flotante: reacción > saludo > dormido > normal (ojos grandes). */
const expresionFab = computed(() => {
  if (asistente.reaccion) return asistente.reaccion
  if (saludando.value) return 'feliz' as const
  if (dormido.value) return 'durmiendo' as const
  return 'normal' as const
})
const animacionFab = computed(() => {
  if (saludando.value && !asistente.gesto) return 'wave' as const
  if (dormido.value) return 'none' as const
  return 'float' as const
})

/** Reacciona al cambiar de módulo: CEDI/Inventarios → transportando caja; el resto → saludo. */
watch(() => route.path.split('/')[1] ?? '', (nuevo, anterior) => {
  if (!nuevo || !anterior || nuevo === anterior) return
  if (/cedi|inventario/i.test(nuevo)) {
    asistente.reaccionar('feliz', 2800, 'caja')
  } else {
    asistente.reaccionar('feliz', 2000)
    saludar(2000)
  }
})

async function abrir(): Promise<void> {
  abierto.value = true
  globoDescartado.value = true
  if (!mensajes.value.length) {
    const saludo = nombreUsuario.value ? `¡Hola, ${nombreUsuario.value}!` : '¡Hola!'
    mensajes.value.push({
      rol: 'bot',
      texto: `${saludo} Soy Cool-turito, tu asistente de SCNEXUS. Respondo preguntas sobre los procesos, políticas y manuales publicados de la organización, citando siempre las fuentes. ¿Qué necesitas hacer?`,
    })
  }
  if (!usuarioAd.value) return
  // Cargas ligeras que no consumen cuota: saldo y áreas disponibles.
  if (!cuota.value) consultarCuota(usuarioAd.value).then(c => { cuota.value = c }).catch(() => {})
  if (!areas.value.length) consultarAreas().then(a => { areas.value = a.filter(x => x.con_documentos) }).catch(() => {})
}

async function enviar(): Promise<void> {
  const pregunta = borrador.value.trim()
  if (!pregunta || cargando.value || !usuarioAd.value) return
  borrador.value = ''
  ultimoError.value = false
  mensajes.value.push({ rol: 'user', texto: pregunta })
  cargando.value = true
  try {
    const r = await preguntar(
      usuarioAd.value,
      pregunta,
      areaSeleccionada.value ? [areaSeleccionada.value] : undefined,
    )
    cuota.value = r.cuota
    // sin_contexto: true no es un error — la respuesta ya viene redactada; no reintentar.
    mensajes.value.push({
      rol: 'bot',
      texto: r.respuesta,
      fuentes: r.fuentes,
      sinContexto: r.sin_contexto,
    })
  } catch (e) {
    ultimoError.value = true
    if (e instanceof MiaApiError) {
      if (e.cuota) cuota.value = e.cuota
      const sufijo = e.trazaId ? `\n(referencia: ${e.trazaId})` : ''
      mensajes.value.push({ rol: 'bot', texto: `${e.message}${sufijo}`, error: true })
    } else {
      mensajes.value.push({ rol: 'bot', texto: 'Ocurrió un error inesperado al consultar el asistente.', error: true })
    }
  } finally {
    cargando.value = false
  }
}

watch([() => mensajes.value.length, cargando], async () => {
  await nextTick()
  listaRef.value?.scrollTo({ top: listaRef.value.scrollHeight, behavior: 'smooth' })
})
</script>

<style scoped>
.ct-fab {
  filter: drop-shadow(0 8px 16px rgba(31, 127, 208, 0.4));
  transition: transform 0.15s ease-out;
}
.ct-fab:hover { transform: translateY(-2px); }

.ct-panel-enter-active, .ct-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.ct-panel-enter-from, .ct-panel-leave-to { opacity: 0; transform: translateY(10px) scale(0.98); }
</style>
