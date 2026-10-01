<template>
  <div class="space-y-6">
    <VolverButton to="/admin" title="Volver al Panel de Administración" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Roles y permisos</h1>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Un rol agrupa permisos. Los usuarios que tienen el rol los reciben al iniciar sesión.
        </p>
      </div>
      <button
        type="button"
        data-testid="nuevo-rol"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        @click="abrirCrear"
      >
        <PlusIcon class="h-5 w-5" aria-hidden="true" />
        Nuevo rol
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

    <div class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <!-- ───────── Lista de roles ───────── -->
      <section class="rounded-lg bg-white p-4 shadow transition-colors dark:bg-gray-800" aria-label="Lista de roles">
        <div class="relative">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            v-model="busqueda"
            type="search"
            autocomplete="off"
            placeholder="Buscar rol…"
            aria-label="Buscar rol"
            class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div v-if="cargandoLista" class="mt-3 space-y-2" aria-busy="true" aria-label="Cargando roles">
          <div v-for="n in 4" :key="n" class="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/60" />
        </div>

        <div v-else-if="rolesStore.roles.length === 0" class="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
          <p class="text-sm text-gray-600 dark:text-gray-300">Aún no hay roles.</p>
          <button type="button" class="mt-3 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400" @click="abrirCrear">
            Crear el primer rol
          </button>
        </div>

        <p v-else-if="rolesFiltrados.length === 0" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Ningún rol coincide con «{{ busqueda }}».
        </p>

        <ul v-else class="mt-3 max-h-[32rem] space-y-1.5 overflow-y-auto pr-1" tabindex="0">
          <li v-for="rol in rolesFiltrados" :key="rol.id">
            <button
              type="button"
              :data-testid="`rol-${rol.name}`"
              :aria-current="rol.id === seleccionadoId ? 'true' : undefined"
              class="w-full rounded-lg border px-3 py-2.5 text-left transition-colors"
              :class="rol.id === seleccionadoId
                ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40'
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'"
              @click="seleccionar(rol.id)"
            >
              <span class="flex items-center gap-2">
                <span class="truncate font-medium text-gray-900 dark:text-white">{{ rol.name }}</span>
                <span
                  v-if="rol.isSystem"
                  class="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-600 dark:text-gray-200"
                >Sistema</span>
              </span>
              <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                {{ plural(rol.usersCount ?? 0, 'usuario') }} · {{ plural(rol.permissionsCount ?? 0, 'permiso') }}
              </span>
            </button>
          </li>
        </ul>
      </section>

      <!-- ───────── Detalle del rol ───────── -->
      <section class="rounded-lg bg-white p-6 shadow transition-colors dark:bg-gray-800" aria-label="Detalle del rol" aria-live="polite">
        <div v-if="!rolSeleccionado" class="flex min-h-[16rem] flex-col items-center justify-center text-center">
          <ShieldCheckIcon class="h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">Selecciona un rol para ver y editar sus permisos</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">o crea uno nuevo con el botón «Nuevo rol».</p>
        </div>

        <template v-else>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="break-all text-xl font-semibold text-gray-900 dark:text-white">{{ rolSeleccionado.name }}</h2>
                <span
                  v-if="rolSeleccionado.isSystem"
                  class="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-600 dark:text-gray-200"
                  title="Rol del sistema: no se puede renombrar ni eliminar"
                >Sistema</span>
              </div>
              <p v-if="rolSeleccionado.description" class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ rolSeleccionado.description }}</p>
              <p v-else class="mt-1 text-sm italic text-gray-400">Sin descripción.</p>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {{ plural(rolSeleccionado.usersCount ?? 0, 'usuario') }} con este rol ·
                {{ plural(permisosDelRol.length, 'permiso') }}
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                type="button"
                data-testid="editar-rol"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="abrirEditar(rolSeleccionado)"
              >
                <PencilSquareIcon class="h-4 w-4" aria-hidden="true" />
                Editar
              </button>
              <button
                type="button"
                data-testid="eliminar-rol"
                :disabled="!!motivoNoEliminar"
                :title="motivoNoEliminar || 'Eliminar este rol'"
                class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                @click="confirmarEliminar = true"
              >
                <TrashIcon class="h-4 w-4" aria-hidden="true" />
                Eliminar
              </button>
            </div>
          </div>
          <p v-if="motivoNoEliminar" class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ motivoNoEliminar }}</p>

          <!-- Permisos asignados -->
          <div class="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Permisos del rol</h3>
            <p v-if="cargandoDetalle" class="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando permisos…</p>
            <p v-else-if="permisosDelRol.length === 0" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Este rol todavía no tiene permisos. Agrégalos más abajo.
            </p>
            <div v-else class="mt-3 space-y-3">
              <div v-for="grupo in gruposDelRol" :key="grupo.modulo">
                <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ grupo.modulo }}</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="permiso in grupo.permisos"
                    :key="permiso.id"
                    class="inline-flex items-center gap-1.5 rounded-full bg-green-100 py-1 pl-3 pr-1.5 text-sm text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    :title="permiso.description"
                  >
                    {{ permiso.key }}
                    <button
                      type="button"
                      class="rounded-full p-0.5 hover:bg-green-200 hover:text-red-700 disabled:opacity-40 dark:hover:bg-green-800 dark:hover:text-red-300"
                      :disabled="rolesStore.loading"
                      :aria-label="`Quitar el permiso ${permiso.key} del rol`"
                      @click="quitarPermiso(permiso)"
                    >
                      <XMarkIcon class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Agregar permisos -->
          <div class="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
            <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Agregar permisos</h3>
            <PermisosSelector
              v-model="permisosAAgregar"
              :permisos="permisosStore.permisos"
              :excluidos="permisosDelRol.map(p => p.id)"
              :cargando="cargandoPermisos"
            />
            <div class="mt-3 flex justify-end">
              <button
                type="button"
                data-testid="agregar-permisos"
                :disabled="permisosAAgregar.length === 0 || agregando"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                @click="agregarPermisos"
              >
                {{ agregando ? 'Agregando…' : permisosAAgregar.length > 0 ? `Agregar ${plural(permisosAAgregar.length, 'permiso')}` : 'Agregar permisos' }}
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <RolFormModal
      :open="formAbierto"
      :rol="rolEnEdicion"
      :permisos="permisosStore.permisos"
      :roles="rolesStore.roles"
      :guardando="guardando"
      :error="errorForm"
      :cargando-permisos="cargandoPermisos"
      @cerrar="cerrarForm"
      @guardar="guardarRol"
    />

    <ConfirmModal
      :open="confirmarEliminar"
      destructive
      title="¿Eliminar este rol?"
      :message="mensajeEliminar"
      confirm-label="Eliminar rol"
      @confirm="eliminarRol"
      @cancel="confirmarEliminar = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, ShieldCheckIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import ConfirmModal from '@/components/modales/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import { useRolesStore } from '../stores/rolesStore'
import { usePermisosStore } from '../stores/permisosStore'
import PermisosSelector from '../components/PermisosSelector.vue'
import RolFormModal, { type RolFormPayload } from '../components/RolFormModal.vue'
import type { Permiso, Rol } from '../types'
import { agruparPorModulo, mensajeDeError, normalizar } from '../utils/roles'

const rolesStore = useRolesStore()
const permisosStore = usePermisosStore()
const toast = useToast()

const busqueda = ref('')
const seleccionadoId = ref<string | null>(null)
const cargandoDetalle = ref(false)
const errorCarga = ref('')

const formAbierto = ref(false)
const rolEnEdicion = ref<Rol | null>(null)
const guardando = ref(false)
const errorForm = ref('')

const confirmarEliminar = ref(false)
const permisosAAgregar = ref<number[]>([])
const agregando = ref(false)

/** Solo la carga inicial: durante otras acciones el store también usa `loading` y la lista no debe parpadear. */
const cargandoLista = computed(() => rolesStore.loading && rolesStore.roles.length === 0)
const cargandoPermisos = computed(() => permisosStore.loading && permisosStore.permisos.length === 0)

const rolesFiltrados = computed(() => {
  const q = normalizar(busqueda.value)
  const lista = rolesStore.rolesOrdenados
  return q ? lista.filter(r => normalizar(`${r.name} ${r.description ?? ''}`).includes(q)) : lista
})

const rolSeleccionado = computed(() => rolesStore.roles.find(r => r.id === seleccionadoId.value) ?? null)
const permisosDelRol = computed<Permiso[]>(() => rolSeleccionado.value?.permissions ?? [])
const gruposDelRol = computed(() => agruparPorModulo(permisosDelRol.value))

const motivoNoEliminar = computed(() => {
  const rol = rolSeleccionado.value
  if (!rol) return ''
  if (rol.isSystem) return 'Es un rol del sistema: no se puede eliminar.'
  const usuarios = rol.usersCount ?? 0
  if (usuarios > 0) return `No se puede eliminar: ${plural(usuarios, 'usuario')} lo tiene${usuarios === 1 ? '' : 'n'} asignado. Quítaselo primero.`
  return ''
})

const mensajeEliminar = computed(() => {
  const rol = rolSeleccionado.value
  if (!rol) return ''
  const n = permisosDelRol.value.length
  const permisos = n > 0 ? ` y se le quitarán ${plural(n, 'permiso')}` : ''
  return `Se eliminará el rol «${rol.name}»${permisos}. Esta acción no se puede deshacer.`
})

function plural(n: number, singular: string): string {
  return `${n} ${singular}${n === 1 ? '' : 's'}`
}

async function cargarTodo() {
  errorCarga.value = ''
  await Promise.all([rolesStore.fetchRoles(), permisosStore.fetchPermisos()])
  if (rolesStore.error) errorCarga.value = `No se pudieron cargar los roles: ${rolesStore.error}`
  else if (permisosStore.error) errorCarga.value = `No se pudo cargar el catálogo de permisos: ${permisosStore.error}`
}

onMounted(cargarTodo)

async function cargarPermisosDelRol(rol: Rol) {
  cargandoDetalle.value = true
  try {
    await rolesStore.fetchPermisosRol(rol.name)
  } catch (e) {
    toast.error('No se pudieron cargar los permisos del rol', mensajeDeError(e, 'Inténtalo de nuevo.'))
  } finally {
    cargandoDetalle.value = false
  }
}

async function seleccionar(id: string) {
  const rol = rolesStore.roles.find(r => r.id === id)
  if (!rol) return
  seleccionadoId.value = id
  permisosAAgregar.value = []
  await cargarPermisosDelRol(rol)
}

// ── Crear y editar ──
function abrirCrear() {
  rolEnEdicion.value = null
  errorForm.value = ''
  formAbierto.value = true
}

function abrirEditar(rol: Rol) {
  rolEnEdicion.value = rol
  errorForm.value = ''
  formAbierto.value = true
}

function cerrarForm() {
  formAbierto.value = false
}

async function guardarRol(datos: RolFormPayload) {
  guardando.value = true
  errorForm.value = ''
  try {
    if (rolEnEdicion.value) {
      const actualizado = await rolesStore.updateRol(rolEnEdicion.value.id, { name: datos.name, description: datos.description })
      formAbierto.value = false
      toast.success('Rol actualizado', `«${actualizado.name}» se guardó correctamente.`)
      await seleccionar(actualizado.id)
      return
    }

    const nuevo = await rolesStore.createRol({ name: datos.name, description: datos.description })
    formAbierto.value = false
    if (datos.permisoIds.length > 0) {
      const { asignados, fallidos } = await rolesStore.asignarPermisos(nuevo.name, datos.permisoIds)
      if (fallidos.length > 0) {
        toast.error(
          `Rol creado, pero ${plural(fallidos.length, 'permiso')} no se pudo asignar`,
          `Se asignaron ${asignados} de ${datos.permisoIds.length}. Agrega los faltantes desde el detalle del rol.`
        )
      } else {
        toast.success('Rol creado', `«${nuevo.name}» quedó con ${plural(asignados, 'permiso')}.`)
      }
    } else {
      toast.success('Rol creado', `«${nuevo.name}» ya existe. Agrégale permisos para que sea útil.`)
    }
    await seleccionar(nuevo.id)
  } catch (e) {
    // El store ya dejó el mensaje del servidor (p. ej. nombre duplicado); se muestra dentro del formulario.
    errorForm.value = rolesStore.error ?? mensajeDeError(e, 'No se pudo guardar el rol.')
  } finally {
    guardando.value = false
  }
}

// ── Eliminar ──
async function eliminarRol() {
  const rol = rolSeleccionado.value
  confirmarEliminar.value = false
  if (!rol) return
  try {
    await rolesStore.deleteRol(rol.id)
    seleccionadoId.value = null
    toast.success('Rol eliminado', `«${rol.name}» ya no existe.`)
  } catch {
    toast.error('No se pudo eliminar el rol', rolesStore.error ?? 'Inténtalo de nuevo.')
  }
}

// ── Permisos del rol ──
async function agregarPermisos() {
  const rol = rolSeleccionado.value
  if (!rol || permisosAAgregar.value.length === 0) return
  agregando.value = true
  try {
    const { asignados, fallidos } = await rolesStore.asignarPermisos(rol.name, permisosAAgregar.value)
    permisosAAgregar.value = fallidos.map(f => f.id)
    if (fallidos.length === 0) toast.success('Permisos agregados', `${plural(asignados, 'permiso')} al rol «${rol.name}».`)
    else toast.error(`${plural(fallidos.length, 'permiso')} no se pudo agregar`, fallidos[0].motivo)
  } finally {
    agregando.value = false
  }
}

async function quitarPermiso(permiso: Permiso) {
  const rol = rolSeleccionado.value
  if (!rol) return
  try {
    await rolesStore.removerPermiso(rol.name, permiso.id)
    toast.success('Permiso quitado', `${permiso.key} ya no pertenece a «${rol.name}».`)
  } catch {
    toast.error('No se pudo quitar el permiso', rolesStore.error ?? 'Inténtalo de nuevo.')
  }
}
</script>
