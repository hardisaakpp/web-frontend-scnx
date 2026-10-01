<script setup lang="ts">
/**
 * Formulario de rol (crear y editar) en un `<dialog>` nativo.
 *
 * - Crear: nombre, descripción y, opcionalmente, los permisos iniciales (así el rol queda útil en un solo paso).
 * - Editar: nombre y descripción. Los permisos se gestionan en el panel de detalle. Un rol del sistema solo permite
 *   cambiar la descripción (el Core impide renombrarlo).
 * El componente no llama a la API: emite `guardar` y el padre decide, mostrando el error del servidor en `error`.
 */
import { computed, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import ModalNativo from '@/components/modales/ModalNativo.vue'
import PermisosSelector from './PermisosSelector.vue'
import type { Permiso, Rol } from '../types'
import { nombreRolDuplicado, ROL_DESCRIPCION_MAX, ROL_NOMBRE_MAX, validarNombreRol } from '../utils/roles'

export interface RolFormPayload {
  name: string
  description: string
  permisoIds: number[]
}

const props = defineProps<{
  open: boolean
  /** Rol a editar; null = crear uno nuevo. */
  rol: Rol | null
  permisos: Permiso[]
  roles: Rol[]
  guardando: boolean
  /** Error devuelto por el servidor (p. ej. nombre duplicado). */
  error?: string
  cargandoPermisos?: boolean
}>()

const emit = defineEmits<{
  cerrar: []
  guardar: [payload: RolFormPayload]
}>()

const nombre = ref('')
const descripcion = ref('')
const permisoIds = ref<number[]>([])
const intentoEnvio = ref(false)

const esEdicion = computed(() => props.rol !== null)
const esSistema = computed(() => Boolean(props.rol?.isSystem))

const errorNombre = computed(() => {
  if (esSistema.value) return ''
  const formato = validarNombreRol(nombre.value)
  if (formato) return formato
  if (nombreRolDuplicado(nombre.value, props.roles, props.rol?.id)) return `Ya existe un rol llamado «${nombre.value.trim()}».`
  return ''
})
// Se avisa mientras escribe, salvo el campo vacío (no se regaña antes de empezar).
const mostrarErrorNombre = computed(() => errorNombre.value !== '' && (intentoEnvio.value || nombre.value.trim() !== ''))
const errorDescripcion = computed(() =>
  descripcion.value.trim().length > ROL_DESCRIPCION_MAX ? `La descripción no puede superar ${ROL_DESCRIPCION_MAX} caracteres.` : ''
)

// Cada vez que se abre, el formulario arranca limpio (o con los datos del rol a editar).
watch(() => props.open, abierto => {
  if (!abierto) return
  nombre.value = props.rol?.name ?? ''
  descripcion.value = props.rol?.description ?? ''
  permisoIds.value = []
  intentoEnvio.value = false
})

function cerrar() {
  if (!props.guardando) emit('cerrar')
}

function enviar() {
  intentoEnvio.value = true
  if (errorNombre.value || errorDescripcion.value || props.guardando) return
  emit('guardar', { name: nombre.value.trim(), description: descripcion.value.trim(), permisoIds: [...permisoIds.value] })
}
</script>

<template>
  <ModalNativo :open="open" labelledby="rol-form-titulo" anchoMax="max-w-xl" :bloqueado="guardando" @cerrar="emit('cerrar')">
    <form class="flex max-h-[90vh] flex-col" novalidate @submit.prevent="enviar">
      <header class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div class="min-w-0">
          <h2 id="rol-form-titulo" class="text-lg font-semibold">
            {{ esEdicion ? `Editar rol «${rol?.name}»` : 'Nuevo rol' }}
          </h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {{ esEdicion ? 'Cambia el nombre o la descripción del rol.' : 'Un rol agrupa permisos: quien lo tenga asignado los recibe todos.' }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Cerrar"
          @click="cerrar"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </header>

      <div class="space-y-5 overflow-y-auto px-6 py-5">
        <div>
          <label for="rol-nombre" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del rol</label>
          <input
            id="rol-nombre"
            v-model="nombre"
            type="text"
            :maxlength="ROL_NOMBRE_MAX"
            :disabled="esSistema"
            :autofocus="!esSistema"
            autocomplete="off"
            placeholder="Ej.: Desarrollador, Supervisor de tienda"
            :aria-invalid="mostrarErrorNombre"
            aria-describedby="rol-nombre-ayuda"
            class="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-900/50"
            :class="mostrarErrorNombre ? 'border-red-400 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 focus:ring-indigo-500 dark:border-gray-600'"
          />
          <p id="rol-nombre-ayuda" class="mt-1 text-xs" :class="mostrarErrorNombre ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
            <template v-if="esSistema">«{{ rol?.name }}» es un rol del sistema: su nombre no se puede cambiar.</template>
            <template v-else-if="mostrarErrorNombre">{{ errorNombre }}</template>
            <template v-else>De 2 a {{ ROL_NOMBRE_MAX }} caracteres: letras, números, espacios, guion, guion bajo o punto.</template>
          </p>
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between">
            <label for="rol-descripcion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción <span class="font-normal text-gray-400">(opcional)</span>
            </label>
            <span class="text-xs" :class="errorDescripcion ? 'text-red-600 dark:text-red-400' : 'text-gray-400'">
              {{ descripcion.length }}/{{ ROL_DESCRIPCION_MAX }}
            </span>
          </div>
          <textarea
            id="rol-descripcion"
            v-model="descripcion"
            rows="2"
            placeholder="¿Para qué sirve este rol? Ej.: Acceso a la documentación técnica del asistente."
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p v-if="errorDescripcion" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorDescripcion }}</p>
        </div>

        <div v-if="!esEdicion">
          <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Permisos del rol <span class="font-normal text-gray-400">(opcional, puedes agregarlos después)</span>
          </p>
          <PermisosSelector v-model="permisoIds" :permisos="permisos" :cargando="cargandoPermisos" alturaMaxima="max-h-56" />
        </div>

        <div
          v-if="error"
          role="alert"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ error }}
        </div>
      </div>

      <footer class="flex justify-end gap-3 border-t border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/30">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          :disabled="guardando"
          @click="cerrar"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          :disabled="guardando"
        >
          {{ guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : permisoIds.length > 0 ? `Crear rol con ${permisoIds.length} permiso${permisoIds.length === 1 ? '' : 's'}` : 'Crear rol' }}
        </button>
      </footer>
    </form>
  </ModalNativo>
</template>
