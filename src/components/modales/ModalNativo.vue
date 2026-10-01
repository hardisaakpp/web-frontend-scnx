<script setup lang="ts">
/**
 * Contenedor de modal sobre `<dialog>` nativo (showModal/close).
 *
 * El navegador aporta el bloqueo del resto de la página, el atrapado de foco y el cierre con Esc; este componente
 * solo traduce eso a `open` / `@cerrar` y cierra al hacer clic en el fondo oscuro. El contenido (cabecera, cuerpo,
 * pie y su <form>) lo pone quien lo usa en el slot. Para enfocar un campo al abrir, ponerle `autofocus`.
 *
 * - `bloqueado`: mientras sea true no se cierra (Esc ni clic fuera): útil mientras se guarda.
 * - `anchoMax`: clase Tailwind de ancho máximo (escrita completa en el consumidor para que Tailwind la detecte).
 */
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  /** id del título dentro del slot, para aria-labelledby. */
  labelledby: string
  anchoMax?: string
  bloqueado?: boolean
}>(), { anchoMax: 'max-w-xl', bloqueado: false })

const emit = defineEmits<{
  cerrar: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(() => props.open, async abierto => {
  await nextTick() // el <dialog> y su contenido ya están montados
  const dialog = dialogRef.value
  if (!dialog) return
  if (abierto && !dialog.open) dialog.showModal()
  else if (!abierto && dialog.open) dialog.close()
}, { immediate: true })

function solicitarCierre() {
  if (!props.bloqueado) emit('cerrar')
}

// Clic en el fondo oscuro (el propio <dialog>, no su contenido) = cerrar.
function alHacerClic(evento: MouseEvent) {
  if (evento.target === dialogRef.value) solicitarCierre()
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="modal-nativo m-auto w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      :class="anchoMax"
      :aria-labelledby="labelledby"
      @cancel.prevent="solicitarCierre"
      @click="alHacerClic"
    >
      <slot />
    </dialog>
  </Teleport>
</template>

<style>
/* ::backdrop no es alcanzable desde un <style scoped>; la clase es específica de este componente. */
.modal-nativo::backdrop {
  background: rgb(0 0 0 / 0.55);
  backdrop-filter: blur(2px);
}
</style>
