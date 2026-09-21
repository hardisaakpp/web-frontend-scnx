<script setup lang="ts">
import { computed } from 'vue'
import { useTemaStore, TEMA_DEFECTO } from '../stores/temaStore'
import { PARTICULAS, INTENSIDADES } from '../constants/particulas.config'
import { estiloFondoTema } from '../utils/fondoTema'
import type { FondoConfig, GradienteConfig, ParadaColorGradiente, ParticulasConfig } from '../types'

const temaStore = useTemaStore()

const fondo = computed<FondoConfig>(() => temaStore.temaBorrador.fondo ?? TEMA_DEFECTO.fondo!)
const gradiente = computed<GradienteConfig>(() => fondo.value.gradiente ?? TEMA_DEFECTO.fondo!.gradiente!)
const particulas = computed<ParticulasConfig>(() => temaStore.temaBorrador.particulas ?? TEMA_DEFECTO.particulas!)

function actualizarParticulas(patch: Partial<ParticulasConfig>) {
  temaStore.actualizarBorrador({ particulas: { ...particulas.value, ...patch } })
}

function actualizarFondo(patch: Partial<FondoConfig>) {
  temaStore.actualizarBorrador({ fondo: { ...fondo.value, ...patch } })
}

function actualizarGradiente(patch: Partial<GradienteConfig>) {
  actualizarFondo({ gradiente: { ...gradiente.value, ...patch } })
}

function actualizarParada(indice: number, patch: Partial<ParadaColorGradiente>) {
  if (patch.offset !== undefined) {
    patch = { ...patch, offset: Math.min(100, Math.max(0, Number.isFinite(patch.offset) ? patch.offset : 0)) }
  }
  const paradas = gradiente.value.paradas.map((p, i) => (i === indice ? { ...p, ...patch } : p))
  actualizarGradiente({ paradas })
}

function agregarParada() {
  actualizarGradiente({ paradas: [...gradiente.value.paradas, { color: '#ffffff', offset: 50 }] })
}

function quitarParada(indice: number) {
  if (gradiente.value.paradas.length <= 2) return // mínimo 2 paradas para que el degradado tenga sentido
  actualizarGradiente({ paradas: gradiente.value.paradas.filter((_, i) => i !== indice) })
}

const previsualizacionGradiente = computed(() => estiloFondoTema(temaStore.temaBorrador))
</script>

<template>
  <div class="space-y-4">
    <!-- Tipo de fondo -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Fondo de pantalla</h3>
      </div>

      <details class="text-xs text-gray-500 dark:text-gray-400">
        <summary class="cursor-pointer" aria-label="Ayuda sobre fondo">? ¿Dónde se verá el fondo?</summary>
        <p>El degradado y colores configurados cubrirán toda la pantalla de la tablet en modo kiosko detrás de la ruleta física en las tiendas.</p>
      </details>
      <div class="h-16 rounded-xl border border-gray-200 dark:border-gray-700" :style="previsualizacionGradiente" />

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400 shrink-0">Estilo</span>
        <select aria-label="Estilo de degradado"
          :value="gradiente.tipo"
          @change="actualizarGradiente({ tipo: ($event.target as HTMLSelectElement).value as GradienteConfig['tipo'] })"
          class="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
        >
          <option value="lineal">Lineal</option>
          <option value="radial">Radial</option>
          <option value="mesh">Mesh (multi-color)</option>
        </select>
      </div>

      <div v-if="gradiente.tipo === 'lineal'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm text-gray-600 dark:text-gray-400">Ángulo</span>
          <span class="text-xs font-mono text-gray-400">{{ gradiente.angulo ?? 135 }}°</span>
        </div>
        <input
          aria-label="Ángulo del degradado" type="range" min="0" max="360" step="5" :value="gradiente.angulo ?? 135"
          @input="actualizarGradiente({ angulo: Number(($event.target as HTMLInputElement).value) })"
          class="w-full accent-violet-600"
        />
      </div>

      <div class="space-y-2">
        <div v-for="(parada, i) in gradiente.paradas" :key="i" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden shrink-0" :style="`background: ${parada.color}`">
            <input :aria-label="`Color de parada ${i + 1}`" type="color" :value="parada.color" @input="actualizarParada(i, { color: ($event.target as HTMLInputElement).value })" class="opacity-0 w-full h-full cursor-pointer" />
          </div>
          <input
            :aria-label="`Posición de parada ${i + 1}`" type="number" min="0" max="100" :value="parada.offset"
            @input="actualizarParada(i, { offset: Number(($event.target as HTMLInputElement).value) })"
            class="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
          />
          <span class="text-xs text-gray-400">%</span>
          <button
            v-if="gradiente.paradas.length > 2"
            @click="quitarParada(i)"
            class="ml-auto text-gray-400 hover:text-red-500 transition-colors"
            title="Quitar parada"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <button @click="agregarParada" class="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300">
          + Agregar parada de color
        </button>
      </div>
    </div>

    <!-- Atenuación -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Atenuación sobre el fondo</span>
        <span class="text-xs font-mono text-gray-400">{{ fondo.overlay_opacidad }}%</span>
      </div>
      <input
        aria-label="Atenuación del fondo" type="range" min="0" max="90" step="5" :value="fondo.overlay_opacidad"
        @input="actualizarFondo({ overlay_opacidad: Number(($event.target as HTMLInputElement).value) })"
        class="w-full accent-violet-600"
      />
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Oscurece el fondo para dar contraste a la ruleta.</p>
    </div>

    <!-- Partículas atmosféricas -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Atmósfera (partículas)</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">Activa efectos visuales dinámicos que flotarán sobre la pantalla (Ej. nieve cayendo para Navidad, o chispas doradas para un aniversario).</p>
      <details class="text-xs text-gray-500 dark:text-gray-400">
        <summary class="cursor-pointer" aria-label="Ayuda sobre atmósfera">? ¿Cómo probar los efectos?</summary>
        <p>Elige un efecto y ajusta la intensidad para verlo al instante en el simulador.</p>
      </details>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Efectos de partículas">
        <button
          v-for="opcion in PARTICULAS"
          :key="opcion.id"
          @click="actualizarParticulas({ tipo: opcion.id })"
          :aria-pressed="particulas.tipo === opcion.id" :aria-label="opcion.etiqueta"
          class="px-3 py-2 rounded-xl border text-sm transition-colors"
          :class="particulas.tipo === opcion.id
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300'"
        >
          <span aria-hidden="true" class="block text-xl">{{ opcion.icono }}</span>
          <span class="block font-semibold">{{ opcion.etiqueta }}</span>
          <span class="block mt-1 text-xs">{{ opcion.descripcion }}</span>
        </button>
      </div>

      <div v-if="particulas.tipo !== 'ninguno'" class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">Intensidad</span>
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
          <button
            v-for="opcion in INTENSIDADES"
            :key="opcion"
            @click="actualizarParticulas({ intensidad: opcion })"
            :aria-pressed="particulas.intensidad === opcion"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
            :class="particulas.intensidad === opcion
              ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
          >
            {{ opcion }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500">Se pausan al ocultar la pestaña y respetan la preferencia de movimiento reducido del dispositivo.</p>
    </div>
  </div>
</template>
