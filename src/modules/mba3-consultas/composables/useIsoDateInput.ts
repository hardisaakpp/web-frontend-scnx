import { ref } from 'vue'

/** Formatea un número de 1-2 dígitos con cero a la izquierda (ej. 3 -> "03"). */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' (vacío si no matchea el formato ISO esperado). */
export function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** 'DD/MM/YYYY' -> 'YYYY-MM-DD', validando mes/día reales (incl. días por mes/año bisiesto). null si no es válida. */
export function displayToIso(display: string): string | null {
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

/** Estado de "qué mes/año se está viendo" en el calendario, sincronizable desde un valor ISO. */
export function useCalendarViewState() {
  const now = new Date()
  const viewYear = ref(now.getFullYear())
  const viewMonth = ref(now.getMonth())

  function syncViewToValue(iso: string): void {
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

  return { viewYear, viewMonth, syncViewToValue }
}
