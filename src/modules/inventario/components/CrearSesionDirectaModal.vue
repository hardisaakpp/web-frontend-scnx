<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="cerrar">
      <TransitionChild enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center p-4 pt-16">
          <TransitionChild enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-xl">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white">
                  Nueva Toma Física
                </DialogTitle>
                <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="cerrar">
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>

              <form @submit.prevent="guardar" class="px-6 py-5 space-y-5">
                <div v-if="error" class="alert-error">{{ error }}</div>

                <!-- Fechas -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">Fecha inicio</label>
                    <div class="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-300">
                      <CalendarIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span class="truncate">{{ fechaHoy }}</span>
                      <span class="ml-auto text-xs text-gray-400 flex-shrink-0">(automática)</span>
                    </div>
                  </div>
                  <div>
                    <label class="label">Fecha cierre estimada</label>
                    <input v-model="form.plannedCloseDate" type="date" class="input" />
                  </div>
                </div>

                <!-- Descripción -->
                <div>
                  <label class="label">Descripción (opcional)</label>
                  <input v-model="form.description" type="text" class="input" maxlength="250" placeholder="Ej: Toma express almacén central" />
                </div>

                <!-- Bodegas -->
                <div>
                  <label class="label">
                    Bodegas *
                    <span class="font-normal text-gray-400">({{ bodegasSeleccionadas.length }} seleccionadas)</span>
                  </label>
                  <div class="mt-1">
                    <div v-if="loadingBodegas" class="text-xs text-gray-400 py-2">Cargando bodegas...</div>
                    <BodegaMultiselect
                      v-else
                      :options="bodegas"
                      v-model="bodegasSeleccionadas"
                    />
                  </div>
                </div>

                <!-- Filtros de artículos -->
                <div>
                  <p class="label mb-2">Filtros de artículos <span class="font-normal text-gray-400">(opcionales)</span></p>
                  <div v-if="loadingCatalogo" class="text-xs text-gray-400">Cargando opciones de filtro...</div>
                  <div v-else class="space-y-3">
                    <FiltroMultiselect
                      v-for="f in FILTROS_DISPONIBLES"
                      :key="f.key"
                      :label="f.label"
                      :options="catalogo[f.catalogKey] ?? []"
                      v-model="filtrosSeleccionados[f.key]"
                    />
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button type="button" class="btn-secondary" @click="cerrar">Cancelar</button>
                  <button type="submit" class="btn-primary" :disabled="guardando || bodegasSeleccionadas.length === 0">
                    {{ guardando ? 'Generando...' : `Generar ${bodegasSeleccionadas.length > 1 ? bodegasSeleccionadas.length + ' tomas' : 'toma'}` }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { XMarkIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import { inventarioPlanesService } from '../services/inventarioPlanesApi'
import type { PlanFilterCatalogDto, WarehouseSimpleDto } from '../types'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  close: []
  creada: [sessionId: string]
}>()

const FILTROS_DISPONIBLES = [
  { key: 'uNv1' as const, label: 'Nivel 1 (u_nv1)', catalogKey: 'uNv1Values' as const },
  { key: 'uNv2' as const, label: 'Nivel 2 (u_nv2)', catalogKey: 'uNv2Values' as const },
  { key: 'uNv3' as const, label: 'Nivel 3 (u_nv3)', catalogKey: 'uNv3Values' as const },
  { key: 'uGen' as const, label: 'Género (u_gen)', catalogKey: 'uGenValues' as const },
  { key: 'material' as const, label: 'Material', catalogKey: 'materialValues' as const },
  { key: 'pack' as const, label: 'Pack', catalogKey: 'packValues' as const },
  { key: 'coleccion' as const, label: 'Colección', catalogKey: 'coleccionValues' as const },
]

type FiltroKey = 'uNv1' | 'uNv2' | 'uNv3' | 'uGen' | 'material' | 'pack' | 'coleccion'

const form = ref({ plannedCloseDate: '', description: '' })
const bodegasSeleccionadas = ref<string[]>([])
const filtrosSeleccionados = ref<Record<FiltroKey, string[]>>({
  uNv1: [], uNv2: [], uNv3: [], uGen: [], material: [], pack: [], coleccion: []
})
const bodegas = ref<WarehouseSimpleDto[]>([])
const catalogo = ref<PlanFilterCatalogDto>({
  uNv1Values: [], uNv2Values: [], uNv3Values: [],
  uGenValues: [], materialValues: [], packValues: [], coleccionValues: []
})
const loadingBodegas = ref(false)
const loadingCatalogo = ref(false)
const guardando = ref(false)
const error = ref<string | null>(null)

const fechaHoy = computed(() => new Date().toLocaleDateString('es', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
}))

watch(() => props.isOpen, async (open) => {
  if (!open) return
  error.value = null
  resetForm()
  if (bodegas.value.length === 0) {
    loadingBodegas.value = true
    try { bodegas.value = await inventarioSesionesService.getWarehouses() }
    catch { /* silent */ }
    finally { loadingBodegas.value = false }
  }
  if (catalogo.value.uNv1Values.length === 0) {
    loadingCatalogo.value = true
    try { catalogo.value = await inventarioPlanesService.getFilterCatalog() }
    catch { /* silent */ }
    finally { loadingCatalogo.value = false }
  }
})

function resetForm() {
  form.value = { plannedCloseDate: '', description: '' }
  bodegasSeleccionadas.value = []
  filtrosSeleccionados.value = { uNv1: [], uNv2: [], uNv3: [], uGen: [], material: [], pack: [], coleccion: [] }
}

function cerrar() {
  emit('close')
}

async function guardar() {
  if (bodegasSeleccionadas.value.length === 0) return
  guardando.value = true
  error.value = null

  const errores: string[] = []
  let lastSessionId: string | null = null
  const fs = filtrosSeleccionados.value

  for (const warehouseCode of bodegasSeleccionadas.value) {
    try {
      const result = await inventarioSesionesService.createSesion(
        warehouseCode,
        form.value.description || null,
        form.value.plannedCloseDate || null,
        {
          uNv1Values: fs.uNv1.length ? fs.uNv1 : undefined,
          uNv2Values: fs.uNv2.length ? fs.uNv2 : undefined,
          uNv3Values: fs.uNv3.length ? fs.uNv3 : undefined,
          uGenValues: fs.uGen.length ? fs.uGen : undefined,
          materialValues: fs.material.length ? fs.material : undefined,
          packValues: fs.pack.length ? fs.pack : undefined,
          coleccionValues: fs.coleccion.length ? fs.coleccion : undefined,
        }
      )
      lastSessionId = result.sessionId
    } catch (e: any) {
      errores.push(`${warehouseCode}: ${e.message ?? 'error'}`)
    }
  }

  guardando.value = false

  if (errores.length > 0) {
    error.value = `Errores: ${errores.join('; ')}`
  }
  if (lastSessionId) {
    emit('creada', lastSessionId)
  }
}

// Combobox multiselect para bodegas
const BodegaMultiselect = defineComponent({
  name: 'BodegaMultiselect',
  props: {
    options: { type: Array as () => WarehouseSimpleDto[], default: () => [] },
    modelValue: { type: Array as () => string[], default: () => [] }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const search = ref('')
    const dropOpen = ref(false)
    const filtered = computed(() => {
      const q = search.value.toLowerCase().trim()
      return q
        ? props.options.filter(b => b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q))
        : props.options
    })
    function toggle(code: string) {
      const current = [...props.modelValue]
      const idx = current.indexOf(code)
      if (idx >= 0) current.splice(idx, 1)
      else current.push(code)
      emit('update:modelValue', current)
    }
    function getLabel(code: string) {
      const b = props.options.find(o => o.code === code)
      return b ? `${b.code} · ${b.name}` : code
    }

    return () => h('div', { class: 'space-y-1' }, [
      props.modelValue.length > 0
        ? h('div', { class: 'flex flex-wrap gap-1 mb-2' },
            props.modelValue.map(code =>
              h('span', {
                key: code,
                class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 cursor-pointer select-none',
                onClick: () => toggle(code)
              }, [getLabel(code), h('span', { class: 'font-bold text-xs ml-0.5' }, '×')])
            )
          )
        : null,
      h('div', { class: 'relative' }, [
        h('input', {
          type: 'text',
          value: search.value,
          placeholder: 'Buscar bodega...',
          class: 'input-sm',
          onInput: (e: Event) => { search.value = (e.target as HTMLInputElement).value; dropOpen.value = true },
          onFocus: () => { dropOpen.value = true },
          onBlur: () => { setTimeout(() => { dropOpen.value = false }, 150) }
        }),
        dropOpen.value
          ? h('div', {
              class: 'absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg',
              onMousedown: (e: Event) => e.preventDefault()
            },
            filtered.value.length > 0
              ? filtered.value.map(b =>
                  h('div', {
                    key: b.code,
                    class: [
                      'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer',
                      props.modelValue.includes(b.code)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    ],
                    onClick: () => { toggle(b.code); search.value = '' }
                  }, [
                    h('span', {
                      class: [
                        'w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center text-xs font-bold',
                        props.modelValue.includes(b.code)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-gray-500'
                      ]
                    }, props.modelValue.includes(b.code) ? '✓' : ''),
                    h('span', { class: 'font-mono text-xs text-gray-500 dark:text-gray-400 flex-shrink-0' }, b.code),
                    h('span', { class: 'truncate' }, b.name)
                  ])
                )
              : [h('div', { class: 'px-3 py-2 text-xs text-gray-400' }, 'Sin resultados.')]
          )
          : null
      ])
    ])
  }
})

// Combobox multiselect para filtros de artículos
const FiltroMultiselect = defineComponent({
  name: 'FiltroMultiselect',
  props: {
    label: String,
    options: { type: Array as () => string[], default: () => [] },
    modelValue: { type: Array as () => string[], default: () => [] }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const search = ref('')
    const dropOpen = ref(false)
    const filtered = computed(() => {
      const q = search.value.toLowerCase()
      return q ? props.options.filter(o => o.toLowerCase().includes(q)) : props.options
    })
    function toggle(val: string) {
      const current = [...props.modelValue]
      const idx = current.indexOf(val)
      if (idx >= 0) current.splice(idx, 1)
      else current.push(val)
      emit('update:modelValue', current)
    }

    return () => {
      if (props.options.length === 0) return null
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'flex items-center justify-between' }, [
          h('label', { class: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, props.label),
          h('span', { class: 'text-xs text-gray-400' }, `${props.modelValue.length} sel.`)
        ]),
        props.modelValue.length > 0
          ? h('div', { class: 'flex flex-wrap gap-1 mb-1' },
              props.modelValue.map(v =>
                h('span', {
                  key: v,
                  class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 cursor-pointer select-none',
                  onClick: () => toggle(v)
                }, [v, h('span', { class: 'font-bold text-xs' }, '×')])
              )
            )
          : null,
        h('div', { class: 'relative' }, [
          h('input', {
            type: 'text',
            value: search.value,
            placeholder: 'Buscar y agregar...',
            class: 'input-sm',
            onInput: (e: Event) => { search.value = (e.target as HTMLInputElement).value; dropOpen.value = true },
            onFocus: () => { dropOpen.value = true },
            onBlur: () => { setTimeout(() => { dropOpen.value = false }, 150) }
          }),
          dropOpen.value && filtered.value.length > 0
            ? h('div', {
                class: 'absolute z-20 mt-1 w-full max-h-36 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg',
                onMousedown: (e: Event) => e.preventDefault()
              },
                filtered.value.slice(0, 50).map(o =>
                  h('div', {
                    key: o,
                    class: [
                      'px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20',
                      props.modelValue.includes(o) ? 'text-blue-600 font-medium bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-800 dark:text-gray-200'
                    ],
                    onClick: () => { toggle(o); search.value = '' }
                  }, o)
                )
              )
            : null
        ])
      ])
    }
  }
})
</script>

<style scoped>
.label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300; }
.input { @apply mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.input-sm { @apply block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
