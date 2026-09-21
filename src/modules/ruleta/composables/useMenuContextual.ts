import { nextTick, onDeactivated, onUnmounted, ref, type CSSProperties } from 'vue'

const MARGEN = 12
const SEPARACION = 6

/** Menú fixed en Teleport: todas las medidas pertenecen al viewport, nunca al documento. */
export function useMenuContextual() {
  const menuAbierto = ref<string | null>(null)
  const menuRef = ref<HTMLElement | null>(null)
  const menuStyle = ref<CSSProperties>({ visibility: 'hidden' })
  let trigger: HTMLElement | null = null
  let apertura = 0
  let viewport: VisualViewport | null = null

  function retirarListeners(): void {
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('keydown', handleKeyDown)
    viewport?.removeEventListener('scroll', handleViewportChange)
    viewport?.removeEventListener('resize', handleViewportChange)
    viewport = null
  }

  function cerrar(restaurarFoco: boolean): void {
    apertura++ // Invalida aperturas pendientes de nextTick, incluso si se reabre el mismo id.
    retirarListeners()
    menuAbierto.value = null
    if (restaurarFoco && trigger?.isConnected) trigger.focus({ preventScroll: true })
    trigger = null
  }

  function cerrarMenu(): void { cerrar(true) }
  function handleViewportChange(): void { cerrar(false) }

  function handleScroll(event: Event): void {
    // El scroll de la lista de acciones no debe cerrar el propio menú.
    if (event.target instanceof Node && menuRef.value?.contains(event.target)) return
    cerrar(false)
  }

  function acciones(): HTMLButtonElement[] {
    return Array.from(menuRef.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cerrarMenu()
      return
    }
    if (event.key === 'Tab') {
      // Devuelve el foco al disparador y permite continuar la tabulación normal de la tabla.
      cerrarMenu()
      return
    }
    if (!menuRef.value?.contains(document.activeElement)) return
    const items = acciones()
    if (!items.length) return
    const index = items.findIndex(item => item === document.activeElement)
    let next: number
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      default: return
    }
    event.preventDefault()
    items[next]?.focus() // Permite desplazar internamente una acción fuera del área visible.
  }

  async function abrirMenu(event: MouseEvent, id: string): Promise<void> {
    event.stopPropagation()
    if (menuAbierto.value === id) { cerrarMenu(); return }
    const button = event.currentTarget
    if (!(button instanceof HTMLElement)) return
    cerrar(false)
    trigger = button
    const version = apertura
    viewport = window.visualViewport
    const width = viewport?.width ?? (document.documentElement.clientWidth || window.innerWidth)
    const height = viewport?.height ?? window.innerHeight
    const x = viewport?.offsetLeft ?? 0
    const y = viewport?.offsetTop ?? 0
    const anchoDisponible = Math.max(0, width - MARGEN * 2)

    // Primero limita el ancho para medir también el alto real de los textos que se ajusten.
    menuStyle.value = {
      top: `${y + MARGEN}px`, left: `${x + MARGEN}px`,
      maxWidth: `${anchoDisponible}px`, visibility: 'hidden',
    }
    menuAbierto.value = id
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleViewportChange, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    viewport?.addEventListener('scroll', handleViewportChange, { passive: true })
    viewport?.addEventListener('resize', handleViewportChange, { passive: true })

    await nextTick()
    if (apertura !== version) return
    const menu = menuRef.value
    if (!menu || !button.isConnected) { cerrar(false); return }
    const rect = button.getBoundingClientRect()
    const medida = menu.getBoundingClientRect()
    const abajo = Math.max(0, y + height - MARGEN - rect.bottom - SEPARACION)
    const arriba = Math.max(0, rect.top - SEPARACION - y - MARGEN)
    const invertir = medida.height > abajo && arriba > abajo
    const maxHeight = Math.min(invertir ? arriba : abajo, Math.max(0, height - MARGEN * 2))
    const alto = Math.min(medida.height, maxHeight)
    const ancho = Math.min(medida.width, anchoDisponible)
    const left = Math.max(x + MARGEN, Math.min(rect.right - ancho, x + width - MARGEN - ancho))
    const top = Math.max(y + MARGEN, Math.min(
      invertir ? rect.top - SEPARACION - alto : rect.bottom + SEPARACION,
      y + height - MARGEN - alto,
    ))
    menuStyle.value = {
      top: `${top}px`, left: `${left}px`, maxWidth: `${anchoDisponible}px`,
      maxHeight: `${maxHeight}px`, visibility: 'visible',
    }
    await nextTick()
    if (apertura === version) acciones()[0]?.focus({ preventScroll: true })
  }

  onUnmounted(() => cerrar(false))
  onDeactivated(() => cerrar(false))
  return { menuAbierto, menuRef, menuStyle, abrirMenu, cerrarMenu }
}
