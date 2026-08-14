<template>
  <input
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :value="textValue"
    :disabled="disabled"
    placeholder="DD/MM/AAAA"
    @input="handleInput"
    @blur="handleBlur"
    @keydown="handleKeydown"
    :class="[
      'w-full px-3 py-2 border rounded-lg text-sm',
      disabled
        ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
    ]"
  />
</template>

<script setup lang="ts">
/**
 * Input de fecha propio (texto DD/MM/AAAA con máscara automática) que no depende
 * del input nativo <input type="date">: el navegador renderiza ese control (orden
 * de día/mes/año) según el idioma/región configurados en el propio navegador, no
 * según el `lang` de la página, así que no se puede forzar día/mes/año de forma
 * confiable con el control nativo.
 *
 * Sin calendario desplegable a propósito (feedback de UX): más simple y sin
 * riesgo de bugs de layout/posición; encaja además con campos como Fecha
 * Facturación, que se copian de un documento real en vez de "navegarse".
 *
 * v-model expone y recibe siempre 'YYYY-MM-DD' (o '' si no hay fecha), igual que
 * el input nativo, para no tener que tocar el resto del código que ya trabaja con
 * ese formato.
 */
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const textValue = ref('')

function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

function displayToIso(display: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim())
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return null
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

watch(
  () => props.modelValue,
  (value) => {
    textValue.value = isoToDisplay(value ?? '')
  },
  { immediate: true }
)

function handleInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let formatted = digits
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  textValue.value = formatted
  if (digits.length === 8) {
    commitFromText()
  }
}

function handleBlur() {
  commitFromText()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    commitFromText()
    ;(event.target as HTMLInputElement).blur()
  }
}

function commitFromText() {
  const trimmed = textValue.value.trim()
  if (trimmed === '') {
    if (props.modelValue) {
      emit('update:modelValue', '')
      emit('change', '')
    }
    return
  }
  const iso = displayToIso(trimmed)
  if (iso) {
    if (iso !== props.modelValue) {
      emit('update:modelValue', iso)
      emit('change', iso)
    }
  } else {
    // Fecha incompleta o inválida: revertir al último valor válido
    textValue.value = isoToDisplay(props.modelValue ?? '')
  }
}
</script>
