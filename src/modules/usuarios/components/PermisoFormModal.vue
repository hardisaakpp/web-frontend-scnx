<script setup lang="ts">
/**
 * Formulario de permiso (crear y editar) sobre `ModalNativo`.
 *
 * - Crear: módulo, clave, descripción y, opcionalmente, los roles que lo recibirán (así queda en uso en un solo paso).
 * - Editar: módulo, clave y descripción. Al cambiar la clave de un permiso en uso se avisa, porque las pantallas del
 *   sistema buscan la clave exacta. Una clave existente que no cambia no se vuelve a validar (puede ser anterior a la
 *   convención actual).
 * No llama a la API: emite `guardar` y el padre muestra el error del servidor en `error`.
 */
import { computed, ref, watch } from 'vue'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ModalNativo from '@/components/modales/ModalNativo.vue'
import type { Permiso, Rol } from '../types'
import {
  ACCIONES_SUGERIDAS,
  claveDuplicada,
  normalizarClave,
  normalizarModulo,
  PERMISO_CLAVE_MAX,
  PERMISO_DESCRIPCION_MAX,
  PERMISO_MODULO_MAX,
  validarClavePermiso,
  validarDescripcionPermiso,
  validarModuloPermiso,
} from '../utils/permisos'

export interface PermisoFormPayload {
  key: string
  description: string
  module: string
  roleNames: string[]
}

const props = defineProps<{
  open: boolean
  /** Permiso a editar; null = crear. */
  permiso: Permiso | null
  /** Catálogo completo: sirve para detectar claves repetidas y sugerir módulos existentes. */
  permisos: Permiso[]
  roles: Rol[]
  /** Roles que ya tienen el permiso que se edita. */
  rolesEnUso?: string[]
  /** Módulo con el que arranca el formulario al crear (p. ej. desde «Agregar a este módulo»). */
  moduloInicial?: string
  guardando: boolean
  error?: string
}>()

const emit = defineEmits<{
  cerrar: []
  guardar: [payload: PermisoFormPayload]
}>()

const modulo = ref('')
const clave = ref('')
const descripcion = ref('')
const rolesElegidos = ref<string[]>([])
const intentoEnvio = ref(false)

const esEdicion = computed(() => props.permiso !== null)
const modulos = computed(() => [...new Set(props.permisos.map(p => p.module).filter(Boolean))].sort((a, b) => a.localeCompare(b)))
const moduloNormalizado = computed(() => normalizarModulo(modulo.value))
const claveNormalizada = computed(() => normalizarClave(clave.value))
const claveSinCambios = computed(() => esEdicion.value && claveNormalizada.value === props.permiso?.key.toLowerCase())
const moduloSinCambios = computed(() => esEdicion.value && modulo.value.trim() === props.permiso?.module)

const errorModulo = computed(() => (moduloSinCambios.value ? '' : validarModuloPermiso(modulo.value)))
const errorClave = computed(() => {
  if (claveSinCambios.value) return ''
  const formato = validarClavePermiso(clave.value)
  if (formato) return formato
  if (claveDuplicada(clave.value, props.permisos, props.permiso?.id)) return `Ya existe el permiso «${claveNormalizada.value}».`
  return ''
})
const errorDescripcion = computed(() => validarDescripcionPermiso(descripcion.value))

// Se avisa mientras escribe, salvo el campo vacío (no se regaña antes de empezar).
const mostrarErrorClave = computed(() => errorClave.value !== '' && (intentoEnvio.value || clave.value.trim() !== ''))
const mostrarErrorModulo = computed(() => errorModulo.value !== '' && (intentoEnvio.value || modulo.value.trim() !== ''))
const mostrarErrorDescripcion = computed(() => errorDescripcion.value !== '' && (intentoEnvio.value || descripcion.value.trim() !== ''))

const sugerencias = computed(() => {
  const m = moduloNormalizado.value
  if (esEdicion.value || !m || validarModuloPermiso(m) || clave.value.trim() !== '') return []
  return ACCIONES_SUGERIDAS.map(a => ({ etiqueta: a.etiqueta, clave: `${m}.${a.sufijo}` }))
})

const avisoClaveEnUso = computed(
  () => esEdicion.value && !claveSinCambios.value && (props.rolesEnUso?.length ?? 0) > 0
)

watch(() => props.open, abierto => {
  if (!abierto) return
  modulo.value = props.permiso?.module ?? props.moduloInicial ?? ''
  clave.value = props.permiso?.key ?? ''
  descripcion.value = props.permiso?.description ?? ''
  rolesElegidos.value = []
  intentoEnvio.value = false
})

function cerrar() {
  if (!props.guardando) emit('cerrar')
}

function enviar() {
  intentoEnvio.value = true
  if (errorModulo.value || errorClave.value || errorDescripcion.value || props.guardando) return
  emit('guardar', {
    module: moduloSinCambios.value ? props.permiso!.module : moduloNormalizado.value,
    key: claveSinCambios.value ? props.permiso!.key : claveNormalizada.value,
    description: descripcion.value.trim(),
    roleNames: [...rolesElegidos.value],
  })
}

function alternarRol(nombre: string) {
  rolesElegidos.value = rolesElegidos.value.includes(nombre)
    ? rolesElegidos.value.filter(n => n !== nombre)
    : [...rolesElegidos.value, nombre]
}
</script>

<template>
  <ModalNativo :open="open" labelledby="permiso-form-titulo" anchoMax="max-w-xl" :bloqueado="guardando" @cerrar="emit('cerrar')">
    <form class="flex max-h-[90vh] flex-col" novalidate @submit.prevent="enviar">
      <header class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div class="min-w-0">
          <h2 id="permiso-form-titulo" class="break-all text-lg font-semibold">
            {{ esEdicion ? `Editar permiso «${permiso?.key}»` : 'Nuevo permiso' }}
          </h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Un permiso es una acción que el sistema comprueba, por ejemplo «ver» o «crear» dentro de un módulo.
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
          <label for="permiso-modulo" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Módulo</label>
          <input
            id="permiso-modulo"
            v-model="modulo"
            type="text"
            list="permiso-modulos"
            :maxlength="PERMISO_MODULO_MAX"
            autocomplete="off"
            autofocus
            placeholder="Elige uno existente o escribe uno nuevo"
            :aria-invalid="mostrarErrorModulo"
            aria-describedby="permiso-modulo-ayuda"
            class="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white"
            :class="mostrarErrorModulo ? 'border-red-400 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 focus:ring-indigo-500 dark:border-gray-600'"
          />
          <datalist id="permiso-modulos">
            <option v-for="m in modulos" :key="m" :value="m" />
          </datalist>
          <p id="permiso-modulo-ayuda" class="mt-1 text-xs" :class="mostrarErrorModulo ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
            {{ mostrarErrorModulo ? errorModulo : 'Agrupa los permisos en la lista. Si el módulo no existe, se crea al guardar.' }}
          </p>
        </div>

        <div>
          <label for="permiso-clave" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Clave del permiso</label>
          <input
            id="permiso-clave"
            v-model="clave"
            type="text"
            :maxlength="PERMISO_CLAVE_MAX"
            autocomplete="off"
            spellcheck="false"
            placeholder="modulo.accion  (ej.: xia.tecnico)"
            :aria-invalid="mostrarErrorClave"
            aria-describedby="permiso-clave-ayuda"
            class="w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white"
            :class="mostrarErrorClave ? 'border-red-400 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 focus:ring-indigo-500 dark:border-gray-600'"
          />
          <p id="permiso-clave-ayuda" class="mt-1 text-xs" :class="mostrarErrorClave ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
            <template v-if="mostrarErrorClave">{{ errorClave }}</template>
            <template v-else-if="claveNormalizada && claveNormalizada !== clave">Se guardará como <code class="font-mono">{{ claveNormalizada }}</code> (minúsculas, sin espacios).</template>
            <template v-else>Es el texto exacto que comprueba el sistema. En minúsculas, con el formato módulo.acción.</template>
          </p>
          <div v-if="sugerencias.length" class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span class="text-gray-500 dark:text-gray-400">Sugerencias:</span>
            <button
              v-for="s in sugerencias"
              :key="s.clave"
              type="button"
              class="rounded-full border border-gray-300 px-2.5 py-1 font-mono text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-indigo-950/40"
              :title="`Usar ${s.clave} (${s.etiqueta})`"
              @click="clave = s.clave"
            >
              {{ s.clave }}
            </button>
          </div>
          <div
            v-if="avisoClaveEnUso"
            class="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Este permiso lo usan {{ rolesEnUso!.join(', ') }}. Si cambias la clave, las pantallas que buscan la clave anterior
              dejarán de reconocerlo y los usuarios de esos roles podrían perder el acceso.
            </span>
          </div>
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between">
            <label for="permiso-descripcion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <span class="text-xs" :class="descripcion.trim().length > PERMISO_DESCRIPCION_MAX ? 'text-red-600 dark:text-red-400' : 'text-gray-400'">
              {{ descripcion.length }}/{{ PERMISO_DESCRIPCION_MAX }}
            </span>
          </div>
          <textarea
            id="permiso-descripcion"
            v-model="descripcion"
            rows="2"
            placeholder="¿Qué permite hacer? Ej.: Ver la documentación técnica en el asistente Xia."
            :aria-invalid="mostrarErrorDescripcion"
            class="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white"
            :class="mostrarErrorDescripcion ? 'border-red-400 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 focus:ring-indigo-500 dark:border-gray-600'"
          />
          <p v-if="mostrarErrorDescripcion" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorDescripcion }}</p>
        </div>

        <fieldset v-if="!esEdicion && roles.length > 0">
          <legend class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Asignar a roles <span class="font-normal text-gray-400">(opcional, puedes hacerlo después desde Roles)</span>
          </legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="rol in roles"
              :key="rol.id"
              class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
              :class="rolesElegidos.includes(rol.name)
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-100'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-500 dark:bg-gray-700"
                :checked="rolesElegidos.includes(rol.name)"
                @change="alternarRol(rol.name)"
              />
              {{ rol.name }}
            </label>
          </div>
        </fieldset>

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
          {{ guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : rolesElegidos.length > 0 ? `Crear y asignar a ${rolesElegidos.length} rol${rolesElegidos.length === 1 ? '' : 'es'}` : 'Crear permiso' }}
        </button>
      </footer>
    </form>
  </ModalNativo>
</template>
