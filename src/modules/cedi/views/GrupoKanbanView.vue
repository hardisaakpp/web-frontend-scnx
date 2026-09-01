<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import grupoApi from '../services/grupoApi'
import { useGrupoStore } from '../stores/grupoStore'
import { useToast } from '@/composables/useToast'
import ConfirmActionModal from '../components/ConfirmActionModal.vue'
import type { GrupoDto, GrupoEstado } from '../types'

// P-016 — Kanban Board (Fase 5, "Etapa 2"). Arrastrar una tarjeta ejecuta la MISMA acción
// real que ya existe (iniciar picking / cerrar picking / integrar a SAP) — nunca escribe el
// estado directo, así ninguna regla de negocio (permiso de supervisor en cierre parcial,
// validación de escaneos, bloqueo en SAP) se saltea por arrastrar en vez de tocar un botón.
//
// "Auto-refresh SignalR" del checklist original se resolvió con POLLING (10s) en vez de un
// hub de SignalR real — mismo criterio de "adaptar al patrón ya probado" que el resto del
// proyecto (ver docs/PROGRESO.md P-016): agregar un hub completo (auth, lifecycle, broadcast
// por grupo) es infraestructura nueva grande para una mejora de "se ve al toque" que el
// polling ya cubre razonablemente.

const router = useRouter()
const grupoStore = useGrupoStore()
const toast = useToast()

const columnas: { estado: GrupoEstado; titulo: string }[] = [
  { estado: 'Nuevo', titulo: 'Nuevo' },
  { estado: 'Recolectando', titulo: 'Recolectando' },
  { estado: 'Empaquetando', titulo: 'Empaquetando' },
  { estado: 'Despachado', titulo: 'Despachado' },
]
const ordenColumnas: GrupoEstado[] = ['Nuevo', 'Recolectando', 'Empaquetando', 'Despachado']

const estadoColor: Record<GrupoEstado, string> = {
  Nuevo: 'border-blue-400 dark:border-blue-600',
  Recolectando: 'border-amber-400 dark:border-amber-600',
  Empaquetando: 'border-purple-400 dark:border-purple-600',
  Despachado: 'border-emerald-400 dark:border-emerald-600',
}

const grupos = ref<GrupoDto[]>([])
const cargando = ref(false)
const arrastrando = ref<GrupoDto | null>(null)
const integrarPendiente = ref<GrupoDto | null>(null)
const integrando = ref(false)

function gruposDe(estado: GrupoEstado) {
  return grupos.value.filter(g => g.estado === estado)
}

async function cargar() {
  cargando.value = true
  try {
    const result = await grupoApi.getGrupos(1, 100)
    grupos.value = result.data
  } catch {
    // silencioso: el próximo tick de polling reintenta solo
  } finally {
    cargando.value = false
  }
}

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  cargar()
  poll = setInterval(cargar, 10000)
})
onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
})

function onDragStart(grupo: GrupoDto) {
  arrastrando.value = grupo
}

async function onDrop(destino: GrupoEstado) {
  const grupo = arrastrando.value
  arrastrando.value = null
  if (!grupo || grupo.estado === destino) return

  const idxOrigen = ordenColumnas.indexOf(grupo.estado)
  const idxDestino = ordenColumnas.indexOf(destino)
  if (idxDestino !== idxOrigen + 1) {
    toast.warning('Movimiento no permitido', 'Solo se puede avanzar una columna a la vez, en orden.')
    return
  }

  if (destino === 'Recolectando') {
    try {
      await grupoStore.startPickingSession(grupo.id)
      toast.success('Picking iniciado', `"${grupo.nombre}" pasó a Recolectando.`)
      await cargar()
    } catch (e: any) {
      toast.error('No se pudo iniciar el picking', e?.response?.data?.message)
    }
  } else if (destino === 'Empaquetando') {
    try {
      await grupoStore.closePicking(grupo.id)
      toast.success('Picking cerrado', `"${grupo.nombre}" pasó a Empaquetando.`)
      await cargar()
    } catch (e: any) {
      toast.error('No se pudo cerrar el picking', e?.response?.data?.message)
    }
  } else if (destino === 'Despachado') {
    // Genera documentos reales en SAP — se confirma en vez de disparar directo al soltar.
    // La tarjeta no se mueve todavía (grupos.value no cambia hasta confirmar), así que si
    // se cancela, queda tal cual estaba.
    integrarPendiente.value = grupo
  }
}

async function confirmarIntegrar() {
  if (!integrarPendiente.value) return
  integrando.value = true
  try {
    await grupoStore.integrarStockTransfer(integrarPendiente.value.id)
    toast.success('Integrado a SAP', `"${integrarPendiente.value.nombre}" despachado.`)
    integrarPendiente.value = null
    await cargar()
  } catch (e: any) {
    toast.error('No se pudo integrar a SAP', e?.response?.data?.message)
  } finally {
    integrando.value = false
  }
}

function abrirGrupo(grupo: GrupoDto) {
  router.push(`/cedi/distribucion/grupos/${grupo.id}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tablero de Grupos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Arrastrá una tarjeta a la columna siguiente para avanzar su estado — click para ver el detalle.
        </p>
      </div>
      <router-link to="/cedi/distribucion/grupos" class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Ver como lista
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        v-for="col in columnas"
        :key="col.estado"
        class="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-3 min-h-[240px]"
        @dragover.prevent
        @drop="onDrop(col.estado)"
      >
        <div class="flex items-center justify-between mb-3 px-1">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-300">{{ col.titulo }}</h2>
          <span class="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
            {{ gruposDe(col.estado).length }}
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="grupo in gruposDe(col.estado)"
            :key="grupo.id"
            draggable="true"
            class="bg-white dark:bg-gray-800 rounded-xl border-l-4 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
            :class="estadoColor[grupo.estado]"
            @dragstart="onDragStart(grupo)"
            @click="abrirGrupo(grupo)"
          >
            <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ grupo.nombre }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ grupo.almacen }} · {{ grupo.tipo }}</p>
            <div class="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{{ grupo.cantidadSolicitudes }} solicitud(es)</span>
              <span>{{ grupo.cantidadArticulos }} ítem(s)</span>
            </div>
          </div>

          <p v-if="gruposDe(col.estado).length === 0" class="text-xs text-gray-300 dark:text-gray-600 text-center py-6">
            Sin grupos acá
          </p>
        </div>
      </div>
    </div>
  </div>

  <ConfirmActionModal
    :open="integrarPendiente !== null"
    title="Integrar a SAP"
    :message="`Se va a crear un StockTransfer REAL en SAP para cada solicitud de '${integrarPendiente?.nombre}' con algo escaneado. No es reversible desde acá.`"
    confirm-label="Sí, integrar a SAP"
    accent="red"
    :delay-seconds="5"
    :busy="integrando"
    @cancel="integrarPendiente = null"
    @confirm="confirmarIntegrar"
  />
</template>
