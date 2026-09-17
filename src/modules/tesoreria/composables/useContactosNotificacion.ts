import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerErroresCampo, extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import type {
  ActualizarContactoNotificacionPayload,
  ContactoNotificacionDto,
  CrearContactoNotificacionPayload
} from '../types/tesoreria.types'

// Estado a nivel de módulo (mismo patrón que useCuentasFinancieras.ts): la tarjeta resumen de
// ConfiguracionTesoreriaView y el Drawer de gestión comparten esta misma instancia.
const contactos = ref<ContactoNotificacionDto[]>([])
const cargando = ref(false)
const guardando = ref(false)
const enviandoPrueba = ref(false)
const actualizandoIds = ref(new Set<number>())
const erroresCampo = ref<Record<string, string> | null>(null)

const busqueda = ref('')

export function useContactosNotificacion() {
  const toast = useToast()

  const totalContactos = computed(() => contactos.value.length)
  const totalActivos = computed(() => contactos.value.filter(c => c.activo).length)

  /** Regla de resguardo (espejo del backend): siempre debe quedar al menos un contacto activo. */
  const sinCobertura = computed(() => !cargando.value && totalActivos.value === 0)

  const contactosFiltrados = computed<ContactoNotificacionDto[]>(() => {
    const termino = busqueda.value.trim().toLowerCase()
    if (!termino) return contactos.value

    return contactos.value.filter(c =>
      c.nombreCompleto.toLowerCase().includes(termino) ||
      c.email.toLowerCase().includes(termino) ||
      (c.cargo ?? '').toLowerCase().includes(termino)
    )
  })

  async function cargar(): Promise<void> {
    cargando.value = true
    try {
      contactos.value = await tesoreriaService.getContactosNotificacion()
    } catch (err) {
      toast.error('No se pudieron cargar los destinatarios de alertas', extraerMensajeError(err))
    } finally {
      cargando.value = false
    }
  }

  async function crear(payload: CrearContactoNotificacionPayload): Promise<boolean> {
    guardando.value = true
    erroresCampo.value = null
    try {
      const creado = await tesoreriaService.crearContactoNotificacion(payload)
      contactos.value = [...contactos.value, creado]
      toast.success('Destinatario agregado', `${creado.nombreCompleto} recibirá las alertas configuradas.`)
      return true
    } catch (err) {
      toast.error('No se pudo agregar el destinatario', extraerMensajeError(err))
      erroresCampo.value = extraerErroresCampo(err)
      return false
    } finally {
      guardando.value = false
    }
  }

  async function actualizar(id: number, payload: ActualizarContactoNotificacionPayload): Promise<boolean> {
    guardando.value = true
    erroresCampo.value = null
    try {
      const actualizado = await tesoreriaService.actualizarContactoNotificacion(id, payload)
      const idx = contactos.value.findIndex(c => c.id === id)
      if (idx !== -1) contactos.value[idx] = actualizado
      toast.success('Destinatario actualizado', `${actualizado.nombreCompleto} se guardó correctamente.`)
      return true
    } catch (err) {
      toast.error('No se pudo actualizar el destinatario', extraerMensajeError(err))
      erroresCampo.value = extraerErroresCampo(err)
      return false
    } finally {
      guardando.value = false
    }
  }

  async function cambiarEstado(contacto: ContactoNotificacionDto, activo: boolean): Promise<void> {
    if (actualizandoIds.value.has(contacto.id)) return

    actualizandoIds.value.add(contacto.id)
    try {
      const actualizado = await tesoreriaService.cambiarEstadoContacto(contacto.id, { activo })
      const idx = contactos.value.findIndex(c => c.id === contacto.id)
      if (idx !== -1) contactos.value[idx] = actualizado
      toast.success(
        activo ? 'Destinatario activado' : 'Destinatario inactivado',
        `${actualizado.nombreCompleto} ${activo ? 'volverá a recibir' : 'dejó de recibir'} alertas.`
      )
    } catch (err) {
      toast.error('No se pudo cambiar el estado', extraerMensajeError(err))
    } finally {
      actualizandoIds.value.delete(contacto.id)
    }
  }

  async function eliminar(contacto: ContactoNotificacionDto): Promise<void> {
    if (actualizandoIds.value.has(contacto.id)) return

    actualizandoIds.value.add(contacto.id)
    try {
      await tesoreriaService.eliminarContactoNotificacion(contacto.id)
      contactos.value = contactos.value.filter(c => c.id !== contacto.id)
      toast.success('Destinatario eliminado', `${contacto.nombreCompleto} ya no recibirá alertas.`)
    } catch (err) {
      toast.error('No se pudo eliminar el destinatario', extraerMensajeError(err))
    } finally {
      actualizandoIds.value.delete(contacto.id)
    }
  }

  async function enviarPrueba(): Promise<void> {
    enviandoPrueba.value = true
    try {
      const resultado = await tesoreriaService.enviarCorreoPruebaContactos()
      if (resultado.enviados === 0) {
        toast.warning('No se envió ningún correo', 'No hay destinatarios activos configurados.')
        return
      }
      toast.success(
        'Correo de prueba enviado',
        `Se envió a ${resultado.enviados} destinatario(s): ${resultado.destinatarios.join(', ')}.`
      )
    } catch (err) {
      toast.error('No se pudo enviar el correo de prueba', extraerMensajeError(err))
    } finally {
      enviandoPrueba.value = false
    }
  }

  return {
    contactos,
    contactosFiltrados,
    busqueda,
    cargando,
    guardando,
    enviandoPrueba,
    actualizandoIds,
    erroresCampo,
    totalContactos,
    totalActivos,
    sinCobertura,
    cargar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    enviarPrueba
  }
}
