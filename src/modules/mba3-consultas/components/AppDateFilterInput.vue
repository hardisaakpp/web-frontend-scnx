<template>
  <div ref="rootRef" class="relative">
    <div
      class="w-full flex items-center gap-1 pl-3 pr-2.5 py-2 border rounded-lg text-sm"
      :class="[
        disabled
          ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 cursor-pointer'
      ]"
      @click="togglePopover"
    >
      <button
        type="button"
        :id="id"
        :disabled="disabled"
        class="flex-1 min-w-0 text-left truncate focus:outline-none"
        :class="tieneFiltro ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'"
      >
        {{ resumen }}
      </button>
      <button
        v-if="tieneFiltro && !disabled"
        type="button"
        title="Quitar filtro de fecha"
        class="shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
        @click.stop="clearDates"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <svg class="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    <Teleport to="body">
    <div
      v-if="showPopover"
      ref="popoverRef"
      class="fixed z-[100] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg p-2"
      :style="{ width: '17rem', ...popoverPosition }"
    >
      <!-- Tipo de fecha (a qué fecha aplica el rango) y rango, juntos en un solo paso -->
      <div class="px-1 pt-1 pb-2">
        <label :for="tipoSelectId" class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
          ¿Qué fecha quieres filtrar?
        </label>
        <select
          :id="tipoSelectId"
          v-model="tipo"
          class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option v-for="opt in TIPO_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1.5 px-1 pb-2">
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :value="textDesde"
          placeholder="Desde"
          class="w-0 flex-1 min-w-0 px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          @input="handleInput('desde', $event)"
          @blur="commitFromText('desde')"
          @keydown="handleKeydown"
        />
        <span class="text-gray-400 dark:text-gray-500 shrink-0">–</span>
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :value="textHasta"
          placeholder="Hasta"
          class="w-0 flex-1 min-w-0 px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          @input="handleInput('hasta', $event)"
          @blur="commitFromText('hasta')"
          @keydown="handleKeydown"
        />
      </div>

      <div class="flex items-center justify-between px-1 py-1">
        <button type="button" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" @click="prevMonth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ monthYearLabel }}</span>
        <button type="button" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" @click="nextMonth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <!-- grid-template-columns inline: ver nota en AppDateInput.vue -->
      <div class="grid gap-0.5 mt-1 px-1" style="grid-template-columns: repeat(7, minmax(0, 1fr));">
        <span v-for="d in WEEK_DAYS" :key="d" class="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500">{{ d }}</span>
      </div>
      <div class="grid gap-0.5 mt-0.5 px-1 pb-1" style="grid-template-columns: repeat(7, minmax(0, 1fr));">
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          type="button"
          class="h-7 rounded text-xs transition-colors"
          :class="[
            cell.isDesde || cell.isHasta
              ? 'bg-indigo-600 text-white font-medium'
              : cell.isInRange
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
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
        <button type="button" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium px-1 py-1" @click="selectToday">
          Hoy
        </button>
        <button type="button" class="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium px-1 py-1" @click="clearDates">
          Limpiar
        </button>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Filtro de fecha combinado (tipo + rango) en un solo control: el popover
 * muestra el selector de a qué fecha aplica (Pedido/Entrega/Facturación)
 * junto con el calendario del rango Desde/Hasta.
 *
 * Reemplaza al par de AppDateInput sueltos + el <select> de "Tipo de Fecha"
 * que se usaban antes en los paneles de filtros de listado de pedidos.
 *
 * Cada v-model expone/recibe 'YYYY-MM-DD' (fechas) o el value del tipo
 * (TipoFechaFiltro: 'pedido' | 'creacion' | 'modificacion' | 'entrega' | 'facturacion'), para no tener que
 * tocar el resto del código de filtros.
 */
import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from 'vue'
import type { TipoFechaFiltro } from '../types'
import { pad2, isoToDisplay, displayToIso, useCalendarViewState } from '../composables/useIsoDateInput'

const props = defineProps<{
  disabled?: boolean
  id?: string
}>()

const tipo = defineModel<TipoFechaFiltro | undefined>('tipo', { default: 'pedido' })
const desde = defineModel<string | null | undefined>('desde', { default: '' })
const hasta = defineModel<string | null | undefined>('hasta', { default: '' })

/** Se emite cuando, tras un cambio, el rango queda completo (Desde y Hasta
 * con valor) — así el filtro puede aplicarse solo, sin botón "Buscar". */
const emit = defineEmits<{ change: [] }>()
watch([desde, hasta], ([d, h]) => {
  if (d && h) emit('change')
})

const TIPO_OPTIONS: Array<{ value: TipoFechaFiltro; label: string }> = [
  { value: 'pedido', label: 'Fecha Pedido' },
  { value: 'creacion', label: 'Fecha Creación' },
  { value: 'modificacion', label: 'Fecha Modificación' },
  { value: 'entrega', label: 'Fecha Entrega' },
  { value: 'facturacion', label: 'Fecha Facturación' }
]
const TIPO_LABELS: Record<TipoFechaFiltro, string> = {
  pedido: 'Fecha Pedido',
  creacion: 'Fecha Creación',
  modificacion: 'Fecha Modificación',
  entrega: 'Fecha Entrega',
  facturacion: 'Fecha Facturación'
}

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const rootRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const tipoSelectId = useId()
const showPopover = ref(false)
const textDesde = ref('')
const textHasta = ref('')
// true mientras se espera el clic que define "Hasta" (ya hay un "Desde" elegido en el calendario)
const seleccionandoHasta = ref(false)
const popoverPosition = ref<Record<string, string>>({})

// Alto estimado del popover (selector de tipo + rango + calendario + footer): igual que en
// AppDateInput.vue, se decide arriba/abajo ANTES del primer paint para evitar un salto visual.
const POPOVER_HEIGHT_ESTIMATE = 420
const VIEWPORT_MARGIN = 8

function updatePopoverPosition() {
  const anchor = rootRef.value
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const gap = 4
  const cabeHaciaAbajo = window.innerHeight - rect.bottom - gap >= POPOVER_HEIGHT_ESTIMATE
  const left = Math.min(rect.left, window.innerWidth - 17 * 16 - VIEWPORT_MARGIN)
  popoverPosition.value = cabeHaciaAbajo
    ? { left: `${Math.max(left, VIEWPORT_MARGIN)}px`, top: `${rect.bottom + gap}px` }
    : { left: `${Math.max(left, VIEWPORT_MARGIN)}px`, bottom: `${window.innerHeight - rect.top + gap}px` }
}

function handleReposition() {
  if (showPopover.value) updatePopoverPosition()
}

const { viewYear, viewMonth, syncViewToValue } = useCalendarViewState()

const tipoLabelActual = computed(() => TIPO_LABELS[tipo.value ?? 'pedido'])
const tieneFiltro = computed(() => !!desde.value || !!hasta.value)

const resumen = computed(() => {
  const d = isoToDisplay(desde.value ?? '')
  const h = isoToDisplay(hasta.value ?? '')
  if (!d && !h) return 'Todas las fechas'
  if (d && h) return `${tipoLabelActual.value}: ${d} – ${h}`
  if (d) return `${tipoLabelActual.value}: desde ${d}`
  return `${tipoLabelActual.value}: hasta ${h}`
})

watch(desde, (value) => { textDesde.value = isoToDisplay(value ?? '') }, { immediate: true })
watch(hasta, (value) => { textHasta.value = isoToDisplay(value ?? '') }, { immediate: true })

function togglePopover() {
  if (props.disabled) return
  showPopover.value = !showPopover.value
  if (showPopover.value) {
    syncViewToValue(desde.value || hasta.value || '')
    updatePopoverPosition()
  }
}

function handleInput(campo: 'desde' | 'hasta', event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let formatted = digits
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  if (campo === 'desde') {
    textDesde.value = formatted
  } else {
    textHasta.value = formatted
  }
  if (digits.length === 8) {
    commitFromText(campo)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showPopover.value = false
  }
  // Enter: se deja burbujear para que @keyup.enter en el componente padre
  // (ej. aplicarFiltros) siga funcionando como con un <input> normal.
}

function commitFromText(campo: 'desde' | 'hasta') {
  const model = campo === 'desde' ? desde : hasta
  const textRef = campo === 'desde' ? textDesde : textHasta
  const trimmed = textRef.value.trim()
  if (trimmed === '') {
    if (model.value) model.value = ''
    return
  }
  const iso = displayToIso(trimmed)
  if (iso) {
    if (iso !== model.value) model.value = iso
    syncViewToValue(iso)
  } else {
    textRef.value = isoToDisplay(model.value ?? '')
  }
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
  isDesde: boolean
  isHasta: boolean
  isInRange: boolean
  isToday: boolean
}

const calendarCells = computed<CalendarCell[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstOfMonth = new Date(year, month, 1)
  const leading = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const today = new Date()
  const desdeIso = desde.value || ''
  const hastaIso = hasta.value || ''

  function buildCell(day: number, monthOffset: -1 | 0 | 1): CalendarCell {
    const cellDate = new Date(year, month + monthOffset, day)
    const iso = `${cellDate.getFullYear()}-${pad2(cellDate.getMonth() + 1)}-${pad2(cellDate.getDate())}`
    return {
      key: `${monthOffset}-${day}`,
      day,
      iso,
      isCurrentMonth: monthOffset === 0,
      isDesde: !!desdeIso && iso === desdeIso,
      isHasta: !!hastaIso && iso === hastaIso,
      isInRange: !!desdeIso && !!hastaIso && iso > desdeIso && iso < hastaIso,
      isToday: monthOffset === 0
        && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
    }
  }

  const cells: CalendarCell[] = []
  for (let i = 0; i < leading; i++) {
    cells.push(buildCell(daysInPrevMonth - leading + 1 + i, -1))
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(buildCell(day, 0))
  }
  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    cells.push(buildCell(day, 1))
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

function selectDay(cell: CalendarCell) {
  if (!seleccionandoHasta.value || !desde.value) {
    desde.value = cell.iso
    hasta.value = ''
    seleccionandoHasta.value = true
    return
  }
  if (cell.iso < desde.value) {
    desde.value = cell.iso
    hasta.value = ''
    return
  }
  hasta.value = cell.iso
  seleccionandoHasta.value = false
  showPopover.value = false
}

function selectToday() {
  const today = new Date()
  const iso = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  desde.value = iso
  hasta.value = iso
  seleccionandoHasta.value = false
  syncViewToValue(iso)
  showPopover.value = false
}

function clearDates() {
  desde.value = ''
  hasta.value = ''
  seleccionandoHasta.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  // El popover vive en <Teleport to="body">, fuera del árbol DOM de rootRef --
  // hay que comprobar ambos para no cerrarlo al hacer clic dentro de él mismo.
  const dentroDelInput = rootRef.value?.contains(target) ?? false
  const dentroDelPopover = popoverRef.value?.contains(target) ?? false
  if (!dentroDelInput && !dentroDelPopover) {
    showPopover.value = false
  }
}

watch(showPopover, (open) => {
  if (open) {
    nextTick(() => document.addEventListener('click', handleDocumentClick))
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
  } else {
    document.removeEventListener('click', handleDocumentClick)
    seleccionandoHasta.value = false
    window.removeEventListener('scroll', handleReposition, true)
    window.removeEventListener('resize', handleReposition)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('scroll', handleReposition, true)
  window.removeEventListener('resize', handleReposition)
})
</script>
