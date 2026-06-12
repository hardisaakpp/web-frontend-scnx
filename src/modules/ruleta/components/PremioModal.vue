<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ResultadoGiro } from '../types'

const props = defineProps<{
  resultado: ResultadoGiro
}>()

const emit = defineEmits<{
  cerrar: []
  notificacionEnviada: [correo: string]
}>()

const correo = ref(props.resultado.cliente.correo ?? '')
const enviando = ref(false)
const enviado = ref(false)

const mostrarCampoEmail = props.resultado.cliente.segmento === 'GRUPO_6' && !props.resultado.premio.es_vacio

type AnimType = 'a' | 'b' | 'c' | 'd' | 'e'
type ShapeType = 'rect' | 'circle' | 'ribbon' | 'star'

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  rotation: number
  width: number
  height: number
  shape: ShapeType
  anim: AnimType
}

const confettiPieces = ref<ConfettiPiece[]>([])
const animTypes: AnimType[] = ['a', 'b', 'c', 'd', 'e']

const palette = [
  '#FFD700', '#FFC200', '#FFE566', '#FFEC8B',   // golds
  '#FF6B6B', '#FF4757', '#FF8FA3', '#FF69B4',   // reds/pinks
  '#4ECDC4', '#2BBDB6', '#A8E6CF', '#00CED1',   // teals
  '#0E97D4', '#45B7D1', '#B3DFF5', '#87CEEB',   // blues
  '#DDA0DD', '#C39BD3', '#F8A8FF', '#BA55D3',   // purples
  '#FF9A3C', '#FFB347', '#FFDEAD', '#FFA500',   // oranges
  '#ffffff', '#F0F0F0', '#E8E8E8',              // whites
]

onMounted(() => {
  if (!props.resultado.premio.es_vacio) {
    const shapes: ShapeType[] = ['rect', 'rect', 'circle', 'ribbon', 'star']
    confettiPieces.value = Array.from({ length: 140 }, (_, i) => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const isRibbon = shape === 'ribbon'
      const isStar = shape === 'star'
      return {
        id: i,
        x: Math.random() * 114 - 7,
        delay: Math.random() * 1400,
        duration: isRibbon
          ? 3200 + Math.random() * 2200
          : isStar
            ? 2400 + Math.random() * 1600
            : 2000 + Math.random() * 2200,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * 360,
        width:  isRibbon ? 2 + Math.random() * 3
              : isStar   ? 10 + Math.random() * 10
              : 5 + Math.random() * 9,
        height: isRibbon ? 18 + Math.random() * 16
              : isStar   ? 10 + Math.random() * 10
              : 7 + Math.random() * 13,
        shape,
        anim: animTypes[Math.floor(Math.random() * animTypes.length)],
      }
    })
  }
})

function pieceStyle(p: ConfettiPiece): Record<string, string> {
  const base: Record<string, string> = {
    left: p.x + '%',
    top: '-20px',
    animationDelay: p.delay + 'ms',
    animationDuration: p.duration + 'ms',
    backgroundColor: p.color,
    width: p.width + 'px',
    height: p.height + 'px',
    transform: `rotate(${p.rotation}deg)`,
  }
  if (p.shape === 'circle')  base.borderRadius = '50%'
  else if (p.shape === 'ribbon') base.borderRadius = '1px'
  else if (p.shape === 'star')   base.clipPath = 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
  else                           base.borderRadius = '2px'
  return base
}

const esEmailValido = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.value.trim())
)

async function enviarNotificacion() {
  if (!correo.value) return
  enviando.value = true
  try {
    emit('notificacionEnviada', correo.value)
    enviado.value = true
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" @click="emit('cerrar')"></div>

    <!-- Card con entrada dramática -->
    <div class="card-pop relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

      <!-- ── Premio ganado ─────────────────────────────── -->
      <template v-if="!resultado.premio.es_vacio">

        <!-- Cabecera -->
        <div class="relative overflow-hidden px-6 pt-6 pb-5 flex items-center justify-between gap-4"
             style="background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%)">
          <div class="pointer-events-none absolute inset-0"
               style="background: radial-gradient(circle at 85% 30%, rgba(19,168,231,0.45) 0%, transparent 55%)"/>

          <!-- Sparkle dots decorativos -->
          <span class="sparkle-dot" style="top:18%;left:12%;animation-delay:0.0s" />
          <span class="sparkle-dot" style="top:65%;left:22%;animation-delay:0.5s" />
          <span class="sparkle-dot" style="top:25%;right:18%;animation-delay:0.2s" />
          <span class="sparkle-dot" style="top:72%;right:28%;animation-delay:0.7s" />
          <span class="sparkle-dot" style="top:8%; left:48%;animation-delay:0.35s" />
          <span class="sparkle-dot" style="top:82%;left:60%;animation-delay:0.55s" />
          <span class="sparkle-dot" style="top:45%;left:5%; animation-delay:0.15s" />
          <span class="sparkle-dot" style="top:50%;right:6%;animation-delay:0.9s"  />

          <!-- Estrella izquierda animada -->
          <div class="relative star-pulse z-10">
            <svg class="w-5 h-5" fill="#FFD700" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>

          <!-- Ícono del premio con rebote y glow -->
          <div class="relative prize-bounce z-10">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                 style="background: rgba(255,255,255,0.18)">
              <svg v-if="!resultado.premio.imagen_url" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
              <img v-else :src="resultado.premio.imagen_url" class="w-12 h-12 object-contain" alt="Premio"/>
            </div>
            <span class="prize-ring absolute inset-0 rounded-2xl" />
          </div>

          <!-- Estrella derecha animada -->
          <div class="relative star-pulse z-10" style="animation-delay:0.5s">
            <svg class="w-5 h-5" fill="#FFD700" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>

        <!-- Cuerpo -->
        <div class="px-6 py-5">
          <p class="text-center text-lg font-bold text-gray-900 dark:text-white">
            <span class="emoji-pop inline-block">🎉</span>
            ¡Ganaste {{ resultado.premio.nombre }}!
          </p>

          <!-- Código de canje con shimmer -->
          <p class="mt-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
            Código de canje
          </p>
          <div class="code-shimmer mt-1.5 rounded-xl border-2 border-dashed py-3 px-4 text-center"
               style="border-color: #B3DFF5; background: #EFF8FD">
            <span class="text-2xl font-extrabold tracking-widest font-mono"
                  style="color: #0574AF">
              {{ resultado.codigo_canje }}
            </span>
          </div>

          <!-- Email para no afiliados -->
          <template v-if="mostrarCampoEmail">
            <div class="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico del cliente
              </label>
              <input
                v-model="correo"
                type="email"
                placeholder="cliente@ejemplo.com"
                :disabled="enviado"
                class="w-full rounded-xl border-2 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm
                       text-gray-900 dark:text-white
                       focus:outline-none transition-colors disabled:opacity-60"
                :class="enviado
                  ? 'border-gray-200 dark:border-gray-600'
                  : correo && !esEmailValido
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400'
                    : 'border-gray-200 dark:border-gray-600 focus:border-[#0A86C2] dark:focus:border-[#0E97D4]'"
              />
              <p class="mt-1.5 flex items-start gap-1 text-xs"
                 :class="correo && !esEmailValido && !enviado
                   ? 'text-red-500 dark:text-red-400'
                   : 'text-gray-400 dark:text-gray-500'">
                <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ correo && !esEmailValido && !enviado
                  ? 'Ingresa un correo válido (ej: nombre@dominio.com).'
                  : 'Cliente no afiliado — ingresa su correo para enviarle el premio.' }}
              </p>
              <div v-if="enviado" class="mt-2 flex items-center gap-2 text-sm font-medium"
                   style="color: #16a34a">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Notificación enviada
              </div>
            </div>
          </template>

          <!-- Botones -->
          <div class="mt-5 flex gap-3">
            <button
              @click="emit('cerrar')"
              class="flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors
                     border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300
                     hover:border-[#0A86C2] hover:text-[#0A86C2] dark:hover:border-[#0E97D4] dark:hover:text-[#0E97D4]"
            >
              Cerrar
            </button>
            <button
              v-if="mostrarCampoEmail && !enviado"
              :disabled="!esEmailValido || enviando"
              @click="enviarNotificacion"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              :style="esEmailValido && !enviando
                ? 'background: linear-gradient(135deg, #0E97D4 0%, #0574AF 100%); color: white; box-shadow: 0 4px 14px rgba(10,134,194,0.35)'
                : ''"
              :class="!(esEmailValido && !enviando) ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'"
            >
              <span v-if="enviando">Enviando…</span>
              <span v-else>Enviar notificación</span>
            </button>
          </div>
        </div>
      </template>

      <!-- ── Sin premio ──────────────────────────────────── -->
      <template v-else>
        <div class="px-6 pt-8 pb-6 flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb)">
            <span class="text-3xl">🎯</span>
          </div>
          <p class="text-lg font-bold text-gray-900 dark:text-white text-center">¡Sigue intentando!</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            Esta vez no fue, pero puedes volver a intentarlo más adelante.
          </p>
          <button
            @click="emit('cerrar')"
            class="mt-2 w-full px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style="background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%); box-shadow: 0 4px 14px rgba(10,134,194,0.30)"
          >
            Aceptar
          </button>
        </div>
      </template>

    </div>

    <!-- ── Confeti de celebración ── -->
    <div v-if="confettiPieces.length" class="fixed inset-0 pointer-events-none z-[400] overflow-hidden">
      <div
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece absolute"
        :class="`cfp-${piece.anim}`"
        :style="pieceStyle(piece)"
      />
    </div>

  </div>
</template>

<style scoped>
/* ── Entrada del modal ───────────────────────────────────────────────────── */
.card-pop {
  animation: card-pop-in 0.55s cubic-bezier(0.34, 1.5, 0.64, 1) both;
}
@keyframes card-pop-in {
  0%   { opacity: 0; transform: scale(0.65) translateY(24px); }
  100% { opacity: 1; transform: scale(1)    translateY(0); }
}

/* ── Sparkle dots en el header ───────────────────────────────────────────── */
.sparkle-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  animation: sparkle-blink 1.4s ease-in-out infinite;
}
@keyframes sparkle-blink {
  0%, 100% { opacity: 0;   transform: scale(0);   }
  40%, 60%  { opacity: 1;   transform: scale(1.6); }
}

/* ── Estrellas pulsantes ─────────────────────────────────────────────────── */
.star-pulse {
  animation: star-pulse-anim 1.6s ease-in-out infinite;
}
@keyframes star-pulse-anim {
  0%, 100% { transform: scale(1);    filter: brightness(1);   }
  50%       { transform: scale(1.35); filter: brightness(1.6) drop-shadow(0 0 5px rgba(255,215,0,0.9)); }
}

/* ── Rebote del ícono del premio ─────────────────────────────────────────── */
.prize-bounce {
  animation: prize-bounce-anim 1.8s ease-in-out infinite;
}
@keyframes prize-bounce-anim {
  0%, 100% { transform: translateY(0);   }
  50%       { transform: translateY(-8px); }
}

/* Anillo de glow que se expande */
.prize-ring {
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
  animation: prize-ring-anim 1.8s ease-out infinite;
}
@keyframes prize-ring-anim {
  0%   { box-shadow: 0 0 0 0   rgba(255,255,255,0.5); }
  70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0);   }
  100% { box-shadow: 0 0 0 0   rgba(255,255,255,0);   }
}

/* ── Emoji de entrada ────────────────────────────────────────────────────── */
.emoji-pop {
  animation: emoji-pop-anim 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
@keyframes emoji-pop-anim {
  0%   { transform: scale(0) rotate(-40deg); }
  60%  { transform: scale(1.4) rotate(12deg); }
  100% { transform: scale(1)   rotate(0deg); }
}

/* ── Shimmer en el código de canje ───────────────────────────────────────── */
.code-shimmer {
  position: relative;
  overflow: hidden;
}
.code-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  left: -80%;
  width: 50%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
  animation: shimmer-pass 2.8s ease-in-out infinite;
  animation-delay: 0.7s;
}
@keyframes shimmer-pass {
  0%   { left: -60%; }
  100% { left: 130%; }
}

/* ── Confeti ─────────────────────────────────────────────────────────────── */
.confetti-piece {
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
.cfp-a { animation-name: cfp-fall-a; }
.cfp-b { animation-name: cfp-fall-b; }
.cfp-c { animation-name: cfp-fall-c; }
.cfp-d { animation-name: cfp-fall-d; }
.cfp-e { animation-name: cfp-fall-e; }

@keyframes cfp-fall-a {
  0%   { transform: translateY(-12px) translateX(0)     rotate(0deg);   opacity: 1;   }
  25%  { transform: translateY(24vh)  translateX(-26px) rotate(200deg); opacity: 1;   }
  55%  { transform: translateY(54vh)  translateX(14px)  rotate(420deg); opacity: 0.9; }
  80%  { transform: translateY(82vh)  translateX(-20px) rotate(600deg); opacity: 0.5; }
  100% { transform: translateY(112vh) translateX(-6px)  rotate(720deg); opacity: 0;   }
}
@keyframes cfp-fall-b {
  0%   { transform: translateY(-12px) translateX(0)     rotate(0deg);   opacity: 1;   }
  25%  { transform: translateY(24vh)  translateX(30px)  rotate(190deg); opacity: 1;   }
  55%  { transform: translateY(54vh)  translateX(-10px) rotate(390deg); opacity: 0.9; }
  80%  { transform: translateY(82vh)  translateX(24px)  rotate(570deg); opacity: 0.5; }
  100% { transform: translateY(112vh) translateX(10px)  rotate(720deg); opacity: 0;   }
}
@keyframes cfp-fall-c {
  0%   { transform: translateY(-12px) translateX(0)     rotate(0deg);   opacity: 1;    }
  20%  { transform: translateY(18vh)  translateX(-40px) rotate(150deg); opacity: 1;    }
  45%  { transform: translateY(44vh)  translateX(34px)  rotate(310deg); opacity: 0.95; }
  70%  { transform: translateY(70vh)  translateX(-30px) rotate(470deg); opacity: 0.65; }
  100% { transform: translateY(112vh) translateX(16px)  rotate(640deg); opacity: 0;    }
}
@keyframes cfp-fall-d {
  0%   { transform: translateY(-12px) translateX(0)    rotate(0deg);   opacity: 1;   }
  35%  { transform: translateY(36vh)  translateX(10px) rotate(330deg); opacity: 1;   }
  65%  { transform: translateY(68vh)  translateX(-5px) rotate(570deg); opacity: 0.8; }
  88%  { transform: translateY(92vh)  translateX(4px)  rotate(700deg); opacity: 0.4; }
  100% { transform: translateY(112vh) translateX(0)    rotate(800deg); opacity: 0;   }
}
@keyframes cfp-fall-e {
  0%   { transform: translateY(-12px) translateX(0)     rotate(0deg);   opacity: 1;   }
  15%  { transform: translateY(13vh)  translateX(22px)  rotate(65deg);  opacity: 1;   }
  32%  { transform: translateY(30vh)  translateX(-16px) rotate(155deg); opacity: 1;   }
  52%  { transform: translateY(50vh)  translateX(26px)  rotate(275deg); opacity: 0.9; }
  72%  { transform: translateY(70vh)  translateX(-12px) rotate(405deg); opacity: 0.7; }
  88%  { transform: translateY(88vh)  translateX(18px)  rotate(510deg); opacity: 0.4; }
  100% { transform: translateY(112vh) translateX(5px)   rotate(600deg); opacity: 0;   }
}
</style>
