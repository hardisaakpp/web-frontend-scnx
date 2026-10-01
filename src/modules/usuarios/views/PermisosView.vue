<template>
  <div class="space-y-6">
    <VolverButton to="/admin" title="Volver al Panel de Administración" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Permisos</h1>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Un permiso es una acción concreta que el sistema comprueba (por ejemplo, «ver» o «crear» en un módulo).
          Se agrupan en <RouterLink to="/roles" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">roles</RouterLink>, que son los que se asignan a los usuarios.
        </p>
      </div>
      <button
        type="button"
        data-testid="nuevo-permiso"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        @click="abrirCrear()"
      >
        <PlusIcon class="h-5 w-5" aria-hidden="true" />
        Nuevo permiso
      </button>
    </div>

    <div
      v-if="errorCarga"
      role="alert"
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
    >
      <span>{{ errorCarga }}</span>
      <button type="button" class="font-semibold underline" @click="cargarTodo">Reintentar</button>
    </div>

    <!-- Carga inicial -->
    <div v-if="cargandoLista" class="space-y-3" aria-busy="true" aria-label="Cargando permisos">
      <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
    </div>

    <!-- Catálogo vacío -->
    <div v-else-if="permisosStore.permisos.length === 0 && !errorCarga" class="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
      <KeyIcon class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <h3 class="mt-3 text-sm font-medium text-gray-900 dark:text-white">Aún no hay permisos</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea el primero para poder asignarlo a un rol.</p>
      <button type="button" class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" @click="abrirCrear()">
        Crear el primer permiso
      </button>
    </div>

    <template v-else-if="permisosStore.permisos.length > 0">
      <!-- Barra de búsqueda y filtros -->
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="relative min-w-[14rem] flex-1">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            v-model="busqueda"
            type="search"
            autocomplete="off"
            placeholder="Buscar por clave, descripción o módulo…"
            aria-label="Buscar permisos"
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          v-model="moduloFiltro"
          aria-label="Filtrar por módulo"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todos los módulos ({{ permisosStore.modulos.length }})</option>
          <option v-for="m in permisosStore.modulos" :key="m" :value="m">{{ m }}</option>
        </select>
        <label
          v-if="usoCargado"
          class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
          title="Muestra los permisos que ningún rol tiene asignado"
        >
          <input v-model="soloSinRoles" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-500 dark:bg-gray-700" />
          Solo sin roles
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{{ totalSinRoles }}</span>
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {{ plural(permisosFiltrados.length, 'permiso') }} en {{ plural(grupos.length, 'módulo') }}
          <template v-if="hayFiltros"> (de {{ permisosStore.permisos.length }} en total)</template>
        </span>
        <span v-if="grupos.length > 1 && !hayFiltros" class="flex gap-3">
          <button type="button" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400" @click="contraerTodos">Contraer módulos</button>
          <button type="button" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400" @click="colapsados = new Set()">Expandir módulos</button>
        </span>
      </div>

      <p v-if="grupos.length === 0" class="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
        Ningún permiso coincide con los filtros.
        <button type="button" class="ml-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400" @click="limpiarFiltros">Quitar filtros</button>
      </p>

      <!-- Módulos -->
      <section
        v-for="grupo in grupos"
        :key="grupo.modulo"
        class="overflow-hidden rounded-lg border border-transparent bg-white shadow transition-colors dark:border-gray-700 dark:bg-gray-800"
        :aria-label="`Módulo ${grupo.modulo}`"
      >
        <header class="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 text-left"
            :aria-expanded="!estaColapsado(grupo.modulo)"
            @click="alternarModulo(grupo.modulo)"
          >
            <ChevronDownIcon class="h-4 w-4 shrink-0 text-gray-400 transition-transform" :class="estaColapsado(grupo.modulo) ? '-rotate-90' : ''" aria-hidden="true" />
            <span class="truncate text-base font-semibold capitalize text-gray-900 dark:text-white">{{ grupo.modulo }}</span>
            <span class="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ grupo.permisos.length }}</span>
          </button>
          <button
            type="button"
            class="shrink-0 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            :title="`Agregar un permiso al módulo ${grupo.modulo}`"
            @click="abrirCrear(grupo.modulo)"
          >
            + Agregar
          </button>
        </header>

        <ul v-show="!estaColapsado(grupo.modulo)" class="divide-y divide-gray-100 dark:divide-gray-700">
          <li
            v-for="permiso in grupo.permisos"
            :key="permiso.id"
            :data-testid="`permiso-${permiso.key}`"
            class="grid gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-gray-50 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto] sm:items-start dark:hover:bg-gray-700/40"
          >
            <div class="flex min-w-0 items-center gap-1.5">
              <code class="min-w-0 break-all rounded bg-gray-100 px-2 py-1 font-mono text-[13px] text-gray-900 dark:bg-gray-700 dark:text-gray-100">{{ permiso.key }}</code>
              <button
                type="button"
                class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                :aria-label="`Copiar la clave ${permiso.key}`"
                title="Copiar clave"
                @click="copiarClave(permiso.key)"
              >
                <ClipboardDocumentIcon class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div class="min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-200">{{ permiso.description || 'Sin descripción' }}</p>
              <div v-if="usoCargado" class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <template v-if="rolesDe(permiso).length > 0">
                  <span class="text-gray-400">Roles:</span>
                  <span
                    v-for="nombre in rolesDe(permiso).slice(0, 4)"
                    :key="nombre"
                    class="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  >{{ nombre }}</span>
                  <span
                    v-if="rolesDe(permiso).length > 4"
                    class="text-gray-500 dark:text-gray-400"
                    :title="rolesDe(permiso).slice(4).join(', ')"
                  >+{{ rolesDe(permiso).length - 4 }} más</span>
                </template>
                <span v-else class="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Sin roles asignados
                </span>
              </div>
            </div>

            <div class="flex shrink-0 gap-1 sm:justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                :aria-label="`Editar el permiso ${permiso.key}`"
                @click="abrirEditar(permiso)"
              >
                <PencilSquareIcon class="h-4 w-4" aria-hidden="true" />
                Editar
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                :aria-label="`Eliminar el permiso ${permiso.key}`"
                @click="pedirEliminar(permiso)"
              >
                <TrashIcon class="h-4 w-4" aria-hidden="true" />
                Eliminar
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <PermisoFormModal
      :open="formAbierto"
      :permiso="permisoEnEdicion"
      :permisos="permisosStore.permisos"
      :roles="rolesStore.rolesOrdenados"
      :roles-en-uso="permisoEnEdicion ? rolesDe(permisoEnEdicion) : []"
      :modulo-inicial="moduloInicial"
      :guardando="guardando"
      :error="errorForm"
      @cerrar="formAbierto = false"
      @guardar="guardarPermiso"
    />

    <ConfirmModal
      :open="permisoAEliminar !== null"
      destructive
      title="¿Eliminar este permiso?"
      :message="mensajeEliminar"
      confirm-label="Eliminar permiso"
      @confirm="eliminarPermiso"
      @cancel="permisoAEliminar = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChevronDownIcon, ClipboardDocumentIcon, KeyIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon,
} from '@heroicons/vue/24/outline'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import ConfirmModal from '@/components/modales/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import { usePermisosStore } from '../stores/permisosStore'
import { useRolesStore } from '../stores/rolesStore'
import { permisosService } from '../services/usuariosApi'
import PermisoFormModal, { type PermisoFormPayload } from '../components/PermisoFormModal.vue'
import type { Permiso } from '../types'
import { agruparPorModulo, filtrarPermisos, mensajeDeError } from '../utils/roles'
import { usoPorPermiso } from '../utils/permisos'

const permisosStore = usePermisosStore()
const rolesStore = useRolesStore()
const toast = useToast()

const busqueda = ref('')
const moduloFiltro = ref('')
const soloSinRoles = ref(false)
const colapsados = ref<Set<string>>(new Set())
const errorCarga = ref('')

// Qué roles tiene cada permiso: el Core no lo ofrece en un solo endpoint, así que se arma con los permisos de cada rol.
const usoMapa = ref<Map<number, string[]>>(new Map())
const usoCargado = ref(false)

const formAbierto = ref(false)
const permisoEnEdicion = ref<Permiso | null>(null)
const moduloInicial = ref('')
const guardando = ref(false)
const errorForm = ref('')
const permisoAEliminar = ref<Permiso | null>(null)

/** Solo la carga inicial: durante otras acciones el store también usa `loading` y la lista no debe parpadear. */
const cargandoLista = computed(() => permisosStore.loading && permisosStore.permisos.length === 0)

const rolesDe = (permiso: Permiso): string[] => usoMapa.value.get(permiso.id) ?? []
const totalSinRoles = computed(() => permisosStore.permisos.filter(p => rolesDe(p).length === 0).length)

const hayFiltros = computed(() => busqueda.value.trim() !== '' || moduloFiltro.value !== '' || soloSinRoles.value)

const permisosFiltrados = computed(() => {
  let lista = filtrarPermisos(permisosStore.permisos, busqueda.value)
  if (moduloFiltro.value) lista = lista.filter(p => p.module === moduloFiltro.value)
  if (soloSinRoles.value) lista = lista.filter(p => rolesDe(p).length === 0)
  return lista
})
const grupos = computed(() => agruparPorModulo(permisosFiltrados.value))

// Con filtros activos los módulos se muestran abiertos: contraídos esconderían justo lo que se busca.
const estaColapsado = (modulo: string) => !hayFiltros.value && colapsados.value.has(modulo)

function alternarModulo(modulo: string) {
  const nuevo = new Set(colapsados.value)
  if (nuevo.has(modulo)) nuevo.delete(modulo)
  else nuevo.add(modulo)
  colapsados.value = nuevo
}
const contraerTodos = () => { colapsados.value = new Set(grupos.value.map(g => g.modulo)) }

function limpiarFiltros() {
  busqueda.value = ''
  moduloFiltro.value = ''
  soloSinRoles.value = false
}

function plural(n: number, singular: string): string {
  return `${n} ${singular}${n === 1 ? '' : 's'}`
}

async function cargarUso() {
  try {
    const roles = rolesStore.roles.filter(r => r.permissionsCount !== 0)
    const porRol = await Promise.all(roles.map(async r => ({ nombre: r.name, permisos: await permisosService.getPermisosPorRol(r.name) })))
    usoMapa.value = usoPorPermiso(porRol)
    usoCargado.value = true
  } catch {
    // Sin esta información la pantalla sigue siendo útil: simplemente no se muestran los roles de cada permiso.
    usoCargado.value = false
  }
}

async function cargarTodo() {
  errorCarga.value = ''
  await Promise.all([permisosStore.fetchPermisos(), rolesStore.fetchRoles()])
  if (permisosStore.error) {
    errorCarga.value = `No se pudieron cargar los permisos: ${permisosStore.error}`
    return
  }
  await cargarUso()
}

onMounted(cargarTodo)

// ── Crear y editar ──
function abrirCrear(modulo = '') {
  permisoEnEdicion.value = null
  moduloInicial.value = modulo
  errorForm.value = ''
  formAbierto.value = true
}

function abrirEditar(permiso: Permiso) {
  permisoEnEdicion.value = permiso
  errorForm.value = ''
  formAbierto.value = true
}

async function guardarPermiso(datos: PermisoFormPayload) {
  guardando.value = true
  errorForm.value = ''
  try {
    if (permisoEnEdicion.value) {
      const actualizado = await permisosStore.updatePermiso(permisoEnEdicion.value.id, {
        key: datos.key, description: datos.description, module: datos.module,
      })
      formAbierto.value = false
      toast.success('Permiso actualizado', `«${actualizado.key}» se guardó correctamente.`)
      await cargarUso()
      return
    }

    const nuevo = await permisosStore.createPermiso({ key: datos.key, description: datos.description, module: datos.module })
    formAbierto.value = false

    const fallidos: string[] = []
    for (const roleName of datos.roleNames) {
      try {
        await permisosService.asignarPermiso({ roleName, permissionId: nuevo.id })
      } catch {
        fallidos.push(roleName)
      }
    }
    if (datos.roleNames.length > 0) await rolesStore.fetchRoles()
    await cargarUso()

    if (fallidos.length > 0) {
      toast.error('Permiso creado, pero no se pudo asignar', `No se asignó a: ${fallidos.join(', ')}. Hazlo desde la pantalla de Roles.`)
    } else if (datos.roleNames.length > 0) {
      toast.success('Permiso creado', `«${nuevo.key}» quedó asignado a ${datos.roleNames.join(', ')}.`)
    } else {
      toast.success('Permiso creado', `«${nuevo.key}» ya existe. Asígnalo a un rol para que tenga efecto.`)
    }
  } catch (e) {
    // El store ya dejó el mensaje del servidor (p. ej. clave repetida); se muestra dentro del formulario.
    errorForm.value = permisosStore.error ?? mensajeDeError(e, 'No se pudo guardar el permiso.')
  } finally {
    guardando.value = false
  }
}

// ── Eliminar ──
const mensajeEliminar = computed(() => {
  const p = permisoAEliminar.value
  if (!p) return ''
  const roles = rolesDe(p)
  const efecto = roles.length > 0
    ? ` y se quitará de ${plural(roles.length, 'rol')} (${roles.join(', ')}): quienes lo tengan por esos roles perderán esa acción`
    : ''
  return `Se eliminará el permiso «${p.key}» del catálogo${efecto}. Esta acción no se puede deshacer.`
})

function pedirEliminar(permiso: Permiso) {
  permisoAEliminar.value = permiso
}

async function eliminarPermiso() {
  const p = permisoAEliminar.value
  permisoAEliminar.value = null
  if (!p) return
  try {
    await permisosStore.deletePermiso(p.id)
    toast.success('Permiso eliminado', `«${p.key}» ya no existe.`)
    await Promise.all([rolesStore.fetchRoles(), cargarUso()])
  } catch {
    toast.error('No se pudo eliminar el permiso', permisosStore.error ?? 'Inténtalo de nuevo.')
  }
}

async function copiarClave(clave: string) {
  try {
    await navigator.clipboard.writeText(clave)
    toast.success('Clave copiada', clave, 2500)
  } catch {
    toast.error('No se pudo copiar', 'Selecciona la clave y cópiala manualmente.')
  }
}
</script>
