<script setup lang="ts">
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'
import EstadosPlantilla from './EstadosPlantilla.vue'
import type { SolicitudDetalle, StockFaltante } from '../types'
import CargandoSpinner from './CargandoSpinner.vue';
import ErrorStockFaltante from './ErrorStockFaltante.vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  abierto: boolean; detalle: SolicitudDetalle | null; cargando: boolean
  modo?: 'solo-lectura' | 'aprobacion'
  procesando?: boolean
  error?: string
  faltantes?: StockFaltante[]
}>()
const emit = defineEmits<{
  cerrar: []
  aprobar: [observacion: string]
  rechazar: [motivoRechazo: string]
}>()

const accionActiva = ref<'aprobar' | 'rechazar' | null>(null)
const observacion = ref('')
const motivoRechazo = ref('')

watch(() => props.abierto, (v) => {
  if (v) { accionActiva.value = null; observacion.value = ''; motivoRechazo.value = '' }
})

const confirmarAprobar = () => emit('aprobar', observacion.value.trim())
const confirmarRechazar = () => {
  if (!motivoRechazo.value.trim()) return   // motivo obligatorio
  emit('rechazar', motivoRechazo.value.trim())
}


const formatFecha = (iso: string) => (iso ? new Date(iso).toLocaleDateString(APP_LOCALE) : '')
const mostrarGuia = (g: string | null) => (g && g.trim() ? g : '—')

// Fecha + hora para la resolución (dd/MM/yyyy HH:mm)
const formatFechaHora = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// ── Resolución del aprobador ─────────────────────────────────────────────────
// El comentario es el mismo campo para aprobar y rechazar: el estado define el tono.
const hayResolucion = computed(() =>
  !!(props.detalle?.comentarioAprobador || props.detalle?.aprobadoPor || props.detalle?.fechaAprobacion)
)
const fueRechazada = computed(() => props.detalle?.estado === 'Rechazado')

const claseResolucion = computed(() =>
  fueRechazada.value
    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
    : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
)
const claseTituloResolucion = computed(() =>
  fueRechazada.value ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
)
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cerrar')"></div>

    <div
      class="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Solicitud <span v-if="detalle">#{{ detalle.id }}</span>
            </h2>
            <EstadosPlantilla v-if="detalle" :estado="detalle.estado" />
          </div>
          <p v-if="modo === 'aprobacion'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Esta solicitud requiere tu aprobación para continuar el envío a SAP, o recházala indicando el motivo.
          </p>
        </div>
        <button type="button" @click="emit('cerrar')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="overflow-y-auto p-6 space-y-6">
        <CargandoSpinner v-if="cargando" mensaje="Cargando detalle…" />

        <template v-else-if="detalle">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Responsable</dt>
              <dd class="text-gray-900 dark:text-white">{{ detalle.usuarioSolicitante }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha</dt>
              <dd class="text-gray-900 dark:text-white">{{ formatFecha(detalle.fechaSolicitud) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Origen</dt>
              <dd class="text-gray-900 dark:text-white">{{ detalle.tiendaOrigen }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Destino</dt>
              <dd class="text-gray-900 dark:text-white">{{ detalle.tiendaDestinoCodigo }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Guía</dt>
              <dd class="text-gray-900 dark:text-white">{{ mostrarGuia(detalle.guiaEnvio) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Justificación</dt>
              <dd class="text-gray-900 dark:text-white">{{ detalle.justificacion || '—' }}</dd>
            </div>
          </dl>

          <!-- Resolución del aprobador (verde si aprobó, rojo si rechazó) -->
          <div v-if="hayResolucion" class="rounded-lg border p-3" :class="claseResolucion">
            <div class="flex items-center gap-2">
              <XCircleIcon v-if="fueRechazada" class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <CheckCircleIcon v-else class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p class="text-sm font-semibold" :class="claseTituloResolucion">
                {{ fueRechazada ? 'Solicitud rechazada' : 'Solicitud aprobada' }}
              </p>
            </div>

            <p v-if="detalle.aprobadoPor || detalle.fechaAprobacion"
              class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ detalle.aprobadoPor || 'Sin registrar' }}
              <span v-if="detalle.fechaAprobacion"> · {{ formatFechaHora(detalle.fechaAprobacion) }}</span>
            </p>

            <p v-if="detalle.comentarioAprobador"
              class="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {{ detalle.comentarioAprobador }}
            </p>
          </div>

          <div v-if="detalle.sapDraftDocEntry || detalle.sapTransferDocNum"
            class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Información SAP</h3>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div v-if="detalle.sapTransferDocNum">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Doc. Transferencia</dt>
                <dd class="text-gray-900 dark:text-white">{{ detalle.sapTransferDocNum }}</dd>
              </div>
              <div v-else-if="detalle.sapDraftDocEntry">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Doc. Borrador</dt>
                <dd class="text-gray-900 dark:text-white">{{ detalle.sapDraftDocEntry }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos</h3>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="overflow-x-auto overflow-y-auto max-h-[40vh]">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th
                        class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código</th>
                      <th
                        class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nombre</th>
                      <th
                        class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código de Barras</th>
                      <th
                        class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="p in detalle.productos" :key="p.itemCode">
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.itemCode }}</td>
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.itemName }}</td>
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.codeBars }}</td>
                      <td class="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{{ p.cantidadSolicitada
                        }}</td>
                    </tr>
                    <tr v-if="detalle.productos.length === 0">
                      <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-400">Sin productos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div v-if="modo === 'aprobacion' && detalle"
            class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <!-- Error de stock insuficiente: mensaje + tabla de faltantes -->
            <!-- El aprobador sí ve el stock disponible: lo necesita para decidir -->
            <ErrorStockFaltante v-if="error && (faltantes?.length ?? 0) > 0" :mensaje="error" :faltantes="faltantes!"
              mostrar-disponible />
            <!-- Resto de errores: solo el mensaje -->
            <p v-else-if="error"
              class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ error
              }}</p>

            <!-- Selector inicial de acción: ícono + descripción para inferir qué se va a hacer -->
            <div v-if="accionActiva === null" class="flex items-center justify-between gap-3">
              <button type="button" @click="emit('cerrar')"
                class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>

              <div class="flex gap-3">
                <button type="button" @click="accionActiva = 'rechazar'"
                  class="px-4 py-2 rounded-lg border border-rose-600 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  Rechazar
                </button>
                <button type="button" @click="accionActiva = 'aprobar'"
                  class="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm">
                  Aprobar
                </button>
              </div>
            </div>

            <!-- Formulario Aprobar (observación opcional) -->
            <div v-else-if="accionActiva === 'aprobar'" class="space-y-2">
              <label for="observacionAprobacion"
                class="block text-sm font-medium text-gray-700 dark:text-gray-200">Observación (opcional)</label>
              <textarea id="observacionAprobacion" v-model="observacion" rows="2" placeholder="Comentario opcional…"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"></textarea>
              <div class="flex justify-end gap-3 pt-1">
                <button type="button" @click="accionActiva = null" :disabled="procesando"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  Volver
                </button>
                <button type="button" @click="confirmarAprobar" :disabled="procesando"
                  class="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm">
                  {{ procesando ? 'Aprobando…' : 'Confirmar aprobación' }}
                </button>
              </div>
            </div>

            <!-- Formulario Rechazar (motivo obligatorio) -->
            <div v-else class="space-y-2">
              <label for="motivoRechazo" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Motivo del
                rechazo <span class="text-red-500">*</span></label>
              <textarea id="motivoRechazo" v-model="motivoRechazo" rows="2" placeholder="Explica por qué se rechaza…"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"></textarea>
              <div class="flex justify-end gap-3 pt-1">
                <button type="button" @click="accionActiva = null" :disabled="procesando"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  Volver
                </button>
                <button type="button" @click="confirmarRechazar" :disabled="procesando || !motivoRechazo.trim()"
                  class="px-6 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm">
                  {{ procesando ? 'Rechazando…' : 'Confirmar rechazo' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
