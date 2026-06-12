<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRuletaStore } from '../stores/ruletaStore'
import { useTemaStore } from '../stores/temaStore'
import SeleccionTiendaModal from '../components/SeleccionTiendaModal.vue'
import VolverButton from '../components/VolverButton.vue'
import RuletaWheel from '../components/RuletaWheel.vue'
import PremioModal from '../components/PremioModal.vue'
import type { Tienda } from '../types'

const authStore = useAuthStore()
const store = useRuletaStore()
const temaStore = useTemaStore()
const tema = computed(() => temaStore.tema)

const cedula = ref('')
const cedulaTouched = ref(false)
const mostrarPremioModal = ref(false)
const indiceGanador = ref<number | null>(null)
const modoFullscreen = ref(false)

const mostrarModalTienda = computed(() => !store.tiendaSeleccionada)

const soloDigitos = computed(() => /^\d+$/.test(cedula.value.trim()))

const cedulaError = computed(() => {
  if (!cedulaTouched.value || !cedula.value.trim()) return ''
  if (!soloDigitos.value) return 'La cédula solo puede contener números.'
  if (cedula.value.trim().length < 10) return 'La cédula debe tener exactamente 10 dígitos.'
  return ''
})

const puedeGirar = computed(() =>
  cedula.value.trim().length === 10 &&
  soloDigitos.value &&
  !store.girando &&
  !!store.tiendaSeleccionada &&
  !!store.campanaActivaId
)

onMounted(async () => {
  store.restaurarTiendaDelDia()
  await Promise.all([store.cargarTiendas(), store.cargarSegmentos()])
})

function onTiendaConfirmada(tienda: Tienda) {
  store.seleccionarTienda(tienda)
}

async function onGirar() {
  if (!puedeGirar.value) return
  store.limpiarGiro()
  mostrarPremioModal.value = false
  indiceGanador.value = null
  modoFullscreen.value = true
  await store.ejecutarGiro(cedula.value.trim())
  if (store.resultadoGiro) {
    indiceGanador.value = store.resultadoGiro.indice_segmento
  } else if (store.errorEnrolador) {
    modoFullscreen.value = false
  }
}

function onAnimacionCompletada() {
  if (store.resultadoGiro) mostrarPremioModal.value = true
}

function onCerrarPremio() {
  mostrarPremioModal.value = false
  modoFullscreen.value = false
  indiceGanador.value = null
  cedula.value = ''
  cedulaTouched.value = false
  store.limpiarGiro()
}

async function onNotificacionEnviada(correo: string) {
  await store.enviarNotificacion(correo)
}
</script>

<template>
  <div
    class="-mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8
           flex flex-col lg:flex-row overflow-hidden"
    style="min-height: calc(100dvh - 4rem)"
  >

    <!-- ══════════════════════════════════════════════════
         PANEL RULETA — Fondo Credicorp Blue
    ══════════════════════════════════════════════════ -->
    <div
      class="order-1 lg:order-2 flex-none lg:flex-1
             relative flex flex-col items-center justify-center gap-5 lg:gap-6
             overflow-hidden
             h-[64vh] sm:h-[68vh] md:h-[72vh] lg:h-auto"
      :style="`background: linear-gradient(135deg, ${tema.color_fondo_inicio} 0%, ${tema.color_fondo_fin} 45%, ${tema.color_fondo_fin}dd 100%)`"
    >

      <!-- Glows decorativos Credicorp -->
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
             style="background: rgba(19,168,231,0.12)" />
        <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl"
             style="background: rgba(5,116,175,0.15)" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[36rem] h-[36rem] rounded-full blur-3xl"
             style="background: rgba(0,99,156,0.07)" />
        <div class="absolute top-0 left-0 right-0 h-1/3 opacity-20"
             style="background: linear-gradient(180deg, rgba(19,168,231,0.12) 0%, transparent 100%)" />
      </div>

      <!-- ── Logo ONE CARD SVG ─────────────────────────────────────────── -->
      <div class="relative z-10 flex flex-col items-center select-none mt-4">
        <svg viewBox="0 0 400 120" class="w-64 sm:w-80 md:w-96 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="120" y="70" font-family="'Brush Script MT', 'Great Vibes', 'Pacifico', cursive" font-size="80" font-weight="normal" fill="white" text-anchor="middle" letter-spacing="-2">one</text>
          <path d="M 180 65 C 220 100, 280 110, 380 40" stroke="white" stroke-width="8" stroke-linecap="round" fill="none" />
          <text x="180" y="105" font-family="'Montserrat', 'Helvetica Neue', sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="8" text-anchor="middle">CARD</text>
        </svg>
        <div class="flex items-center gap-2.5 mt-4">
          <div class="h-px w-10" style="background: rgba(255,255,255,0.2)" />
          <span class="font-bold uppercase text-white/45"
                style="font-size: 0.6rem; letter-spacing: 0.28em">Ruleta de Premios</span>
          <div class="h-px w-10" style="background: rgba(255,255,255,0.2)" />
        </div>
      </div>

      <!-- ── Rueda ──────────────────────────────────────────────────────── -->
      <div
        class="relative z-10
               w-[320px]  h-[320px]
               sm:w-[420px] sm:h-[420px]
               md:w-[520px] md:h-[520px]
               lg:w-[560px] lg:h-[560px]
               xl:w-[640px] xl:h-[640px]
               2xl:w-[720px] 2xl:h-[720px]"
      >
        <RuletaWheel
          :segmentos="store.segmentos"
          :indice-ganador="indiceGanador"
          :girando="store.girando"
          :tema="tema"
          @animacion-completada="onAnimacionCompletada"
        />
      </div>

      <!-- ── Indicador de estado ────────────────────────────────────────── -->
      <div class="relative z-10 flex items-center gap-2 h-8 px-4 py-1.5 rounded-full
                  bg-white/8 backdrop-blur-sm border border-white/12">
        <template v-if="store.girando">
          <span class="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
          <span class="text-sm font-semibold text-white">Girando…</span>
        </template>
        <template v-else-if="!store.tiendaSeleccionada">
          <span class="inline-flex h-2 w-2 rounded-full bg-white/30" />
          <span class="text-sm text-white/50">Selecciona una tienda para comenzar</span>
        </template>
        <template v-else-if="cedula.trim().length < 10">
          <span class="inline-flex h-2 w-2 rounded-full bg-white/30" />
          <span class="text-sm text-white/50">Ingresa la cédula del cliente</span>
        </template>
        <template v-else>
          <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span class="text-sm font-semibold text-emerald-300">Listo para girar</span>
        </template>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════
         PANEL FORMULARIO
    ══════════════════════════════════════════════════ -->
    <div
      class="order-2 lg:order-1 flex-1 lg:flex-none lg:w-[360px]
             flex flex-col justify-center
             bg-white dark:bg-gray-900
             px-6 sm:px-10 md:px-12 lg:px-10 py-6 lg:py-0
             shadow-[0_-8px_32px_rgba(0,0,0,0.08)] lg:shadow-[8px_0_32px_rgba(0,0,0,0.06)]
             dark:shadow-none"
    >
      <div class="w-full max-w-sm mx-auto">

        <VolverButton to="/ruleta" label="Ruleta One Card" class="mb-5" />

        <!-- Badge tienda activa -->
        <div v-if="store.tiendaSeleccionada" class="mb-5 flex items-center gap-2">
          <span
            class="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full
                   bg-[#EFF8FD] dark:bg-[#0A86C2]/20
                   text-[#0574AF] dark:text-[#13A8E7]"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {{ store.tiendaSeleccionada.ciudad ? store.tiendaSeleccionada.ciudad + ' — ' : '' }}{{ store.tiendaSeleccionada.nombre }}
          </span>
          <button
            @click="store.cambiarTienda()"
            :disabled="store.girando"
            title="Cambiar tienda"
            class="p-1.5 rounded-full text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                   hover:text-[#0A86C2] hover:bg-[#EFF8FD] dark:hover:text-[#13A8E7] dark:hover:bg-[#0A86C2]/20"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
          </button>
        </div>

        <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-4">
          Datos del cliente
        </p>

        <!-- Input cédula -->
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-5 flex items-center">
            <svg class="w-6 h-6 text-[#0A86C2]/70 dark:text-[#0A86C2]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <input
            v-model="cedula"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="Ingresa la cédula…"
            maxlength="10"
            :disabled="store.girando"
            class="w-full pl-14 pr-5 py-5 text-xl rounded-2xl
                   border-2
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-white
                   placeholder-gray-300 dark:placeholder-gray-600
                   focus:outline-none
                   transition-colors disabled:opacity-50
                   touch-manipulation"
            :class="cedulaError
              ? 'border-red-400 dark:border-red-500 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-[#0A86C2] dark:focus:border-[#13A8E7]'"
            @blur="cedulaTouched = true"
            @keyup.enter="onGirar"
          />
        </div>

        <!-- Error de formato de cédula -->
        <p
          v-if="cedulaError"
          class="mt-2 flex items-center gap-2 text-sm text-red-500 dark:text-red-400"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ cedulaError }}
        </p>

        <!-- Error del servidor -->
        <div
          v-if="store.errorEnrolador"
          class="mt-3 flex items-start gap-2.5
                 text-sm text-red-600 dark:text-red-400
                 bg-red-50 dark:bg-red-900/20
                 border border-red-200 dark:border-red-800
                 rounded-xl px-4 py-3"
        >
          <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ store.errorEnrolador }}</span>
        </div>

        <!-- Botón GIRAR -->
        <button
          :disabled="!puedeGirar"
          @click="onGirar"
          class="mt-4 w-full flex items-center justify-center gap-3
                 py-5 rounded-2xl
                 font-extrabold uppercase tracking-[0.12em] text-lg
                 transition-all active:scale-95 touch-manipulation"
          :class="puedeGirar
            ? 'text-white shadow-xl'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'"
          :style="puedeGirar
            ? `background: ${tema.color_boton}; box-shadow: 0 8px 32px ${tema.color_boton}73`
            : ''"
        >
          <span>Girar Ruleta</span>
          <svg
            class="w-6 h-6"
            :class="{ 'animate-spin': store.girando }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>

        <p class="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
          El sistema validará al cliente automáticamente.
        </p>

      </div>
    </div>

  </div>

  <!-- ══════════════════════════════════════════════════════════════════════════
       FULLSCREEN OVERLAY — se monta fuera del layout mediante Teleport
  ══════════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="fs-overlay">
      <div
        v-if="modoFullscreen"
        class="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
        :style="`background: linear-gradient(135deg, ${tema.color_fondo_inicio} 0%, ${tema.color_fondo_fin} 45%, ${tema.color_fondo_fin}dd 100%)`"
      >

        <!-- Glows de fondo Credicorp -->
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl"
               style="background: rgba(19,168,231,0.14)" />
          <div class="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl"
               style="background: rgba(5,116,175,0.16)" />
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[80vw] h-[80vw] rounded-full blur-3xl"
               style="background: rgba(0,99,156,0.07)" />
        </div>

        <!-- Logo OneCard -->
        <div class="relative z-10 flex flex-col items-center select-none mb-6 sm:mb-8">
          <svg viewBox="0 0 400 120" class="w-72 sm:w-80 md:w-[28rem] drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="120" y="70" font-family="'Brush Script MT', 'Great Vibes', 'Pacifico', cursive" font-size="80" font-weight="normal" fill="white" text-anchor="middle" letter-spacing="-2">one</text>
            <path d="M 180 65 C 220 100, 280 110, 380 40" stroke="white" stroke-width="8" stroke-linecap="round" fill="none" />
            <text x="180" y="105" font-family="'Montserrat', 'Helvetica Neue', sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="8" text-anchor="middle">CARD</text>
          </svg>
          <div class="flex items-center gap-3 mt-4">
            <div class="h-px w-12" style="background: rgba(255,255,255,0.2)" />
            <span class="font-bold uppercase text-white/40"
                  style="font-size: 0.6rem; letter-spacing: 0.28em">Ruleta de Premios</span>
            <div class="h-px w-12" style="background: rgba(255,255,255,0.2)" />
          </div>
        </div>

        <!-- Rueda grande -->
        <Transition name="fs-wheel" appear>
          <div
            class="relative z-10"
            style="width: min(70vmin, 680px); height: min(70vmin, 680px)"
          >
            <RuletaWheel
              :segmentos="store.segmentos"
              :indice-ganador="indiceGanador"
              :girando="store.girando"
              :tema="tema"
              @animacion-completada="onAnimacionCompletada"
            />
          </div>
        </Transition>

        <!-- Badge estado -->
        <div class="relative z-10 mt-6 sm:mt-8 flex items-center gap-2.5 px-5 py-2.5 rounded-full
                    backdrop-blur-sm border border-white/15"
             style="background: rgba(255,255,255,0.08)">
          <template v-if="store.girando">
            <!-- Tres puntos animados -->
            <span class="inline-flex gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-300 animate-bounce [animation-delay:0ms]"   />
              <span class="w-2 h-2 rounded-full bg-amber-300 animate-bounce [animation-delay:120ms]" />
              <span class="w-2 h-2 rounded-full bg-amber-300 animate-bounce [animation-delay:240ms]" />
            </span>
            <span class="text-sm font-semibold tracking-wide text-white">¡Girando la ruleta!</span>
          </template>
          <template v-else>
            <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span class="text-sm font-semibold text-emerald-300">¡La ruleta se detuvo!</span>
          </template>
        </div>

      </div>
    </Transition>
  </Teleport>

  <!-- Modal selección de tienda -->
  <SeleccionTiendaModal
    v-if="mostrarModalTienda"
    :tiendas="store.tiendas"
    :cargando="store.cargandoTiendas"
    :nombre-usuario="authStore.fullName || authStore.userName || 'Enrolador'"
    @confirmar="onTiendaConfirmada"
  />

  <!-- Modal resultado del giro — z-[300] para quedar sobre el fullscreen -->
  <PremioModal
    v-if="mostrarPremioModal && store.resultadoGiro"
    :resultado="store.resultadoGiro"
    class="z-[300]"
    @cerrar="onCerrarPremio"
    @notificacion-enviada="onNotificacionEnviada"
  />

</template>

<style scoped>
/* ── Overlay fullscreen ────────────────────────────────────────────────────── */
.fs-overlay-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.fs-overlay-leave-active {
  transition: opacity 0.45s ease;
}
.fs-overlay-enter-from {
  opacity: 0;
  transform: scale(1.06);
}
.fs-overlay-leave-to {
  opacity: 0;
}

/* ── Rueda dentro del fullscreen ───────────────────────────────────────────── */
.fs-wheel-enter-active {
  transition: opacity 0.5s ease 0.15s, transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.15s;
}
.fs-wheel-enter-from {
  opacity: 0;
  transform: scale(0.75);
}
</style>
