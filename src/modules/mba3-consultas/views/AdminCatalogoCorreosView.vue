<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de Correos</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Qué correo (asunto) existe en el sistema y a qué tipo de notificación pertenece
        </p>
      </div>
      <button
        @click="$router.push('/mba3-consultas/admin/destinatarios')"
        class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        ← Volver a Destinatarios
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-1">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          El tipo se puede escribir libre: si no existe, se crea al agregar la primera fila.
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Las filas numeradas (1-9) siguen el flujo real del pedido: Plantilla Excel → ... → ODC a SAP.
          Lo que queda fuera de ese flujo (migración automática SAP) se muestra sin numerar, al final.
        </p>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando catálogo..." color="violet" />

      <div v-else-if="error" class="p-8 text-center">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button @click="cargarCatalogo" class="mt-4 text-violet-600 dark:text-violet-400 hover:underline">
          Reintentar
        </button>
      </div>

      <template v-else>
        <!-- Agregar fila al catálogo -->
        <form
          @submit.prevent="agregarTipoCorreo"
          class="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2"
        >
          <input
            v-model.trim="nuevoTipo"
            list="tipos-notificacion-existentes"
            required
            placeholder="Tipo (existente o nuevo)"
            class="w-44 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <datalist id="tipos-notificacion-existentes">
            <option v-for="tipo in tiposNotificacion" :key="tipo" :value="tipo" />
          </datalist>
          <input
            v-model.trim="nuevoAsunto"
            type="text"
            required
            placeholder="Asunto del correo"
            class="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <input
            v-model.trim="nuevaDescripcion"
            type="text"
            placeholder="Descripción (opcional)"
            class="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <button
            type="submit"
            :disabled="agregando"
            class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </form>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asunto</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="tiposCorreo.length === 0">
                <td colspan="6" class="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                  Sin correos registrados en el catálogo
                </td>
              </tr>
              <template v-for="(correo, index) in tiposCorreo" :key="correo.id">
                <tr v-if="index === primerIndiceFueraDeFlujo">
                  <td colspan="6" class="px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/40">
                    Fuera del flujo de pedido — proceso aparte de migración automática SAP → MBA3
                  </td>
                </tr>
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-4 py-3 text-center">
                    <span
                      v-if="correo.orden_flujo"
                      class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-semibold"
                    >
                      {{ correo.orden_flujo }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ etiquetaTipo(correo.tipo_notificacion) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ correo.tipo_correo }}</td>
                  <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ correo.descripcion || '—' }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="correo.activo
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
                    >
                      {{ correo.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      :disabled="previewCorreoId === correo.id"
                      @click="verEjemplo(correo)"
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                    >
                      {{ previewCorreoId === correo.id ? 'Cargando...' : 'Ejemplo' }}
                    </button>
                    <button
                      :disabled="procesandoId === correo.id"
                      @click="toggleActivo(correo)"
                      class="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                    >
                      {{ correo.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                    <button
                      :disabled="procesandoId === correo.id"
                      @click="eliminarTipoCorreo(correo)"
                      class="text-sm text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Modal: vista previa del correo (mismo HTML que se envía realmente, con datos de ejemplo) -->
    <Teleport to="body">
      <dialog
        ref="modalRef"
        v-if="previewModalOpen"
        class="catalogo-correos-preview-dialog relative p-0 m-auto border-0 overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl transition-all w-full max-w-3xl max-h-[90vh] flex flex-col focus:outline-none"
        @cancel.prevent="cerrarPreview"
        @click="onBackdropClick"
      >
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex-shrink-0">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-blue-100">Vista previa (datos de ejemplo)</p>
              <h3 class="text-base font-semibold text-white truncate">{{ previewSubject }}</h3>
            </div>
            <button @click="cerrarPreview" class="text-white hover:text-blue-100 transition-colors flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
          <iframe
            :srcdoc="previewHtml"
            sandbox=""
            class="w-full h-full border-0"
            style="height: 70vh;"
            title="Vista previa del correo"
          />
        </div>

        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-between gap-4">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Datos de ejemplo, no reales. El diseño es el mismo que usa el envío real.
          </p>
          <button
            @click="cerrarPreview"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex-shrink-0"
          >
            Cerrar
          </button>
        </div>
      </dialog>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import { notificacionTipoCorreoService, type TipoCorreo } from '../services/domains/notificacionTipoCorreo'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const toast = useToast()

const loading = ref(true)
const error = ref<string | null>(null)
const tiposCorreo = ref<TipoCorreo[]>([])

// El backend ya ordena por orden_flujo (nulls al final); esto solo ubica dónde
// insertar el separador visual entre el flujo de pedido y lo que queda fuera de él.
const primerIndiceFueraDeFlujo = computed(() => tiposCorreo.value.findIndex((c) => !c.orden_flujo))
const tiposNotificacion = ref<string[]>([])
const nuevoTipo = ref('')
const nuevoAsunto = ref('')
const nuevaDescripcion = ref('')
const agregando = ref(false)
const procesandoId = ref<number | null>(null)

const previewCorreoId = ref<number | null>(null)
const previewModalOpen = ref(false)
const previewSubject = ref('')
const previewHtml = ref('')
const modalRef = ref<HTMLDialogElement | null>(null)

const ETIQUETAS_TIPO: Record<string, string> = {
  OPERACIONES: 'Operaciones (El Rayo)',
  MABEL_TRADING: 'Mabel Trading',
  HOMOLOGACIONES: 'Homologaciones',
  TECNICOS: 'Técnicos',
  PRODUCCION_ELRAYO: 'Producción El Rayo',
}

function etiquetaTipo(tipo: string): string {
  return ETIQUETAS_TIPO[tipo] || tipo
}

function extraerMensajeError(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.message || fallback
}

async function cargarCatalogo() {
  loading.value = true
  error.value = null
  try {
    const data = await notificacionTipoCorreoService.getTiposCorreo()
    tiposCorreo.value = data.tipos_correo
    tiposNotificacion.value = data.tipos_notificacion
  } catch (err: any) {
    error.value = extraerMensajeError(err, 'No se pudo cargar el catálogo de correos')
  } finally {
    loading.value = false
  }
}

async function agregarTipoCorreo() {
  const tipo = nuevoTipo.value.trim()
  const asunto = nuevoAsunto.value.trim()
  if (!tipo || !asunto) return

  agregando.value = true
  try {
    const nuevo = await notificacionTipoCorreoService.crearTipoCorreo(tipo, asunto, nuevaDescripcion.value.trim() || undefined)
    tiposCorreo.value.push({
      ...nuevo,
      creado_fecha: new Date().toISOString(),
      creado_por: null,
      modificado_fecha: null,
      modificado_por: null,
    })
    if (!tiposNotificacion.value.includes(nuevo.tipo_notificacion)) {
      tiposNotificacion.value.push(nuevo.tipo_notificacion)
    }
    nuevoAsunto.value = ''
    nuevaDescripcion.value = ''
    toast.success('Correo agregado al catálogo', `${asunto} (${etiquetaTipo(nuevo.tipo_notificacion)})`)
  } catch (err: any) {
    toast.error('No se pudo agregar', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    agregando.value = false
  }
}

async function toggleActivo(correo: TipoCorreo) {
  procesandoId.value = correo.id
  const nuevoEstado = !correo.activo
  try {
    await notificacionTipoCorreoService.actualizarActivo(correo.id, nuevoEstado)
    correo.activo = nuevoEstado
    toast.success(nuevoEstado ? 'Correo activado' : 'Correo desactivado', correo.tipo_correo)
  } catch (err: any) {
    toast.error('No se pudo actualizar', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoId.value = null
  }
}

async function eliminarTipoCorreo(correo: TipoCorreo) {
  if (!window.confirm(`¿Eliminar '${correo.tipo_correo}' del catálogo de ${etiquetaTipo(correo.tipo_notificacion)}?`)) {
    return
  }

  procesandoId.value = correo.id
  try {
    await notificacionTipoCorreoService.eliminarTipoCorreo(correo.id)
    tiposCorreo.value = tiposCorreo.value.filter((c) => c.id !== correo.id)
    toast.success('Correo eliminado del catálogo', correo.tipo_correo)
  } catch (err: any) {
    toast.error('No se pudo eliminar', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    procesandoId.value = null
  }
}

async function verEjemplo(correo: TipoCorreo) {
  previewCorreoId.value = correo.id
  try {
    const resultado = await notificacionTipoCorreoService.getPreview(correo.id)
    if (!resultado) {
      toast.error(
        'Sin vista previa disponible',
        'Este correo no está asociado a un código de envío real (por ejemplo, fue agregado manualmente al catálogo).'
      )
      return
    }
    previewSubject.value = resultado.subject
    previewHtml.value = resultado.html
    previewModalOpen.value = true
  } catch (err: any) {
    toast.error('No se pudo cargar el ejemplo', extraerMensajeError(err, 'Error desconocido'))
  } finally {
    previewCorreoId.value = null
  }
}

function cerrarPreview() {
  modalRef.value?.close()
  previewModalOpen.value = false
  previewSubject.value = ''
  previewHtml.value = ''
}

function onBackdropClick(evento: MouseEvent): void {
  if (evento.target === modalRef.value) {
    cerrarPreview()
  }
}

watch(previewModalOpen, async (abierto) => {
  if (abierto) {
    await nextTick()
    modalRef.value?.showModal()
  }
})

onMounted(cargarCatalogo)
</script>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear (pseudo-elemento fuera del arbol normal),
   por eso el nombre de clase bien especifico y el estilo sin "scoped". Reemplaza al overlay
   manual bg-gray-500/75 dark:bg-gray-900/80 que envolvia el modal antes de la migracion a <dialog>. */
.catalogo-correos-preview-dialog::backdrop {
  background-color: rgb(100 116 139 / 0.75);
}
.dark .catalogo-correos-preview-dialog::backdrop {
  background-color: rgb(15 23 42 / 0.8);
}
</style>
