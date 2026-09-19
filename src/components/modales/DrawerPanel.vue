<!--
  DrawerPanel — slide-over lateral genérico sobre <dialog> nativo, para paneles de detalle o
  edición (no confundir con los modales centrados de este mismo directorio).

  Mobile-first: pantalla completa (edge-to-edge, alto real vía 100dvh) en < sm; anclado a un
  lado con ancho acotado en >= sm.

  Contrato:
    props:
      - open (boolean, requerido): controla apertura/cierre (showModal()/close() internos).
      - titleId (string, requerido): id del heading que el consumidor renderiza dentro del
        slot "header" (debe coincidir con el id real del <h2>). No se llama "ariaLabelledby"
        a propósito: Vue nunca camel-iza atributos de plantilla con prefijo aria-/data- al
        resolver props (son pass-through por diseño), así que `:aria-labelledby="..."` jamás
        llegaría a esta prop por más que el nombre coincida en camelCase.
      - placement ('left' | 'right', default 'right').
      - maxWidthClass (string, default 'sm:max-w-xl'): clases Tailwind de ancho máximo en
        desktop — cada consumidor define el suyo (una tabla ancha necesita más que un form).
    emits:
      - close: Esc, click en el backdrop, o el botón ✕ que ya incluye este componente.
    slots:
      - header: título/subtítulo, junto al botón ✕ (debe incluir el <h2 :id="titleId">).
      - top (opcional): contenido fijo, no-scrolleable, entre el header y el cuerpo — toolbars
        de búsqueda/filtro, banners de advertencia.
      - default: cuerpo scrolleable.
      - footer (opcional): fijo en la base, ya incluye el padding de safe-area de iOS.

  Por qué <dialog> nativo: Esc y el atrapado de foco los da el navegador vía showModal() — no
  hace falta un focus-trap manual. El primer elemento con `autofocus` recibe el foco inicial;
  este componente ya lo pone en el botón ✕ por defecto.

  Gotcha de posicionamiento (no lo rompas): el user-agent stylesheet de <dialog> trae
  `left: 0; right: 0; margin: auto;` por defecto (es como centra un <dialog> sin position
  explícito). Si solo se fija `right-0` sin `left-auto`, el elemento queda con left, right y
  width los tres no-auto a la vez → CSS lo resuelve como sobre-restringido y en LTR se ignora
  `right`, anclando todo a la izquierda pese al `right-0`. Por eso `m-0` y el `left-auto`
  explícito de más abajo no son decorativos.
-->
<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(
  defineProps<{
    open: boolean
    titleId: string
    placement?: 'left' | 'right'
    maxWidthClass?: string
  }>(),
  {
    placement: 'right',
    maxWidthClass: 'sm:max-w-xl'
  }
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)

function cerrar(): void {
  dialogRef.value?.close()
  emit('close')
}

function onBackdropClick(evento: MouseEvent): void {
  if (evento.target === dialogRef.value) cerrar()
}

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      await nextTick()
      dialogRef.value?.showModal()
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      :enter-from-class="placement === 'right' ? 'translate-x-full' : '-translate-x-full'"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-200"
      :leave-from-class="'translate-x-0'"
      :leave-to-class="placement === 'right' ? 'translate-x-full' : '-translate-x-full'"
    >
      <dialog
        v-if="open"
        ref="dialogRef"
        :aria-labelledby="titleId"
        class="drawer-panel-dialog fixed inset-0 m-0 h-[100dvh] w-full border-0 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0 shadow-2xl flex flex-col focus:outline-none"
        :class="[
          maxWidthClass,
          placement === 'right' ? 'sm:left-auto sm:right-0 sm:border-l' : 'sm:right-auto sm:left-0 sm:border-r'
        ]"
        @cancel.prevent="cerrar"
        @click="onBackdropClick"
      >
        <header class="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex-shrink-0">
          <div class="min-w-0 flex-1">
            <slot name="header" />
          </div>
          <button
            type="button"
            autofocus
            aria-label="Cerrar panel"
            class="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div v-if="$slots.top" class="flex-shrink-0">
          <slot name="top" />
        </div>

        <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/95 px-5 pt-3.5 pb-[max(env(safe-area-inset-bottom),0.875rem)] flex-shrink-0"
        >
          <slot name="footer" />
        </footer>
      </dialog>
    </Transition>
  </Teleport>
</template>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear (pseudo-elemento fuera del arbol
   normal), de ahi el nombre de clase especifico y el estilo sin "scoped". Compartido por
   todos los consumidores de DrawerPanel. */
.drawer-panel-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.6);
}
</style>
