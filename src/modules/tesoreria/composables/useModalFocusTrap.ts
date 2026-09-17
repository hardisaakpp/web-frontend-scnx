import { nextTick, watch, type Ref } from 'vue'

/**
 * Foco atrapado + cierre con Escape para modales accesibles (WCAG 2.1.2 "No Keyboard Trap" se
 * cumple porque Tab/Shift+Tab siguen moviendo el foco, solo lo mantienen dentro del diálogo).
 * Enfoca `initialFocusRef` en cuanto `isOpen` pasa a true.
 */
export function useModalFocusTrap(dialogRef: Ref<HTMLElement | null>, initialFocusRef: Ref<HTMLElement | null>, isOpen: Ref<boolean>, onClose: () => void) {
  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.value) return

    const focusables = dialogRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, async (open) => {
    if (!open) return
    await nextTick()
    initialFocusRef.value?.focus()
  })

  return { onKeydown }
}
