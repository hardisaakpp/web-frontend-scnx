<template>
  <!-- Overlay de bloqueo durante la carga de plantilla Excel con barra de progreso -->
  <Teleport to="body">
    <div 
      v-if="uploading"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      @click.prevent
      @mousedown.prevent
      @mouseup.prevent
      @touchstart.prevent
      @touchmove.prevent
      @touchend.prevent
    >
      <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transition-all duration-300 border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
        <!-- Efecto de fondo animado -->
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 pointer-events-none"></div>
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner con efecto de pulso -->
          <div class="relative">
            <svg class="animate-spin h-14 w-14 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 border-2 border-emerald-300/30 dark:border-emerald-500/30 rounded-full animate-ping"></div>
          </div>
          
          <div class="w-full">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Cargando Plantilla Excel</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ uploadMessage || 'Preparando archivo...' }}</p>
            
            <!-- Barra de progreso -->
            <div class="w-full space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400 font-medium">
                  {{ uploadFase === 'upload' ? 'Subiendo archivo' : (uploadFase === 'processing' ? 'Procesando en servidor' : 'Preparando') }}
                </span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${uploadProgress}%` }"
                >
                  <!-- Efecto shimmer sobre la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicadores de fase -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'upload' || uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Subir</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Validar</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Guardar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading }">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestionar Pedido</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">Editar cantidades, costos y gestionar pedidos</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Input de búsqueda de pedidos -->
          <div class="relative w-full sm:w-auto">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="pedidoIdInput"
              @keyup.enter="goToPedido"
              type="text"
              :list="`pedido-history-list-search`"
              placeholder="Buscar por N° de pedido (ej: P-12.48 - 12 - 2025)"
              class="w-full sm:w-80 pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
              autocomplete="off"
            />
            <datalist :id="`pedido-history-list-search`">
              <option v-for="pedido in historialPedidos" :key="pedido" :value="pedido" />
            </datalist>
            <button
              v-if="pedidoIdInput"
              @click="pedidoIdInput = ''"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar búsqueda"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para errores de validación del archivo -->
    <UploadErrorModal
      v-model="showErrorModal"
      :upload-error-info="uploadErrorInfo"
      @apply-corrections="aplicarCorreccionesYContinuar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, onActivated, nextTick, Teleport } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useFileUpload } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import type { UploadPlantillaResponse } from '../types'
import UploadErrorModal from '../components/UploadErrorModal.vue'

const router = useRouter()
const toast = useToast()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const archivoCargado = ref(false)
const uploadedFileName = ref<string>('')
const uploadResponse = ref<UploadPlantillaResponse | null>(null)
const pedidoIdInput = ref('')
// Flag para evitar múltiples llamadas simultáneas, pero se resetea al montar/activar
const cargandoUltimoPedido = ref(false)
// Flag para evitar redirección automática si el usuario hizo una búsqueda manual
const busquedaManualRealizada = ref(false)

// ⭐ Usar composable useFileUpload que muestra modal de error
const fileUploadComposable = useFileUpload({
  onUploadSuccess: async (numeroPedido) => {
    await router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
  },
  useAsyncUpload: true // Procesamiento en segundo plano (Celery), no bloquea la app
})

const {
  uploading,
  showErrorModal,
  uploadErrorInfo,
  uploadFile,
  validateFile,
  reintentarConCorrecciones,
  archivoOriginal: archivoOriginalDelComposable,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable


// ⭐ Historial de números de pedido (similar al autocompletado del navegador)
const STORAGE_KEY_PEDIDOS = 'mba3_pedidos_historial'
const MAX_HISTORIAL_SIZE = 10 // Máximo de 10 números de pedido en el historial

/**
 * Guarda un número de pedido en el historial
 */
function guardarEnHistorial(numeroPedido: string) {
  if (!numeroPedido || !numeroPedido.trim()) return
  
  try {
    const historial = obtenerHistorial()
    const numeroPedidoTrimmed = numeroPedido.trim()
    
    // Remover si ya existe (para moverlo al principio)
    const index = historial.indexOf(numeroPedidoTrimmed)
    if (index > -1) {
      historial.splice(index, 1)
    }
    
    // Agregar al principio
    historial.unshift(numeroPedidoTrimmed)
    
    // Limitar el tamaño del historial
    if (historial.length > MAX_HISTORIAL_SIZE) {
      historial.splice(MAX_HISTORIAL_SIZE)
    }
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(historial))
  } catch (e) {
    console.warn('Error al guardar en historial de pedidos:', e)
  }
}

/**
 * Obtiene el historial de números de pedido
 */
function obtenerHistorial(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PEDIDOS)
    if (stored) {
      const historial = JSON.parse(stored) as string[]
      // Validar que sea un array y filtrar valores vacíos
      if (Array.isArray(historial)) {
        return historial.filter(p => p && p.trim().length > 0)
      }
    }
  } catch (e) {
    console.warn('Error al obtener historial de pedidos:', e)
  }
  return []
}

// Computed para el historial (reactivo)
const historialPedidos = computed(() => obtenerHistorial())

/**
 * Aplica las correcciones seleccionadas (código y/o pack/pvp) y reintenta el flujo de carga
 * ⭐ ACTUALIZADO: Recibe correcciones del componente UploadErrorModal
 */
async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
  const archivo = archivoOriginalDelComposable.value

  if (!archivo) {
    toast.error(
      'Error',
      'No se encontró el archivo original. Por favor, vuelve a subir el archivo.'
    )
    return
  }

  try {
    showErrorModal.value = false

    await reintentarConCorrecciones(
      archivo,
      correcciones
    )
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    if (uploadErrorInfo.value) {
      showErrorModal.value = true
    }
    toast.error(
      'Error al aplicar correcciones',
      error.message || 'No se pudo procesar el archivo con las correcciones aplicadas'
    )
  }
}

// Computed: validación completa OK
const esValidacionCompletaOk = computed(() => {
  if (!uploadResponse.value?.validacion) return true
  const v = uploadResponse.value.validacion
  return v?.productos?.todos_validos && 
         v?.tiendas?.todas_validas && 
         v?.cantidades?.valid
})

const triggerFileInput = () => {
  if (!uploading.value && !archivoCargado.value && fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0], target)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (uploading.value || archivoCargado.value) return
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file: File, inputElement?: HTMLInputElement) => {
  // Usar la validación del composable
  const validation = validateFile(file)
  if (!validation.valid) {
    toast.error('Error de validación', validation.error || 'Archivo no válido')
    if (inputElement) inputElement.value = ''
    return
  }
  
  selectedFile.value = file
  toast.success('Archivo seleccionado', `Listo para cargar: ${file.name}`)
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// ⭐ Usar uploadFile del composable que muestra modal de error
const handleUploadFile = async () => {
  if (!selectedFile.value) return
  
  try {
    await uploadFile(selectedFile.value)
    // Si fue exitoso, el composable maneja la redirección
    // Si hubo error, el composable muestra el modal automáticamente
    selectedFile.value = null
  } catch (e: any) {
    // El error ya fue manejado por el composable (modal de error)
    console.error('Error en handleUploadFile:', e)
  }
}

const handleReset = () => {
  archivoCargado.value = false
  uploadedFileName.value = ''
  uploadResponse.value = null
  clearFile()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function goToPedido() {
  const numeroPedido = pedidoIdInput.value.trim()
  if (!numeroPedido) {
    toast.error('Error', 'Por favor ingresa un número de pedido válido')
    return
  }
  
  // ⭐ Guardar en el historial antes de navegar
  guardarEnHistorial(numeroPedido)
  
  // Marcar que se hizo una búsqueda manual (evita redirección automática)
  busquedaManualRealizada.value = true
  
  // Limpiar el input después de navegar
  pedidoIdInput.value = ''
  
  router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
}

/**
 * Carga automáticamente el último pedido del usuario al montar/activar el componente
 * Se ejecuta cada vez que el usuario entra a "Gestionar Pedido"
 */
async function cargarUltimoPedido() {
  // Evitar múltiples llamadas simultáneas
  if (cargandoUltimoPedido.value) {
    return
  }

  // Si el usuario hizo una búsqueda manual, no redirigir automáticamente
  if (busquedaManualRealizada.value) {
    return
  }

  cargandoUltimoPedido.value = true
  
  try {
    const pedido = await mba3ConsultasService.getUltimoPedido(false)
    
    if (pedido && pedido.cabecera.numero_pedido) {
      // Mostrar badge informativo
      toast.info(
        'Último pedido cargado',
        `Mostrando último pedido: ${pedido.cabecera.numero_pedido}`
      )
      
      // Redirigir a la vista de detalle del pedido solo si no hay búsqueda manual
      if (!busquedaManualRealizada.value) {
        router.push(`/mba3-consultas/pedidos/${encodeURIComponent(pedido.cabecera.numero_pedido)}`)
      }
    }
  } catch (error: any) {
    // Si es un error que no sea 404, loguearlo pero no mostrar error al usuario
    // (el 404 ya se maneja en el servicio retornando null)
    if (error.response?.status !== 404 && error.message && !error.message.includes('404')) {
      console.error('Error al cargar último pedido:', error)
    }
    // No mostrar error al usuario, simplemente no redirigir
  } finally {
    cargandoUltimoPedido.value = false
  }
}

// Función para resetear el flag de búsqueda manual cuando se monta/activa el componente
function resetearEstado() {
  // Resetear el flag de búsqueda manual para permitir carga automática
  // Esto permite que al regresar a "Gestionar Pedido", se vuelva a cargar el último pedido
  busquedaManualRealizada.value = false
}

// Cargar último pedido al montar el componente
onMounted(() => {
  resetearEstado()
  cargarUltimoPedido()
})

// Si el componente está en un keep-alive, también cargar al activarse
onActivated(() => {
  resetearEstado()
  cargarUltimoPedido()
})

</script>

