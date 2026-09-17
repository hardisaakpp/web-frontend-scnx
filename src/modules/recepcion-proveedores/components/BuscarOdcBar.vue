<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/feedback/LoadingSpinner.vue'
import { useDelayedFlag } from '@/composables/useDelayedFlag'

const props = withDefaults(
  defineProps<{
    autofocus?: boolean
    /** DocNum actual (p.ej. la ODC que ya se esta viendo) para que el input no aparezca vacio. */
    initialDocNum?: number | string | null
    /** Loading real de la pagina que embebe esta barra (ej. la consulta a SAP ya en curso). */
    loading?: boolean
  }>(),
  { autofocus: false, initialDocNum: null, loading: false }
)

/** Se busca el mismo DocNum que ya está en pantalla: un router.push a la misma ruta no
 * navega (Vue Router lo ignora), así que el padre debe volver a consultar manualmente. */
const emit = defineEmits<(e: 'buscar-mismo-docnum', docNum: number) => void>()

const router = useRouter()
const docNum = ref<string>(props.initialDocNum != null ? String(props.initialDocNum) : '')
const buscando = ref(false)
const error = ref<string | null>(null)

// El boton "Logs" (registro tecnico evento a evento, distinto del "Historial" de recepciones del
// dashboard) solo se muestra cuando esta barra vive en el detalle de una ODC: ahi lleva su
// referencia en la query para que "Volver" en LogsView regrese a esa ODC en vez del dashboard.
const logsTo = computed(() => ({
  path: '/recepcion-proveedores/logs',
  query: props.initialDocNum != null ? { volverA: String(props.initialDocNum) } : {},
}))

// Cubre el caso en que esta misma instancia persiste entre busquedas (ej. dentro del detalle de
// una ODC, el usuario busca otro DocNum sin salir del componente): el input se actualiza al
// nuevo DocNum en vez de quedar vacio o mostrando el anterior.
watch(
  () => props.initialDocNum,
  (valor) => {
    docNum.value = valor != null ? String(valor) : ''
  }
)

const cargando = computed(() => buscando.value || props.loading)

// Recien despues de 10s (el umbral en el que el middleware decide encolar la consulta a SAP,
// ver JobQueue:QueueAfterSeconds del middleware) se avisa que la espera se alargo, en vez de
// dejar el mensaje generico igual a los 2s que a los 35s.
const tardandoMasDeLoUsual = useDelayedFlag(() => cargando.value, 10000)

async function buscar(): Promise<void> {
  const valor = Number(docNum.value)
  if (!Number.isFinite(valor) || valor <= 0) {
    error.value = 'Ingresa un número de ODC válido.'
    return
  }
  error.value = null
  buscando.value = true
  try {
    if (props.initialDocNum != null && Number(props.initialDocNum) === valor) {
      emit('buscar-mismo-docnum', valor)
    } else {
      await router.push({ name: 'recepcion-proveedores-detalle', params: { docNum: valor } })
    }
  } finally {
    buscando.value = false
  }
}
</script>

<template>
  <div>
    <form class="flex gap-2" @submit.prevent="buscar">
      <label for="buscar-odc-input" class="sr-only">Número de ODC</label>
      <input
        id="buscar-odc-input"
        v-model="docNum"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        :autofocus="autofocus"
        :disabled="cargando"
        placeholder="Número de ODC (DocNum)"
        class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        :disabled="cargando"
        class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <LoadingSpinner v-if="cargando" layout="inline" size="sm" color="current" aria-label="Buscando" />
        {{ cargando ? 'Buscando...' : 'Buscar' }}
      </button>
      <RouterLink
        v-if="initialDocNum != null"
        :to="logsTo"
        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        :class="{ 'opacity-50 pointer-events-none cursor-not-allowed': cargando }"
        :tabindex="cargando ? -1 : undefined"
        :aria-disabled="cargando"
      >
        Logs
      </RouterLink>
    </form>
    <p v-if="cargando && tardandoMasDeLoUsual" class="mt-2 text-sm text-amber-600 dark:text-amber-400">
      SAP está respondiendo más lento de lo usual — seguimos esperando, esto puede tardar hasta 40 segundos.
    </p>
    <p v-else-if="cargando" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Buscando ODC {{ docNum }}... esto puede tardar unos segundos si se consulta directamente a SAP.
    </p>
    <p v-else-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
