<template>
  <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-800/30">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-800 text-sm">
        <caption class="sr-only">Papeletas de depósito registradas para el día seleccionado</caption>
        <thead class="bg-slate-800/60">
          <tr>
            <th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold text-slate-400">Papeleta</th>
            <th scope="col" class="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Monto</th>
            <th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold text-slate-400">Estado</th>
            <th scope="col" class="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <!-- Skeleton de carga -->
          <tr v-if="loading" v-for="i in 3" :key="`sk-${i}`">
            <td v-for="c in 4" :key="c" class="px-3 py-3">
              <div class="h-4 rounded bg-slate-700/60 animate-pulse" :class="c === 2 ? 'w-16 ml-auto' : 'w-20'"></div>
            </td>
          </tr>

          <!-- Vacío -->
          <tr v-else-if="depositos.length === 0">
            <td colspan="4" class="px-3 py-10 text-center text-sm text-slate-500">
              No se han registrado papeletas de depósito para este día todavía.
            </td>
          </tr>

          <!-- Filas de datos -->
          <tr
            v-for="deposito in (loading ? [] : depositos)"
            :key="deposito.id"
            class="hover:bg-slate-800/50 transition-colors"
          >
            <td class="px-3 py-3 align-top">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-white">{{ deposito.numeroComprobante }}</span>
                  <span
                    v-if="deposito.esSobrante"
                    class="inline-flex items-center rounded-full bg-sky-500/10 text-sky-300 border border-sky-700/60 px-2 py-0.5 text-[10px] font-semibold"
                  >
                    Sobrante
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-slate-400 truncate">{{ deposito.responsable }}</p>
                <p class="text-[11px] text-slate-500">{{ formatDateOnly(deposito.fechaDepositoBanco) }}</p>
              </div>
            </td>
            <td class="px-3 py-3 text-right font-bold text-white align-top whitespace-nowrap">{{ formatCurrency(deposito.montoDepositado) }}</td>
            <td class="px-3 py-3 align-top">
              <SemaforoEstadoBadge
                :estado="deposito.estado"
                :creado-s-a-p="deposito.creadoSAP"
                :doc-entry-s-a-p="deposito.docEntrySAP"
              />
            </td>
            <td class="px-3 py-3 align-top">
              <div class="flex items-center justify-end gap-1">
                <!-- Ver comprobante -->
                <button
                  type="button"
                  class="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  title="Ver comprobante adjunto"
                  aria-label="Ver comprobante adjunto"
                  @click="$emit('ver-comprobante', deposito)"
                >
                  <EyeIcon class="h-4 w-4" aria-hidden="true" />
                </button>

                <!-- Enviar a SAP -->
                <button
                  v-if="puedeIntegrarSap && deposito.estado === EstadoDeposito.Pendiente"
                  type="button"
                  :disabled="enviandoSapIds.has(deposito.id)"
                  :aria-busy="enviandoSapIds.has(deposito.id)"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs"
                  @click="$emit('integrar-sap', deposito)"
                >
                  <svg v-if="enviandoSapIds.has(deposito.id)" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <PaperAirplaneIcon v-else class="h-3.5 w-3.5" aria-hidden="true" />
                  <span class="sr-only sm:not-sr-only">{{ enviandoSapIds.has(deposito.id) ? 'Enviando…' : 'Enviar a SAP' }}</span>
                </button>

                <!-- Anular papeleta (si no está integrada a SAP) -->
                <button
                  v-if="puedeEliminar && !deposito.creadoSAP && deposito.estado !== EstadoDeposito.Anulado"
                  type="button"
                  :disabled="anulandoIds.has(deposito.id)"
                  :aria-busy="anulandoIds.has(deposito.id)"
                  class="rounded-lg p-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  title="Anular papeleta"
                  aria-label="Anular papeleta"
                  @click="$emit('anular', deposito)"
                >
                  <TrashIcon class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { formatCurrency, formatDateOnly } from '../utils/formatters'
import { EstadoDeposito, type DepositoDto } from '../types/tesoreria.types'
import SemaforoEstadoBadge from './SemaforoEstadoBadge.vue'

defineProps<{
  depositos: DepositoDto[]
  loading: boolean
  enviandoSapIds: Set<number>
  anulandoIds: Set<number>
  puedeIntegrarSap: boolean
  puedeEliminar: boolean
}>()

defineEmits<{
  (e: 'integrar-sap', deposito: DepositoDto): void
  (e: 'anular', deposito: DepositoDto): void
  (e: 'ver-comprobante', deposito: DepositoDto): void
}>()
</script>
