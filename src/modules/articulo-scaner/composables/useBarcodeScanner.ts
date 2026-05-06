import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { ref } from 'vue'

type PermissionState = 'unknown' | 'granted' | 'denied'
type ScannerEngine = 'native' | 'zxing' | null

export interface ScannerCamera {
  id: string
  label: string
}

export function useBarcodeScanner(cooldownMs: number = 1500) {
  const reader = new BrowserMultiFormatReader()
  const NativeBarcodeDetector = (globalThis as { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  const permission = ref<PermissionState>('unknown')
  const isRunning = ref(false)
  const error = ref<string | null>(null)
  const activeEngine = ref<ScannerEngine>(null)
  const cameras = ref<ScannerCamera[]>([])
  const selectedCameraId = ref<string | null>(null)

  let lastDetectedAt = 0
  let controls: IScannerControls | null = null
  let nativeAnimationFrameId: number | null = null
  let nativeMediaStream: MediaStream | null = null
  let nativeDetector: { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } | null = null

  const NATIVE_FORMATS = [
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
    'code_128',
    'code_39',
    'itf',
    'codabar'
  ]

  async function getCameras() {
    if (!isSupported) return []
    const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices()
    cameras.value = videoInputs.map((device) => ({
      id: device.deviceId,
      label: device.label || 'Camara sin nombre'
    }))
    if (!selectedCameraId.value && cameras.value.length > 0) {
      selectedCameraId.value = cameras.value[0].id
    }
    return cameras.value
  }

  async function start(videoElement: HTMLVideoElement, onDetected: (code: string) => void, cameraId?: string) {
    if (!isSupported) {
      error.value = 'Este navegador no soporta acceso a camara.'
      return
    }

    stop()
    const deviceId = cameraId || selectedCameraId.value || undefined

    try {
      isRunning.value = true
      if (NativeBarcodeDetector) {
        activeEngine.value = 'native'
        nativeDetector = new NativeBarcodeDetector({ formats: NATIVE_FORMATS })
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: 'environment' } }
        }
        nativeMediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        videoElement.srcObject = nativeMediaStream
        await videoElement.play()
        permission.value = 'granted'
        nativeScanLoop(videoElement, onDetected)
        return
      }

      activeEngine.value = 'zxing'
      controls = await reader.decodeFromVideoDevice(deviceId, videoElement, (result, err) => {
        if (result) {
          const now = Date.now()
          if (now - lastDetectedAt < cooldownMs) return
          lastDetectedAt = now
          onDetected(result.getText().trim())
          return
        }

        // ZXing invokes this constantly while scanning; besides NotFoundException ("no barcode in frame")
        // other errors are often transient (blur, glare) and must not populate `error`, or the UI shows
        // false "failure" messages while video is running normally.
        if (err && import.meta.env.DEV) {
          console.debug('[useBarcodeScanner] decode tick', err)
        }
      })
      permission.value = 'granted'
    } catch (err: unknown) {
      permission.value = 'denied'
      isRunning.value = false
      error.value = (err as Error)?.message || 'No fue posible iniciar la camara.'
    }
  }

  function stop() {
    if (nativeAnimationFrameId !== null) {
      cancelAnimationFrame(nativeAnimationFrameId)
      nativeAnimationFrameId = null
    }
    nativeDetector = null

    if (nativeMediaStream) {
      nativeMediaStream.getTracks().forEach(track => track.stop())
      nativeMediaStream = null
    }

    controls?.stop()
    controls = null
    activeEngine.value = null
    isRunning.value = false
    error.value = null
  }

  async function switchCamera(videoElement: HTMLVideoElement, onDetected: (code: string) => void, cameraId: string) {
    selectedCameraId.value = cameraId
    if (!isRunning.value) return
    stop()
    await start(videoElement, onDetected, cameraId)
  }

  function nativeScanLoop(videoElement: HTMLVideoElement, onDetected: (code: string) => void) {
    if (!nativeDetector || !isRunning.value) return

    nativeAnimationFrameId = requestAnimationFrame(async () => {
      if (!nativeDetector || !isRunning.value) return

      try {
        const barcodes = await nativeDetector.detect(videoElement)
        const firstCode = barcodes.find(item => item.rawValue?.trim())?.rawValue?.trim()

        if (firstCode) {
          const now = Date.now()
          if (now - lastDetectedAt >= cooldownMs) {
            lastDetectedAt = now
            onDetected(firstCode)
          }
        }
      } catch {
        // Ignore per-frame detector errors and continue scanning.
      }

      nativeScanLoop(videoElement, onDetected)
    })
  }

  return {
    isSupported,
    permission,
    isRunning,
    error,
    activeEngine,
    cameras,
    selectedCameraId,
    getCameras,
    start,
    stop,
    switchCamera
  }
}
