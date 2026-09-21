<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTemaStore, TEMA_DEFECTO } from '../../stores/temaStore'
import { useToast } from '@/composables/useToast'
import RuletaWheel from '../../components/RuletaWheel.vue'
import PremioModal from '../../components/PremioModal.vue'
import VolverButton from '@/components/VolverButton.vue'
import PresetGallery from '../../components/PresetGallery.vue'
import HubBrandingPanel from '../../components/HubBrandingPanel.vue'
import FondoAtmosferaPanel from '../../components/FondoAtmosferaPanel.vue'
import TipografiaPanel from '../../components/TipografiaPanel.vue'
import AtmosphericParticles from '../../components/AtmosphericParticles.vue'
import PublicarTemaModal from '../../components/PublicarTemaModal.vue'
import { mensajeErrorTema } from '../../utils/errorTema'
import { estiloFondoTema } from '../../utils/fondoTema'
import type { DispositivoSimulado, ResultadoGiro, SegmentoRuleta } from '../../types'

const route = useRoute()
const toast = useToast()
const temaStore = useTemaStore()

const campanaId = computed(() => {
  const valor = route.query.campanaId
  return typeof valor === 'string' && valor.length > 0 ? valor : null
})

const tema = computed(() => temaStore.temaBorrador)
watch(campanaId, id => temaStore.cargarTema(id), { immediate: true })

onMounted(() => {
  temaStore.cargarPresets()
})

// ── Tabs del panel izquierdo ─────────────────────────────────────────────────
type TabId = 'plantillas' | 'paleta' | 'branding' | 'fondo' | 'tipografia'
const tabs: { id: TabId; label: string }[] = [
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'paleta', label: 'Paleta de Segmentos' },
  { id: 'branding', label: 'Branding y Hub' },
  { id: 'fondo', label: 'Fondo y Atmósfera' },
  { id: 'tipografia', label: 'Tipografía' },
]
const tabActiva = ref<TabId>('paleta')

// ── Preview ──────────────────────────────────────────────────────────────────
// El primer segmento siempre se marca Premio Mayor en el estudio: así el diseñador ve el estilo
// VIP (gradiente dorado, pulso, corona/estrella) incluso antes de simular un giro.
const segmentosPreview = computed<SegmentoRuleta[]>(() =>
  tema.value.paleta_segmentos.map((color, i) => ({
    id: i + 1,
    nombre: i === 0 ? 'Premio Mayor' : i % 2 === 0 ? 'Premio' : '¡Sigue!',
    tipo: 'relleno' as const,
    imagen_url: null,
    color,
    es_vacio: i % 2 !== 0,
    es_premio_mayor: i === 0,
  }))
)

// ── Simulador de giro ──────────────────────────────────────────────────────
const indiceJackpotPreview = computed(() => segmentosPreview.value.findIndex((s) => s.es_premio_mayor))
const indiceConsolacionPreview = computed(() => segmentosPreview.value.findIndex((s) => s.es_vacio))

const girandoSimulacion = ref(false)
const indiceGanadorSimulacion = ref<number | null>(null)
const resultadoSimulado = ref<ResultadoGiro | null>(null)

function construirResultadoSimulado(indice: number): ResultadoGiro {
  const premio = segmentosPreview.value[indice]
  return {
    giro_id: 'simulacion',
    codigo_canje: 'DEMO-0000',
    premio,
    es_ganador: !premio.es_vacio,
    indice_segmento: indice,
    cliente: {
      identificacion: '0000000000',
      correo: null,
      segmento: 'GRUPO_1',
      en_lista_negra: false,
      nombre: 'Cliente de prueba',
      telefono: null,
    },
  }
}

function simularGiro(tipo: 'jackpot' | 'consolacion') {
  if (girandoSimulacion.value) return
  const indice = tipo === 'jackpot' ? indiceJackpotPreview.value : indiceConsolacionPreview.value
  if (indice < 0) return
  resultadoSimulado.value = null
  indiceGanadorSimulacion.value = null
  girandoSimulacion.value = true
  // Un tick para forzar el cambio null → índice aunque se repita la misma simulación seguida
  // (RuletaWheel solo dispara la animación cuando `indiceGanador` cambia de valor).
  requestAnimationFrame(() => { indiceGanadorSimulacion.value = indice })
}

function onSimulacionCompletada() {
  girandoSimulacion.value = false
  if (indiceGanadorSimulacion.value !== null) {
    resultadoSimulado.value = construirResultadoSimulado(indiceGanadorSimulacion.value)
  }
}

// ── Simulador de viewport ────────────────────────────────────────────────────
const DISPOSITIVOS: { id: DispositivoSimulado; label: string; ancho: number; alto: number }[] = [
  { id: 'tablet-h', label: 'Tablet horizontal', ancho: 1280, alto: 800 },
  { id: 'tablet-v', label: 'Tablet vertical', ancho: 800, alto: 1280 },
  { id: 'desktop', label: 'Kiosko Full HD', ancho: 1920, alto: 1080 },
]
const dispositivoActual = computed(() =>
  DISPOSITIVOS.find((d) => d.id === temaStore.modoDispositivo) ?? DISPOSITIVOS[0]
)
const aspectRatioMarco = computed(() => `${dispositivoActual.value.ancho} / ${dispositivoActual.value.alto}`)

// Mismo criterio de resolución de fondo que EnroladorView, para que la vista previa sea WYSIWYG.
const estiloFondoPreview = computed(() => estiloFondoTema(tema.value))
const overlayFondoPreview = computed(() => (tema.value.fondo?.overlay_opacidad ?? 0) / 100)

// ── Publicación ──────────────────────────────────────────────────────────────
const mostrarModalPublicar = ref(false)
const destinoPublicacion = computed(() => (campanaId.value ? 'en esta campaña' : 'globalmente (todas las tiendas)'))

async function confirmarPublicacion() {
  try {
    await temaStore.publicarTemaEnTiendas()
    mostrarModalPublicar.value = false
    toast.success('Tema publicado', 'El tema se aplicará en las terminales.')
  } catch (e) {
    console.error(e)
    toast.error('No se pudo publicar el tema', mensajeErrorTema(e, 'Intenta nuevamente en unos segundos.'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <VolverButton
      :to="campanaId ? `/ruleta/admin/campanas/${campanaId}` : '/ruleta/admin'"
      :label="campanaId ? 'Detalle de campaña' : 'Administración — Ruleta'"
    />

    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Estudio de Diseño Visual</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ campanaId ? 'Tema personalizado de esta campaña.' : 'Tema global aplicado a todas las tiendas.' }}
          Los cambios se ven aquí en vivo; no llegan a las terminales hasta publicarlos.
        </p>
      </div>
      <span
        v-if="temaStore.hayCambiosSinPublicar"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      >
        Cambios sin publicar
      </span>
      <span v-else class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        Sincronizado con producción
      </span>
    </div>

    <div v-if="temaStore.errorCarga" role="alert" class="text-sm text-amber-700">
      {{ temaStore.errorCarga }}
      <button class="underline font-semibold" @click="temaStore.cargarTema(campanaId, true)">Reintentar</button>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- ── Panel izquierdo: tabs de diseño ────────────────────────────────── -->
      <div class="space-y-4">
        <div class="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl p-1.5">
          <button
            v-for="t in tabs"
            :key="t.id"
            @click="tabActiva = t.id"
            class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors"
            :class="tabActiva === t.id
              ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Plantillas -->
        <PresetGallery v-if="tabActiva === 'plantillas'" />

        <!-- Paleta de segmentos -->
        <template v-if="tabActiva === 'paleta'">
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Colores de los segmentos</h3>
            <div class="grid grid-cols-3 gap-3">
              <label
                v-for="(color, i) in tema.paleta_segmentos"
                :key="i"
                :for="`seg-color-${i}`"
                class="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div
                  class="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 group-hover:border-violet-400 transition-colors overflow-hidden"
                  :style="`background: ${color}`"
                >
                  <input
                    :id="`seg-color-${i}`"
                    type="color"
                    :value="color"
                    @input="temaStore.actualizarColorPaleta(i, ($event.target as HTMLInputElement).value)"
                    class="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <span class="text-xs text-gray-400 font-mono">{{ color }}</span>
              </label>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Texto, aro y hub</h3>

            <div
              v-for="campo in ([
                { key: 'color_texto_segmentos', label: 'Texto en segmentos' },
                { key: 'color_puntero',         label: 'Puntero / flecha' },
                { key: 'color_boton',           label: 'Botón Girar Ruleta' },
                { key: 'color_aro_primario',    label: 'Aro — primario' },
                { key: 'color_aro_secundario',  label: 'Aro — secundario' },
                { key: 'color_hub_fondo',       label: 'Hub — fondo' },
                { key: 'color_hub_acento',      label: 'Hub — acento' },
                { key: 'color_halo',            label: 'Halo / glow' },
                { key: 'color_fondo_inicio',    label: 'Fondo — inicio gradiente' },
                { key: 'color_fondo_fin',       label: 'Fondo — fin gradiente' },
              ] as const)"
              :key="campo.key"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ campo.label }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-mono text-gray-400">{{ tema[campo.key] }}</span>
                <label :for="`color-${campo.key}`" :aria-label="`Selector de color: ${campo.label}`" class="relative cursor-pointer">
                  <div class="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors overflow-hidden"
                       :style="`background: ${tema[campo.key]}`">
                    <input :id="`color-${campo.key}`" type="color" :value="tema[campo.key]"
                           @input="temaStore.actualizarBorrador({ [campo.key]: ($event.target as HTMLInputElement).value })"
                           class="opacity-0 w-full h-full cursor-pointer" />
                  </div>
                </label>
                <button v-if="tema[campo.key] !== TEMA_DEFECTO[campo.key]"
                        @click="temaStore.actualizarBorrador({ [campo.key]: TEMA_DEFECTO[campo.key] })"
                        title="Restablecer" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Branding y Hub -->
        <HubBrandingPanel v-if="tabActiva === 'branding'" />

        <!-- Fondo y Atmósfera -->
        <FondoAtmosferaPanel v-if="tabActiva === 'fondo'" />

        <!-- Tipografía -->
        <TipografiaPanel v-if="tabActiva === 'tipografia'" />
      </div>

      <!-- ── Panel derecho: simulador ────────────────────────────────────────── -->
      <div class="xl:sticky xl:top-6 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">Vista previa</p>
          <div class="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
            <button
              v-for="d in DISPOSITIVOS"
              :key="d.id"
              @click="temaStore.modoDispositivo = d.id"
              :title="d.label"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              :class="temaStore.modoDispositivo === d.id
                ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <div
          class="relative mx-auto rounded-2xl overflow-hidden flex items-center justify-center max-w-full [container-type:size]"
          :style="`${estiloFondoPreview} aspect-ratio: ${aspectRatioMarco}; width: min(100%, ${480 * dispositivoActual.ancho / dispositivoActual.alto}px)`"
        >
          <div class="absolute inset-0 pointer-events-none" :style="`background: rgba(0,0,0,${overlayFondoPreview})`" />
          <div class="relative aspect-square w-[min(16rem,70cqw,70cqh)]">
            <RuletaWheel
              :segmentos="segmentosPreview"
              :indice-ganador="indiceGanadorSimulacion"
              :girando="girandoSimulacion"
              :tema="tema"
              @animacion-completada="onSimulacionCompletada"
            />
          </div>
          <AtmosphericParticles
            :tipo="tema.particulas?.tipo ?? 'ninguno'"
            :intensidad="tema.particulas?.intensidad ?? 'media'"
          />
        </div>

        <!-- Simulador de giro -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex flex-wrap gap-2">
          <button
            @click="simularGiro('jackpot')"
            :disabled="girandoSimulacion"
            class="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            👑 Simular Giro Ganador (Jackpot)
          </button>
          <button
            @click="simularGiro('consolacion')"
            :disabled="girandoSimulacion"
            class="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Simular Premio de Consolación
          </button>
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

        <!-- Acciones de borrador / publicación -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex flex-wrap items-center gap-2">
          <button
            @click="temaStore.deshacer()"
            :disabled="!temaStore.puedeDeshacer"
            class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deshacer
          </button>
          <button
            @click="temaStore.rehacer()"
            :disabled="!temaStore.puedeRehacer"
            class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Rehacer
          </button>
          <button
            @click="temaStore.restablecerCambios()"
            :disabled="!temaStore.hayCambiosSinPublicar"
            class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Restablecer cambios
          </button>
          <button
            @click="mostrarModalPublicar = true"
            :disabled="!temaStore.hayCambiosSinPublicar || temaStore.publicando || temaStore.cargando || !!temaStore.errorCarga"
            class="ml-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ temaStore.publicando ? 'Publicando…' : 'Publicar en tiendas' }}
          </button>
        </div>
      </div>

    </div>

    <PublicarTemaModal
      v-if="mostrarModalPublicar"
      :activo="temaStore.temaActivo"
      :borrador="temaStore.temaBorrador"
      :destino="destinoPublicacion"
      :publicando="temaStore.publicando"
      @confirmar="confirmarPublicacion"
      @cancelar="mostrarModalPublicar = false"
    />

    <PremioModal
      v-if="resultadoSimulado"
      :resultado="resultadoSimulado"
      @cerrar="resultadoSimulado = null"
    />
  </div>
</template>
