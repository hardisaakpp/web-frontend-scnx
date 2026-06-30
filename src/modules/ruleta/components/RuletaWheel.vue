<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SegmentoRuleta, TemaRuleta } from '../types'
import { TEMA_DEFECTO } from '../stores/temaStore'

const props = defineProps<{
  segmentos: SegmentoRuleta[]
  indiceGanador: number | null
  girando: boolean
  tema?: TemaRuleta
}>()

const t = computed(() => props.tema ?? TEMA_DEFECTO)

const emit = defineEmits<{
  animacionCompletada: []
}>()

const rotacionActual = ref(0)
const animando       = ref(false)
const DURACION_MS    = 4500

const CX    = 100
const CY    = 100
const RADIO = 95

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180
}

function arcPath(startDeg: number, endDeg: number): string {
  const x1 = CX + RADIO * Math.cos(toRad(startDeg))
  const y1 = CY + RADIO * Math.sin(toRad(startDeg))
  const x2 = CX + RADIO * Math.cos(toRad(endDeg))
  const y2 = CY + RADIO * Math.sin(toRad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIO} ${RADIO} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function labelPos(midDeg: number, radio = RADIO * 0.63) {
  return {
    x: CX + radio * Math.cos(toRad(midDeg)),
    y: CY + radio * Math.sin(toRad(midDeg)),
  }
}

const segCount = computed(() => props.segmentos.length || 8)
const segSize  = computed(() => 360 / segCount.value)

const segmentosCalculados = computed(() =>
  props.segmentos.map((s, i) => {
    const start = i * segSize.value
    const end   = start + segSize.value
    return { ...s, start, end, mid: start + segSize.value / 2 }
  })
)

const lineasSeparacion = computed(() =>
  Array.from({ length: segCount.value }, (_, i) => {
    const rad = toRad(i * segSize.value)
    return {
      x2: (CX + RADIO * Math.cos(rad)).toFixed(2),
      y2: (CY + RADIO * Math.sin(rad)).toFixed(2),
    }
  })
)

// LED lights — positioned on the outer bezel (static, don't rotate)
// r=97 puts them inside the outer ring band (between inner wheel edge ~94 and container edge 100)
const LED_COUNT  = 24
const LED_RADIUS = 97

const ledPositions = computed(() =>
  Array.from({ length: LED_COUNT }, (_, i) => {
    const a = toRad(i * (360 / LED_COUNT))
    return {
      cx: (CX + LED_RADIUS * Math.cos(a)).toFixed(2),
      cy: (CY + LED_RADIUS * Math.sin(a)).toFixed(2),
      delay: `${(i * (2400 / LED_COUNT)).toFixed(0)}ms`,
    }
  })
)

const estiloRuleta = computed(() => ({
  transform: `rotate(${rotacionActual.value}deg)`,
  transition: animando.value
    ? `transform ${DURACION_MS}ms cubic-bezier(0.17, 0.67, 0.08, 1.0)`
    : 'none',
}))

watch(() => props.indiceGanador, (nuevoIndice) => {
  if (nuevoIndice === null) return
  const sz = 360 / segCount.value
  const centroSegmento     = nuevoIndice * sz + sz / 2
  const targetEnUnaVuelta  = (360 - centroSegmento + 360) % 360
  const currentEnUnaVuelta = rotacionActual.value % 360
  const extraNeeded        = (targetEnUnaVuelta - currentEnUnaVuelta + 360) % 360
  animando.value = true
  rotacionActual.value = rotacionActual.value + 5 * 360 + extraNeeded
  setTimeout(() => {
    animando.value = false
    emit('animacionCompletada')
  }, DURACION_MS + 100)
})
</script>

<template>
  <div class="relative w-full h-full flex items-center justify-center select-none">

    <!-- ── Halo de luz exterior (estático) ───────────────────────────────── -->
    <div class="absolute inset-[-12%] rounded-full pointer-events-none"
         :style="`background: radial-gradient(circle, ${t.color_halo}40 0%, ${t.color_halo}22 35%, transparent 68%)`" />

    <!-- ── Aro exterior con gradiente cónico (bezel) ─────────────────────── -->
    <div class="absolute inset-0 rounded-full"
         :style="`
           background: conic-gradient(from 0deg,
             ${t.color_aro_primario}ff 0%,   ${t.color_aro_secundario}cc 8%,
             ${t.color_aro_primario}ff 16%,  ${t.color_aro_secundario}aa 24%,
             ${t.color_aro_primario}ff 32%,  ${t.color_aro_secundario}cc 40%,
             ${t.color_aro_primario}ff 48%,  ${t.color_aro_secundario}aa 56%,
             ${t.color_aro_primario}ff 64%,  ${t.color_aro_secundario}cc 72%,
             ${t.color_aro_primario}ff 80%,  ${t.color_aro_secundario}aa 88%,
             ${t.color_aro_primario}ff 100%);
           padding: 8px;
           border-radius: 9999px;
           box-shadow:
             0 0 40px ${t.color_aro_primario}99,
             0 0 12px ${t.color_aro_primario}55,
             inset 0 0 20px rgba(0,0,0,0.4);
         `">
      <div class="w-full h-full rounded-full" />
    </div>

    <!-- ── LEDs estáticos sobre el aro ───────────────────────────────────── -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none"
         viewBox="0 0 200 200" overflow="visible">
      <defs>
        <filter id="led-glow-rl" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle
        v-for="(led, i) in ledPositions"
        :key="i"
        :cx="led.cx"
        :cy="led.cy"
        r="2.4"
        fill="white"
        filter="url(#led-glow-rl)"
        class="led-light"
        :style="{ animationDelay: led.delay }"
      />
    </svg>

    <!-- ── Rueda giratoria ────────────────────────────────────────────────── -->
    <div
      class="relative rounded-full w-[88%] h-[88%] flex items-center justify-center overflow-hidden"
      :style="`
        background: ${t.color_hub_fondo};
        box-shadow:
          0 0 0 5px ${t.color_aro_primario}bb,
          0 0 0 7px ${t.color_hub_fondo}ff,
          0 12px 60px rgba(0,0,0,0.8),
          0 0 60px ${t.color_aro_primario}22;
      `"
    >
      <svg
        viewBox="0 0 200 200"
        :style="estiloRuleta"
        class="block w-full h-full"
        overflow="visible"
      >
        <defs>
          <!-- Sombra suave en segmentos -->
          <filter id="seg-shadow-rl">
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>

          <!-- Brillo dorado para las líneas separadoras -->
          <filter id="divider-glow-rl" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <!-- Overlay de profundidad radial -->
          <radialGradient id="seg-sheen-rl" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="rgba(0,0,0,0.35)"/>
            <stop offset="55%"  stop-color="rgba(0,0,0,0.05)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.10)"/>
          </radialGradient>

          <!-- Highlight sutil en borde exterior de cada segmento -->
          <radialGradient id="seg-edge-rl" cx="50%" cy="50%" r="50%">
            <stop offset="82%"  stop-color="rgba(255,255,255,0.0)"/>
            <stop offset="96%"  stop-color="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.0)"/>
          </radialGradient>
        </defs>

        <!-- ── Segmentos ── -->
        <path
          v-for="(seg, i) in segmentosCalculados"
          :key="seg.id"
          :d="arcPath(seg.start, seg.end)"
          :fill="t.paleta_segmentos[i % t.paleta_segmentos.length]"
        />

        <!-- ── Overlay de profundidad (sheen) ── -->
        <circle :cx="CX" :cy="CY" r="95" fill="url(#seg-sheen-rl)" />
        <circle :cx="CX" :cy="CY" r="95" fill="url(#seg-edge-rl)" />

        <!-- ── Líneas separadoras con brillo dorado ── -->
        <!-- Capa base gruesa (sombra) -->
        <line
          v-for="(l, i) in lineasSeparacion" :key="`base-${i}`"
          :x1="CX" :y1="CY" :x2="l.x2" :y2="l.y2"
          stroke="rgba(0,0,0,0.4)" stroke-width="3.5" stroke-linecap="round"
        />
        <!-- Capa principal dorada -->
        <line
          v-for="(l, i) in lineasSeparacion" :key="`main-${i}`"
          :x1="CX" :y1="CY" :x2="l.x2" :y2="l.y2"
          :stroke="t.color_aro_primario" stroke-width="2.2"
          stroke-linecap="round"
          filter="url(#divider-glow-rl)"
          opacity="0.9"
        />
        <!-- Capa de brillo (highlight central) -->
        <line
          v-for="(l, i) in lineasSeparacion" :key="`shine-${i}`"
          :x1="CX" :y1="CY" :x2="l.x2" :y2="l.y2"
          stroke="rgba(255,255,255,0.35)" stroke-width="0.8"
          stroke-linecap="round"
        />

        <!-- ── Anillo fino en borde exterior ── -->
        <circle :cx="CX" :cy="CY" r="95.5"
                fill="none"
                :stroke="t.color_aro_primario"
                stroke-width="2.5"
                opacity="0.85"/>
        <circle :cx="CX" :cy="CY" r="95.5"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="0.8"/>

        <!-- ── Puntos decorativos dorados en borde ── -->
        <circle
          v-for="seg in segmentosCalculados"
          :key="`dot-${seg.id}`"
          :cx="labelPos(seg.mid, RADIO * 0.905).x"
          :cy="labelPos(seg.mid, RADIO * 0.905).y"
          r="2.8"
          :fill="t.color_aro_primario"
          opacity="0.9"
        />
        <!-- Brillo blanco sobre el punto dorado -->
        <circle
          v-for="seg in segmentosCalculados"
          :key="`dot-shine-${seg.id}`"
          :cx="labelPos(seg.mid, RADIO * 0.905).x - 0.7"
          :cy="labelPos(seg.mid, RADIO * 0.905).y - 0.7"
          r="1"
          fill="white"
          opacity="0.6"
        />

        <!-- ── Etiquetas ── -->
        <text
          v-for="seg in segmentosCalculados"
          :key="`txt-${seg.id}`"
          :x="labelPos(seg.mid).x"
          :y="labelPos(seg.mid).y"
          text-anchor="middle"
          dominant-baseline="middle"
          :transform="`rotate(${seg.mid <= 180 ? seg.mid - 90 : seg.mid + 90}, ${labelPos(seg.mid).x}, ${labelPos(seg.mid).y})`"
          :font-size="segCount <= 6 ? '5.2' : segCount <= 8 ? '4.5' : '3.8'"
          font-weight="800"
          :fill="t.color_texto_segmentos"
          opacity="0.96"
          class="pointer-events-none"
          filter="url(#seg-shadow-rl)"
        >
          {{ seg.nombre }}
        </text>

        <!-- ── Hub central (concéntrico, sin texto) ── -->
        <!-- Sombra exterior del hub -->
        <circle :cx="CX" :cy="CY" r="22.5" fill="rgba(0,0,0,0.45)" />
        <!-- Fondo hub -->
        <circle :cx="CX" :cy="CY" r="21"   :fill="t.color_hub_fondo"/>
        <!-- Anillo dorado grueso -->
        <circle :cx="CX" :cy="CY" r="19.5" :fill="t.color_aro_primario" opacity="0.95"/>
        <!-- Anillo highlight del dorado -->
        <circle :cx="CX" :cy="CY" r="19.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
        <!-- Interior oscuro -->
        <circle :cx="CX" :cy="CY" r="16"   :fill="t.color_hub_fondo"/>
        <!-- Anillo fino acento interior -->
        <circle :cx="CX" :cy="CY" r="16"   fill="none" :stroke="t.color_aro_primario" stroke-width="0.6" opacity="0.5"/>

      </svg>

    </div>

    <!-- ── Puntero tipo pin de ubicación ─────────────────────────────────── -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[30%] z-20">
      <svg viewBox="0 0 30 44" class="w-7 h-11 sm:w-8 sm:h-12 xl:w-9 xl:h-14 drop-shadow-xl">
        <defs>
          <radialGradient id="pin-body-grad" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   :stop-color="t.color_puntero" />
            <stop offset="100%" :stop-color="t.color_puntero" stop-opacity="0.7"/>
          </radialGradient>
          <filter id="pin-shadow-rl" x="-40%" y="-20%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.55)"/>
          </filter>
        </defs>
        <!-- Cuerpo del pin (teardrop) -->
        <path
          d="M 15 42 C 9 31 2 23 2 13 A 13 13 0 0 1 28 13 C 28 23 21 31 15 42 Z"
          fill="url(#pin-body-grad)"
          filter="url(#pin-shadow-rl)"
        />
        <!-- Borde sutil -->
        <path
          d="M 15 42 C 9 31 2 23 2 13 A 13 13 0 0 1 28 13 C 28 23 21 31 15 42 Z"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          stroke-width="0.8"
        />
        <!-- Círculo interior (color del aro) -->
        <circle cx="15" cy="13" r="7" :fill="t.color_aro_primario" opacity="0.85"/>
        <!-- Highlight en el interior -->
        <circle cx="12.5" cy="10.5" r="2.5" fill="white" opacity="0.45"/>
        <!-- Punto central -->
        <circle cx="15" cy="13" r="2.2" fill="white" opacity="0.6"/>
      </svg>
    </div>

  </div>
</template>

<style scoped>
/* ── LED pulse wave ──────────────────────────────────────────────────────── */
.led-light {
  animation: led-pulse-rl 2.4s ease-in-out infinite;
}

@keyframes led-pulse-rl {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1.0;  }
}
</style>
