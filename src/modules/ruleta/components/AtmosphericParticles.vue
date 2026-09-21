<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CANTIDAD_PARTICULAS, PARTICULAS } from '../constants/particulas.config'
import type { IntensidadParticula, TipoParticula } from '../types'

const props = defineProps<{ tipo: TipoParticula; intensidad: IntensidadParticula }>()
const oculta = ref(false)
function sincronizarVisibilidad() { oculta.value = document.hidden }
onMounted(() => {
  sincronizarVisibilidad()
  document.addEventListener('visibilitychange', sincronizarVisibilidad)
})
onUnmounted(() => document.removeEventListener('visibilitychange', sincronizarVisibilidad))

// Distribución estable al cambiar la intensidad, sin bucles JavaScript de animación.
const particulas = computed(() => {
  if (props.tipo === 'ninguno') return []
  const colores: readonly string[] = PARTICULAS.find(p => p.id === props.tipo)?.colores ?? ['#FFFFFF']
  return Array.from({ length: CANTIDAD_PARTICULAS[props.intensidad] }, (_, i) => ({
    left: `${((props.tipo === 'fuegos_artificiales' ? Math.floor(i / 8) : i) * 37 + 11) % 100}%`,
    top: `${((props.tipo === 'fuegos_artificiales' ? Math.floor(i / 8) : i) * 23 + 7) % 100}%`,
    color: colores[i % colores.length],
    '--size': `${3 + i % 5}px`,
    '--drift': `${(i % 2 ? 1 : -1) * (20 + i % 40)}px`,
    '--turn': `${i % 2 ? 240 : -240}deg`,
    '--duration': `${8 + i % 9}s`,
    '--delay': `${-(props.tipo === 'fuegos_artificiales' ? Math.floor(i / 8) : i) * 1.7}s`,
    '--burst-x': `${Math.cos(i * 2.399) * 65}px`,
    '--burst-y': `${Math.sin(i * 2.399) * 65}px`,
  }))
})
</script>

<template>
  <div aria-hidden="true" data-testid="atmospheric-particles"
    class="atmosfera absolute inset-0 overflow-hidden pointer-events-none"
    :class="{ pausada: oculta }" :data-efecto="tipo">
    <span v-for="(estilo, i) in particulas" :key="`${tipo}-${i}`"
      class="particula" :class="`efecto-${tipo}`" :style="estilo" />
  </div>
</template>

<style scoped>
.atmosfera { container-type: size; }
.particula {
  position: absolute;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  animation: caer var(--duration) linear var(--delay) infinite;
}
.efecto-nieve { box-shadow: 0 0 3px currentColor; }
.efecto-chispas { animation-name: subir; box-shadow: 0 0 5px currentColor; }
.efecto-neon {
  width: calc(var(--size) * 2);
  height: calc(var(--size) * 2);
  box-shadow: 0 0 10px currentColor;
  animation-name: titilar;
}
.efecto-confeti { border-radius: 1px; height: calc(var(--size) * 1.8); animation-name: balancear; }
.efecto-burbujas {
  width: calc(var(--size) * 4);
  height: calc(var(--size) * 4);
  background: transparent;
  border: 1px solid currentColor;
  box-shadow: inset 2px 2px 5px currentColor;
  animation-name: subir;
}
.efecto-estrellas {
  width: calc(var(--size) * 2);
  height: calc(var(--size) * 2);
  clip-path: polygon(50% 0, 61% 35%, 100% 50%, 61% 61%, 50% 100%, 35% 61%, 0 50%, 35% 35%);
  animation-name: titilar;
}
.efecto-fuegos_artificiales { box-shadow: 0 0 4px currentColor; animation-name: estallar; animation-duration: 7s; }
.efecto-hojas { width: calc(var(--size) * 2); height: calc(var(--size) * 3); border-radius: 0 90% 0 90%; animation-name: balancear; }
.efecto-luces_flotantes {
  width: calc(var(--size) * 5);
  height: calc(var(--size) * 5);
  background: radial-gradient(circle, currentColor, transparent 70%);
  animation-name: bokeh;
}
.pausada .particula { animation-play-state: paused; }
@keyframes caer {
  0% { transform: translate3d(0, -100cqh, 0); opacity: 0; }
  15%, 80% { opacity: .7; }
  100% { transform: translate3d(var(--drift), 100cqh, 0); opacity: 0; }
}
@keyframes subir {
  0% { transform: translate3d(0, 100cqh, 0) scale(.7); opacity: 0; }
  20%, 75% { opacity: .65; }
  100% { transform: translate3d(var(--drift), -100cqh, 0) scale(1.2); opacity: 0; }
}
@keyframes balancear {
  0% { transform: translate3d(0, -100cqh, 0) rotate(0); opacity: 0; }
  20%, 75% { opacity: .7; }
  100% { transform: translate3d(var(--drift), 100cqh, 0) rotate(var(--turn)); opacity: 0; }
}
@keyframes titilar {
  0%, 100% { transform: translate3d(0, 0, 0) scale(.5); opacity: .1; }
  50% { transform: translate3d(0, -8px, 0) scale(1.1); opacity: .75; }
}
@keyframes estallar {
  0%, 65%, 100% { transform: translate3d(0, 0, 0) scale(.2); opacity: 0; }
  70% { transform: translate3d(0, 0, 0) scale(.5); opacity: .65; }
  95% { transform: translate3d(var(--burst-x), var(--burst-y), 0) scale(.1); opacity: 0; }
}
@keyframes bokeh {
  0%, 100% { transform: translate3d(0, 0, 0) scale(.8); opacity: .1; }
  50% { transform: translate3d(var(--drift), -35px, 0) scale(1.2); opacity: .4; }
}
@media (prefers-reduced-motion: reduce) { .particula { display: none; animation: none; } }
</style>
