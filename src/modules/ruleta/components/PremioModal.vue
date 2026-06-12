<script setup lang="ts">
import { ref, computed } from 'vue'
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

    <!-- Card -->
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

      <!-- ── Premio ganado ─────────────────────────────── -->
      <template v-if="!resultado.premio.es_vacio">

        <!-- Cabecera gradiente Credicorp -->
        <div class="relative overflow-hidden px-6 pt-6 pb-5 flex items-center justify-between gap-4"
             style="background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%)">
          <div class="pointer-events-none absolute inset-0"
               style="background: radial-gradient(circle at 85% 30%, rgba(19,168,231,0.45) 0%, transparent 55%)"/>

          <!-- Estrella izquierda -->
          <div class="relative flex items-center gap-1 text-sm font-bold" style="color: rgba(255,255,255,0.85)">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>

          <!-- Imagen del premio (centro) -->
          <div class="relative w-18 h-18 flex-shrink-0">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                 style="background: rgba(255,255,255,0.18)">
              <svg v-if="!resultado.premio.imagen_url" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
              <img v-else :src="resultado.premio.imagen_url" class="w-12 h-12 object-contain" alt="Premio"/>
            </div>
          </div>

          <!-- Estrella derecha -->
          <div class="relative flex items-center gap-1 text-sm font-bold" style="color: rgba(255,255,255,0.85)">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>

        <!-- Cuerpo -->
        <div class="px-6 py-5">
          <p class="text-center text-lg font-bold text-gray-900 dark:text-white">
            🎉 ¡Ganaste {{ resultado.premio.nombre }}!
          </p>

          <!-- Código de canje -->
          <p class="mt-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
            Código de canje
          </p>
          <div class="mt-1.5 rounded-xl border-2 border-dashed py-3 px-4 text-center"
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
  </div>
</template>
