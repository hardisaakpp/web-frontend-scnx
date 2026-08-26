<template>
  <div ref="rootRef" class="relative">
    <input
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :value="textValue"
      :disabled="disabled"
      placeholder="DD/MM/AAAA"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
      :class="[
        'w-full pl-3 pr-9 py-2 border rounded-lg text-sm',
        disabled
          ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
      ]"
    />
    <button
      v-if="!disabled"
      type="button"
      tabindex="-1"
      title="Abrir calendario"
      class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      @mousedown.prevent="toggleCalendar"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>

    <Teleport to="body">
    <div
      v-if="showCalendar"
      ref="calendarRef"
      class="fixed z-[100] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg p-2"
      :style="{ width: '17rem', ...calendarPosition }"
      @mousedown.prevent
    >
      <div class="flex items-center justify-between px-1 py-1">
        <button
          type="button"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
          @click="prevMonth"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ monthYearLabel }}</span>
        <button
          type="button"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
          @click="nextMonth"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <!-- grid-template-columns inline (no clase de Tailwind): así el layout nunca
           depende de que esa clase ya esté generada en el CSS del build/caché del
           navegador que la sirve. -->
      <div class="grid gap-0.5 mt-1 px-1" style="grid-template-columns: repeat(7, minmax(0, 1fr));">
        <span
          v-for="d in WEEK_DAYS"
          :key="d"
          class="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500"
        >{{ d }}</span>
      </div>
      <div class="grid gap-0.5 mt-0.5 px-1 pb-1" style="grid-template-columns: repeat(7, minmax(0, 1fr));">
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          type="button"
          class="h-7 rounded text-xs transition-colors"
          :class="[
            cell.isSelected
              ? 'bg-indigo-600 text-white font-medium'
              : cell.isToday
                ? 'border border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300'
                : cell.isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-600'
                  : 'text-gray-300 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600/50'
          ]"
          @click="selectDay(cell)"
        >
          {{ cell.day }}
        </button>
      </div>
      <div class="flex items-center justify-between px-1 pt-1 border-t border-gray-100 dark:border-gray-600">
        <button
          type="button"
          class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium px-1 py-1"
          @click="selectToday"
        >
          Hoy
        </button>
        <button
          type="button"
          class="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium px-1 py-1"
          @click="clear"
        >
          Limpiar
        </button>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Input de fecha propio (texto DD/MM/AAAA con máscara + calendario desplegable)
 * que no depende del input nativo <input type="date">: el navegador renderiza
 * ese control (orden de día/mes/año, idioma del calendario) según el idioma/
 * región configurados en el propio navegador, no según el `lang` de la página,
 * así que no se puede forzar día/mes/año de forma confiable con el control nativo.
 *
 * El grid de días usa grid-template-columns inline (no la clase de Tailwind
 * grid-cols-7): esa clase es poco común en el resto de la app, así que en un
 * build/caché de CSS que no la haya generado todavía el calendario se veía como
 * una sola columna en vez de 7. Con estilo inline el layout no depende de eso.
 *
 * v-model expone y recibe siempre 'YYYY-MM-DD' (o '' si no hay fecha), igual que
 * el input nativo, para no tener que tocar el resto del código que ya trabaja con
 * ese formato.
 *
 * El calendario desplegable se renderiza con <Teleport to="body"> y position:fixed
 * calculado desde el input (calendarPosition/updateCalendarPosition), en vez de
 * position:absolute anidado en el propio componente: así no lo recorta ni lo empuja
 * fuera de vista un contenedor ancestro con overflow-y-auto (ej. el cuerpo scrolleable
 * de un modal) -- el caso real que motivó esto fue DiferenciaProduccionModal.vue,
 * donde el calendario quedaba por debajo del área visible y había que hacer scroll
 * dentro del modal para verlo completo.
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string | null | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const rootRef = ref<HTMLElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const showCalendar = ref(false)
const textValue = ref('')
const calendarPosition = ref<Record<string, string>>({})

// Alto estimado del calendario (header + 6 filas de días + footer): no se mide el
// DOM real porque hay que decidir arriba/abajo ANTES del primer paint para evitar
// un salto visual al abrir.
const CALENDAR_HEIGHT_ESTIMATE = 320
const VIEWPORT_MARGIN = 8

function updateCalendarPosition() {
  const anchor = rootRef.value
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const gap = 4
  const cabeHaciaAbajo = window.innerHeight - rect.bottom - gap >= CALENDAR_HEIGHT_ESTIMATE
  const left = Math.min(rect.left, window.innerWidth - 17 * 16 - VIEWPORT_MARGIN)
  calendarPosition.value = cabeHaciaAbajo
    ? { left: `${Math.max(left, VIEWPORT_MARGIN)}px`, top: `${rect.bottom + gap}px` }
    : { left: `${Math.max(left, VIEWPORT_MARGIN)}px`, bottom: `${window.innerHeight - rect.top + gap}px` }
}

function handleReposition() {
  if (showCalendar.value) updateCalendarPosition()
}

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

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
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`
}

function syncViewToValue(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (m) {
    viewYear.value = Number(m[1])
    viewMonth.value = Number(m[2]) - 1
  } else {
    const today = new Date()
    viewYear.value = today.getFullYear()
    viewMonth.value = today.getMonth()
  }
}

watch(
  () => props.modelValue,
  (value) => {
    textValue.value = isoToDisplay(value ?? '')
    syncViewToValue(value ?? '')
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

function handleFocus() {
  if (props.disabled) return
  showCalendar.value = true
}

function handleBlur() {
  commitFromText()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    commitFromText()
    showCalendar.value = false
    ;(event.target as HTMLInputElement).blur()
  } else if (event.key === 'Escape') {
    showCalendar.value = false
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
    syncViewToValue(iso)
  } else {
    // Fecha incompleta o inválida: revertir al último valor válido
    textValue.value = isoToDisplay(props.modelValue ?? '')
  }
}

function toggleCalendar() {
  if (props.disabled) return
  showCalendar.value = !showCalendar.value
}

const monthYearLabel = computed(() => {
  const label = new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric'
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

interface CalendarCell {
  key: string
  day: number
  iso: string
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
}

const calendarCells = computed<CalendarCell[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstOfMonth = new Date(year, month, 1)
  // JS: 0=domingo..6=sábado. WEEK_DAYS empieza en lunes, así que desplazamos.
  const leading = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const today = new Date()

  const cells: CalendarCell[] = []

  for (let i = 0; i < leading; i++) {
    const day = daysInPrevMonth - leading + 1 + i
    const cellDate = new Date(year, month - 1, day)
    cells.push({
      key: `prev-${day}`,
      day,
      iso: `${cellDate.getFullYear()}-${pad2(cellDate.getMonth() + 1)}-${pad2(cellDate.getDate())}`,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`
    cells.push({
      key: `cur-${day}`,
      day,
      iso,
      isCurrentMonth: true,
      isSelected: iso === props.modelValue,
      isToday: year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
    })
  }

  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const cellDate = new Date(year, month + 1, day)
    cells.push({
      key: `next-${day}`,
      day,
      iso: `${cellDate.getFullYear()}-${pad2(cellDate.getMonth() + 1)}-${pad2(cellDate.getDate())}`,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false
    })
  }

  return cells
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function commitIso(iso: string) {
  textValue.value = isoToDisplay(iso)
  syncViewToValue(iso)
  emit('update:modelValue', iso)
  emit('change', iso)
  showCalendar.value = false
}

function selectDay(cell: CalendarCell) {
  commitIso(cell.iso)
}

function selectToday() {
  const today = new Date()
  commitIso(`${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`)
}

function clear() {
  textValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
  showCalendar.value = false
}

function handleDocumentMousedown(event: MouseEvent) {
  const target = event.target as Node
  // El calendario vive en <Teleport to="body">, fuera del árbol DOM de rootRef --
  // hay que comprobar ambos para no cerrarlo al hacer clic dentro de él mismo.
  const dentroDelInput = rootRef.value?.contains(target) ?? false
  const dentroDelCalendario = calendarRef.value?.contains(target) ?? false
  if (!dentroDelInput && !dentroDelCalendario) {
    showCalendar.value = false
  }
}

watch(showCalendar, (open) => {
  if (open) {
    updateCalendarPosition()
    // mousedown en fase de captura (no click en fase de burbuja): el Dialog de
    // @headlessui/vue que envuelve este componente en varios modales instala su
    // propio detector de "clic afuera" en mousedown/pointerdown con captura, que
    // corre antes y puede re-enfocar/interceptar la interacción -- si nuestro
    // cierre corriera después, en click y en burbuja, el calendario podía quedar
    // abierto pese a haber hecho clic afuera. Con captura+mousedown cerramos antes
    // de que eso ocurra.
    nextTick(() => document.addEventListener('mousedown', handleDocumentMousedown, true))
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
  } else {
    document.removeEventListener('mousedown', handleDocumentMousedown, true)
    window.removeEventListener('scroll', handleReposition, true)
    window.removeEventListener('resize', handleReposition)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown, true)
  window.removeEventListener('scroll', handleReposition, true)
  window.removeEventListener('resize', handleReposition)
})
</script>
