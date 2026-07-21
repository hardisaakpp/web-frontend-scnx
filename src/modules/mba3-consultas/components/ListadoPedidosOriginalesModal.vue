<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header del modal -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Listado Pedidos Originales</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Archivos Excel originales almacenados en el sistema
          </p>
        </div>
        <button
          @click="closeModal"
          class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Contenido del modal -->
      <div class="flex-1 overflow-auto px-6 py-4">
        <!-- Estado de carga -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <svg class="animate-spin w-8 h-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando archivos...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <svg class="w-12 h-12 mx-auto text-red-400 dark:text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-red-600 dark:text-red-400 font-medium">{{ error }}</p>
          <button
            @click="cargarArchivos"
            class="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>

        <!-- Lista vacía -->
        <div v-else-if="archivos.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">No hay archivos disponibles</p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Los archivos Excel originales aparecerán aquí cuando se carguen plantillas</p>
        </div>

        <!-- Buscador + Tabla de archivos -->
        <div v-else class="space-y-4">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              v-model.trim="busqueda"
              type="search"
              placeholder="Buscar por número de pedido o nombre de archivo..."
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            />
            <button
              v-if="busqueda"
              type="button"
              @click="busqueda = ''"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Limpiar búsqueda"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  N° Pedido
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Archivo
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tamaño
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Subida
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descargas
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="archivo in archivosFiltrados"
                :key="archivo.archivo_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="inline-flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ displayNumeroPedido(archivo.numero_pedido) }}
                    </span>
                    <button
                      type="button"
                      @click="copyToClipboard(archivo.numero_pedido)"
                      class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Copiar número de pedido"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]" :title="archivo.nombre_original">
                      {{ displayNombreArchivo(archivo.nombre_original) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatFileSize(resolveFileSizeBytes(archivo)) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(archivo.fecha_subida) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDownloads(archivo.descargas_count) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-2">
                    <!-- Botón Descargar -->
                    <button
                      @click="descargarArchivo(archivo)"
                      :disabled="descargando === archivo.archivo_id"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Descargar archivo"
                    >
                      <svg v-if="descargando === archivo.archivo_id" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Descargar</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <!-- Sin resultados de búsqueda -->
          <div
            v-if="busqueda && archivosFiltrados.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm"
          >
            No hay archivos que coincidan con "{{ busqueda }}".
          </div>
        </div>
      </div>

      <!-- Footer del modal -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <template v-if="busqueda">
            {{ archivosFiltrados.length }} de {{ archivos.length }} archivo(s)
          </template>
          <template v-else>
            {{ archivos.length }} archivo(s) encontrado(s)
          </template>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="cargarArchivos"
            :disabled="loading"
            class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div
      v-if="archivoAEliminar"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[60]"
      @click.self="cancelarEliminar"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Confirmar eliminación</h4>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-600 dark:text-gray-400">
            ¿Está seguro que desea eliminar el archivo
            <strong class="text-gray-900 dark:text-white">{{ archivoAEliminar.nombre_original }}</strong>
            del pedido <strong class="text-gray-900 dark:text-white">{{ archivoAEliminar.numero_pedido }}</strong>?
          </p>
          <p class="text-sm text-amber-600 dark:text-amber-400 mt-3">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            @click="cancelarEliminar"
            :disabled="eliminando !== null"
            class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarEliminar"
            :disabled="eliminando !== null"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="eliminando !== null" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ eliminando !== null ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from '@vue/reactivity'
import { pedidosService } from '../services/domains/pedidos'
import { useToast } from '@/composables/useToast'
import { APP_LOCALE } from '@/plugins/locale'
import type { ArchivoOriginalItem } from '../types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const toast = useToast()

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
const archivos = ref<ArchivoOriginalItem[]>([])
const descargando = ref<string | null>(null)
const eliminando = ref<string | null>(null)
const archivoAEliminar = ref<ArchivoOriginalItem | null>(null)
const busqueda = ref('')

// Lista filtrada por buscador (número de pedido o nombre de archivo)
const archivosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return archivos.value
  return archivos.value.filter(
    (a) =>
      (a.numero_pedido && String(a.numero_pedido).toLowerCase().includes(q)) ||
      (a.nombre_original && a.nombre_original.toLowerCase().includes(q))
  )
})

// Cargar archivos cuando se abre el modal
watch(() => props.visible, (newVal) => {
  if (newVal) {
    cargarArchivos()
  }
})

// Funciones
async function cargarArchivos() {
  loading.value = true
  error.value = null
  
  try {
    const response = await pedidosService.getListadoArchivosOriginales()
    archivos.value = response.data || []
  } catch (err: any) {
    console.error('Error al cargar archivos:', err)
    error.value = err.message || 'Error al cargar el listado de archivos'
  } finally {
    loading.value = false
  }
}

async function descargarArchivo(archivo: ArchivoOriginalItem) {
  descargando.value = archivo.archivo_id
  
  try {
    const blob = await pedidosService.descargarExcelOriginal(archivo.pedido_id)
    
    // Crear link de descarga
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = archivo.nombre_original
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Descarga exitosa', `Archivo ${archivo.nombre_original} descargado`)

    // Refrescar desde backend para mostrar descargas_count persistido (fuente de verdad).
    await cargarArchivos()
  } catch (err: any) {
    console.error('Error al descargar archivo:', err)
    toast.error('Error', err.message || 'No se pudo descargar el archivo')
  } finally {
    descargando.value = null
  }
}

function confirmarEliminar(archivo: ArchivoOriginalItem) {
  archivoAEliminar.value = archivo
}

function cancelarEliminar() {
  archivoAEliminar.value = null
}

async function ejecutarEliminar() {
  if (!archivoAEliminar.value) return
  
  const archivo = archivoAEliminar.value
  eliminando.value = archivo.archivo_id
  
  try {
    await pedidosService.eliminarArchivoOriginal(archivo.archivo_id)
    
    // Remover de la lista
    archivos.value = archivos.value.filter(a => a.archivo_id !== archivo.archivo_id)
    
    toast.success('Archivo eliminado', `El archivo ${archivo.nombre_original} ha sido eliminado`)
    archivoAEliminar.value = null
  } catch (err: any) {
    console.error('Error al eliminar archivo:', err)
    toast.error('Error', err.message || 'No se pudo eliminar el archivo')
  } finally {
    eliminando.value = null
  }
}

function closeModal() {
  emit('close')
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(String(text ?? ''))
    toast.success('Copiado', 'Número de pedido copiado al portapapeles')
  } catch {
    toast.error('Error', 'No se pudo copiar')
  }
}

// Helpers
function formatFileSize(bytes: number): string {
  const safeBytes = Number(bytes)
  if (!Number.isFinite(safeBytes) || safeBytes < 0) return '—'
  if (safeBytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(safeBytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((safeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function resolveFileSizeBytes(archivo: ArchivoOriginalItem): number {
  const raw = (
    (archivo as unknown as Record<string, unknown>).tamanio_bytes ??
    (archivo as unknown as Record<string, unknown>).tamaño_bytes ??
    (archivo as unknown as Record<string, unknown>).tamanioBytes ??
    (archivo as unknown as Record<string, unknown>).size_bytes ??
    (archivo as unknown as Record<string, unknown>).sizeBytes ??
    (archivo as unknown as Record<string, unknown>).size ??
    null
  ) as unknown

  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/,/g, '.')
    const asNumber = Number(cleaned)
    if (Number.isFinite(asNumber)) return asNumber
  }
  return NaN
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDownloads(value: unknown): string {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? String(Math.trunc(n)) : '0'
}

function displayNumeroPedido(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || '—'
}

function displayNombreArchivo(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || 'Archivo sin nombre'
}
</script>
