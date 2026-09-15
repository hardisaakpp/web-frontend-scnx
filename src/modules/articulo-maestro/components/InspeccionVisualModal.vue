<template>
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="close"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl flex flex-col overflow-hidden animate-fade-in-up">
            
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Inspección Visual</h3>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {{ articulo?.itemCode || 'Sin Código' }} <span v-if="articulo?.itemName" class="hidden sm:inline font-normal opacity-75">— {{ articulo.itemName }}</span>
                        </p>
                    </div>
                </div>
                <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-12 text-center flex flex-col items-center justify-center">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">Buscando imágenes del artículo...</p>
            </div>

            <!-- Body -->
            <div v-else class="flex flex-col md:flex-row h-full max-h-[70vh]">
                
                <!-- Visor Izquierdo (Fotos) -->
                <div class="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden relative border-r border-gray-200 dark:border-gray-700">
                    
                    <!-- Imagen Grande -->
                    <div class="flex-1 relative p-4 flex items-center justify-center min-h-[300px] overflow-hidden group">
                        <img 
                            v-if="imagenActivaObj?.urlFinal" 
                            :src="imagenActivaObj.urlFinal ?? undefined" 
                            :alt="`Posición ${posicionActiva} de ${articulo?.itemCode}`"
                            class="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div v-else class="flex flex-col items-center text-gray-400 dark:text-gray-600">
                            <svg class="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            <span class="text-sm font-medium">No hay imagen disponible</span>
                        </div>
                    </div>

                    <!-- Miniaturas Inferiores -->
                    <div class="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex justify-center gap-3">
                        <button
                            v-for="pos in ([1, 2, 3] as const)"
                            :key="pos"
                            @click="posicionActiva = pos as PosicionFoto"
                            class="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                            :class="posicionActiva === pos ? 'border-blue-500 shadow-md ring-2 ring-blue-500/30' : 'border-transparent hover:border-blue-300 opacity-60 hover:opacity-100'"
                            :title="nombrePosicion(pos)"
                        >
                            <img
                                v-if="obtenerImagen(pos)?.urlFinal"
                                :src="obtenerImagen(pos)?.urlFinal ?? undefined"
                                :alt="`Miniatura ${nombrePosicion(pos)}`"
                                class="w-full h-full object-cover"
                            />
                            <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400">
                                <span class="text-[10px] font-bold">{{ pos === 1 ? 'P' : 'S' + (pos - 1) }}</span>
                            </div>
                            
                            <!-- Etiqueta sobre miniatura -->
                            <div class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold py-0.5" v-if="obtenerImagen(pos)?.urlFinal">
                                {{ pos === 1 ? 'PRINCIPAL' : 'SECUNDARIA '+ (pos-1) }}
                            </div>
                        </button>
                    </div>

                </div>

                <!-- Detalles y Acciones Derecho -->
                <div class="w-full md:w-80 flex flex-col bg-white dark:bg-gray-800 shrink-0">
                    
                    <div class="p-6 flex-1 overflow-y-auto">
                        <!-- Metadatos Básicos -->
                        <div class="space-y-4">
                            <div>
                                <h4 class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-1">Código</h4>
                                <p class="text-gray-900 dark:text-white font-mono font-medium">{{ articulo?.itemCode || '-' }}</p>
                            </div>
                            <div>
                                <h4 class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-1">Marca</h4>
                                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    {{ articulo?.uMarca || '-' }}
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-1">PVP Sugerido</h4>
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">${{ (articulo?.price ?? 0).toFixed(2) }}</p>
                            </div>
                        </div>

                        <!-- Divider -->
                        <hr class="my-6 border-gray-100 dark:border-gray-700">

                        <!-- Acciones sobre la imagen seleccionada -->
                        <div>
                            <h4 class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-3 flex items-center justify-between">
                                <span>Acciones (Imagen {{ nombrePosicion(posicionActiva) }})</span>
                            </h4>
                            
                            <div class="space-y-2">
                                <a
                                    v-if="urlActivaSegura"
                                    :href="urlActivaSegura"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    Abrir en pestaña nueva
                                </a>
                                <button v-else disabled class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-800/30 text-blue-400 dark:text-blue-700 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    Abrir en pestaña nueva
                                </button>

                                <button
                                    @click="descargarImagen"
                                    :disabled="!imagenActivaObj?.urlFinal || descargando"
                                    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <svg v-if="descargando" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    {{ descargando ? 'Descargando...' : 'Descargar Imagen' }}
                                </button>
                            </div>
                        </div>

                    </div>
                    
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import type { Articulo, ImagenArticuloReferencia } from '../types'
import { articuloService } from '../services/articuloService'

const props = defineProps<{
    isOpen: boolean
    articuloBase: Articulo | null
}>()

const emit = defineEmits<(e: 'close') => void>()

type PosicionFoto = 1 | 2 | 3

const articulo = ref<Articulo | null>(null)
const loading = ref(false)
const posicionActiva = ref<PosicionFoto>(1)
const descargando = ref(false)

// Fetch full details whenever the modal opens
watch(() => props.isOpen, async (val) => {
    if (val && props.articuloBase) {
        posicionActiva.value = 1
        articulo.value = props.articuloBase
        
        // Petición al backend rápido para traer datos actualizados incluidos imágenes
        loading.value = true
        try {
            articulo.value = await articuloService.getArticuloByCode(props.articuloBase.itemCode)
        } catch (e) {
            console.error('Error fetching image details', e)
        } finally {
            loading.value = false
        }
    } else {
        articulo.value = null
    }
})

// Helpers
const obtenerImagen = (pos: PosicionFoto): ImagenArticuloReferencia | undefined => {
    return articulo.value?.imagenes?.find(img => img.posicion === pos)
}

const imagenActivaObj = computed(() => {
    return obtenerImagen(posicionActiva.value)
})

// Solo se navega entre posiciones que tienen una imagen real cargada -- si
// el usuario cicla con las flechas no tiene sentido detenerse en una
// miniatura vacía (P/S1/S2 sin urlFinal).
const posicionesConImagen = computed<PosicionFoto[]>(() => {
    return ([1, 2, 3] as const).filter(pos => !!obtenerImagen(pos)?.urlFinal)
})

function navegarImagen(direccion: 1 | -1) {
    const posiciones = posicionesConImagen.value
    if (posiciones.length === 0) return

    const indiceActual = posiciones.indexOf(posicionActiva.value)
    const base = indiceActual === -1 ? 0 : indiceActual
    const siguienteIndice = (base + direccion + posiciones.length) % posiciones.length
    posicionActiva.value = posiciones[siguienteIndice]
}

// Solo se permite navegar/abrir el enlace si es http(s): evita que una URL con
// esquema no seguro (p. ej. javascript:) llegue a renderizarse como href.
const urlActivaSegura = computed(() => {
    const url = imagenActivaObj.value?.urlFinal
    if (!url) return null
    try {
        const protocolo = new URL(url).protocol
        return protocolo === 'http:' || protocolo === 'https:' ? url : null
    } catch {
        return null
    }
})

const nombrePosicion = (pos: number) => {
    if (pos === 1) return 'Principal'
    if (pos === 2) return 'Secundaria 1'
    return 'Secundaria 2'
}

function close() {
    emit('close')
}

// El componente permanece montado todo el tiempo (el padre solo alterna
// :is-open, ver GestionArticulos.vue), así que el listener de teclado no
// puede vivir en onMounted/onUnmounted del ciclo de vida del componente --
// se engancha/desengancha explícitamente cuando isOpen cambia, para no
// robarle ← / → / Esc al resto de la página mientras el modal está cerrado.
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault()
        navegarImagen(1)
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        navegarImagen(-1)
    }
}

watch(() => props.isOpen, (abierto) => {
    if (abierto) {
        window.addEventListener('keydown', handleKeydown)
    } else {
        window.removeEventListener('keydown', handleKeydown)
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

async function descargarImagen() {
    const url = imagenActivaObj.value?.urlFinal
    if (!url) return
    
    descargando.value = true
    try {
        // Hacemos fetch a la URL directa para evitar problemas de _blank o CORS de red local con MinIO
        const response = await fetch(url)
        const blob = await response.blob()
        const objectUrl = window.URL.createObjectURL(blob)
        
        const enlace = document.createElement('a')
        enlace.href = objectUrl
        
        // Asignamos nombre sugerido (RL00100-S-P.jpg)
        const nombreArchivo = URL.parse(url)?.pathname.split('/').pop() || `${articulo.value?.itemCode}_POS${posicionActiva.value}.jpg`
        enlace.download = nombreArchivo
        
        document.body.appendChild(enlace)
        enlace.click()
        document.body.removeChild(enlace)
        window.URL.revokeObjectURL(objectUrl)
    } catch (e) {
        console.error('Descarga fallida', e)
        // Fallback: abrir en nueva pestaña original
        window.open(url, '_blank')
    } finally {
        descargando.value = false
    }
}
</script>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
