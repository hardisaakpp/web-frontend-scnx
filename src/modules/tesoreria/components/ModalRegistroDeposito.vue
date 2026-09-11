<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 transition-opacity" @click="cerrar"></div>

      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="tituloId"
        class="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        @keydown="onKeydown"
      >
        <header class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div>
            <h2 :id="tituloId" class="text-base font-semibold text-gray-900 dark:text-white">
              Registrar depósito bancario
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Almacén <span class="font-semibold text-gray-800 dark:text-gray-200">{{ codigoAlmacen }}</span> — Cierre del <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatDateOnly(fechaCierreCaja) }}</span>
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-label="Cerrar formulario de registro"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form class="flex-1 overflow-y-auto px-5 py-4 space-y-4" @submit.prevent="guardar">
          <!-- Cuenta bancaria receptora -->
          <div class="flex flex-col gap-1">
            <label for="cuentaFinanciera" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cuenta bancaria receptora <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="cuentaFinanciera"
              ref="primerCampoRef"
              v-model.number="cuentaFinancieraId"
              required
              :disabled="loadingCuentas"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option :value="0" disabled>{{ loadingCuentas ? 'Cargando cuentas…' : 'Seleccione una cuenta receptora' }}</option>
              <option v-for="cuenta in cuentasHabilitadas" :key="cuenta.id" :value="cuenta.id">
                {{ cuenta.nombreCuenta }} — {{ cuenta.codigoFormateado }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Fecha real de depósito -->
            <div class="flex flex-col gap-1">
              <label for="fechaDeposito" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha real de depósito <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="fechaDeposito"
                v-model="fechaDepositoBanco"
                type="date"
                required
                :min="fechaCierreCaja"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              <p v-if="errorFecha" class="text-xs text-red-600 dark:text-red-400">{{ errorFecha }}</p>
            </div>

            <!-- Número de papeleta -->
            <div class="flex flex-col gap-1">
              <label for="numeroComprobante" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                N.º de papeleta / comprobante <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="numeroComprobante"
                v-model="numeroComprobante"
                type="text"
                required
                maxlength="30"
                placeholder="Ej. 0012345"
                class="w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 uppercase"
                :class="errorNumeroComprobanteBackend
                  ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'"
                @input="onInputNumeroComprobante"
              />
              <p v-if="numeroComprobante && !numeroComprobanteValido" class="text-xs text-red-600 dark:text-red-400">
                Use solo letras, números y guiones.
              </p>
              <p v-else-if="errorNumeroComprobanteBackend" class="text-xs text-red-600 dark:text-red-400 font-medium">
                {{ errorNumeroComprobanteBackend }}
              </p>
            </div>
          </div>

          <!-- Monto depositado -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <label for="montoDepositado" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto depositado <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Pendiente: <strong class="text-gray-800 dark:text-gray-200">{{ formatCurrency(saldoPendiente) }}</strong>
              </span>
            </div>
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-gray-400">$</span>
              <input
                id="montoDepositado"
                v-model="montoDisplay"
                type="text"
                inputmode="decimal"
                required
                placeholder="0.00"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-7 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                @focus="montoDisplay = montoValor > 0 ? String(montoValor) : ''"
                @blur="onBlurMonto"
              />
            </div>

            <!-- Alerta si supera el saldo pendiente -->
            <div
              v-if="montoValor > 0 && !esSobrante && montoValor > saldoPendiente"
              class="mt-1 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-2.5 text-xs text-amber-900 dark:text-amber-200"
            >
              <ExclamationTriangleIcon class="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <div>
                El monto ingresado (<strong>{{ formatCurrency(montoValor) }}</strong>) supera el efectivo pendiente de conciliar (<strong>{{ formatCurrency(saldoPendiente) }}</strong>).
                <template v-if="puedeAutorizarSobregiro">
                  Active la casilla inferior <em>"Autorizar como excedente / sobrante"</em> para permitir el registro.
                </template>
                <template v-else>
                  El rol de Cajero no tiene permiso para sobregiros. Solicite autorización a su Supervisor Zonal o Contabilidad.
                </template>
              </div>
            </div>
          </div>

          <!-- Casilla de Sobrante / Sobregiro -->
          <div
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3"
            :title="!puedeAutorizarSobregiro ? 'No tiene permiso para autorizar depósitos como sobrante' : undefined"
          >
            <label
              class="flex items-start gap-3"
              :class="puedeAutorizarSobregiro ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
            >
              <input
                v-model="esSobrante"
                type="checkbox"
                :disabled="!puedeAutorizarSobregiro"
                :title="!puedeAutorizarSobregiro ? 'No tiene permiso para autorizar depósitos como sobrante' : undefined"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 disabled:cursor-not-allowed"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-semibold text-gray-900 dark:text-white">Autorizar como excedente / sobrante</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <template v-if="puedeAutorizarSobregiro">
                    Marque esta opción para registrar depósitos superiores al cierre de caja (requiere permiso de supervisor).
                  </template>
                  <template v-else>
                    No tiene permiso para autorizar depósitos como sobrante. Solicite autorización a su Supervisor Zonal o Contabilidad.
                  </template>
                </span>
              </span>
            </label>
          </div>

          <!-- Drag & Drop de comprobante (hasta 10 MB) -->
          <div class="flex flex-col gap-1">
            <span id="dropzone-label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comprobante bancario digitalizado <span class="text-red-500" aria-hidden="true">*</span>
            </span>

            <div
              v-if="!archivo"
              role="button"
              tabindex="0"
              aria-labelledby="dropzone-label"
              class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              :class="arrastrandoArchivo
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-900/30'"
              @click="inputArchivoRef?.click()"
              @keydown.enter.prevent="inputArchivoRef?.click()"
              @keydown.space.prevent="inputArchivoRef?.click()"
              @dragover.prevent="arrastrandoArchivo = true"
              @dragleave.prevent="arrastrandoArchivo = false"
              @drop.prevent="onDropArchivo"
            >
              <ArrowUpTrayIcon class="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Arrastre el archivo aquí o <span class="font-semibold text-indigo-600 dark:text-indigo-400 underline">explore en su equipo</span>
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">PDF, JPG o PNG — hasta 10 MB</p>
            </div>

            <div v-else class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/50 p-3">
              <img
                v-if="previewUrl"
                :src="previewUrl"
                alt="Vista previa del comprobante"
                class="h-14 w-14 flex-shrink-0 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-2xs"
              />
              <div v-else class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                <DocumentIcon class="h-8 w-8" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ archivo.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatTamano(archivo.size) }}</p>
              </div>
              <button
                type="button"
                class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                aria-label="Quitar archivo adjunto"
                @click="quitarArchivo"
              >
                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <input
              id="comprobante-input"
              ref="inputArchivoRef"
              type="file"
              aria-labelledby="dropzone-label"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              class="sr-only"
              @change="onSeleccionArchivo"
            />
            <p v-if="errorArchivo" role="alert" class="text-xs text-red-600 dark:text-red-400 font-medium">{{ errorArchivo }}</p>
          </div>
        </form>

        <footer class="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-5 py-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="!puedeGuardar || guardando"
            :aria-busy="guardando"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs"
            @click="guardar"
          >
            <svg v-if="guardando" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {{ guardando ? 'Guardando…' : 'Registrar depósito' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { ArrowUpTrayIcon, DocumentIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'
import { formatCurrency, formatDateOnly } from '../utils/formatters'
import type { CrearDepositoPayload, CuentaFinancieraDto } from '../types/tesoreria.types'

const authStore = useAuthStore()

// Capacidad máxima de 10 MB alineada con LocalNasStorageService del backend
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']

const props = defineProps<{
  open: boolean
  almacenId: number
  codigoAlmacen: string
  fechaCierreCaja: string
  cuentas: CuentaFinancieraDto[]
  loadingCuentas: boolean
  saldoPendiente: number
  puedeAutorizarSobregiro: boolean
  guardando: boolean
  /** Errores de validación del backend (400/409, p. ej. papeleta duplicada) por nombre de campo (PascalCase, tal como los emite ProblemDetails). */
  erroresCampo?: Record<string, string> | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'guardar', payload: CrearDepositoPayload): void
}>()

const tituloId = `registro-deposito-titulo-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref<HTMLElement | null>(null)
const primerCampoRef = ref<HTMLSelectElement | null>(null)
const inputArchivoRef = ref<HTMLInputElement | null>(null)

const cuentaFinancieraId = ref(0)
const fechaDepositoBanco = ref(props.fechaCierreCaja)
const numeroComprobante = ref('')
const montoValor = ref(0)
const montoDisplay = ref('')
const esSobrante = ref(false)
const archivo = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const arrastrandoArchivo = ref(false)
const errorArchivo = ref<string | null>(null)
/** Se limpia al editar el campo, para no mostrar un error de backend ya resuelto por el usuario. */
const numeroComprobanteEditadoTrasError = ref(false)

const cuentasHabilitadas = computed(() => props.cuentas.filter(c => c.activa && c.habilitadaParaTiendas))

const numeroComprobanteValido = computed(() => /^[a-zA-Z0-9-]+$/.test(numeroComprobante.value))

const errorNumeroComprobanteBackend = computed(() =>
  numeroComprobanteEditadoTrasError.value ? null : (props.erroresCampo?.NumeroComprobante ?? null)
)

function onInputNumeroComprobante(): void {
  numeroComprobante.value = numeroComprobante.value.replace(/[^a-zA-Z0-9-]/g, '')
  numeroComprobanteEditadoTrasError.value = true
}

const errorFecha = computed(() => {
  if (!fechaDepositoBanco.value) return null
  return fechaDepositoBanco.value < props.fechaCierreCaja
    ? 'La fecha de depósito no puede ser anterior a la fecha de cierre de caja.'
    : null
})

const excedeSaldoSinAutorizar = computed(() => montoValor.value > props.saldoPendiente && !esSobrante.value)

const puedeGuardar = computed(() =>
  cuentaFinancieraId.value > 0 &&
  !!fechaDepositoBanco.value &&
  !errorFecha.value &&
  numeroComprobante.value.length > 0 &&
  numeroComprobanteValido.value &&
  montoValor.value > 0 &&
  !excedeSaldoSinAutorizar.value &&
  !!archivo.value
)

function formatTamano(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function onBlurMonto(): void {
  const parsed = Number(montoDisplay.value.replace(',', '.'))
  montoValor.value = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0
  montoDisplay.value = montoValor.value > 0 ? formatCurrency(montoValor.value).replace('$', '').trim() : ''
}

function limpiarPreview(): void {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function validarYAsignarArchivo(file: File): void {
  errorArchivo.value = null
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    errorArchivo.value = 'Formato no admitido. Adjunte el comprobante en PDF, JPG o PNG.'
    return
  }
  if (file.size > TAMANO_MAXIMO_BYTES) {
    errorArchivo.value = `El archivo pesa ${formatTamano(file.size)}; el máximo permitido es 10 MB.`
    return
  }
  limpiarPreview()
  archivo.value = file
  if (file.type.startsWith('image/')) previewUrl.value = URL.createObjectURL(file)
}

function onSeleccionArchivo(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) validarYAsignarArchivo(file)
}

function onDropArchivo(event: DragEvent): void {
  arrastrandoArchivo.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) validarYAsignarArchivo(file)
}

function quitarArchivo(): void {
  archivo.value = null
  limpiarPreview()
  errorArchivo.value = null
  if (inputArchivoRef.value) inputArchivoRef.value.value = ''
}

function resetFormulario(): void {
  cuentaFinancieraId.value = cuentasHabilitadas.value.length === 1 ? cuentasHabilitadas.value[0].id : 0
  fechaDepositoBanco.value = props.fechaCierreCaja
  numeroComprobante.value = ''
  montoValor.value = 0
  montoDisplay.value = ''
  esSobrante.value = false
  numeroComprobanteEditadoTrasError.value = false
  quitarArchivo()
}

function cerrar(): void {
  emit('close')
}

function guardar(): void {
  if (!puedeGuardar.value || !archivo.value) return
  emit('guardar', {
    almacenId: props.almacenId,
    codigoAlmacen: props.codigoAlmacen,
    fechaCierreCaja: props.fechaCierreCaja,
    fechaDepositoBanco: fechaDepositoBanco.value,
    cuentaFinancieraId: cuentaFinancieraId.value,
    numeroComprobante: numeroComprobante.value.trim().toUpperCase(),
    montoDepositado: montoValor.value,
    moneda: 'USD',
    tipoDeposito: 'dtCash',
    responsable: authStore.fullName || authStore.userName || 'Usuario SCNexus',
    esSobrante: esSobrante.value,
    comprobante: archivo.value
  })
}

watch(() => props.open, (isOpen) => {
  if (isOpen) resetFormulario()
})

watch(() => props.erroresCampo, (errores) => {
  if (errores?.NumeroComprobante) numeroComprobanteEditadoTrasError.value = false
})

const { onKeydown } = useModalFocusTrap(dialogRef, primerCampoRef, toRef(props, 'open'), cerrar)
</script>
