<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Tienda } from '../types'

const props = defineProps<{
  tiendas: Tienda[]
  cargando: boolean
  nombreUsuario: string
}>()

const emit = defineEmits<{
  confirmar: [tienda: Tienda]
}>()

const tiendaId = ref<number | null>(null)

const ciudades = computed(() => [...new Set(props.tiendas.map(t => t.ciudad).filter(Boolean))])
const tiendasDe = (ciudad: string) => props.tiendas.filter(t => t.ciudad === ciudad)
const tiendasSinCiudad = computed(() => props.tiendas.filter(t => !t.ciudad))

function confirmar() {
  const tienda = props.tiendas.find(t => t.id === tiendaId.value)
  if (tienda) emit('confirmar', tienda)
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>

    <!-- Card -->
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

      <!-- Cabecera con gradiente Credicorp -->
      <div class="relative overflow-hidden px-8 pt-8 pb-6 flex flex-col items-center"
           style="background: linear-gradient(135deg, #0A86C2 0%, #014ba0 100%)">
        <div class="pointer-events-none absolute inset-0"
             style="background: radial-gradient(circle at 80% 20%, rgba(19,168,231,0.4) 0%, transparent 55%)"/>

        <div class="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
             style="background: rgba(255,255,255,0.18)">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
        </div>

        <h2 class="relative text-lg font-bold text-white text-center leading-snug">
          ¡Hola, {{ nombreUsuario }}!
        </h2>
        <p class="relative mt-1 text-sm text-center" style="color: rgba(255,255,255,0.75)">
          ¿Desde qué tienda operarás hoy?
        </p>
      </div>

      <div class="px-8 py-6">

        <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
          Este dato quedará asociado a todos tus giros del día.
        </p>

        <!-- Selector de tienda -->
        <div class="relative">
          <div v-if="cargando" class="flex justify-center py-4">
            <svg class="animate-spin h-5 w-5" style="color: #0A86C2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <template v-else>
            <select
              v-model="tiendaId"
              class="w-full rounded-xl border-2 bg-white dark:bg-gray-700 px-4 py-3 pr-10
                     text-gray-900 dark:text-white text-sm
                     focus:outline-none transition-colors appearance-none cursor-pointer"
              :class="tiendaId
                ? 'border-[#0A86C2] dark:border-[#0E97D4]'
                : 'border-gray-200 dark:border-gray-600 focus:border-[#0A86C2] dark:focus:border-[#0E97D4]'"
            >
              <option :value="null" disabled>Selecciona una tienda…</option>
              <optgroup v-for="ciudad in ciudades" :key="ciudad" :label="ciudad">
                <option v-for="t in tiendasDe(ciudad)" :key="t.id" :value="t.id">
                  {{ ciudad }} — {{ t.nombre }}
                </option>
              </optgroup>
              <option v-for="t in tiendasSinCiudad" :key="t.id" :value="t.id">
                {{ t.nombre }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </template>
        </div>

        <!-- Botón confirmar -->
        <button
          :disabled="!tiendaId"
          @click="confirmar"
          class="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
          :style="tiendaId
            ? 'background: linear-gradient(135deg, #0E97D4 0%, #014ba0 100%); color: white; box-shadow: 0 6px 20px rgba(10,134,194,0.35)'
            : ''"
          :class="!tiendaId ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'"
        >
          Confirmar y continuar
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </button>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-100 dark:border-gray-700 py-3 px-8 flex items-center justify-center gap-2">
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-xs text-gray-400 dark:text-gray-500">
          Podrás cambiar la tienda con el botón junto al badge.
        </span>
      </div>
    </div>
  </div>
</template>
