<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
        @click.self="closePanel"
      >
        <div
          class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-w-2xl"
        >
          <div class="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-5 py-4 text-white">
            <div class="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.06%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
            <div class="relative flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M4 8a2 2 0 0 1 2-2h2l1.2-2h5.6L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                    <circle cx="12" cy="13" r="3.2" />
                  </svg>
                </span>
                <div>
                  <h3 class="text-lg font-bold tracking-tight">Escanear código</h3>
                  <p class="text-xs text-emerald-100/90">Centra el código en el marco</p>
                </div>
              </div>
              <button
                type="button"
                class="rounded-xl bg-white/15 p-2 transition hover:bg-white/25"
                aria-label="Cerrar"
                @click="closePanel"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-4 p-5">
            <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ helperMessage }}</p>
            <p
              v-if="isDev && activeEngine"
              class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              Motor: {{ activeEngine === 'native' ? 'Nativo (BarcodeDetector)' : 'ZXing' }}
            </p>

            <div class="flex flex-wrap items-center gap-2">
              <select
                v-if="cameras.length > 1"
                v-model="selectedCamera"
                :disabled="disabled || !isSupported"
                class="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option v-for="camera in cameras" :key="camera.id" :value="camera.id">
                  {{ camera.label }}
                </option>
              </select>
            </div>

            <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner dark:border-slate-700 aspect-video">
              <video ref="videoRef" class="h-full w-full object-cover" autoplay muted playsinline />

              <div v-if="isRunning" class="pointer-events-none absolute inset-0">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="relative h-[55%] w-[70%] rounded-lg border-2 border-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.35)]">
                    <span class="absolute -left-1 -top-1 h-6 w-6 rounded-tl border-l-[3px] border-t-[3px] border-emerald-300" />
                    <span class="absolute -right-1 -top-1 h-6 w-6 rounded-tr border-r-[3px] border-t-[3px] border-emerald-300" />
                    <span class="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl border-b-[3px] border-l-[3px] border-emerald-300" />
                    <span class="absolute -bottom-1 -right-1 h-6 w-6 rounded-br border-b-[3px] border-r-[3px] border-emerald-300" />
                    <span class="scan-line absolute left-0 right-0 h-[2px] bg-emerald-300/95" />
                  </div>
                </div>
                <p class="absolute bottom-4 left-0 right-0 text-center text-xs font-medium text-emerald-100 drop-shadow-md">
                  Alinea el código dentro del marco
                </p>
              </div>
            </div>

            <p v-if="!isSupported" class="text-xs text-amber-600 dark:text-amber-400">
              Este navegador no permite usar la cámara para escanear. Usa el ingreso manual.
            </p>
            <p v-else-if="errorMessage" class="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {{ errorMessage }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBarcodeScanner } from '../composables/useBarcodeScanner'

const props = defineProps<{
  visible: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'detected', code: string): void
  (e: 'close'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const scanner = useBarcodeScanner(1600)
const isDev = import.meta.env.DEV
const selectedCamera = ref<string>('')
const {
  isSupported,
  isRunning,
  error: errorMessage,
  activeEngine,
  cameras
} = scanner

function onDetected(code: string) {
  if (!code) return
  playBeep()
  emit('detected', code)
}

async function startScanner() {
  if (!videoRef.value) return
  await scanner.start(videoRef.value, onDetected, selectedCamera.value || undefined)
}

function closePanel() {
  scanner.stop()
  emit('close')
}

function playBeep() {
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gainNode.gain.value = 0.05
  oscillator.start()
  oscillator.stop(context.currentTime + 0.08)
}

const helperMessage = computed(() => {
  if (errorMessage.value) return 'No pudimos iniciar la cámara. Revisa permisos del navegador.'
  if (!isSupported) return 'Tu navegador no expone cámara para esta función.'
  if (isRunning.value) return 'Cámara lista. Mantén el código estable hasta que se detecte.'
  return 'Iniciando cámara…'
})

onMounted(async () => {
  const devices = await scanner.getCameras()
  if (devices.length > 0) selectedCamera.value = devices[0].id
})

watch(selectedCamera, async (cameraId, previous) => {
  if (!cameraId || cameraId === previous || !videoRef.value) return
  await scanner.switchCamera(videoRef.value, onDetected, cameraId)
})

onBeforeUnmount(() => {
  scanner.stop()
})

watch(() => props.disabled, (isDisabled) => {
  if (isDisabled) {
    scanner.stop()
    return
  }
  if (props.visible) {
    void startScannerOnOpen()
  }
})

watch(() => props.visible, (isVisible) => {
  if (!isVisible) {
    scanner.stop()
    return
  }

  void startScannerOnOpen()
})

async function startScannerOnOpen() {
  if (props.disabled || !isSupported || isRunning.value) return
  await nextTick()
  if (!videoRef.value) return
  await startScanner()
}
</script>

<style scoped>
.scan-line {
  animation: scanY 1.8s linear infinite;
}

@keyframes scanY {
  0% { top: 6%; opacity: 0.25; }
  50% { opacity: 1; }
  100% { top: 94%; opacity: 0.25; }
}
</style>
