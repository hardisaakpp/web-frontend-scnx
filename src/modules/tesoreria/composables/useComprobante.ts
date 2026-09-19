import { onScopeDispose, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'

/** Descarta respuestas de un comprobante cerrado o reemplazado por otra selección. */
export function useComprobante() {
  const toast = useToast()
  const modalVisorAbierto = ref(false)
  const urlComprobante = ref<string | null>(null)
  const nombreComprobante = ref<string | null>(null)
  const cargandoComprobante = ref(false)
  let solicitud = 0

  function invalidar(): void {
    solicitud++
    urlComprobante.value = null
    nombreComprobante.value = null
    cargandoComprobante.value = false
  }

  async function abrirComprobante(id: number): Promise<void> {
    invalidar()
    const actual = solicitud
    modalVisorAbierto.value = true
    cargandoComprobante.value = true
    try {
      const resultado = await tesoreriaService.obtenerUrlComprobante(id)
      if (actual !== solicitud) return
      urlComprobante.value = resultado.url
      nombreComprobante.value = resultado.nombreArchivo
    } catch (err) {
      if (actual === solicitud) toast.error('No se pudo cargar el comprobante', extraerMensajeError(err))
    } finally {
      if (actual === solicitud) cargandoComprobante.value = false
    }
  }

  watch(modalVisorAbierto, open => { if (!open) invalidar() }, { flush: 'sync' })
  onScopeDispose(invalidar)

  return { modalVisorAbierto, urlComprobante, nombreComprobante, cargandoComprobante, abrirComprobante }
}
