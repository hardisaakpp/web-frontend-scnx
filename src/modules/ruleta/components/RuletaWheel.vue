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
const animando = ref(false)
const DURACION_MS = 4500

const CX = 100
const CY = 100
const RADIO = 95

function toRad(deg: number): number {
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

function labelPos(midDeg: number) {
  const r = RADIO * 0.63
  return { x: CX + r * Math.cos(toRad(midDeg)), y: CY + r * Math.sin(toRad(midDeg)) }
}

function outerDotPos(midDeg: number) {
  const r = RADIO * 0.91
  return { x: CX + r * Math.cos(toRad(midDeg)), y: CY + r * Math.sin(toRad(midDeg)) }
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

    <!-- Halo exterior de luz (estático) -->
    <div class="absolute inset-[-10%] rounded-full"
         :style="`background: radial-gradient(circle, ${t.color_halo}33 0%, ${t.color_halo}1a 40%, transparent 70%); pointer-events:none`" />

    <!-- Flecha indicadora -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[35%] z-20">
      <svg viewBox="0 0 26 34" class="w-6 h-8 sm:w-7 sm:h-9 xl:w-8 xl:h-10 drop-shadow-lg">
        <defs>
          <filter id="arrow-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#7f1d1d" flood-opacity="0.5"/>
          </filter>
        </defs>
        <polygon points="13,30 2,4 24,4"
                 :fill="t.color_puntero" stroke="#111111" stroke-width="2.5" stroke-linejoin="round"
                 filter="url(#arrow-shadow)"/>
      </svg>
    </div>

    <!-- Anillo externo decorativo -->
    <div class="absolute inset-0 rounded-full"
         :style="`background: conic-gradient(from 0deg, ${t.color_aro_primario}e6 0%, ${t.color_aro_secundario}80 25%, ${t.color_aro_primario}e6 50%, ${t.color_aro_secundario}80 75%, ${t.color_aro_primario}e6 100%);
                padding: 4px; border-radius: 9999px; box-shadow: 0 0 28px ${t.color_aro_primario}8c, 0 0 8px ${t.color_aro_primario}4d`">
      <div class="w-full h-full rounded-full bg-transparent" />
    </div>

    <!-- Aro interior + ruleta -->
    <div class="relative rounded-full w-[94%] h-[94%] flex items-center justify-center p-[4%] border-4"
         :style="`background: ${t.color_hub_fondo}; border-color: ${t.color_aro_primario}26; box-shadow: 0 10px 60px rgba(0,0,0,0.7), 0 0 50px ${t.color_aro_primario}1f`">

      <svg viewBox="0 0 200 200" :style="estiloRuleta" class="rounded-full block w-full h-full overflow-visible">

        <defs>
          <filter id="seg-shadow">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>

        <!-- Segmentos -->
        <path
          v-for="seg in segmentosCalculados"
          :key="seg.id"
          :d="arcPath(seg.start, seg.end)"
          :fill="seg.color"
        />

        <!-- Anillo fino interior (sobre borde de segmentos) -->
        <circle :cx="CX" :cy="CY" r="95.5" fill="none" stroke="white" stroke-width="1.2" opacity="0.4"/>

        <!-- Líneas divisorias -->
        <line
          v-for="(l, i) in lineasSeparacion"
          :key="i"
          :x1="CX" :y1="CY" :x2="l.x2" :y2="l.y2"
          stroke="white" stroke-width="2"
        />

        <!-- Puntos decorativos en el borde exterior (centro de cada segmento) -->
        <circle
          v-for="seg in segmentosCalculados"
          :key="`dot-${seg.id}`"
          :cx="outerDotPos(seg.mid).x"
          :cy="outerDotPos(seg.mid).y"
          r="2.2"
          fill="white"
          opacity="0.75"
        />

        <!-- Etiquetas -->
        <text
          v-for="seg in segmentosCalculados"
          :key="`txt-${seg.id}`"
          :x="labelPos(seg.mid).x"
          :y="labelPos(seg.mid).y"
          text-anchor="middle"
          dominant-baseline="middle"
          :transform="`rotate(${seg.mid <= 180 ? seg.mid - 90 : seg.mid + 90}, ${labelPos(seg.mid).x}, ${labelPos(seg.mid).y})`"
          font-size="4.5"
          font-weight="800"
          :fill="t.color_texto_segmentos"
          opacity="0.95"
          class="pointer-events-none drop-shadow-md"
        >
          {{ seg.nombre }}
        </text>

        <!-- Hub central — capas concéntricas -->
        <circle :cx="CX" :cy="CY" r="19"   :fill="t.color_hub_fondo"/>
        <circle :cx="CX" :cy="CY" r="16.5" :fill="t.color_aro_secundario"/>
        <circle :cx="CX" :cy="CY" r="13"   :fill="t.color_hub_acento"/>
        <circle :cx="CX" :cy="CY" r="9.5"  :fill="t.color_hub_fondo"/>
        <circle :cx="CX" :cy="CY" r="6"    :fill="t.color_hub_acento"/>
        <circle :cx="CX" :cy="CY" r="2.8"  :fill="t.color_hub_fondo"/>

      </svg>
    </div>
  </div>
</template>
