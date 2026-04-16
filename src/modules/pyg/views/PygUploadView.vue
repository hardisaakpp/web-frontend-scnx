<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Importador PYG</h1>
        <p class="text-sm text-gray-600 dark:text-gray-300">Carga plantilla, consulta matrices y revisa historiales de importación.</p>
      </div>
      <button
        class="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="handleDownloadTemplate"
      >
        Descargar plantilla
      </button>
    </header>

    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Subir Excel</h2>
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx"
          @change="onFileChange"
          class="hidden"
        />
        <button
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingUpload"
          @click="openFilePicker"
        >
          {{ loadingUpload ? 'Procesando...' : 'Seleccionar y subir Excel' }}
        </button>
      </div>
      <p v-if="selectedFile" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Archivo seleccionado: {{ selectedFile.name }}
      </p>
      <p v-if="uploadMessage" class="mt-3 text-sm" :class="uploadOk ? 'text-green-600' : 'text-red-600'">{{ uploadMessage }}</p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="mb-3">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Historial de cargas</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead>
            <tr class="text-left text-gray-600 dark:text-gray-300">
              <th class="px-3 py-2">Archivo</th>
              <th class="px-3 py-2">Periodo</th>
              <th class="px-3 py-2">Estado</th>
              <th class="px-3 py-2">Filas</th>
              <th class="px-3 py-2 whitespace-nowrap">Fecha ingreso</th>
              <th class="px-3 py-2 whitespace-nowrap">Última actualización</th>
              <th class="px-3 py-2">Usuario últ. act.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="item in uploads" :key="item.id" class="text-gray-800 dark:text-gray-200">
              <td class="px-3 py-2">{{ item.fileName }}</td>
              <td class="px-3 py-2">{{ item.year }}-{{ String(item.month).padStart(2, '0') }}</td>
              <td class="px-3 py-2">{{ item.status }}</td>
              <td class="px-3 py-2">{{ item.validRows }}/{{ item.totalRows }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(item.uploadedAt) }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">—</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ item.uploadedBy?.trim() || '—' }}</td>
            </tr>
            <tr v-if="uploads.length === 0">
              <td colspan="7" class="px-3 py-3 text-center text-gray-500">Sin cargas registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="queryMessage" class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {{ queryMessage }}
    </p>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="mb-3 space-y-1">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Consulta y edición % Matriz</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Doble clic en periodo, empresa, marca o % para editar. Enter guardar · Esc cancelar.</p>
        </div>
        <div class="mb-3 grid gap-2 md:grid-cols-2">
          <input v-model="matrizFilters.year" type="number" min="2000" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Año" />
          <input v-model="matrizFilters.month" type="number" min="1" max="12" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Mes" />
          <input v-model.trim="matrizFilters.empresa" type="text" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Empresa" />
          <input v-model.trim="matrizFilters.marca" type="text" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Marca" />
        </div>
        <button class="mb-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800" @click="loadMatriz">
          Buscar matriz
        </button>
        <div class="max-h-72 overflow-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead>
              <tr class="text-left text-gray-600 dark:text-gray-300">
                <th class="px-2 py-2">Periodo</th>
                <th class="px-2 py-2">Empresa</th>
                <th class="px-2 py-2">Marca</th>
                <th class="px-2 py-2">% Matriz</th>
                <th class="px-2 py-2 whitespace-nowrap">Fecha ingreso</th>
                <th class="px-2 py-2 whitespace-nowrap">Última actualización</th>
                <th class="px-2 py-2">Usuario últ. act.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="row in matrizRows" :key="row.id" class="text-gray-800 dark:text-gray-200">
                <td
                  class="px-2 py-2"
                  :class="matrizEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onMatrizDataDblClick(row)"
                >
                  <template v-if="matrizEditId === row.id">
                    <div class="flex gap-1">
                      <input
                        v-model.number="matrizDraft.year"
                        type="number"
                        min="2000"
                        class="w-20 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                        @keydown.enter.prevent="saveMatrizEdit(row.id)"
                        @keydown.esc.prevent="cancelMatrizEdit"
                      />
                      <input
                        v-model.number="matrizDraft.month"
                        type="number"
                        min="1"
                        max="12"
                        class="w-14 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                        @keydown.enter.prevent="saveMatrizEdit(row.id)"
                        @keydown.esc.prevent="cancelMatrizEdit"
                      />
                    </div>
                  </template>
                  <template v-else>
                    {{ row.year }}/{{ row.month }}
                  </template>
                </td>
                <td
                  class="px-2 py-2"
                  :class="matrizEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onMatrizDataDblClick(row)"
                >
                  <input
                    v-if="matrizEditId === row.id"
                    v-model.trim="matrizDraft.empresa"
                    type="text"
                    class="w-full rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                    @keydown.enter.prevent="saveMatrizEdit(row.id)"
                    @keydown.esc.prevent="cancelMatrizEdit"
                  />
                  <span v-else>{{ row.empresa }}</span>
                </td>
                <td
                  class="px-2 py-2"
                  :class="matrizEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onMatrizDataDblClick(row)"
                >
                  <input
                    v-if="matrizEditId === row.id"
                    v-model.trim="matrizDraft.marca"
                    type="text"
                    class="w-full rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                    @keydown.enter.prevent="saveMatrizEdit(row.id)"
                    @keydown.esc.prevent="cancelMatrizEdit"
                  />
                  <span v-else>{{ row.marca }}</span>
                </td>
                <td
                  class="px-2 py-2"
                  :class="matrizEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onMatrizDataDblClick(row)"
                >
                  <input
                    v-if="matrizEditId === row.id"
                    v-model.number="matrizDraft.percentMatriz"
                    type="number"
                    min="0"
                    max="1"
                    step="0.0001"
                    class="w-24 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                    @keydown.enter.prevent="saveMatrizEdit(row.id)"
                    @keydown.esc.prevent="cancelMatrizEdit"
                  />
                  <span v-else>{{ row.percentMatriz }}</span>
                </td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(row.createdAt) }}</td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(row.updatedAt) }}</td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400">{{ row.lastUpdatedBy?.trim() || '—' }}</td>
              </tr>
              <tr v-if="matrizRows.length === 0">
                <td colspan="7" class="px-2 py-3 text-center text-gray-500">Sin datos.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="mb-3 space-y-1">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Consulta y edición % Bodega</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Doble clic en periodo, empresa/marca, bodega o % para editar. Enter guardar · Esc cancelar.</p>
        </div>
        <div class="mb-3 grid gap-2 md:grid-cols-2">
          <input v-model="bodegaFilters.year" type="number" min="2000" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Año" />
          <input v-model="bodegaFilters.month" type="number" min="1" max="12" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Mes" />
          <input v-model.trim="bodegaFilters.empresa" type="text" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Empresa" />
          <input v-model.trim="bodegaFilters.marca" type="text" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" placeholder="Marca" />
          <input v-model.trim="bodegaFilters.codigoBodega" type="text" class="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 md:col-span-2" placeholder="Código bodega" />
        </div>
        <button class="mb-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800" @click="loadBodega">
          Buscar bodegas
        </button>
        <div class="max-h-72 overflow-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead>
              <tr class="text-left text-gray-600 dark:text-gray-300">
                <th class="px-2 py-2">Periodo</th>
                <th class="px-2 py-2">Empresa / Marca</th>
                <th class="px-2 py-2">Bodega</th>
                <th class="px-2 py-2">% General</th>
                <th class="px-2 py-2 whitespace-nowrap">Fecha ingreso</th>
                <th class="px-2 py-2 whitespace-nowrap">Última actualización</th>
                <th class="px-2 py-2">Usuario últ. act.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="row in bodegaRows" :key="row.id" class="text-gray-800 dark:text-gray-200">
                <td
                  class="px-2 py-2"
                  :class="bodegaEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onBodegaDataDblClick(row)"
                >
                  <template v-if="bodegaEditId === row.id">
                    <div class="flex gap-1">
                      <input
                        v-model.number="bodegaDraft.year"
                        type="number"
                        min="2000"
                        class="w-20 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                        @keydown.enter.prevent="saveBodegaEdit(row.id)"
                        @keydown.esc.prevent="cancelBodegaEdit"
                      />
                      <input
                        v-model.number="bodegaDraft.month"
                        type="number"
                        min="1"
                        max="12"
                        class="w-14 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                        @keydown.enter.prevent="saveBodegaEdit(row.id)"
                        @keydown.esc.prevent="cancelBodegaEdit"
                      />
                    </div>
                  </template>
                  <template v-else>
                    {{ row.year }}/{{ row.month }}
                  </template>
                </td>
                <td
                  class="px-2 py-2"
                  :class="bodegaEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onBodegaDataDblClick(row)"
                >
                  <template v-if="bodegaEditId === row.id">
                    <input
                      v-model.trim="bodegaDraft.empresa"
                      type="text"
                      class="mb-1 w-full rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                      @keydown.enter.prevent="saveBodegaEdit(row.id)"
                      @keydown.esc.prevent="cancelBodegaEdit"
                    />
                    <input
                      v-model.trim="bodegaDraft.marca"
                      type="text"
                      class="w-full rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                      @keydown.enter.prevent="saveBodegaEdit(row.id)"
                      @keydown.esc.prevent="cancelBodegaEdit"
                    />
                  </template>
                  <template v-else>
                    {{ row.empresa }} / {{ row.marca }}
                  </template>
                </td>
                <td
                  class="px-2 py-2"
                  :class="bodegaEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onBodegaDataDblClick(row)"
                >
                  <input
                    v-if="bodegaEditId === row.id"
                    v-model.trim="bodegaDraft.codigoBodega"
                    type="text"
                    class="w-full rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                    @keydown.enter.prevent="saveBodegaEdit(row.id)"
                    @keydown.esc.prevent="cancelBodegaEdit"
                  />
                  <span v-else>{{ row.codigoBodega }}</span>
                </td>
                <td
                  class="px-2 py-2"
                  :class="bodegaEditId !== row.id ? 'cursor-pointer' : ''"
                  title="Doble clic para editar"
                  @dblclick="onBodegaDataDblClick(row)"
                >
                  <input
                    v-if="bodegaEditId === row.id"
                    v-model.number="bodegaDraft.percentGeneral"
                    type="number"
                    min="0"
                    max="1"
                    step="0.0001"
                    class="w-24 rounded border border-gray-300 px-1 py-1 dark:border-gray-700 dark:bg-gray-800"
                    @keydown.enter.prevent="saveBodegaEdit(row.id)"
                    @keydown.esc.prevent="cancelBodegaEdit"
                  />
                  <span v-else>{{ row.percentGeneral }}</span>
                </td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(row.createdAt) }}</td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(row.updatedAt) }}</td>
                <td class="px-2 py-2 text-gray-600 dark:text-gray-400">{{ row.lastUpdatedBy?.trim() || '—' }}</td>
              </tr>
              <tr v-if="bodegaRows.length === 0">
                <td colspan="7" class="px-2 py-3 text-center text-gray-500">Sin datos.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lastNotification } from '@/composables/useNotificaciones'
import {
  downloadTemplate,
  getBodega,
  getMatriz,
  getUploads,
  updateBodega,
  updateMatriz,
  uploadExcel,
  type BodegaUpdatePayload,
  type BodegaRow,
  type MatrizUpdatePayload,
  type MatrizRow,
  type UploadBatchSummary
} from '../services/pygApi'

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const loadingUpload = ref(false)
const uploadMessage = ref('')
const uploadOk = ref(false)

const uploads = ref<UploadBatchSummary[]>([])
const loadingUploads = ref(false)
const matrizRows = ref<MatrizRow[]>([])
const bodegaRows = ref<BodegaRow[]>([])
const queryMessage = ref('')
const UPLOADS_AUTO_REFRESH_MS = 10000
let uploadsAutoRefreshTimer: ReturnType<typeof setInterval> | null = null

const matrizFilters = ref({
  year: '',
  month: '',
  empresa: '',
  marca: ''
})

const bodegaFilters = ref({
  year: '',
  month: '',
  empresa: '',
  marca: '',
  codigoBodega: ''
})

const matrizEditId = ref<number | null>(null)
const matrizDraft = ref<MatrizUpdatePayload>({
  year: new Date().getFullYear(),
  month: 1,
  empresa: '',
  marca: '',
  percentMatriz: 0
})
const savingMatriz = ref(false)

const bodegaEditId = ref<number | null>(null)
const bodegaDraft = ref<BodegaUpdatePayload>({
  year: new Date().getFullYear(),
  month: 1,
  empresa: '',
  marca: '',
  codigoBodega: '',
  percentGeneral: 0
})
const savingBodega = ref(false)

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Misma convención que otros módulos (p. ej. gestión de usuarios). */
function formatAuditDate(value: string | undefined): string {
  const s = (value || '').trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: unknown; status?: number } })?.response
  const data = response?.data
  const status = response?.status

  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (typeof o.message === 'string' && o.message.trim()) return o.message
    if (typeof o.detail === 'string' && o.detail.trim()) return o.detail
    if (typeof o.title === 'string' && o.title.trim()) return o.title
  }

  if (status === 403) {
    return (
      'El API PYG respondió 403 (prohibido): el microservicio no autoriza esta petición con tu token. ' +
      'Revisa políticas y permisos en el backend Docker, que el JWT sea el que PYG valida (mismo issuer/firma), ' +
      'y en desarrollo que no estés entrando al módulo sin permisos (VITE_ALLOW_UNAUTHENTICATED=false alinea router y API).'
    )
  }

  return fallback
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  if (!selectedFile.value) return
  void handleUpload()
}

function openFilePicker() {
  if (loadingUpload.value) return
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function handleDownloadTemplate() {
  const blob = await downloadTemplate()
  saveBlob(blob, 'Plantilla porcentajes.xlsx')
}

async function handleUpload() {
  if (!selectedFile.value) return

  loadingUpload.value = true
  uploadMessage.value = ''
  try {
    const result = await uploadExcel(selectedFile.value)
    uploadOk.value = result.success
    uploadMessage.value = result.message || 'Carga procesada.'
    await loadUploads()
  } catch (error: unknown) {
    uploadOk.value = false
    uploadMessage.value = getApiErrorMessage(error, 'Error al subir archivo.')
  } finally {
    loadingUpload.value = false
  }
}

async function loadUploads() {
  if (loadingUploads.value) return
  loadingUploads.value = true
  queryMessage.value = ''
  try {
    uploads.value = await getUploads()
  } catch (error: unknown) {
    uploads.value = []
    queryMessage.value = getApiErrorMessage(
      error,
      'No se pudo cargar el historial de cargas PYG. Revisa proxy (VITE_PYG_PROXY_TARGET), permisos del contenedor y logs del backend.'
    )
  } finally {
    loadingUploads.value = false
  }
}

async function loadMatriz() {
  try {
    const filters = {
      year: toOptionalNumber(matrizFilters.value.year),
      month: toOptionalNumber(matrizFilters.value.month),
      empresa: matrizFilters.value.empresa || undefined,
      marca: matrizFilters.value.marca || undefined
    }

    matrizRows.value = await getMatriz(filters)
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo consultar la matriz.')
  }
}

async function loadBodega() {
  try {
    const filters = {
      year: toOptionalNumber(bodegaFilters.value.year),
      month: toOptionalNumber(bodegaFilters.value.month),
      empresa: bodegaFilters.value.empresa || undefined,
      marca: bodegaFilters.value.marca || undefined,
      codigoBodega: bodegaFilters.value.codigoBodega || undefined
    }

    bodegaRows.value = await getBodega(filters)
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo consultar bodegas.')
  }
}

function onMatrizDataDblClick(row: MatrizRow) {
  if (savingMatriz.value) return
  if (matrizEditId.value === row.id) return
  startMatrizEdit(row)
}

function startMatrizEdit(row: MatrizRow) {
  matrizEditId.value = row.id
  matrizDraft.value = {
    year: row.year,
    month: row.month,
    empresa: row.empresa,
    marca: row.marca,
    percentMatriz: row.percentMatriz
  }
}

function cancelMatrizEdit() {
  matrizEditId.value = null
}

async function saveMatrizEdit(id: number) {
  savingMatriz.value = true
  queryMessage.value = ''
  try {
    await updateMatriz(id, matrizDraft.value)
    matrizEditId.value = null
    await loadMatriz()
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo actualizar matriz.')
  } finally {
    savingMatriz.value = false
  }
}

function onBodegaDataDblClick(row: BodegaRow) {
  if (savingBodega.value) return
  if (bodegaEditId.value === row.id) return
  startBodegaEdit(row)
}

function startBodegaEdit(row: BodegaRow) {
  bodegaEditId.value = row.id
  bodegaDraft.value = {
    year: row.year,
    month: row.month,
    empresa: row.empresa,
    marca: row.marca,
    codigoBodega: row.codigoBodega,
    percentGeneral: row.percentGeneral
  }
}

function cancelBodegaEdit() {
  bodegaEditId.value = null
}

async function saveBodegaEdit(id: number) {
  savingBodega.value = true
  queryMessage.value = ''
  try {
    await updateBodega(id, bodegaDraft.value)
    bodegaEditId.value = null
    await loadBodega()
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo actualizar bodega.')
  } finally {
    savingBodega.value = false
  }
}

onMounted(async () => {
  await loadUploads()
  uploadsAutoRefreshTimer = setInterval(() => {
    void loadUploads()
  }, UPLOADS_AUTO_REFRESH_MS)
})

watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.target_permission !== 'pyg.edit') return
  void loadUploads()
})

onBeforeUnmount(() => {
  if (!uploadsAutoRefreshTimer) return
  clearInterval(uploadsAutoRefreshTimer)
  uploadsAutoRefreshTimer = null
})
</script>
