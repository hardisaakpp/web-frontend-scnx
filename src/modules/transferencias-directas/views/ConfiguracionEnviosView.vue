<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, InboxIcon } from '@heroicons/vue/24/outline'
import CargandoSpinner from '../components/CargandoSpinner.vue'
import type { ConfiguracionEnvio } from '../types'
import transferenciasService from '../services/transferenciasService.js'
import almacenesService from '../services/almacenesServices.js'
import ModalConfigEnvio from '../components/ModalConfigEnvio.vue'

const configuraciones = ref<ConfiguracionEnvio[]>([])
const cargando = ref(false)
const error = ref('')
const marcas = ref<string[]>([])
const marcasOrigenUsadas = computed(() =>
    Array.from(new Set(configuraciones.value.map((c) => c.marcaOrigen)))
)

const cargar = async () => {
    cargando.value = true
    error.value = ''
    try {
        configuraciones.value = await transferenciasService.listarConfiguracionMarcas()
    } catch {
        error.value = 'No se pudieron cargar las configuraciones.'
    } finally {
        cargando.value = false
    }
}
onMounted(async () => {
    await cargar()
    try {
        const almacenes = await almacenesService.listar('Destino')
        marcas.value = Array.from(
            new Set(almacenes.map((a) => a.marca).filter((m): m is string => !!m))
        ).sort()
    } catch { /* silencioso */ }
})


const agrupadas = computed(() => {
    const map = new Map<string, string[]>()
    for (const c of configuraciones.value) {
        if (!c.activo) continue                 // ← solo activos en el listado
        if (!map.has(c.marcaOrigen)) map.set(c.marcaOrigen, [])
        map.get(c.marcaOrigen)!.push(c.marcaDestino)
    }
    return Array.from(map, ([marcaOrigen, destinos]) => ({ marcaOrigen, destinos }))
})

const modalAbierto = ref(false)
const modalModo = ref<'nuevo' | 'editar'>('nuevo')
const modalOrigen = ref('')
const modalDestinos = ref<string[]>([])
const guardando = ref(false)
const modalError = ref('')

const abrirNuevo = () => {
    modalModo.value = 'nuevo'
    modalOrigen.value = ''
    modalDestinos.value = []
    modalError.value = ''
    modalAbierto.value = true
}
const abrirEditar = (marcaOrigen: string) => {
    modalModo.value = 'editar'
    modalOrigen.value = marcaOrigen
    modalDestinos.value = configuraciones.value
        .filter((c) => c.marcaOrigen === marcaOrigen && c.activo)
        .map((c) => c.marcaDestino)
    modalError.value = ''
    modalAbierto.value = true
}
const cerrarModal = () => { if (!guardando.value) modalAbierto.value = false }

const guardarConfig = async ({ marcaOrigen, destinos }: { marcaOrigen: string; destinos: string[] }) => {
    guardando.value = true
    modalError.value = ''
    try {
        const existentes = configuraciones.value.filter((c) => c.marcaOrigen === marcaOrigen)
        const seleccion = new Set(destinos)
        const tareas: Promise<unknown>[] = []

        for (const destino of destinos) {
            const ya = existentes.find((c) => c.marcaDestino === destino)
            if (!ya) tareas.push(transferenciasService.crearConfiguracionMarcas({ marcaOrigen, marcaDestino: destino, activo: true }))
            else if (!ya.activo) tareas.push(transferenciasService.actualizarConfiguracionMarcas(ya.id, { marcaOrigen, marcaDestino: destino, activo: true }))
        }
        for (const c of existentes) {
            if (c.activo && !seleccion.has(c.marcaDestino)) {
                tareas.push(transferenciasService.actualizarConfiguracionMarcas(c.id, { marcaOrigen: c.marcaOrigen, marcaDestino: c.marcaDestino, activo: false }))
            }
        }

        await Promise.all(tareas)
        modalAbierto.value = false
        await cargar()
    } catch (e: any) {
        modalError.value = e?.response?.data?.mensaje ?? e?.response?.data?.error ?? 'No se pudo guardar.'
    } finally {
        guardando.value = false
    }
}
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <router-link to="/transferencias-stock"
                    class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
                    <ArrowLeftIcon class="w-5 h-5" />
                </router-link>
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Configuración de Envíos</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Marcas origen y sus destinos permitidos.
                    </p>
                </div>
            </div>
            <button type="button" @click="abrirNuevo"
                class="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <PlusIcon class="w-4 h-4" /> Nuevo
            </button>
        </div>

        <section
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th
                                class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Marca Origen</th>
                            <th
                                class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Marcas Destino</th>
                            <th
                                class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        <tr v-if="cargando">
                            <td colspan="3" class="px-4 py-6">
                                <CargandoSpinner mensaje="Cargando…" />
                            </td>
                        </tr>

                        <tr v-for="g in agrupadas" v-else :key="g.marcaOrigen"
                            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ g.marcaOrigen }}
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex flex-wrap gap-1.5">
                                    <span v-for="d in g.destinos" :key="d"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {{ d }}
                                    </span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button type="button" @click="abrirEditar(g.marcaOrigen)" title="Editar"
                                    class="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                                    <PencilSquareIcon class="w-5 h-5" />
                                </button>
                            </td>
                        </tr>

                        <tr v-if="!cargando && agrupadas.length === 0">
                            <td colspan="3" class="px-4 py-12 text-center">
                                <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p class="text-sm text-gray-400 dark:text-gray-500">No hay configuraciones registradas.
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="error"
                class="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">
                {{ error }}</p>
        </section>
        <ModalConfigEnvio :abierto="modalAbierto" :modo="modalModo" :marcas="marcas"
            :marcas-origen-usadas="marcasOrigenUsadas" :marca-origen="modalOrigen" :destinos-actuales="modalDestinos"
            :guardando="guardando" :error="modalError" @guardar="guardarConfig" @cerrar="cerrarModal" />

    </div>
</template>
