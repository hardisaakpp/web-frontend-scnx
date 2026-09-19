<template>
  <DrawerPanel
    :open="isOpen"
    title-id="drawer-contactos-title"
    max-width-class="sm:max-w-3xl md:max-w-4xl"
    @close="cerrar"
  >
    <template #header>
      <h2 id="drawer-contactos-title" class="text-lg font-bold text-gray-900 dark:text-white truncate">
        Destinatarios de Alertas de Contabilidad
      </h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Administre quién recibe las notificaciones de depósitos pendientes, sin depender de TI
      </p>
    </template>

    <template #top>
      <div v-if="sinCobertura" class="px-5 pt-3">
        <p class="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <ExclamationTriangleIcon class="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          Se requiere al menos un contacto activo de Contabilidad para asegurar la recepción de las alertas diarias de depósitos pendientes.
        </p>
      </div>

      <!-- Barra de herramientas -->
      <div class="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-800 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative flex-1 sm:max-w-xs">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre, cargo o correo…"
            aria-label="Buscar destinatario"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="enviandoPrueba || totalActivos === 0"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="enviarPrueba"
          >
            <EnvelopeIcon class="h-4 w-4" aria-hidden="true" />
            {{ enviandoPrueba ? 'Enviando…' : 'Enviar Correo de Prueba' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="abrirCrear"
          >
            <PlusIcon class="h-4 w-4" aria-hidden="true" />
            Nuevo Destinatario
          </button>
        </div>
      </div>
    </template>

    <div v-if="cargando" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse"></div>
    </div>

    <div v-else-if="contactosFiltrados.length === 0" class="flex flex-col items-center justify-center gap-2 py-12 text-center text-gray-500 dark:text-gray-400">
      <UserGroupIcon class="h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <p class="font-medium">{{ contactos.length === 0 ? 'Todavía no hay destinatarios registrados.' : 'No hay destinatarios que coincidan con la búsqueda.' }}</p>
      <button
        v-if="contactos.length === 0"
        type="button"
        class="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        @click="abrirCrear"
      >
        Agregar el primer destinatario
      </button>
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
        <caption class="sr-only">Destinatarios de alertas de depósitos pendientes</caption>
        <thead class="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            <th scope="col" class="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Colaborador</th>
            <th scope="col" class="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Correo Electrónico</th>
            <th scope="col" class="px-3 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">Estado</th>
            <th scope="col" class="px-3 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-for="contacto in contactosFiltrados" :key="contacto.id">
            <td class="px-3 py-2.5">
              <div class="font-medium text-gray-900 dark:text-white">{{ contacto.nombreCompleto }}</div>
              <div v-if="contacto.cargo" class="text-xs text-gray-500 dark:text-gray-400">{{ contacto.cargo }}</div>
            </td>
            <td class="px-3 py-2.5 text-gray-600 dark:text-gray-300">{{ contacto.email }}</td>
            <td class="px-3 py-2.5">
              <div class="flex justify-center">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="contacto.activo"
                  :aria-label="contacto.activo ? 'Inactivar destinatario' : 'Activar destinatario'"
                  :disabled="actualizandoIds.has(contacto.id)"
                  class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  :class="contacto.activo ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="cambiarEstado(contacto, !contacto.activo)"
                >
                  <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" :class="contacto.activo ? 'translate-x-4' : 'translate-x-1'" />
                </button>
              </div>
            </td>
            <td class="px-3 py-2.5 text-right">
              <div class="flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline"
                  @click="abrirEditar(contacto)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  :disabled="actualizandoIds.has(contacto.id)"
                  class="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:underline disabled:opacity-50"
                  @click="confirmarEliminar(contacto)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        <strong class="text-gray-800 dark:text-gray-200">{{ contactosFiltrados.length }}</strong> de {{ contactos.length }} destinatario(s) —
        <strong class="text-gray-800 dark:text-gray-200">{{ totalActivos }}</strong> activo(s)
      </p>
      <button
        type="button"
        class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        @click="cerrar"
      >
        Cerrar <span class="text-gray-400 dark:text-gray-500">(Esc)</span>
      </button>
    </template>
  </DrawerPanel>

  <ModalContactoNotificacion
    :open="isModalOpen"
    :contacto="contactoEnEdicion"
    :guardando="guardando"
    :errores-campo="erroresCampo"
    @close="isModalOpen = false"
    @guardar="onGuardar"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { EnvelopeIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, PlusIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import DrawerPanel from '@/components/modales/DrawerPanel.vue'
import { useContactosNotificacion } from '../composables/useContactosNotificacion'
import ModalContactoNotificacion from './ModalContactoNotificacion.vue'
import type {
  ActualizarContactoNotificacionPayload,
  ContactoNotificacionDto,
  CrearContactoNotificacionPayload
} from '../types/tesoreria.types'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<(e: 'close') => void>()

const {
  contactos, contactosFiltrados, busqueda, cargando, guardando, enviandoPrueba, actualizandoIds,
  erroresCampo, totalActivos, sinCobertura, cargar, crear, actualizar, cambiarEstado, eliminar, enviarPrueba
} = useContactosNotificacion()

const isModalOpen = ref(false)
const contactoEnEdicion = ref<ContactoNotificacionDto | null>(null)

function cerrar(): void {
  emit('close')
}

function abrirCrear(): void {
  contactoEnEdicion.value = null
  isModalOpen.value = true
}

function abrirEditar(contacto: ContactoNotificacionDto): void {
  contactoEnEdicion.value = contacto
  isModalOpen.value = true
}

async function onGuardar(payload: CrearContactoNotificacionPayload | ActualizarContactoNotificacionPayload): Promise<void> {
  const exito = contactoEnEdicion.value
    ? await actualizar(contactoEnEdicion.value.id, payload as ActualizarContactoNotificacionPayload)
    : await crear(payload as CrearContactoNotificacionPayload)

  if (exito) isModalOpen.value = false
}

function confirmarEliminar(contacto: ContactoNotificacionDto): void {
  if (window.confirm(`¿Eliminar a ${contacto.nombreCompleto} (${contacto.email}) de los destinatarios de alertas?`)) {
    eliminar(contacto)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && contactos.value.length === 0 && !cargando.value) cargar()
  }
)
</script>
