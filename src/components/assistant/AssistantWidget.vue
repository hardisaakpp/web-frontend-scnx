<template>
  <!-- Widget global de SCNEXUS AI (Cool-turito) -->
  <div
    ref="raizRef"
    class="fixed bottom-4 right-4 z-40 flex flex-col gap-3 print:hidden"
    :class="[
      anclado ? 'items-start' : 'items-end',
      { 'transition-[top,left,transform] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]': !arrastreActivo && !saltarTransicionAnclaje }
    ]"
    :style="estiloRaiz"
  >
    <!--
      Panel del chat / botón flotante: un solo <transition mode="out-in"> para los dos (mismo
      efecto de fundido+escala en ambos, anclado o flotante), en vez de transiciones
      independientes -- así el saliente termina de irse (`@after-leave`) antes de que el entrante
      aparezca, y recién ahí `panelVisible` cambia (ver estiloRaiz): si no, al cerrar estando
      anclado, la posición saltaba de golpe hacia el cajoncito (chico) mientras el panel (grande)
      todavía se veía desvaneciéndose ahí en el medio, como si "apareciera del otro lado".
    -->
    <transition name="ct-panel" mode="out-in" @after-leave="alTransicionarPanel">
      <div
        v-if="abierto"
        key="panel"
        class="w-[min(24rem,calc(100vw-2rem))] h-[min(34rem,calc(100vh-7rem))] flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 bg-[#0c2340]">
          <CoolTurito :expression="expresion" variant="head" :size="38" />
          <div class="min-w-0 flex-1">
            <p class="text-white font-bold text-sm leading-tight">mIA · SCNEXUS AI</p>
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

      <!-- Botón flotante: Cool-turito de medio cuerpo, sin círculo contenedor (o mini-avatar si está anclado) -->
      <div v-else key="fab" class="flex items-end gap-2" :class="{ 'flex-row-reverse': pegadoIzquierda && !anclado }">
        <button
          v-if="!globoDescartado && !anclado"
          class="mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
          :class="pegadoIzquierda ? 'rounded-bl-md' : 'rounded-br-md'"
          @click="abrir"
        >
          {{ nombreUsuario ? `¡Hola, ${nombreUsuario}!` : '' }} ¿Necesitas ayuda?
        </button>
        <button
          class="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-xl cursor-grab active:cursor-grabbing touch-none"
          :class="anclado ? '' : 'ct-fab'"
          :aria-label="anclado ? 'Abrir asistente SCNEXUS AI (anclado en el header)' : 'Abrir asistente SCNEXUS AI'"
          :title="anclado ? 'Abrir mIA · arrastra o clic con el botón central para volver a flotar' : ''"
          @pointerdown="iniciarArrastre"
          @click="onClickFab"
          @mousedown.middle.prevent="alternarAnclaje"
          @mouseenter="saludar()"
        >
          <CoolTurito
            :expression="expresionFab"
            :variant="anclado ? 'head' : 'half'"
            :size="anclado ? TAMANO_ANCLADO : TAMANO_FLOTANTE"
            :animation="anclado ? 'none' : animacionFab"
            :gesture="asistente.gesto ?? 'none'"
          />
          <span v-if="!anclado" class="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssistantStore } from '@/stores/assistant'
import CoolTurito from './CoolTurito.vue'
import { consultarAreas, consultarCuota, preguntar, MiaApiError, type MiaArea, type MiaCuota, type MiaFuente, type MiaTurno } from '@/services/miaApi'

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
/**
 * Espejo de `abierto`, pero retrasado hasta que el elemento saliente del `<transition mode="out-in">`
 * termine de irse (`alTransicionarPanel`, en `@after-leave`) -- lo usa `estiloRaiz` para decidir
 * la posición del panel/fab anclado. Si siguiera a `abierto` directamente, la posición saltaría en
 * el mismo instante en que se pide abrir/cerrar, mientras el elemento saliente todavía se ve
 * encogiéndose/agrandándose en el punto viejo (el bug de "aparece del otro lado").
 */
const panelVisible = ref(false)
const globoDescartado = ref(false)
const borrador = ref('')
const cargando = ref(false)
const cuota = ref<MiaCuota | null>(null)
const areas = ref<MiaArea[]>([])
const areaSeleccionada = ref<string | null>(null)
const listaRef = ref<HTMLElement | null>(null)
const raizRef = ref<HTMLElement | null>(null)
const ultimoError = ref(false)

const mensajes = ref<Mensaje[]>([])

/**
 * Arrastre del botón flotante: `offset` es el desplazamiento (px) respecto a la
 * esquina inferior derecha por defecto (bottom-4 right-4). Al soltar, se imanta al
 * borde (izquierdo o derecho) más cercano —conserva la altura, como en iOS AssistiveTouch—
 * y se persiste en localStorage.
 */
const CLAVE_POSICION = 'mia-widget-offset'
const UMBRAL_ARRASTRE = 4
const MARGEN_BORDE = 16 // mismo margen que bottom-4/right-4 (1rem)

/**
 * `window.innerWidth`/`innerHeight` incluyen el grosor de la scrollbar nativa (cuando la página
 * tiene una, como suele pasar en las vistas con tablas largas de este panel) -- la scrollbar se
 * pinta encima de cualquier contenido, incluido un widget `fixed`, así que un límite basado en
 * `innerWidth`/`innerHeight` deja que una parte del widget quede tapada debajo de ella (se ve
 * "cortada a la mitad"). `document.documentElement.clientWidth`/`clientHeight` sí excluyen la
 * scrollbar, así que son el límite real de la zona visible/interactiva para topar el widget.
 */
function anchoVisible(): number { return document.documentElement.clientWidth }
function altoVisible(): number { return document.documentElement.clientHeight }
const offset = ref({ x: 0, y: 0 })
/** true cuando el fab quedó imantado al borde izquierdo: el globo de saludo se dibuja a su derecha. */
const pegadoIzquierda = ref(false)
const arrastreActivo = ref(false)
/**
 * true muy brevemente justo al anclar/desanclar (ver `anclarWidget`/`desanclarWidget`): suprime la
 * transición CSS de posición del contenedor raíz para ese cambio puntual. Sin esto, el salto entre
 * la posición flotante (esquina inferior) y la anclada (cajoncito del header) -- muy distintas
 * entre sí, a diferencia del pequeño ajuste al imantarse a un borde -- se anima de forma rara: el
 * transform (translate) sí interpola, pero top/left vuelven a `auto` (se dejan de fijar) al pasar
 * a flotante, un valor que los navegadores no interpolan, así que quedaba una mezcla de salto y
 * deslizamiento en vez de aparecer directamente en el lugar nuevo, que es lo esperado en este caso.
 */
const saltarTransicionAnclaje = ref(false)
let huboMovimiento = false
let seAcabaDeArrastrar = false
let inicioArrastre = { x: 0, y: 0, offsetX: 0, offsetY: 0 }
let baseArrastre = { left: 0, top: 0, width: 0, height: 0 }
let observadorTamano: ResizeObserver | null = null

/**
 * Anclaje al cajoncito reservado junto al título del header (uno por header, móvil y escritorio
 * -- ver `IDS_SLOT_ANCLAJE`/MainLayout.vue): arrastrar el widget hasta ahí (o clic con el botón
 * central sobre él) lo "estaciona" en el header como mini-avatar, sin dejar de funcionar (sigue
 * abriendo el chat al click). Repetir el gesto lo devuelve a flotante. Se persiste junto al offset.
 */
const anclado = ref(false)
const TAMANO_ANCLADO = 40 // ancho (px) del SVG variant="head" mientras está anclado
const ALTO_ANCLADO = Math.round(TAMANO_ANCLADO * 140 / 164) // proporción del viewBox 'head' (28 6 164 140)
const MARGEN_ACIERTO_ANCLAJE = 20 // tolerancia (px) para soltar cerca del cajoncito, no exactamente encima
/** Se incrementa en cada cambio de layout (resize, sidebar, etc.) para forzar el recálculo de `estiloRaiz`. */
const anclajeVersion = ref(0)
/** Posición (viewport) del propio widget al iniciar un arrastre desde el estado anclado. */
let baseAnclajeArrastre: { top: number; left: number } | null = null

/** true por debajo del breakpoint `md` de Tailwind (768px, el mismo que gobierna `hidden md:block`/`md:hidden` en MainLayout.vue). */
const esMovil = ref(false)
let mqlMovil: MediaQueryList | null = null
function actualizarEsMovil(): void { esMovil.value = mqlMovil?.matches ?? false }
/** Tamaño (px) de Cool-turito de cuerpo completo flotante: más chico en móvil para no ocupar tanta pantalla. */
const TAMANO_FLOTANTE = computed(() => (esMovil.value ? 56 : 76))

/** Borde derecho del sidebar fijo (si está visible en pantalla), para no tapar ni imantar el widget debajo de él. */
function limiteIzquierdoSidebar(): number {
  const aside = document.getElementById('app-sidebar')
  if (!aside) return 0
  return Math.max(aside.getBoundingClientRect().right, 0)
}

/**
 * Borde superior hasta el que se puede arrastrar el widget cuya columna horizontal actual es
 * [left, left+width]: el borde inferior del header visible (móvil o escritorio), para no
 * superponerlo con contenido que no le corresponde (título, botón de tema, nombre de usuario).
 * Única excepción: si esa columna se solapa con el cajoncito de anclaje visible (móvil o
 * escritorio, con la misma tolerancia que el acierto de anclaje), el límite sube hasta su borde
 * superior — es la única "puerta" de entrada al header, del ancho del propio cajoncito.
 */
function limiteSuperiorHeader(left: number, width: number): number {
  let limite = 0
  for (const id of ['app-header-mobile', 'app-header-desktop']) {
    const el = document.getElementById(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.height > 0) limite = Math.max(limite, rect.bottom)
  }
  const slot = obtenerSlotAnclaje()
  if (slot) {
    const solapaConCajita = left + width >= slot.left - MARGEN_ACIERTO_ANCLAJE && left <= slot.right + MARGEN_ACIERTO_ANCLAJE
    if (solapaConCajita) limite = Math.min(limite, slot.top)
  }
  return limite
}

/**
 * Techo del header sin la excepción del cajoncito (a diferencia de `limiteSuperiorHeader`): el
 * widget flotante de cuerpo entero (no anclado) nunca puede quedar en reposo superpuesto al
 * header, ni siquiera parcialmente — solo el mini-avatar ya anclado puede aparecer dentro de él.
 * La excepción del cajoncito es solo un pasillo de entrada válido MIENTRAS se arrastra activamente
 * hacia el anclaje (`moverArrastre`); si el arrastre termina sin llegar a anclarse, `imantarABorde`
 * y `reajustarOffset` usan este límite estricto para devolverlo por debajo del header.
 */
function limiteSuperiorHeaderEstricto(): number {
  let limite = 0
  for (const id of ['app-header-mobile', 'app-header-desktop']) {
    const el = document.getElementById(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.height > 0) limite = Math.max(limite, rect.bottom)
  }
  return limite
}

/** ids de los cajoncitos de anclaje: uno por header (móvil/escritorio, ver MainLayout.vue) -- solo uno está visible a la vez (`hidden md:block` / `md:hidden`). */
const IDS_SLOT_ANCLAJE = ['coolturito-dock-slot-mobile', 'coolturito-dock-slot-desktop']

/** Rect del cajoncito de anclaje actualmente visible (móvil o escritorio), o null si ninguno lo está. */
function obtenerSlotAnclaje(): DOMRect | null {
  for (const id of IDS_SLOT_ANCLAJE) {
    const rect = document.getElementById(id)?.getBoundingClientRect()
    if (rect && rect.width > 0 && rect.height > 0) return rect
  }
  return null
}

/** Posición (viewport) centrada del mini-avatar dentro del cajoncito. */
function posicionCentradaEnSlot(rect: DOMRect): { top: number; left: number } {
  return {
    top: rect.top + (rect.height - ALTO_ANCLADO) / 2,
    left: rect.left + (rect.width - TAMANO_ANCLADO) / 2,
  }
}

/** true si el rect dado (posición/tamaño actual del widget) colisiona con el cajoncito de anclaje, con tolerancia — alcanza con que se toquen, no hace falta que el centro caiga dentro. */
function colisionaConSlotAnclaje(rect: { left: number; top: number; width: number; height: number }): boolean {
  const slot = obtenerSlotAnclaje()
  if (!slot) return false
  return (
    rect.left <= slot.right + MARGEN_ACIERTO_ANCLAJE && rect.left + rect.width >= slot.left - MARGEN_ACIERTO_ANCLAJE &&
    rect.top <= slot.bottom + MARGEN_ACIERTO_ANCLAJE && rect.top + rect.height >= slot.top - MARGEN_ACIERTO_ANCLAJE
  )
}

/**
 * true si el CURSOR (no el cuerpo arrastrado) cae sobre el cajoncito, con la misma tolerancia.
 * Usado solo para decidir el amague visual EN VIVO (`promoverAAnclado`, mientras se arrastra el
 * cuerpo completo) -- a diferencia de `colisionaConSlotAnclaje` (usada al soltar, con el rect
 * completo del cuerpo arrastrado, sin tocar). Con el cuerpo completo (76px+, bastante más grande
 * que el cajoncito de 48px), comprobar el rect entero disparaba el amague apenas un BORDE del
 * cuerpo rozaba la tolerancia, aunque el cursor (y el resto del cuerpo) siguiera bien lejos --
 * daba la sensación de que el cursor "se despegaba" del mini-avatar apenas se acercaba al header.
 * Al soltar, la decisión real de anclar sigue siendo la misma de siempre (`resolverSueltaFlotante`
 * → `colisionaConSlotAnclaje` con el cuerpo completo) -- esto solo decide cuándo se ve el amague
 * durante el arrastre, no cambia qué termina anclado al soltar.
 */
function cursorSobreCajoncito(clientX: number, clientY: number): boolean {
  const slot = obtenerSlotAnclaje()
  if (!slot) return false
  return (
    clientX >= slot.left - MARGEN_ACIERTO_ANCLAJE && clientX <= slot.right + MARGEN_ACIERTO_ANCLAJE &&
    clientY >= slot.top - MARGEN_ACIERTO_ANCLAJE && clientY <= slot.bottom + MARGEN_ACIERTO_ANCLAJE
  )
}

/**
 * Posición "natural" (sin el translate de arrastre) para el tamaño ACTUAL del contenido.
 * Se deriva del ancla CSS (bottom-4 right-4) usando solo rect.width/height, que el transform
 * no altera. OJO: no usar `rect.left - offset.x` para esto — mientras el propio contenedor o el
 * sidebar están a mitad de su transición (300ms), rect.left es una posición intermedia que no
 * coincide con el offset ya confirmado en JS, y el error se arrastra en cascada en cada reajuste.
 */
function baseNatural(rect: DOMRect): { left: number; top: number; width: number; height: number } {
  return {
    left: anchoVisible() - MARGEN_BORDE - rect.width,
    top: altoVisible() - MARGEN_BORDE - rect.height,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * `estricto`: true ignora la excepción del cajoncito (usar para la posición de REPOSO del widget
 * flotante — `imantarABorde`/`reajustarOffset`); false (default) permite el pasillo de entrada
 * hacia el cajoncito, solo válido mientras se arrastra activamente (`moverArrastre`).
 */
function limitarOffset(x: number, y: number, base: typeof baseArrastre, estricto = false): { x: number; y: number } {
  const minX = limiteIzquierdoSidebar() - base.left
  const maxX = anchoVisible() - base.width - base.left
  const clampedX = Math.min(Math.max(x, minX), maxX)
  const minY = (estricto ? limiteSuperiorHeaderEstricto() : limiteSuperiorHeader(base.left + clampedX, base.width)) - base.top
  const maxY = altoVisible() - base.height - base.top
  return { x: clampedX, y: Math.min(Math.max(y, minY), maxY) }
}

function iniciarArrastre(e: PointerEvent): void {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const el = raizRef.value
  if (!el) return
  if (anclado.value) {
    const rect = el.getBoundingClientRect()
    baseAnclajeArrastre = { top: rect.top, left: rect.left }
    inicioArrastre = { x: e.clientX, y: e.clientY, offsetX: 0, offsetY: 0 }
    offset.value = { x: 0, y: 0 }
  } else {
    baseArrastre = baseNatural(el.getBoundingClientRect())
    inicioArrastre = { x: e.clientX, y: e.clientY, offsetX: offset.value.x, offsetY: offset.value.y }
  }
  huboMovimiento = false
  arrastreActivo.value = true
  asistente.marcarArrastre(true)
  window.addEventListener('pointermove', moverArrastre)
  window.addEventListener('pointerup', terminarArrastre, { once: true })
}

/**
 * Clampa el arrastre del mini-avatar anclado a la zona de tolerancia alrededor del cajoncito --
 * su única área de movimiento permitida mientras siga contando como "seguir anclado" (los mismos
 * límites que hacen que `colisionaConSlotAnclaje` sea true, no solo el recuadro visual del
 * cajoncito): no puede tocar el resto del header, ni siquiera de paso. Usar la zona de tolerancia
 * completa (en vez de solo el recuadro de 48px) es a propósito: adentro de ella el cursor sigue
 * pegado al mini-avatar (el clamp casi nunca llega a activarse), en vez de quedar plantado en un
 * recuadro de apenas 6-7px de margen mientras el cursor se sigue moviendo dentro de la tolerancia.
 *
 * Además se intersecta con la zona visible real (0/`anchoVisible()`/`altoVisible()`, que excluyen
 * la scrollbar -- ver su comentario): el cajoncito vive pegado al borde derecho del header, así
 * que su zona de tolerancia (`MARGEN_ACIERTO_ANCLAJE` de más) puede sobrepasar el borde real de la
 * pantalla -- sin este tope, el mini-avatar se podía arrastrar hasta quedar tapado debajo de la
 * scrollbar (o de plano fuera de la ventana), sin ningún impedimento visible.
 */
function limitarOffsetAlCajoncito(x: number, y: number): { x: number; y: number } {
  if (!baseAnclajeArrastre) return { x, y }
  const slot = obtenerSlotAnclaje()
  if (!slot) return { x, y }
  const minX = Math.max(slot.left - MARGEN_ACIERTO_ANCLAJE - TAMANO_ANCLADO, 0) - baseAnclajeArrastre.left
  const maxX = Math.min(slot.right + MARGEN_ACIERTO_ANCLAJE, anchoVisible() - TAMANO_ANCLADO) - baseAnclajeArrastre.left
  const minY = Math.max(slot.top - MARGEN_ACIERTO_ANCLAJE - ALTO_ANCLADO, 0) - baseAnclajeArrastre.top
  const maxY = Math.min(slot.bottom + MARGEN_ACIERTO_ANCLAJE, altoVisible() - ALTO_ANCLADO) - baseAnclajeArrastre.top
  return { x: Math.min(Math.max(x, minX), maxX), y: Math.min(Math.max(y, minY), maxY) }
}

/** true si, con el offset (x,y) pedido, el mini-avatar anclado todavía colisiona con su cajoncito -- o sea, si soltar ahí seguiría contando como "anclado". */
function todaviaColisionaConCajoncito(x: number, y: number): boolean {
  if (!baseAnclajeArrastre) return false
  const rectActual = { left: baseAnclajeArrastre.left + x, top: baseAnclajeArrastre.top + y, width: TAMANO_ANCLADO, height: ALTO_ANCLADO }
  return colisionaConSlotAnclaje(rectActual)
}

/**
 * Promueve, en el mismo gesto (mismo puntero todavía presionado), un arrastre anclado que se alejó
 * del cajoncito a un arrastre flotante normal -- de ahí en más se lo trata exactamente igual que si
 * el usuario hubiera agarrado a Cool-turito ya flotante: mismo tamaño de cuerpo completo, mismo
 * muro/imantado al soltar (`resolverSueltaFlotante`), el mismo efecto que arrastrar y soltar en
 * cualquier parte de la pantalla. Solo aplica al SACARLO del cajoncito -- meterlo ya funciona así
 * (`resolverSueltaFlotante` → `anclarWidget`), no hace falta tocar ese camino.
 *
 * Centra el cuerpo completo (bastante más grande que el mini-avatar, y con otra proporción) en el
 * cursor en vez de conservar la esquina superior izquierda del mini-avatar: como el mini-avatar
 * venía confinado al cajoncito mientras el cursor podía haberse alejado bastante de él (zona 1 de
 * `moverArrastre`), esa esquina ya no tiene por qué estar cerca del cursor -- mantenerla fija dejaba
 * al cuerpo completo (y sobre todo, más alto que ancho) apareciendo lejos del cursor al agrandarse.
 */
function promoverAFlotante(e: PointerEvent): void {
  anclado.value = false
  nextTick(() => {
    const el = raizRef.value
    if (!el) return
    baseArrastre = baseNatural(el.getBoundingClientRect())
    const leftDeseado = e.clientX - baseArrastre.width / 2
    const topDeseado = e.clientY - baseArrastre.height / 2
    offset.value = limitarOffset(leftDeseado - baseArrastre.left, topDeseado - baseArrastre.top, baseArrastre)
    inicioArrastre = { x: e.clientX, y: e.clientY, offsetX: offset.value.x, offsetY: offset.value.y }
  })
}

/**
 * Simétrico a `promoverAFlotante`: al arrastrar el cuerpo completo (flotante) hasta acercar el
 * CURSOR al cajoncito (`cursorSobreCajoncito`), lo confina ahí mismo en el mismo gesto (mismo
 * puntero todavía presionado) -- se ve "encogerse" hacia el cajoncito mientras se lo sigue
 * arrastrando, en vez de recién notarse al soltar. Se dispara por la posición del CURSOR, no por
 * el rect completo del cuerpo arrastrado (mucho más grande que el cajoncito): usar el rect
 * disparaba el amague apenas un borde lejano del cuerpo rozaba la tolerancia, con el cursor todavía
 * bien lejos del cajoncito -- se sentía como que el cursor "se despegaba" del mini-avatar apenas se
 * acercaba al header. Al soltar, la decisión real de anclar sigue siendo la de siempre
 * (`resolverSueltaFlotante` → `colisionaConSlotAnclaje`, con el rect completo) -- no cambia CUÁNDO/SI
 * algo queda anclado al soltar, solo cuándo se ve el amague durante el arrastre. Si el usuario sigue
 * arrastrando y se aleja de nuevo del cajoncito antes de soltar, `promoverAFlotante` ya lo revierte
 * (mismo mecanismo, en sentido inverso).
 *
 * A diferencia de `promoverAFlotante` (que sí necesita esperar un `nextTick` para medir el tamaño
 * del cuerpo completo, desconocido de antemano), acá el tamaño del mini-avatar ya se conoce como
 * constante (`TAMANO_ANCLADO`/`ALTO_ANCLADO`), así que todo se calcula de una sola vez, sin esperar
 * ningún render: `baseAnclajeArrastre` queda listo antes de que Vue vuelva a pintar, centrado en el
 * cursor. Esperar al `nextTick` (como en un primer intento) dejaba `baseAnclajeArrastre` en null
 * durante ESE primer render, que entonces caía en la posición de reposo centrada en el cajoncito
 * -- ignorando cursor y arrastre -- y de ahí quedaba el mismo bug de "cursor separado" ya visto y
 * corregido en `promoverAFlotante`.
 */
function promoverAAnclado(e: PointerEvent): void {
  anclado.value = true
  baseAnclajeArrastre = { left: e.clientX - TAMANO_ANCLADO / 2, top: e.clientY - ALTO_ANCLADO / 2 }
  offset.value = limitarOffsetAlCajoncito(0, 0)
  inicioArrastre = { x: e.clientX, y: e.clientY, offsetX: offset.value.x, offsetY: offset.value.y }
}

function moverArrastre(e: PointerEvent): void {
  const dx = e.clientX - inicioArrastre.x
  const dy = e.clientY - inicioArrastre.y
  if (!huboMovimiento && Math.hypot(dx, dy) > UMBRAL_ARRASTRE) huboMovimiento = true
  if (!huboMovimiento) return
  if (anclado.value) {
    const x = inicioArrastre.offsetX + dx
    const y = inicioArrastre.offsetY + dy
    if (todaviaColisionaConCajoncito(x, y)) {
      offset.value = limitarOffsetAlCajoncito(x, y)
    } else {
      promoverAFlotante(e)
    }
    return
  }
  if (cursorSobreCajoncito(e.clientX, e.clientY)) {
    promoverAAnclado(e)
  } else {
    offset.value = limitarOffset(inicioArrastre.offsetX + dx, inicioArrastre.offsetY + dy, baseArrastre)
  }
}

function terminarArrastre(e: PointerEvent): void {
  arrastreActivo.value = false
  asistente.marcarArrastre(false)
  window.removeEventListener('pointermove', moverArrastre)
  if (!huboMovimiento) {
    // Tap sin arrastre: abrir aquí mismo (pointerup), no esperar al `click` sintetizado por el
    // navegador -- en táctil ese click puede llegar tarde o directamente no llegar, y hacía falta
    // un segundo toque para abrir el chat. Si el click síntetico sí llega después, `onClickFab` ve
    // `seAcabaDeArrastrar` y no vuelve a abrir (evita abrir dos veces con mouse/touch normales).
    abrir()
    seAcabaDeArrastrar = true
    return
  }
  seAcabaDeArrastrar = true
  if (anclado.value) {
    resolverSueltaDesdeAnclado(e.clientX)
  } else {
    resolverSueltaFlotante()
  }
}

/** Al soltar desde flotante: si colisiona con el cajoncito del header, se ancla; si no, se imanta al borde de siempre. */
function resolverSueltaFlotante(): void {
  const rectActual = { left: baseArrastre.left + offset.value.x, top: baseArrastre.top + offset.value.y, width: baseArrastre.width, height: baseArrastre.height }
  if (colisionaConSlotAnclaje(rectActual)) {
    anclarWidget()
  } else {
    imantarABorde()
  }
  guardarPosicion()
}

/** Al soltar desde anclado: si sigue colisionando con el cajoncito, permanece anclado; si se arrastró fuera, vuelve a flotar. */
function resolverSueltaDesdeAnclado(ultimoClientX: number): void {
  if (!baseAnclajeArrastre) return
  const rectActual = { left: baseAnclajeArrastre.left + offset.value.x, top: baseAnclajeArrastre.top + offset.value.y, width: TAMANO_ANCLADO, height: ALTO_ANCLADO }
  if (colisionaConSlotAnclaje(rectActual)) {
    // Sin esto, este pequeño ajuste (encajar del todo en el centro del cajoncito) se animaba con
    // la transición de 300ms -- ya no queda arrastre activo para suprimirla (ver saltarTransicionAnclaje).
    saltarTransicionAnclaje.value = true
    offset.value = { x: 0, y: 0 }
    guardarPosicion()
    nextTick(() => requestAnimationFrame(() => { saltarTransicionAnclaje.value = false }))
    return
  }
  desanclarWidget(ultimoClientX, rectActual.top)
}

/**
 * Al soltar sin anclar, pega el widget al borde horizontal más cercano (respetando el sidebar);
 * la altura queda donde se soltó, salvo que el pasillo de entrada al cajoncito la haya dejado
 * superpuesta al header — clamp estricto (sin la excepción del cajoncito) para evitarlo, ya que
 * el widget queda flotante de cuerpo entero, y ese nunca puede quedar dentro del header.
 */
function imantarABorde(): void {
  const centroX = baseArrastre.left + offset.value.x + baseArrastre.width / 2
  const pegarIzquierda = centroX < window.innerWidth / 2
  const xIzquierda = limiteIzquierdoSidebar() - baseArrastre.left + MARGEN_BORDE
  const xDerecha = window.innerWidth - baseArrastre.width - baseArrastre.left - MARGEN_BORDE
  const candidato = pegarIzquierda ? xIzquierda : xDerecha
  offset.value = limitarOffset(candidato, offset.value.y, baseArrastre, true)
  pegadoIzquierda.value = pegarIzquierda
}

/** Estaciona a Cool-turito en el cajoncito del header: queda reducido, pero sigue abriendo el chat al click. */
function anclarWidget(): void {
  saltarTransicionAnclaje.value = true
  anclado.value = true
  abierto.value = false
  offset.value = { x: 0, y: 0 }
  nextTick(() => requestAnimationFrame(() => { saltarTransicionAnclaje.value = false }))
}

/**
 * Devuelve a Cool-turito a flotante, imantado al borde horizontal más cercano al punto donde se
 * soltó/activó. `topAbsoluto` (posición vertical en viewport donde quedó al soltar el arrastre)
 * se conserva igual que en `imantarABorde` — si no se da (p. ej. clic con el botón central,
 * sin gesto de arrastre), cae a la posición natural inferior.
 */
function desanclarWidget(clientX: number, topAbsoluto?: number): void {
  saltarTransicionAnclaje.value = true
  anclado.value = false
  pegadoIzquierda.value = clientX < window.innerWidth / 2
  nextTick(() => {
    reajustarOffset(topAbsoluto)
    guardarPosicion()
    nextTick(() => requestAnimationFrame(() => { saltarTransicionAnclaje.value = false }))
  })
}

/** Alterna anclado/flotante (usado por el clic con el botón central); no depende de dónde esté el puntero. */
function alternarAnclaje(): void {
  if (anclado.value) {
    desanclarWidget(pegadoIzquierda.value ? 0 : window.innerWidth)
  } else {
    anclarWidget()
    guardarPosicion()
  }
}

function guardarPosicion(): void {
  try {
    localStorage.setItem(CLAVE_POSICION, JSON.stringify({ ...offset.value, izquierda: pegadoIzquierda.value, anclado: anclado.value }))
  } catch { /* localStorage no disponible */ }
}

/** Evita abrir el asistente cuando el click en el fab en realidad fue el final de un arrastre. */
function onClickFab(): void {
  if (seAcabaDeArrastrar) { seAcabaDeArrastrar = false; return }
  abrir()
}

/**
 * Con el panel abierto, un click fuera del widget lo cierra (clicks dentro del panel no cuentan).
 * Escucha 'pointerdown' (no 'click'): ese evento ocurre ANTES del click que abre el chat, así que
 * para el mismo gesto que abre, este chequeo siempre corre con `abierto` todavía en false y no
 * puede interferir con la apertura.
 */
function cerrarSiClickFuera(e: PointerEvent): void {
  if (!abierto.value) return
  if (raizRef.value && !raizRef.value.contains(e.target as Node)) {
    abierto.value = false
  }
}

/**
 * Recalcula el offset horizontal según el borde al que está pegado el widget, usando el tamaño
 * ACTUAL del contenido (fab pequeño o panel grande). No basta con acotar el offset guardado: al
 * abrir/cerrar el chat el ancho cambia drásticamente y ese offset queda desalineado del borde,
 * dejando a Cool-turito flotando "en el aire". Se llama al cambiar de tamaño de ventana y al
 * abrir/cerrar el panel.
 */
function reajustarOffset(yAbsolutoPreferido?: number): void {
  const el = raizRef.value
  if (!el) return
  const base = baseNatural(el.getBoundingClientRect())
  const xAncla = pegadoIzquierda.value ? limiteIzquierdoSidebar() - base.left + MARGEN_BORDE : 0
  const y = yAbsolutoPreferido !== undefined ? yAbsolutoPreferido - base.top : offset.value.y
  offset.value = limitarOffset(xAncla, y, base, true)
}

/**
 * Posición/estilo del contenedor raíz. Anclado (y sin arrastre en curso): se fija sobre el
 * cajoncito del header vía top/left, leído en vivo de `anclajeVersion` (getBoundingClientRect
 * no es reactivo por sí solo) — salvo que el chat esté visible (`panelVisible`, no `abierto`
 * directamente -- ver su declaración): el panel (384px de ancho) no cabe centrado en el cajoncito
 * de 48px sin salirse de la pantalla, así que en ese caso cuelga hacia abajo desde el header,
 * pegado al borde visible de la pantalla (mismo margen `MARGEN_BORDE` que el widget flotante en
 * reposo) -- NO al borde del cajoncito: en el header móvil el cajoncito ya no es el elemento más a
 * la derecha (el botón de tema quedó a su derecha), así que alinear el panel al cajoncito lo dejaba
 * corrido hacia la izquierda, con un hueco vacío hasta el borde real. Anclado y arrastrando: el
 * top/left queda congelado en la posición donde empezó el arrastre y solo se anima el translate,
 * igual que el modo flotante (el chat no puede estar abierto mientras se arrastra: el fab que
 * inicia el arrastre solo se renderiza con el chat cerrado). Si el cajoncito no existe (p. ej.
 * header de escritorio oculto en móvil), cae a flotante.
 */
const estiloRaiz = computed(() => {
  // Se lee (sin usar el valor) solo para registrar anclajeVersion como dependencia reactiva de
  // este computed y forzar el recalculo ante resize/observers (ver su declaracion). Asignada a
  // una const, en vez de dejarla como expresion suelta, para no disparar typescript:S905 -- la
  // lectura de .value ocurre igual dentro del computed, así que el tracking no cambia.
  const _anclajeVersion = anclajeVersion.value
  if (anclado.value) {
    if (arrastreActivo.value && baseAnclajeArrastre) {
      return {
        top: `${baseAnclajeArrastre.top}px`, left: `${baseAnclajeArrastre.left}px`,
        right: 'auto', bottom: 'auto',
        transform: `translate(${offset.value.x}px, ${offset.value.y}px)`,
      }
    }
    const slot = obtenerSlotAnclaje()
    if (slot) {
      if (panelVisible.value) {
        return {
          top: `${slot.bottom + MARGEN_BORDE}px`, left: 'auto',
          right: `${window.innerWidth - anchoVisible() + MARGEN_BORDE}px`, bottom: 'auto',
          transform: 'none',
        }
      }
      const pos = posicionCentradaEnSlot(slot)
      return { top: `${pos.top}px`, left: `${pos.left}px`, right: 'auto', bottom: 'auto', transform: 'none' }
    }
  }
  return { transform: `translate(${offset.value.x}px, ${offset.value.y}px)` }
})

/**
 * `@after-leave` del `<transition mode="out-in">` panel/fab: recién cuando el saliente terminó de
 * irse, `panelVisible` pasa a reflejar el `abierto` ya vigente -- ver su declaración para el porqué
 * del retraso. `mode="out-in"` garantiza que esto corre justo antes de montar el entrante, con la
 * posición ya correcta.
 */
function alTransicionarPanel(): void {
  panelVisible.value = abierto.value
}

/**
 * Reposiciona ante cualquier cambio de layout: recalcula el offset flotante, o solo marca sucio el
 * anclaje. Se salta `reajustarOffset` mientras hay un arrastre activo (`arrastreActivo`): el
 * tamaño del widget cambia de golpe al promover un arrastre anclado a flotante a mitad de gesto
 * (`promoverAFlotante`), y el ResizeObserver que dispara esta función competiría por la misma
 * posición con el propio cálculo de la promoción -- el arrastre en curso manda, no un resize.
 */
function onCambioLayout(): void {
  if (!anclado.value && !arrastreActivo.value) reajustarOffset()
  anclajeVersion.value++
}

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

/** El globo "¿Necesitas ayuda?" se retira solo a los 15s si el usuario no lo cerró interactuando. */
const DURACION_GLOBO_MS = 10_000
let globoTimeout: ReturnType<typeof setTimeout> | null = null

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
  globoTimeout = setTimeout(() => { globoDescartado.value = true }, DURACION_GLOBO_MS)
  mqlMovil = window.matchMedia('(max-width: 767.98px)')
  actualizarEsMovil()
  mqlMovil.addEventListener('change', actualizarEsMovil)
  try {
    const guardado = localStorage.getItem(CLAVE_POSICION)
    if (guardado) {
      const datos = JSON.parse(guardado)
      offset.value = { x: datos.x ?? 0, y: datos.y ?? 0 }
      pegadoIzquierda.value = !!datos.izquierda
      anclado.value = !!datos.anclado
    }
  } catch { /* localStorage no disponible */ }
  nextTick(onCambioLayout)
  // Cualquier cambio de ancho/alto del widget (abrir/cerrar chat, globo que se descarta,
  // texto de saludo que cambia al cargar el usuario, etc.), del sidebar (se expande al pasar
  // el mouse, 80px→288px) o del cajoncito de anclaje del header puede dejar la posición
  // desalineada — el ResizeObserver lo detecta en vivo sin tener que enumerar cada causa.
  observadorTamano = new ResizeObserver(() => onCambioLayout())
  if (raizRef.value) observadorTamano.observe(raizRef.value)
  const sidebar = document.getElementById('app-sidebar')
  if (sidebar) observadorTamano.observe(sidebar)
  for (const id of IDS_SLOT_ANCLAJE) {
    const slotAnclaje = document.getElementById(id)
    if (slotAnclaje) observadorTamano.observe(slotAnclaje)
  }
  window.addEventListener('mousemove', reiniciarInactividad, { passive: true })
  window.addEventListener('keydown', reiniciarInactividad)
  window.addEventListener('click', reiniciarInactividad)
  window.addEventListener('pointerdown', cerrarSiClickFuera)
  window.addEventListener('resize', onCambioLayout)
  document.addEventListener('visibilitychange', onVisibilidad)
})
onUnmounted(() => {
  if (saludoTimeout) clearTimeout(saludoTimeout)
  if (idleTimeout) clearTimeout(idleTimeout)
  if (globoTimeout) clearTimeout(globoTimeout)
  observadorTamano?.disconnect()
  mqlMovil?.removeEventListener('change', actualizarEsMovil)
  window.removeEventListener('mousemove', reiniciarInactividad)
  window.removeEventListener('keydown', reiniciarInactividad)
  window.removeEventListener('click', reiniciarInactividad)
  window.removeEventListener('pointerdown', cerrarSiClickFuera)
  window.removeEventListener('resize', onCambioLayout)
  window.removeEventListener('pointermove', moverArrastre)
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
  if (globoTimeout) clearTimeout(globoTimeout)
  if (!mensajes.value.length) {
    const saludo = nombreUsuario.value ? `¡Hola, ${nombreUsuario.value}!` : '¡Hola!'
    mensajes.value.push({
      rol: 'bot',
      texto: `${saludo} Soy mIA, tu asistente de SCNEXUS. Respondo preguntas sobre los procesos, políticas y manuales publicados de la organización, citando siempre las fuentes. ¿Qué necesitas hacer?`,
    })
  }
  if (!usuarioAd.value) return
  // Cargas ligeras que no consumen cuota: saldo y áreas disponibles.
  if (!cuota.value) consultarCuota(usuarioAd.value).then(c => { cuota.value = c }).catch(() => {})
  if (!areas.value.length) consultarAreas().then(a => { areas.value = a.filter(x => x.con_documentos) }).catch(() => {})
}

const TURNOS_HISTORIAL = 6
const MAX_CHARS_TURNO = 2000

/** Conversación previa que acompaña a la pregunta, para que mIA entienda seguimientos. Sin el saludo inicial ni los errores. */
function historialPrevio(): MiaTurno[] {
  return mensajes.value
    .filter((m, i) => !m.error && !(i === 0 && m.rol === 'bot'))
    .slice(-TURNOS_HISTORIAL)
    .map(m => ({ rol: m.rol, texto: m.texto.slice(0, MAX_CHARS_TURNO) }))
}

async function enviar(): Promise<void> {
  const pregunta = borrador.value.trim()
  if (!pregunta || cargando.value || !usuarioAd.value) return
  borrador.value = ''
  ultimoError.value = false
  const historial = historialPrevio() // antes de agregar la pregunta actual
  mensajes.value.push({ rol: 'user', texto: pregunta })
  cargando.value = true
  try {
    const r = await preguntar(
      usuarioAd.value,
      pregunta,
      areaSeleccionada.value ? [areaSeleccionada.value] : undefined,
      historial,
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
