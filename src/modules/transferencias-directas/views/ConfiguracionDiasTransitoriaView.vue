<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon, InboxIcon } from '@heroicons/vue/24/outline'
import configuracionDiasTransitoriaService from '../services/configuracionDiasTransitoriaService'
import almacenesService from '../services/almacenesServices'
import CargandoSpinner from '../components/CargandoSpinner.vue'
import ModalConfigDiasTransitoria from '../components/ModalConfigDiasTransitoria.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import type { ConfiguracionDiasTransitoria, TiendaDestino } from '../types'

const reglas = ref<ConfiguracionDiasTransitoria[]>([])
const marcas = ref<string[]>([])
const almacenes = ref<TiendaDestino[]>([])
const cargando = ref(false)
const error = ref('')

const cargar = async () => {
  cargando.value = true
  error.value = ''
  try {
    reglas.value = await configuracionDiasTransitoriaService.listar()
  } catch {
    error.value = 'No se pudieron cargar las configuraciones.'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargar()
  try {
    almacenes.value = await almacenesService.listar('Destino')
    marcas.value = Array.from(
      new Set(almacenes.value.map((a) => a.marca).filter((m): m is string => !!m))
    ).sort()
  } catch { /* silencioso */ }
})

const nombreBodega = (uBogTra: string | null) => {
  if (!uBogTra) return 'Todas'
  return almacenes.value.find((a) => a.uBogTra=== uBogTra)?.whsNombre ?? uBogTra
}

// ── Modal CRUD ────────────────────────────────────────────────────────────────
const modalAbierto = ref(false)
const modalModo = ref<'nuevo' | 'editar'>('nuevo')
const reglaEditando = ref<ConfiguracionDiasTransitoria | null>(null)
const guardando = ref(false)
const modalError = ref('')

const abrirNuevo = () => {
  modalModo.value = 'nuevo'
  reglaEditando.value = null
  modalError.value = ''
  modalAbierto.value = true
}
const abrirEditar = (r: ConfiguracionDiasTransitoria) => {
  modalModo.value = 'editar'
  reglaEditando.value = r
  modalError.value = ''
  modalAbierto.value = true
}
const cerrarModal = () => { if (!guardando.value) modalAbierto.value = false }

const guardarRegla = async (payload: { marca: string; bodegaCodigo: string | null; dias: number; activo: boolean }) => {
  guardando.value = true
  modalError.value = ''
  try {
    if (modalModo.value === 'nuevo') await configuracionDiasTransitoriaService.crear(payload)
    else await configuracionDiasTransitoriaService.actualizar(reglaEditando.value!.id, payload)
    modalAbierto.value = false
    await cargar()
  } catch (e: any) {
    modalError.value = mensajeError(e)
  } finally {
    guardando.value = false
  }
}

const mensajeError = (e: any): string => {
  const st = e?.response?.status
  if (st === 400) return e?.response?.data?.error ?? 'Datos inválidos. Revisa la configuración.'
  if (st === 403) return 'No tienes permisos para esta acción.'
  if (st === 500) return 'Error interno del servidor, intenta más tarde.'
  return 'Ocurrió un error inesperado.'
}

// ── Desactivar (no hay DELETE, se da de baja con activo:false) ────────────────
const confirmAbierto = ref(false)
const confirmCargando = ref(false)
const confirmError = ref('')
const idADesactivar = ref<number | null>(null)

const pedirDesactivar = (id: number) => { idADesactivar.value = id; confirmError.value = ''; confirmAbierto.value = true }
const cancelarDesactivar = () => {
  if (confirmCargando.value) return
  confirmAbierto.value = false
  idADesactivar.value = null
}

const confirmarDesactivar = async () => {
  if (idADesactivar.value == null) return
  const r = reglas.value.find((x) => x.id === idADesactivar.value)
  if (!r) return
  confirmCargando.value = true
  confirmError.value = ''
  try {
    await configuracionDiasTransitoriaService.actualizar(r.id, {
      marca: r.marca,
      bodegaCodigo: r.bodegaCodigo,
      dias: r.dias,
      activo: false,
    })
    confirmAbierto.value = false
    idADesactivar.value = null
    await cargar()
  } catch (e: any) {
    confirmError.value = mensajeError(e)
  } finally {
    confirmCargando.value = false
  }
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <router-link to="/transferencias-stock/configuracion"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Configuración de Transitorias</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Días de plazo para gestionar una transitoria abierta o parcialmente abierta.
          </p>
        </div>
      </div>
      <button type="button" @click="abrirNuevo"
        class="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
        <PlusIcon class="w-4 h-4" /> Nuevo
      </button>
    </div>

    <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bodega/Tienda</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Días</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr v-if="cargando"><td colspan="5" class="px-4 py-6"><CargandoSpinner mensaje="Cargando…" /></td></tr>

            <tr v-for="r in reglas" v-else :key="r.id" class="transition-colors"
              :class="r.activo ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'opacity-50 hover:opacity-75'">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ r.marca }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ nombreBodega(r.bodegaCodigo) }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">{{ r.dias }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="r.activo" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Activo</span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Inactivo</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button type="button" @click="abrirEditar(r)" title="Editar"
                    class="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button v-if="r.activo" type="button" @click="pedirDesactivar(r.id)" title="Desactivar"
                    class="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!cargando && reglas.length === 0">
              <td colspan="5" class="px-4 py-12 text-center">
                <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p class="text-sm text-gray-400 dark:text-gray-500">No hay configuraciones registradas.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="error" class="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">{{ error }}</p>
    </section>

    <ModalConfigDiasTransitoria
      :abierto="modalAbierto"
      :modo="modalModo"
      :marcas="marcas"
      :almacenes="almacenes"
      :regla="reglaEditando"
      :guardando="guardando"
      :error="modalError"
      @guardar="guardarRegla"
      @cerrar="cerrarModal"
    />

    <ModalConfirmacion
      :abierto="confirmAbierto"
      titulo="¿Desactivar esta configuración?"
      mensaje="Dejará de aplicarse a nuevas transitorias. ¿Deseas continuar?"
      texto-confirmar="Desactivar"
      variante="peligro"
      :cargando="confirmCargando"
      :error="confirmError"
      @confirmar="confirmarDesactivar"
      @cancelar="cancelarDesactivar"
    />
  </div>
</template>
