<template>
  <svg
    :viewBox="viewBox"
    :width="size"
    aria-hidden="true"
    class="ct-svg"
    :class="{ 'ct-float': animation === 'float' || animation === 'wave' }"
  >
    <defs>
      <linearGradient :id="`ctG-${uid}`" x1="0" y1="0" x2="0.55" y2="1">
        <stop offset="0" stop-color="#aed7f4" />
        <stop offset="0.45" stop-color="#5fa9e6" />
        <stop offset="1" stop-color="#1f7fd0" />
      </linearGradient>
      <linearGradient :id="`ctGarm-${uid}`" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="#c6e3f8" />
        <stop offset="0.5" stop-color="#7ab8ec" />
        <stop offset="1" stop-color="#3b93dc" />
      </linearGradient>
    </defs>

    <!-- Sombra (solo cuerpo completo) -->
    <ellipse v-if="variant === 'full'" cx="110" cy="240" rx="42" ry="7" fill="#0f172a" opacity="0.12" />

    <template v-if="variant !== 'head'">
      <!-- Cuerpo: cuello ancho, cono hacia abajo -->
      <path
        d="M84,134 C72,136 66,148 69,162 L76,198 C79,215 93,221 110,221 C127,221 141,215 144,198 L151,162 C154,148 148,136 136,134 Z"
        :fill="`url(#ctG-${uid})`"
      />
      <!-- Gesto: transportando una caja con código de barras -->
      <g v-if="gesture === 'caja'">
        <rect x="72" y="132" width="76" height="58" rx="5" fill="#dfa864" stroke="#b9834a" stroke-width="2" />
        <rect x="105" y="132" width="10" height="58" fill="#f4e3c6" opacity="0.9" />
        <rect x="79" y="160" width="26" height="19" rx="2" fill="#ffffff" stroke="#b9834a" stroke-width="1.2" />
        <path d="M84,164 v11 M88,164 v11 M92,164 v11 M96.5,164 v11 M100.5,164 v11" stroke="#0f172a" stroke-width="1.5" />
        <path :d="FLIP_D" transform="translate(79,158) scale(-1,1) rotate(70)" :fill="`url(#ctGarm-${uid})`" />
        <path :d="FLIP_D" transform="translate(141,158) rotate(70)" :fill="`url(#ctGarm-${uid})`" />
      </g>
      <template v-else>
        <!-- Aleta izquierda -->
        <path :d="FLIP_D" :transform="leftArmTransform" :fill="`url(#ctGarm-${uid})`" />
        <!-- Aleta derecha (grupo externo posiciona; el interno se anima en 'wave') -->
        <g :transform="rightArmOuterTransform">
          <g :class="{ 'ct-wave-arm': animation === 'wave' }">
            <path :d="FLIP_D" :transform="rightArmInnerTransform" :fill="`url(#ctGarm-${uid})`" />
          </g>
        </g>
      </template>
    </template>

    <!-- Cabeza -->
    <rect x="35" y="14" width="150" height="122" rx="52" :fill="`url(#ctG-${uid})`" />
    <ellipse cx="78" cy="44" rx="44" ry="24" fill="#ffffff" opacity="0.2" />

    <!-- ── Rostro según expresión ── -->
    <!-- Ojos abiertos -->
    <g v-if="hasOpenEyes" :transform="eyesTransform">
      <circle cx="78" cy="74" :r="eyeR" :fill="EYE" />
      <circle cx="142" cy="74" :r="eyeR" :fill="EYE" />
      <circle cx="71" cy="66" r="6.5" fill="#ffffff" />
      <circle cx="135" cy="66" r="6.5" fill="#ffffff" />
      <circle cx="86" cy="83" r="3" fill="#ffffff" />
      <circle cx="150" cy="83" r="3" fill="#ffffff" />
    </g>
    <!-- Ojos felices (arcos) -->
    <g v-else-if="hasHappyEyes">
      <path d="M60,76 Q78,57 96,76" fill="none" :stroke="EYE" stroke-width="7" stroke-linecap="round" />
      <path d="M124,76 Q142,57 160,76" fill="none" :stroke="EYE" stroke-width="7" stroke-linecap="round" />
    </g>
    <!-- Concentrado: medios ojos -->
    <g v-else-if="expression === 'concentrado'">
      <path d="M57,74 Q78,98 99,74 Z" :fill="EYE" />
      <path d="M121,74 Q142,98 163,74 Z" :fill="EYE" />
      <circle cx="72" cy="79" r="2.6" fill="#ffffff" />
      <circle cx="136" cy="79" r="2.6" fill="#ffffff" />
    </g>
    <!-- Procesando: ojos con anillo giratorio -->
    <g v-else-if="expression === 'procesando'">
      <circle cx="78" cy="74" r="21" :fill="EYE" />
      <circle cx="142" cy="74" r="21" :fill="EYE" />
      <circle class="ct-spin" cx="78" cy="74" r="10" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="48 15" stroke-linecap="round" />
      <circle class="ct-spin" cx="142" cy="74" r="10" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="48 15" stroke-linecap="round" />
    </g>
    <!-- Durmiendo: ojos cerrados -->
    <g v-else-if="expression === 'durmiendo'">
      <path d="M60,74 Q78,89 96,74" fill="none" :stroke="EYE" stroke-width="6.5" stroke-linecap="round" />
      <path d="M124,74 Q142,89 160,74" fill="none" :stroke="EYE" stroke-width="6.5" stroke-linecap="round" />
    </g>
    <!-- Guiño: izquierdo abierto, derecho arco -->
    <g v-else-if="expression === 'guino'">
      <circle cx="78" cy="74" r="21" :fill="EYE" />
      <circle cx="71" cy="66" r="6.5" fill="#ffffff" />
      <circle cx="86" cy="83" r="3" fill="#ffffff" />
      <path d="M124,76 Q142,57 160,76" fill="none" :stroke="EYE" stroke-width="7" stroke-linecap="round" />
    </g>

    <!-- Bocas -->
    <!-- Sonrisa con dientes superiores (normal, feliz, guiño) -->
    <g v-if="smileMouth">
      <path d="M93,106 Q110,113 127,106 Q125,126 110,128 Q95,126 93,106 Z" :fill="DARK" />
      <path d="M95,107.5 Q110,114 125,107.5 L123.5,113.5 Q110,119 96.5,113.5 Z" fill="#ffffff" />
    </g>
    <!-- Éxito: boca abierta grande -->
    <g v-else-if="expression === 'exito'">
      <path d="M82,100 Q110,112 138,100 Q135,133 110,136 Q85,133 82,100 Z" fill="#ffffff" />
      <path d="M92,119 Q110,136 128,119 Q110,127 92,119 Z" :fill="DARK" />
    </g>
    <path v-else-if="expression === 'pensativo'" d="M100,117 L124,113" fill="none" :stroke="EYE" stroke-width="4" stroke-linecap="round" />
    <path v-else-if="expression === 'concentrado' || expression === 'procesando'" d="M101,115 L119,115" fill="none" :stroke="EYE" stroke-width="4" stroke-linecap="round" />
    <ellipse v-else-if="expression === 'alerta'" cx="110" cy="116" rx="7" ry="9" :fill="EYE" />
    <circle v-else-if="expression === 'durmiendo'" cx="110" cy="116" r="3.5" :fill="EYE" />
    <path v-else-if="expression === 'disculpa'" d="M99,121 Q110,111 121,121" fill="none" :stroke="EYE" stroke-width="4" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { CoolTuritoExpression, CoolTuritoGesture } from './coolturito.types'

/**
 * Cool-turito — mascota oficial de SCNEXUS AI.
 * SVG vectorial con fondo transparente, basado en la hoja de diseño
 * (Artifact "Cool-turito · Mascota SCNEXUS AI").
 */
export type { CoolTuritoExpression }

const props = withDefaults(defineProps<{
  expression?: CoolTuritoExpression
  /** full = cuerpo completo · half = medio cuerpo (botón/panel) · head = solo rostro (avatar) */
  variant?: 'full' | 'half' | 'head'
  /** Ancho en px */
  size?: number
  animation?: 'none' | 'float' | 'wave'
  gesture?: CoolTuritoGesture
}>(), {
  expression: 'normal',
  variant: 'full',
  size: 96,
  animation: 'none',
  gesture: 'none',
})

let uidCounter = 0
const uid = `${Date.now().toString(36)}${uidCounter++}`

const EYE = '#0e1f33'
const DARK = '#1565c0'
/** Aleta: base en (0,0) local, punta en (45,8). */
const FLIP_D = 'M0,-10 C16,-14 36,-6 45,8 C49,15 44,23 36,20 C24,15 10,10 -2,10 C-9,5 -7,-6 0,-10 Z'

const VIEWBOXES: Record<'head' | 'half' | 'full', string> = {
  head: '28 6 164 140',
  half: '0 0 220 176',
  full: '0 0 220 260',
}
const viewBox = computed(() => VIEWBOXES[props.variant])

/** Hombros: izquierdo (79,158), derecho (141,158). Reposo = rotate(38). */
const leftArmTransform = 'translate(79,158) scale(-1,1) rotate(38)'
const rightArmOuterTransform = computed(() =>
  props.animation === 'wave' ? 'translate(141,158) rotate(-52)' : 'translate(141,158)')
const rightArmInnerTransform = computed(() =>
  props.animation === 'wave' ? '' : 'rotate(38)')

const hasOpenEyes = computed(() => ['normal', 'pensativo', 'alerta', 'disculpa'].includes(props.expression))
const hasHappyEyes = computed(() => ['feliz', 'exito'].includes(props.expression))
const eyeR = computed(() => (props.expression === 'alerta' ? 24.5 : 21))
const EYES_TRANSFORMS: Partial<Record<CoolTuritoExpression, string>> = {
  pensativo: 'translate(-5,-6)',
  disculpa: 'translate(0,4)',
}
const eyesTransform = computed(() => EYES_TRANSFORMS[props.expression] ?? '')
const smileMouth = computed(() => ['normal', 'feliz', 'guino'].includes(props.expression))
</script>

<style scoped>
.ct-svg { display: block; overflow: hidden; }
.ct-float { animation: ct-float 3s ease-in-out infinite; }
@keyframes ct-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.ct-wave-arm {
  animation: ct-wave 1.1s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 8% 50%;
}
@keyframes ct-wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-16deg); }
}
.ct-spin {
  animation: ct-spin 1s linear infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes ct-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .ct-float, .ct-wave-arm, .ct-spin { animation: none; }
}
</style>
