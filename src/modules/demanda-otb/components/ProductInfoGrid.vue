<script setup lang="ts">
import type { SkuDetail } from '../types'

defineProps<{ producto: SkuDetail; negocio: string }>()

const CONFIANZA_COLOR: Record<string, string> = {
  ALTA: 'text-emerald-600 dark:text-emerald-400',
  MEDIA: 'text-amber-600 dark:text-amber-400',
  BAJA: 'text-red-600 dark:text-red-400',
}

const SEMAFORO_COLOR: Record<string, string> = {
  OK: 'text-emerald-600 dark:text-emerald-400',
  BAJO: 'text-amber-600 dark:text-amber-400',
  CRITICO: 'text-red-600 dark:text-red-400',
  SOBRESTOCK: 'text-blue-600 dark:text-blue-400',
  MARGINAL: 'text-amber-600 dark:text-amber-400',
  'SIN DEMANDA': 'text-gray-500 dark:text-gray-400',
}

const SEMAFORO_DOT: Record<string, string> = {
  OK: 'bg-emerald-500',
  BAJO: 'bg-amber-500',
  CRITICO: 'bg-red-500',
  SOBRESTOCK: 'bg-blue-500',
  MARGINAL: 'bg-amber-500',
  'SIN DEMANDA': 'bg-gray-400',
}

function confianzaColor(value: string | null | undefined) {
  return value ? CONFIANZA_COLOR[value.toUpperCase()] ?? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
}

function semaforoColor(value: string | null | undefined) {
  return value ? SEMAFORO_COLOR[value.toUpperCase()] ?? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
}

function semaforoDot(value: string | null | undefined) {
  return value ? SEMAFORO_DOT[value.toUpperCase()] ?? 'bg-gray-400' : 'bg-gray-400'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Detalle producto -->
    <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
      <h4 class="text-[14px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-3">Detalle producto</h4>
      <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Código</span>
          <span class="font-bold text-blue-700 dark:text-blue-400">{{ producto.codigo }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Producto</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.nombre }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Marca</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ negocio }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Nivel 1</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.nivel1 || '—' }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Nivel 2</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.nivel2 || '—' }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Nivel 3</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.nivel3 || '—' }}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Género</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.genero || 'No aplica' }}</span>
        </div>
        <div v-if="producto.descripcion" class="col-span-2">
          <span class="text-gray-500 dark:text-gray-400 block mb-1">Descripción</span>
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ producto.descripcion }}</span>
        </div>
      </div>
    </div>

    <!-- Proyección OTB -->
    <div v-if="producto.tieneProyeccion" class="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100/60 dark:border-blue-800/60">
      <h4 class="text-[14px] font-bold text-blue-500 dark:text-blue-500 uppercase tracking-widest mb-3">Proyección OTB</h4>
      <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Categoría</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.categoria || 'Sin datos' }}</span>
        </div>
        <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Confianza</span>
          <span class="font-bold" :class="confianzaColor(producto.confianza)">{{ producto.confianza || '—' }}</span>
        </div>
        <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Stock inicial</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.stockInicial ?? '—' }} uds</span>
        </div>
        <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Próximo mes ({{ producto.proximoMes }})</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.prediccionProximoMes ?? '—' }} uds</span>
        </div>
        <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Rango 80%</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.rangoMin80 ?? '—' }} – {{ producto.rangoMax80 ?? '—' }} uds</span>
        </div>
        <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Semáforo OTB</span>
          <span class="font-bold flex items-center gap-1.5" :class="semaforoColor(producto.semaforo)">
            <span class="w-2 h-2 rounded-full flex-shrink-0" :class="semaforoDot(producto.semaforo)"></span>
            {{ producto.semaforo || '—' }} - {{producto.coberturaTotalDias}} días de cobertura.
          </span>
        </div>
        <div class="col-span-2">
          <span class="text-gray-500 dark:text-gray-400 block mb-1">Decisión</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ producto.decisionOtb || '—' }}</span>
        </div>
      </div>
    </div>
    <div v-else class="bg-amber-50/50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-100/60 dark:border-amber-800/60">
      <h4 class="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3">Sin proyección</h4>
      <p class="text-sm text-gray-700 dark:text-gray-300">{{ producto.mensaje }}</p>
    </div>
  </div>
</template>
