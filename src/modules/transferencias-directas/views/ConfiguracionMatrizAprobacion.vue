<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MARCA_TODAS, MatrizAprobacion, ReglaAprobacionRequest, TiendaDestino } from '../types'
import reglasAprobacionService from '../services/reglasAprobacionService'
import almacenesService from '../services/almacenesServices'
import { ArrowLeftIcon, InboxIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ModalReglaAprobacion from '../components/ModalReglaAprobacion.vue'
import CargandoSpinner from '../components/CargandoSpinner.vue'


const reglas = ref<MatrizAprobacion[]>([])
const marcas = ref<string[]>([])
const almacenes = ref<TiendaDestino[]>([])
const cargando = ref(false)
const error = ref('')

const cargar = async () => {
  cargando.value = true
  error.value = ''
  try {
    reglas.value = await reglasAprobacionService.listar()
  } catch {
    error.value = 'No se pudieron cargar las reglas de aprobación.'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargar()
  try {
    almacenes.value = await almacenesService.listar('Destino')
    marcas.value = Array.from(new Set(almacenes.value.map((a) => a.marca).filter((m): m is string => !!m))).sort()
  } catch {  }
})

const nombreBodega = (whsCode: string | null) => {
  if (!whsCode) return 'Todas'
  return almacenes.value.find((a) => a.uBogTra === whsCode)?.whsNombre ?? whsCode
}
const etiquetaMarca = (marca: string) => (marca === MARCA_TODAS ? 'Todas las Marcas' : marca)

// ── Modal CRUD ────────────────────────────────────────────────────────────────
const modalAbierto = ref(false)
const modalModo = ref<'nuevo' | 'editar'>('nuevo')
const reglaEditando = ref<MatrizAprobacion | null>(null)
const guardando = ref(false)
const modalError = ref('')

const abrirNuevo = () => {
  modalModo.value = 'nuevo'
  reglaEditando.value = null
  modalError.value = ''
  modalAbierto.value = true
}
const abrirEditar = (r: MatrizAprobacion) => {
  modalModo.value = 'editar'
  reglaEditando.value = r
  modalError.value = ''
  modalAbierto.value = true
}
const cerrarModal = () => { if (!guardando.value) modalAbierto.value = false }

const guardarRegla = async (payload: ReglaAprobacionRequest) => {
  guardando.value = true
  modalError.value = ''
  try {
    if (modalModo.value === 'nuevo') await reglasAprobacionService.crear(payload)
    else await reglasAprobacionService.actualizar(reglaEditando.value!.id, payload)
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
  if (st === 400) return e?.response?.data?.error ?? 'Datos inválidos. Revisa la regla.'
  if (st === 403) return 'No tienes permisos para esta acción.'
  if (st === 500) return 'Error interno del servidor, intenta más tarde.'
  return 'Ocurrió un error inesperado.'
}

const confirmAbierto = ref(false)
const confirmCargando = ref(false)
const confirmError = ref('')
const idAEliminar = ref<number | null>(null)

const pedirEliminar = (id: number) => { idAEliminar.value = id; confirmError.value = ''; confirmAbierto.value = true }
const cancelarEliminar = () => {
  if (confirmCargando.value) return
  confirmAbierto.value = false
  idAEliminar.value = null
}

const confirmarEliminar = async () => {
  if (idAEliminar.value == null) return
  confirmCargando.value = true
  confirmError.value = ''
  try {
    await reglasAprobacionService.eliminar(idAEliminar.value)
    confirmAbierto.value = false
    idAEliminar.value = null
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
        <router-link to="/transferencias-stock"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Matriz de Aprobación</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Reglas que determinan si una transferencia requiere aprobación.</p>
        </div>
      </div>
      <button type="button" @click="abrirNuevo"
        class="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
        <PlusIcon class="w-4 h-4" /> Nuevo
      </button>
    </div>

    <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca Origen</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca Destino</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bodega Destino(Tránsito)</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">¿Requiere Aprobación?</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol Aprobador</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr v-if="cargando"><td colspan="7" class="px-4 py-6"><CargandoSpinner mensaje="Cargando reglas…" /></td></tr>

            <tr v-for="r in reglas" v-else :key="r.id"
              class="transition-colors"
              :class="r.activo ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'opacity-50 hover:opacity-75'">
              <td class="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">{{ etiquetaMarca(r.marcaOrigen) }}</td>
              <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ etiquetaMarca(r.marcaDestino) }}</td>
              <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ nombreBodega(r.whsCodeDestino) }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="r.requiereAprobacion" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Sí</span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">No</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ r.rolAprobador ?? '-' }}</td>
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
                  <button v-if="r.activo" type="button" @click="pedirEliminar(r.id)" title="Eliminar"
                    class="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!cargando && reglas.length === 0">
              <td colspan="7" class="px-4 py-12 text-center">
                <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p class="text-xs text-gray-400 dark:text-gray-500">No hay reglas registradas.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="error" class="px-4 py-3 text-xs text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700">{{ error }}</p>
    </section>

    <ModalReglaAprobacion
      :abierto="modalAbierto"
      :modo="modalModo"
      :marcas="marcas"
      :regla="reglaEditando"
      :guardando="guardando"
      :error="modalError"
      @guardar="guardarRegla"
      @cerrar="cerrarModal"
    />

    <ModalConfirmacion
      :abierto="confirmAbierto"
      titulo="¿Eliminar esta regla?"
      mensaje="La regla se desactivará y dejará de aplicarse a nuevas transferencias. ¿Deseas continuar?"
      texto-confirmar="Eliminar"
      variante="peligro"
      :cargando="confirmCargando"
      :error="confirmError"
      @confirmar="confirmarEliminar"
      @cancelar="cancelarEliminar"
    />
  </div>
</template>
