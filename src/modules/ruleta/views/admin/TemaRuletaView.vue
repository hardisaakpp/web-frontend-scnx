<script setup lang="ts">
import { computed } from 'vue'
import { useTemaStore, TEMA_DEFECTO } from '../../stores/temaStore'
import RuletaWheel from '../../components/RuletaWheel.vue'
import VolverButton from '../../components/VolverButton.vue'
import type { SegmentoRuleta } from '../../types'

const temaStore = useTemaStore()
const tema = computed(() => temaStore.tema)

const segmentosPreview = computed<SegmentoRuleta[]>(() =>
  tema.value.paleta_segmentos.map((color, i) => ({
    id: i + 1,
    nombre: i % 2 === 0 ? 'Premio' : '¡Sigue!',
    tipo: 'relleno' as const,
    imagen_url: null,
    color,
    es_vacio: false,
  }))
)

const hayCambios = computed(() =>
  JSON.stringify(tema.value) !== JSON.stringify(TEMA_DEFECTO)
)
</script>

<template>
  <div class="space-y-6">
    <VolverButton to="/ruleta/admin" label="Administración — Ruleta" />

    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Diseño Visual de la Ruleta</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Personaliza los colores de la ruleta. Los cambios se aplican de inmediato.</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- ── Panel de controles ────────────────────────────────────────────── -->
      <div class="space-y-5">

        <!-- Paleta de segmentos -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Colores de los segmentos</h3>
          <div class="grid grid-cols-3 gap-3">
            <label
              v-for="(color, i) in tema.paleta_segmentos"
              :key="i"
              class="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                class="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 group-hover:border-violet-400 transition-colors overflow-hidden"
                :style="`background: ${color}`"
              >
                <input
                  type="color"
                  :value="color"
                  @input="temaStore.actualizarColorPaleta(i, ($event.target as HTMLInputElement).value)"
                  class="opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              <span class="text-xs text-gray-400 font-mono">{{ color }}</span>
              <span class="text-xs text-gray-500">Segmento {{ i + 1 }}</span>
            </label>
          </div>
        </div>

        <!-- Texto y elementos -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Texto y elementos</h3>

          <!-- Texto en segmentos -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Texto en segmentos</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema.color_texto_segmentos }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema.color_texto_segmentos}`">
                  <input type="color" :value="tema.color_texto_segmentos"
                         @input="temaStore.actualizarTema({ color_texto_segmentos: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema.color_texto_segmentos !== TEMA_DEFECTO.color_texto_segmentos"
                      @click="temaStore.actualizarTema({ color_texto_segmentos: TEMA_DEFECTO.color_texto_segmentos })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Puntero / flecha -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Puntero / flecha</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema.color_puntero }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema.color_puntero}`">
                  <input type="color" :value="tema.color_puntero"
                         @input="temaStore.actualizarTema({ color_puntero: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema.color_puntero !== TEMA_DEFECTO.color_puntero"
                      @click="temaStore.actualizarTema({ color_puntero: TEMA_DEFECTO.color_puntero })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Botón Girar Ruleta -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Botón Girar Ruleta</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema.color_boton }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema.color_boton}`">
                  <input type="color" :value="tema.color_boton"
                         @input="temaStore.actualizarTema({ color_boton: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema.color_boton !== TEMA_DEFECTO.color_boton"
                      @click="temaStore.actualizarTema({ color_boton: TEMA_DEFECTO.color_boton })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Aro exterior -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aro exterior</h3>

          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Color primario</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema.color_aro_primario }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema.color_aro_primario}`">
                  <input type="color" :value="tema.color_aro_primario"
                         @input="temaStore.actualizarTema({ color_aro_primario: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema.color_aro_primario !== TEMA_DEFECTO.color_aro_primario"
                      @click="temaStore.actualizarTema({ color_aro_primario: TEMA_DEFECTO.color_aro_primario })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Color secundario</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema.color_aro_secundario }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema.color_aro_secundario}`">
                  <input type="color" :value="tema.color_aro_secundario"
                         @input="temaStore.actualizarTema({ color_aro_secundario: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema.color_aro_secundario !== TEMA_DEFECTO.color_aro_secundario"
                      @click="temaStore.actualizarTema({ color_aro_secundario: TEMA_DEFECTO.color_aro_secundario })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Hub central y fondo -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Hub central y fondo</h3>

          <div v-for="campo in ([
            { key: 'color_hub_fondo',     label: 'Hub — fondo' },
            { key: 'color_hub_acento',    label: 'Hub — acento' },
            { key: 'color_halo',          label: 'Halo / glow' },
            { key: 'color_fondo_inicio',  label: 'Fondo — inicio gradiente' },
            { key: 'color_fondo_fin',     label: 'Fondo — fin gradiente' },
          ] as const)" :key="campo.key" class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ campo.label }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-gray-400">{{ tema[campo.key] }}</span>
              <label class="relative cursor-pointer">
                <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                     :style="`background: ${tema[campo.key]}`">
                  <input type="color" :value="tema[campo.key]"
                         @input="temaStore.actualizarTema({ [campo.key]: ($event.target as HTMLInputElement).value })"
                         class="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <button v-if="tema[campo.key] !== TEMA_DEFECTO[campo.key]"
                      @click="temaStore.actualizarTema({ [campo.key]: TEMA_DEFECTO[campo.key] })"
                      title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex items-center gap-3">
          <button
            v-if="hayCambios"
            @click="temaStore.resetearTema()"
            class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Restablecer valores por defecto
          </button>
          <span v-if="!hayCambios" class="text-xs text-gray-400 dark:text-gray-500 italic">
            Usando tema por defecto
          </span>
          <span v-else class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Cambios guardados automáticamente
          </span>
        </div>

      </div>

      <!-- ── Preview de la ruleta ──────────────────────────────────────────── -->
      <div class="xl:sticky xl:top-6 space-y-3">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">Vista previa</p>

        <div
          class="rounded-2xl overflow-hidden flex items-center justify-center p-8"
          :style="`background: linear-gradient(135deg, ${tema.color_fondo_inicio} 0%, ${tema.color_fondo_fin} 100%); min-height: 380px`"
        >
          <div class="w-64 h-64 sm:w-72 sm:h-72">
            <RuletaWheel
              :segmentos="segmentosPreview"
              :indice-ganador="null"
              :girando="false"
              :tema="tema"
            />
          </div>
        </div>

        <!-- Muestra del botón -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center gap-4">
          <span class="text-sm text-gray-500 dark:text-gray-400 shrink-0">Botón:</span>
          <button
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-wider opacity-90 cursor-default"
            :style="`background: ${tema.color_boton}`"
          >
            GIRAR RULETA
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
