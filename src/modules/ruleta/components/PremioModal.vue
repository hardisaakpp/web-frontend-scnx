<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ResultadoGiro } from '../types'
import { useRuletaStore } from '../stores/ruletaStore'

const props = defineProps<{
  resultado: ResultadoGiro
}>()

const store = useRuletaStore()

const emit = defineEmits<{
  cerrar: []
}>()

const isUnboxed = ref(false)
const correo = ref(props.resultado.cliente.correo ?? '')
const enviando = ref(false)
const enviado = ref(false)
const notificacionError = ref('')

const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/

// El segmento puede llegar con variaciones de formato ("grupo 6", "Grupo-6") desde el backend;
// se normaliza antes de comparar para no perder el campo de correo por una diferencia de formato.
const segmentoNormalizado = (props.resultado.cliente.segmento ?? '').toUpperCase().replace(/[- ]/g, '_')
const mostrarCampoEmail = segmentoNormalizado === 'GRUPO_6' && !props.resultado.premio.es_vacio

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

const rnd = () => Math.random() // NOSONAR

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
  // Retraso para el suspenso y luego destape 3D
  setTimeout(() => {
    isUnboxed.value = true
  }, 1200)

  if (!props.resultado.premio.es_vacio) {
    const shapes: ShapeType[] = ['rect', 'rect', 'circle', 'ribbon', 'star']
    confettiPieces.value = Array.from({ length: 140 }, (_, i) => {
      const shape = shapes[Math.floor(rnd() * shapes.length)]
      const isRibbon = shape === 'ribbon'
      const isStar = shape === 'star'
      let duration = 2000 + rnd() * 2200
      let width = 5 + rnd() * 9
      let height = 7 + rnd() * 13

      if (isRibbon) {
        duration = 3200 + rnd() * 2200
        width = 2 + rnd() * 3
        height = 18 + rnd() * 16
      } else if (isStar) {
        duration = 2400 + rnd() * 1600
        width = 10 + rnd() * 10
        height = 10 + rnd() * 10
      }

      return {
        id: i,
        x: rnd() * 114 - 7,
        delay: rnd() * 1400 + 1200, // Retraso base de 1.2s
        duration,
        color: palette[Math.floor(rnd() * palette.length)],
        rotation: rnd() * 360,
        width,
        height,
        shape,
        anim: animTypes[Math.floor(rnd() * animTypes.length)],
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
  EMAIL_REGEX.test(correo.value.trim())
)

async function enviarNotificacion() {
  if (!correo.value) return
  enviando.value = true
  try {
    await store.enviarNotificacion(correo.value)
    enviado.value = true
  } catch {
    notificacionError.value = 'Ocurrió un error al enviar la notificación. Verifica el correo e intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <!-- Spotlight Foco Absoluto -->
    <div class="absolute inset-0 spotlight-overlay backdrop-blur-sm" @click="emit('cerrar')"></div>

    <!-- Escena 3D y Contenedor Flip -->
    <div class="scene-3d w-full max-w-sm">
      <div class="card-flip-container" :class="{ 'is-flipped': isUnboxed }">

        <!-- ==============================================
             CARTA CERRADA (MISTERIO) - FRENTE
             ============================================== -->
        <div class="card-face card-front legend-glow-wrap rounded-2xl">
          <!-- Aura legendaria emitiendo del borde -->
          <div v-if="!resultado.premio.es_vacio" class="legendary-glow"></div>
          
          <div class="relative z-10 w-full h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-8 border border-white/10 shadow-2xl"
               style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); min-height: 480px;">
             
             <!-- Brillo radial detrás del regalo -->
             <div class="absolute w-32 h-32 rounded-full blur-3xl opacity-30 bg-cyan-400 z-[0]"></div>
             
             <!-- Logo regalo rebotando -->
             <div class="prize-bounce z-10 relative">
                <span class="text-7xl block transition-transform hover:scale-110 drop-shadow-2xl">🎁</span>
             </div>
             
             <h2 class="mt-8 text-2xl font-black text-white text-center tracking-widest uppercase leading-tight relative z-10"
                 style="text-shadow: 0 4px 12px rgba(255,255,255,0.25)">
                ¡TU PREMIO<br>ESTÁ AQUÍ!
             </h2>
             <p class="mt-4 text-xs text-cyan-300/70 font-semibold uppercase tracking-[0.2em] animate-pulse relative z-10">
                Desbloqueando...
             </p>
          </div>
        </div>

        <!-- ==============================================
             CARTA ABIERTA (CONTENIDO) - REVERSO
             ============================================== -->
        <div class="card-face card-back legend-glow-wrap rounded-2xl">
          <!-- Borde resplandeciente si gana -->
          <div v-if="!resultado.premio.es_vacio" class="legendary-glow"></div>
          
          <!-- Contenido original realzado -->
          <div class="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col min-h-[480px]">
            
            <!-- ── Premio ganado ─────────────────────────────── -->
            <template v-if="!resultado.premio.es_vacio">
              
              <!-- Cabecera -->
              <div class="relative overflow-hidden px-6 pt-6 pb-5 flex items-center justify-between gap-4"
                   style="background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%)">
                <div class="pointer-events-none absolute inset-0"
                     style="background: radial-gradient(circle at 85% 30%, rgba(19,168,231,0.45) 0%, transparent 55%)"/>

                <!-- Sparkle dots decorativos (retardados por el flip) -->
                <span class="sparkle-dot" style="top:18%;left:12%;animation-delay:1.2s" />
                <span class="sparkle-dot" style="top:65%;left:22%;animation-delay:1.7s" />
                <span class="sparkle-dot" style="top:25%;right:18%;animation-delay:1.4s" />
                <span class="sparkle-dot" style="top:72%;right:28%;animation-delay:1.9s" />
                <span class="sparkle-dot" style="top:8%; left:48%;animation-delay:1.55s" />
                <span class="sparkle-dot" style="top:82%;left:60%;animation-delay:1.75s" />
                <span class="sparkle-dot" style="top:45%;left:5%; animation-delay:1.35s" />
                <span class="sparkle-dot" style="top:50%;right:6%;animation-delay:2.1s"  />

                <!-- Estrella izquierda animada -->
                <div class="relative star-pulse z-10" style="animation-delay: 1.2s">
                  <svg class="w-5 h-5" fill="#FFD700" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>

                <!-- Ícono del premio con rebote y glow -->
                <div class="relative prize-bounce z-10" style="animation-delay: 1.2s">
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                       style="background: rgba(255,255,255,0.18)">
                    <svg v-if="!resultado.premio.imagen_url" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                    </svg>
                    <img v-else :src="resultado.premio.imagen_url" class="w-12 h-12 object-contain" alt="Premio"/>
                  </div>
                  <span class="prize-ring absolute inset-0 rounded-2xl" style="animation-delay: 1.2s" />
                </div>

                <!-- Estrella derecha animada -->
                <div class="relative star-pulse z-10" style="animation-delay: 1.7s">
                  <svg class="w-5 h-5" fill="#FFD700" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>

              <!-- Cuerpo -->
              <div class="px-6 py-5 flex-1 flex flex-col justify-between">
                <div>
                  <p class="text-center text-lg font-bold text-gray-900 dark:text-white">
                    <span class="emoji-pop inline-block" style="animation-delay: 1.5s">🎉</span>
                    ¡Ganaste {{ resultado.premio.nombre }}!
                  </p>

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
                      <label for="correo-cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Correo electrónico del cliente
                      </label>
                      <input
                        id="correo-cliente"
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
                          : 'Cliente no afiliado — ingresa su correo.' }}
                      </p>
                      <div v-if="notificacionError" class="mt-2 text-xs text-red-500">{{ notificacionError }}</div>
                      <div v-if="enviado" class="mt-2 text-sm text-green-600">Notificación enviada</div>
                    </div>
                  </template>
                </div>

                <!-- Botones -->
                <div class="mt-5 flex gap-3">
                  <button
                    @click="emit('cerrar')"
                    class="flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors
                           border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300
                           hover:border-[#0A86C2] hover:text-[#0A86C2]"
                  >
                    Cerrar
                  </button>
                  <button
                    v-if="mostrarCampoEmail && !enviado"
                    :disabled="!esEmailValido || enviando"
                    @click="enviarNotificacion"
                    class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    :style="esEmailValido && !enviando
                      ? 'background: #0E97D4; color: white;'
                      : ''"
                    :class="!(esEmailValido && !enviando) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:opacity-90'"
                  >
                    <span v-if="enviando">Enviando…</span>
                    <span v-else>Enviar</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- ── Sin premio ──────────────────────────────────── -->
            <template v-else>
              <div class="px-6 py-10 flex-1 flex flex-col items-center justify-center gap-3">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb)">
                  <span class="text-3xl">🎯</span>
                </div>
                <p class="text-xl font-bold text-gray-900 dark:text-white text-center">
                  {{ resultado.premio.nombre || '¡Sigue intentando!' }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 text-center whitespace-pre-wrap leading-relaxed mt-1">
                  {{ resultado.premio.descripcion || 'Esta vez no fue, pero puedes volver a intentarlo más adelante.' }}
                </p>
                <button
                  @click="emit('cerrar')"
                  class="mt-4 w-full px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style="background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%); box-shadow: 0 4px 14px rgba(10,134,194,0.30)"
                >
                  Entendido
                </button>
              </div>
            </template>
            
          </div>
        </div>

      </div>
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

/* ── Foco Absoluto (Spotlight) ───────────────────────────────────────────── */
.spotlight-overlay {
  background: radial-gradient(circle at center, rgba(15,23,42,0.85) 0%, rgba(2,6,23,0.98) 100%);
  animation: fade-in-spotlight 0.7s ease-out forwards;
}

@keyframes fade-in-spotlight {
  0% { opacity: 0; }
  100% { opacity: 1; }
}


/* ── Escena 3D y Contenedor Flip ─────────────────────────────────────────── */
.scene-3d {
  perspective: 1200px;
  animation: card-pop-in 0.6s cubic-bezier(0.34, 1.5, 0.64, 1) both;
}
.card-flip-container {
  display: grid;
  width: 100%;
  position: relative;
  transition: transform 0.8s cubic-bezier(0.34, 1.5, 0.64, 1);
  transform-style: preserve-3d;
}
.card-flip-container.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  grid-area: 1 / 1;
  width: 100%;
  backface-visibility: hidden;
}

.card-front {
  transform: rotateY(0deg);
}

.card-back {
  transform: rotateY(180deg);
}

/* ── Borde Legendario Dinámico (Glow) ────────────────────────────────────── */
.legend-glow-wrap {
  position: relative;
}
.legendary-glow {
  position: absolute;
  inset: -4px;
  background: linear-gradient(
    90deg,
    #0E97D4, #FFD700, #0E97D4, #00CED1, #0E97D4
  );
  background-size: 300% 300%;
  border-radius: 20px;
  z-index: 0; 
  filter: blur(10px);
  animation: legend-flow 3.5s linear infinite;
  opacity: 0.9;
}
@keyframes legend-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

/* ── Entrada del modal ───────────────────────────────────────────────────── */
@keyframes card-pop-in {
  0%   { opacity: 0; transform: scale(0.65) translateY(40px); }
  60%  { opacity: 1; transform: scale(1.05) translateY(-5px); }
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
  animation: emoji-pop-anim 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
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
  animation-delay: 1.9s; /* Delay para cuando voltea la cara */
}
@keyframes shimmer-pass {
  0%   { left: -60%; }
  100% { left: 130%; }
}

/* ── Confeti ─────────────────────────────────────────────────────────────── */
.confetti-piece {
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  opacity: 0;
}
.cfp-a { animation-name: cfp-fall-a; }
.cfp-b { animation-name: cfp-fall-b; }
.cfp-c { animation-name: cfp-fall-c; }
.cfp-d { animation-name: cfp-fall-d; }
.cfp-e { animation-name: cfp-fall-e; }

@keyframes cfp-fall-a {
  0%   { transform: translateY(-20px) translateX(0)     rotate(0deg);   opacity: 1;   }
  25%  { transform: translateY(24vh)  translateX(-26px) rotate(200deg); opacity: 1;   }
  55%  { transform: translateY(54vh)  translateX(14px)  rotate(420deg); opacity: 0.9; }
  80%  { transform: translateY(82vh)  translateX(-20px) rotate(600deg); opacity: 0.5; }
  100% { transform: translateY(112vh) translateX(-6px)  rotate(720deg); opacity: 0;   }
}
@keyframes cfp-fall-b {
  0%   { transform: translateY(-20px) translateX(0)     rotate(0deg);   opacity: 1;   }
  25%  { transform: translateY(24vh)  translateX(30px)  rotate(190deg); opacity: 1;   }
  55%  { transform: translateY(54vh)  translateX(-10px) rotate(390deg); opacity: 0.9; }
  80%  { transform: translateY(82vh)  translateX(24px)  rotate(570deg); opacity: 0.5; }
  100% { transform: translateY(112vh) translateX(10px)  rotate(720deg); opacity: 0;   }
}
@keyframes cfp-fall-c {
  0%   { transform: translateY(-20px) translateX(0)     rotate(0deg);   opacity: 1;    }
  20%  { transform: translateY(18vh)  translateX(-40px) rotate(150deg); opacity: 1;    }
  45%  { transform: translateY(44vh)  translateX(34px)  rotate(310deg); opacity: 0.95; }
  70%  { transform: translateY(70vh)  translateX(-30px) rotate(470deg); opacity: 0.65; }
  100% { transform: translateY(112vh) translateX(16px)  rotate(640deg); opacity: 0;    }
}
@keyframes cfp-fall-d {
  0%   { transform: translateY(-20px) translateX(0)    rotate(0deg);   opacity: 1;   }
  35%  { transform: translateY(36vh)  translateX(10px) rotate(330deg); opacity: 1;   }
  65%  { transform: translateY(68vh)  translateX(-5px) rotate(570deg); opacity: 0.8; }
  88%  { transform: translateY(92vh)  translateX(4px)  rotate(700deg); opacity: 0.4; }
  100% { transform: translateY(112vh) translateX(0)    rotate(800deg); opacity: 0;   }
}
@keyframes cfp-fall-e {
  0%   { transform: translateY(-20px) translateX(0)     rotate(0deg);   opacity: 1;   }
  15%  { transform: translateY(13vh)  translateX(22px)  rotate(65deg);  opacity: 1;   }
  32%  { transform: translateY(30vh)  translateX(-16px) rotate(155deg); opacity: 1;   }
  52%  { transform: translateY(50vh)  translateX(26px)  rotate(275deg); opacity: 0.9; }
  72%  { transform: translateY(70vh)  translateX(-12px) rotate(405deg); opacity: 0.7; }
  88%  { transform: translateY(88vh)  translateX(18px)  rotate(510deg); opacity: 0.4; }
  100% { transform: translateY(112vh) translateX(5px)   rotate(600deg); opacity: 0;   }
}

@media (prefers-reduced-motion: reduce) {
  .legendary-glow {
    animation: none !important;
    filter: blur(4px);
    opacity: 0.5;
  }
  .confetti-piece {
    display: none !important;
  }
  .card-flip-container {
    transition: transform 0ms;
  }
}
</style>
