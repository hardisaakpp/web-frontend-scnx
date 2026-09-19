import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'
import '../styles/dialog.css'

/** Sincroniza la Top Layer nativa con Vue; el navegador gestiona Tab, Escape y el foco de retorno. */
export function useDialogModal(
  dialogRef: Ref<HTMLDialogElement | null>,
  isOpen: Ref<boolean>,
  initialFocusRef: Ref<HTMLElement | null>,
  onClose: () => void
): { onBackdropClick: (event: MouseEvent) => void } {
  watch(isOpen, async (open, _previous, onCleanup) => {
    if (!open) {
      dialogRef.value?.close()
      return
    }

    let cancelled = false
    onCleanup(() => { cancelled = true })
    await nextTick()
    const dialog = dialogRef.value
    if (cancelled || !isOpen.value || !dialog?.isConnected) return
    if (!dialog.open) dialog.showModal()
    initialFocusRef.value?.focus()
  }, { immediate: true })

  onBeforeUnmount(() => dialogRef.value?.close())

  function onBackdropClick(event: MouseEvent): void {
    if (event.target === dialogRef.value) onClose()
  }

  return { onBackdropClick }
}
