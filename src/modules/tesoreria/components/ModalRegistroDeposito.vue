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

        <!-- Stepper de progreso del asistente -->
        <nav aria-label="Progreso del registro de depósito" class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-5 py-3">
          <ol class="flex items-center">
            <li v-for="(paso, idx) in pasosWizard" :key="paso.numero" class="flex flex-1 items-center last:flex-none">
              <div class="flex items-center gap-2">
                <span
                  class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
                  :class="claseCirculoPaso(paso.numero)"
                  :aria-current="pasoActual === paso.numero ? 'step' : undefined"
                >
                  <CheckIcon v-if="pasoActual > paso.numero" class="h-4 w-4" aria-hidden="true" />
                  <span v-else>{{ paso.numero }}</span>
                </span>
                <span
                  class="hidden text-xs font-semibold sm:inline"
                  :class="pasoActual === paso.numero
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : pasoActual > paso.numero
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'"
                >
                  {{ paso.etiqueta }}
                </span>
              </div>
              <div
                v-if="idx < pasosWizard.length - 1"
                class="mx-2 h-0.5 flex-1 rounded transition-colors"
                :class="pasoActual > paso.numero ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'"
              ></div>
            </li>
          </ol>
          <p class="sr-only" role="status" aria-live="polite">
            Paso {{ pasoActual }} de 3: {{ pasosWizard[pasoActual - 1].etiqueta }}
          </p>
        </nav>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <!-- ═══════ PASO 1: Captura de datos y comprobante ═══════ -->
          <form v-if="pasoActual === 1" class="space-y-4" @submit.prevent="avanzarAPaso2">
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
                <div class="flex items-center justify-between">
                  <label for="numeroComprobante" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    N.º de papeleta / comprobante <span class="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <span class="text-[11px] text-gray-400 dark:text-gray-500">{{ numeroComprobante.length }}/{{ LONGITUD_MAXIMA_COMPROBANTE }}</span>
                </div>
                <input
                  id="numeroComprobante"
                  v-model="numeroComprobante"
                  type="text"
                  required
                  :maxlength="LONGITUD_MAXIMA_COMPROBANTE"
                  placeholder="Ej. 0012345"
                  autocomplete="off"
                  class="w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 uppercase"
                  :class="errorNumeroComprobanteBackend
                    ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'"
                  @input="onInputNumeroComprobante"
                />
                <p v-if="numeroComprobante && !numeroComprobanteValido" class="text-xs text-red-600 dark:text-red-400">
                  Máximo {{ LONGITUD_MAXIMA_COMPROBANTE }} caracteres alfanuméricos (límite SAP B1).
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

          <!-- ═══════ PASO 2: Doble confirmación ciega de papeleta ═══════ -->
          <form v-else-if="pasoActual === 2" class="flex flex-col items-center gap-4 py-4 text-center" @submit.prevent="avanzarAPaso3">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
              <ShieldCheckIcon class="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Verificación de seguridad de papeleta</h3>
              <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Por favor, vuelva a digitar el N.° de comprobante bancario para confirmar que coincide con el documento físico.
              </p>
            </div>

            <div class="w-full max-w-xs text-left">
              <label for="comprobanteConfirmacion" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar N.º de papeleta <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="comprobanteConfirmacion"
                ref="comprobanteConfirmacionInputRef"
                v-model="comprobanteConfirmacion"
                type="text"
                autofocus
                autocomplete="off"
                :maxlength="LONGITUD_MAXIMA_COMPROBANTE"
                placeholder="Reingrese el N.° de papeleta..."
                class="mt-1 w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-center text-sm font-mono tracking-widest text-gray-900 dark:text-gray-100 focus:ring-2 uppercase"
                :class="claseInputConfirmacion"
                @input="onInputConfirmacion"
                @paste.prevent="onPasteBlocked"
              />

              <p v-if="intentoPegadoBloqueado" role="alert" class="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                Por seguridad, debe digitar el número manualmente. No se permite pegar texto.
              </p>
              <p v-else-if="coincidenciaEnVivo === true" class="mt-1.5 flex items-center justify-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon class="h-4 w-4" aria-hidden="true" /> El número coincide correctamente.
              </p>
              <p
                v-else-if="coincidenciaEnVivo === false || errorCoincidenciaComprobante"
                role="alert"
                class="mt-1.5 flex items-start gap-1.5 text-left text-xs font-medium text-red-600 dark:text-red-400"
              >
                <ExclamationTriangleIcon class="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                El número no coincide con el registrado en el Paso 1. Verifique el comprobante físico.
              </p>
            </div>
          </form>

          <!-- ═══════ PASO 3: Resumen ejecutivo y guardado ═══════ -->
          <form v-else class="space-y-4" @submit.prevent="guardar">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Verifique que los datos sean correctos antes de confirmar. Esta acción registrará el depósito de forma definitiva.
            </p>

            <div class="space-y-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-slate-400">Almacén y Cierre</span>
                <span class="text-right font-semibold text-white">{{ codigoAlmacen }} — Cierre del {{ formatDateOnly(fechaCierreCaja) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-slate-400">Banco Receptor</span>
                <span class="text-right font-semibold text-white">{{ cuentaSeleccionada?.nombreCuenta }} — {{ cuentaSeleccionada?.codigoFormateado }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-slate-400">Fecha de Depósito</span>
                <span class="font-semibold text-white">{{ formatDateOnly(fechaDepositoBanco) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-slate-400">N.° Comprobante</span>
                <span class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-300">
                  <CheckCircleIcon class="h-4 w-4" aria-hidden="true" />
                  {{ numeroComprobante }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-slate-700/60 pt-3">
                <span class="text-sm text-slate-400">Monto Depositado</span>
                <span class="text-xl font-bold text-white">{{ formatCurrency(montoValor) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-slate-400">Condición</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="esSobrante
                    ? 'bg-sky-500/10 text-sky-300 border border-sky-700/60'
                    : 'bg-slate-700/60 text-slate-300 border border-slate-600/60'"
                >
                  {{ esSobrante ? 'Sobrante / Excedente' : 'Normal' }}
                </span>
              </div>
              <div class="flex items-center gap-2 border-t border-slate-700/60 pt-3 text-sm">
                <DocumentIcon class="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                <div class="min-w-0 flex-1 text-left">
                  <p class="truncate font-medium text-white">{{ archivo?.name }}</p>
                  <p class="text-xs text-slate-400">{{ archivo ? formatTamano(archivo.size) : '' }}</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        <footer class="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-5 py-3">
          <button
            v-if="pasoActual === 1"
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cancelar
          </button>
          <button
            v-else
            type="button"
            :disabled="guardando"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="retrocederPaso"
          >
            <ChevronLeftIcon class="h-4 w-4" aria-hidden="true" />
            {{ pasoActual === 3 ? 'Corregir Datos' : 'Atrás' }}
          </button>

          <button
            v-if="pasoActual === 1"
            type="button"
            :disabled="!formularioValidoPaso1"
            class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs"
            @click="avanzarAPaso2"
          >
            Continuar al Paso 2
            <ChevronRightIcon class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            v-else-if="pasoActual === 2"
            type="button"
            :disabled="!coincidenciaEnVivo"
            class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs"
            @click="avanzarAPaso3"
          >
            Continuar al Resumen
            <ChevronRightIcon class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            v-else
            type="button"
            :disabled="!formularioValidoPaso1 || guardando"
            :aria-busy="guardando"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs"
            @click="guardar"
          >
            <svg v-if="guardando" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {{ guardando ? 'Registrando…' : 'Confirmar y Registrar Depósito' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'
import { formatCurrency, formatDateOnly } from '../utils/formatters'
import type { CrearDepositoPayload, CuentaFinancieraDto } from '../types/tesoreria.types'

const authStore = useAuthStore()

// Capacidad máxima de 10 MB alineada con LocalNasStorageService del backend
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']
/** Límite estricto del campo ODPS.BankRef en SAP Business One. */
const LONGITUD_MAXIMA_COMPROBANTE = 8

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
const comprobanteConfirmacionInputRef = ref<HTMLInputElement | null>(null)

// ─── Control de pasos del asistente ───────────────────────────────────────────
type Step = 1 | 2 | 3
const pasoActual = ref<Step>(1)
const pasosWizard: { numero: Step; etiqueta: string }[] = [
  { numero: 1, etiqueta: 'Datos' },
  { numero: 2, etiqueta: 'Verificación' },
  { numero: 3, etiqueta: 'Resumen' }
]

function claseCirculoPaso(numero: Step): string {
  if (pasoActual.value > numero) return 'border-indigo-600 bg-indigo-600 text-white'
  if (pasoActual.value === numero) return 'border-indigo-600 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900'
  return 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
}

// ─── Paso 1: datos y comprobante ──────────────────────────────────────────────
const cuentaFinancieraId = ref(0)
const fechaDepositoBanco = ref(props.fechaCierreCaja)
const numeroComprobante = ref('')
const montoDisplay = ref('')
const esSobrante = ref(false)
const archivo = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const arrastrandoArchivo = ref(false)
const errorArchivo = ref<string | null>(null)
/** Se limpia al editar el campo, para no mostrar un error de backend ya resuelto por el usuario. */
const numeroComprobanteEditadoTrasError = ref(false)

const cuentasHabilitadas = computed(() => props.cuentas.filter(c => c.activa && c.habilitadaParaTiendas))
const cuentaSeleccionada = computed(() => cuentasHabilitadas.value.find(c => c.id === cuentaFinancieraId.value) ?? null)

const numeroComprobanteValido = computed(() => /^[A-Z0-9]{1,8}$/.test(numeroComprobante.value))

const errorNumeroComprobanteBackend = computed(() =>
  numeroComprobanteEditadoTrasError.value ? null : (props.erroresCampo?.NumeroComprobante ?? null)
)

function onInputNumeroComprobante(): void {
  numeroComprobante.value = numeroComprobante.value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, LONGITUD_MAXIMA_COMPROBANTE)
  numeroComprobanteEditadoTrasError.value = true
}

const errorFecha = computed(() => {
  if (!fechaDepositoBanco.value) return null
  return fechaDepositoBanco.value < props.fechaCierreCaja
    ? 'La fecha de depósito no puede ser anterior a la fecha de cierre de caja.'
    : null
})

/**
 * Deriva el monto numérico directamente de lo escrito, sin depender de que `blur` se dispare
 * antes de otra interacción (p. ej. abrir el selector de archivos) — evita que el valor se
 * "pierda" si el usuario nunca deja el campo o si el evento de blur llega tarde/race con otro clic.
 * Distingue coma-decimal ("350,50") de coma-de-miles ya formateada ("1,350.50"): si hay coma Y
 * punto, o más de una coma, se asume separador de miles y se descarta.
 */
function parseMonto(raw: string): number {
  const limpio = raw.trim()
  if (!limpio) return 0
  const comas = (limpio.match(/,/g) ?? []).length
  const esComaDecimal = comas === 1 && !limpio.includes('.')
  const normalizado = esComaDecimal ? limpio.replace(',', '.') : limpio.replace(/,/g, '')
  const parsed = Number(normalizado)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0
}

const montoValor = computed(() => parseMonto(montoDisplay.value))

const excedeSaldoSinAutorizar = computed(() => montoValor.value > props.saldoPendiente && !esSobrante.value)

/** Condiciones de captura del Paso 1 — habilita "Continuar" y respalda el envío final del Paso 3. */
const formularioValidoPaso1 = computed(() =>
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

// ─── Paso 2: doble verificación ciega ──────────────────────────────────────────
const comprobanteConfirmacion = ref('')
const errorCoincidenciaComprobante = ref(false)
const intentoPegadoBloqueado = ref(false)

/** null mientras aún no se ha terminado de escribir, para no marcar error prematuro. */
const coincidenciaEnVivo = computed<boolean | null>(() => {
  if (comprobanteConfirmacion.value.length === 0) return null
  if (comprobanteConfirmacion.value.length < numeroComprobante.value.length) return null
  return comprobanteConfirmacion.value.trim().toUpperCase() === numeroComprobante.value.trim().toUpperCase()
})

const claseInputConfirmacion = computed(() => {
  if (coincidenciaEnVivo.value === true) {
    return 'border-emerald-400 ring-1 ring-emerald-300 focus:border-emerald-500 focus:ring-emerald-500'
  }
  if (coincidenciaEnVivo.value === false || errorCoincidenciaComprobante.value) {
    return 'border-rose-500 ring-1 ring-rose-500 focus:border-rose-500 focus:ring-rose-500'
  }
  return 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
})

function onInputConfirmacion(): void {
  comprobanteConfirmacion.value = comprobanteConfirmacion.value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, LONGITUD_MAXIMA_COMPROBANTE)
  errorCoincidenciaComprobante.value = false
  intentoPegadoBloqueado.value = false
}

function onPasteBlocked(event: ClipboardEvent): void {
  event.preventDefault()
  intentoPegadoBloqueado.value = true
}

// ─── Navegación entre pasos ────────────────────────────────────────────────────
function avanzarAPaso2(): void {
  if (!formularioValidoPaso1.value) return
  comprobanteConfirmacion.value = ''
  errorCoincidenciaComprobante.value = false
  intentoPegadoBloqueado.value = false
  pasoActual.value = 2
}

function avanzarAPaso3(): void {
  const comp1 = numeroComprobante.value.trim().toUpperCase()
  const comp2 = comprobanteConfirmacion.value.trim().toUpperCase()

  if (comp1 !== comp2) {
    errorCoincidenciaComprobante.value = true
    return
  }

  errorCoincidenciaComprobante.value = false
  pasoActual.value = 3
}

function retrocederPaso(): void {
  if (pasoActual.value === 3) pasoActual.value = 2
  else if (pasoActual.value === 2) pasoActual.value = 1
}

watch(pasoActual, async (nuevo) => {
  if (nuevo !== 2) return
  await nextTick()
  comprobanteConfirmacionInputRef.value?.focus()
})

// ─── Reinicio, cierre y envío final ────────────────────────────────────────────
function resetFormulario(): void {
  pasoActual.value = 1
  cuentaFinancieraId.value = cuentasHabilitadas.value.length === 1 ? cuentasHabilitadas.value[0].id : 0
  fechaDepositoBanco.value = props.fechaCierreCaja
  numeroComprobante.value = ''
  montoDisplay.value = ''
  esSobrante.value = false
  numeroComprobanteEditadoTrasError.value = false
  comprobanteConfirmacion.value = ''
  errorCoincidenciaComprobante.value = false
  intentoPegadoBloqueado.value = false
  quitarArchivo()
}

function cerrar(): void {
  emit('close')
}

function guardar(): void {
  if (!formularioValidoPaso1.value || !archivo.value) return
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
  // El backend solo puede rechazar el NumeroComprobante al confirmar en el Paso 3 (papeleta
  // duplicada) — se regresa al Paso 1 para que el usuario vea y corrija el campo señalado.
  if (errores?.NumeroComprobante) {
    numeroComprobanteEditadoTrasError.value = false
    pasoActual.value = 1
  }
})

const { onKeydown } = useModalFocusTrap(dialogRef, primerCampoRef, toRef(props, 'open'), cerrar)
</script>
