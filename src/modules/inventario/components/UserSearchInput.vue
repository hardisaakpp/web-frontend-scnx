<template>
  <div class="relative">
    <div class="flex gap-2">
      <input
        ref="inputRef"
        v-model="texto"
        type="text"
        class="text-input flex-1"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        role="combobox"
        :aria-expanded="abierto"
        aria-autocomplete="list"
        @input="onInput"
        @focus="abierto = coincidencias.length > 0"
        @keydown.down.prevent="mover(1)"
        @keydown.up.prevent="mover(-1)"
        @keydown.enter.prevent="onEnter"
        @keydown.esc="abierto = false"
        @blur="onBlur"
      >
      <button type="button" class="btn-add" :disabled="disabled || !texto.trim() || buscando" @click="onEnter">
        {{ buscando ? 'Buscando...' : 'Agregar' }}
      </button>
    </div>

    <ul
      v-if="abierto && (coincidencias.length > 0 || (texto.trim().length >= MIN_CHARS && !buscando))"
      class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm"
      role="listbox"
    >
      <li
        v-for="(u, idx) in coincidencias"
        :key="u.id || u.userName"
        role="option"
        :aria-selected="idx === indice"
        class="px-3 py-2 cursor-pointer flex items-center justify-between gap-3"
        :class="idx === indice ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'"
        @mousedown.prevent="elegir(u)"
      >
        <div class="min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">{{ u.fullName || u.userName }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ u.userName }}<span v-if="u.email && u.email !== u.userName"> · {{ u.email }}</span>
          </div>
        </div>
        <span class="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">Elegir</span>
      </li>
      <li v-if="coincidencias.length === 0" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
        Sin coincidencias en SCNexus para "{{ texto.trim() }}".
      </li>
    </ul>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Buscador de usuarios del Core con autocompletado. Mientras se escribe consulta coincidencias por
 * usuario, nombre o correo y deja elegir una; solo se emite un usuario que existe en SCNexus.
 * Reemplaza los campos de texto libre de "agregar usuario" en picking y reparto de reconteo:
 * hay cuentas cuyo usuario no coincide con el correo (o no tienen correo) y el operador no
 * tiene por qué saber cómo está registrada.
 */
import { ref, onBeforeUnmount } from 'vue'
import { searchCoreUsers, findCoreUser, type CoreUserInfo } from '@/utils/resolveUserNames'

withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Buscar usuario por nombre, usuario de red o correo',
  disabled: false,
})

const emit = defineEmits<{ select: [user: CoreUserInfo] }>()

const MIN_CHARS = 2
const inputRef = ref<HTMLInputElement | null>(null)
const texto = ref('')
const coincidencias = ref<CoreUserInfo[]>([])
const indice = ref(-1)
const abierto = ref(false)
const buscando = ref(false)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null
let ultimaBusqueda = 0

function onInput() {
  error.value = null
  if (timer) clearTimeout(timer)
  const q = texto.value.trim()
  if (q.length < MIN_CHARS) {
    coincidencias.value = []
    abierto.value = false
    return
  }
  timer = setTimeout(() => buscar(q), 300)
}

async function buscar(q: string) {
  const id = ++ultimaBusqueda
  buscando.value = true
  try {
    const res = await searchCoreUsers(q)
    if (id !== ultimaBusqueda) return // llegó una búsqueda más nueva
    coincidencias.value = res
    indice.value = res.length > 0 ? 0 : -1
    abierto.value = true
  } finally {
    if (id === ultimaBusqueda) buscando.value = false
  }
}

function mover(delta: number) {
  if (coincidencias.value.length === 0) return
  abierto.value = true
  indice.value = (indice.value + delta + coincidencias.value.length) % coincidencias.value.length
}

async function onEnter() {
  const q = texto.value.trim()
  if (!q) return
  if (abierto.value && indice.value >= 0 && coincidencias.value[indice.value]) {
    elegir(coincidencias.value[indice.value])
    return
  }
  // Sin lista abierta: intenta resolver exacto lo escrito (usuario, correo o id).
  buscando.value = true
  try {
    const user = await findCoreUser(q)
    if (user) {
      elegir(user)
    } else {
      error.value = `El usuario "${q}" no existe en SCNexus / Directorio Activo. Escribe parte del nombre para ver coincidencias.`
    }
  } finally {
    buscando.value = false
  }
}

function elegir(u: CoreUserInfo) {
  emit('select', u)
  texto.value = ''
  coincidencias.value = []
  indice.value = -1
  abierto.value = false
  error.value = null
  inputRef.value?.focus()
}

function onBlur() {
  // Da tiempo al mousedown de la lista antes de cerrarla.
  setTimeout(() => { abierto.value = false }, 150)
}

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.text-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60; }
.btn-add { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0; }
</style>
