import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import ModalRegistroDeposito from '@/modules/tesoreria/components/ModalRegistroDeposito.vue'

function crearModal(saldoPendiente = 100.20 - 100) {
  return mount(ModalRegistroDeposito, {
    attachTo: document.body,
    global: { plugins: [createPinia()], stubs: { teleport: true } },
    props: {
      open: true, almacenId: 47, codigoAlmacen: 'T047', fechaCierreCaja: '2026-09-18',
      cuentas: [{ id: 9, codigoCuentaSAP: '1101', codigoFormateado: '1101', nombreCuenta: 'Banco de prueba', activa: true, habilitadaParaTiendas: true }],
      loadingCuentas: false, saldoPendiente, guardando: false
    }
  })
}
type Modal = ReturnType<typeof crearModal>
let modal: Modal | undefined
const crearUrl = vi.fn(() => 'blob:prueba')
const revocarUrl = vi.fn()

async function adjuntar(wrapper: Modal) {
  const input = wrapper.get<HTMLInputElement>('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [new File(['png'], 'recibo.png', { type: 'image/png' })] })
  await input.trigger('change')
}

describe('registro de depósitos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: crearUrl })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revocarUrl })
    HTMLDialogElement.prototype.showModal = function () { this.open = true }
    HTMLDialogElement.prototype.close = function () { this.open = false }
    modal = crearModal()
  })
  afterEach(() => { modal?.unmount(); document.body.replaceChildren() })

  it('acepta exactamente veinte centavos y permite corregir desde el resumen', async () => {
    const wrapper = modal!
    await flushPromises()
    await wrapper.get('#numeroComprobante').setValue('12345678')
    await wrapper.get('#montoDepositado').setValue('0.20')
    await adjuntar(wrapper)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('#comprobanteConfirmacion').exists()).toBe(true)
    await wrapper.get('#comprobanteConfirmacion').setValue('12345678')
    await wrapper.get('form').trigger('submit')
    const corregir = wrapper.findAll('button').find(button => button.text() === 'Corregir Datos')!
    await corregir.trigger('click')
    expect(wrapper.find('#numeroComprobante').exists()).toBe(true)
    expect(wrapper.get<HTMLInputElement>('#numeroComprobante').element.value).toBe('12345678')
  })

  it('libera el Blob al reemplazar, cerrar desde el padre y desmontar', async () => {
    const wrapper = modal!
    await flushPromises()
    await adjuntar(wrapper)
    await adjuntar(wrapper)
    expect(revocarUrl).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ open: false })
    expect(revocarUrl).toHaveBeenCalledTimes(2)
    await wrapper.setProps({ open: true })
    await adjuntar(wrapper)
    wrapper.unmount()
    modal = undefined
    expect(revocarUrl).toHaveBeenCalledTimes(3)
  })

  it('enfoca el comprobante duplicado y bloquea el reenvío hasta editarlo', async () => {
    const wrapper = modal!
    await flushPromises()
    await wrapper.get('#numeroComprobante').setValue('12345678')
    await wrapper.get('#montoDepositado').setValue('0.20')
    await adjuntar(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('#comprobanteConfirmacion').setValue('12345678')
    await wrapper.get('form').trigger('submit')
    await wrapper.setProps({ erroresCampo: { NumeroComprobante: 'El comprobante ya existe' } })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('#numeroComprobante').element)
    expect(wrapper.get('#numeroComprobante').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toContain('ya existe')
    await wrapper.get('#numeroComprobante').setValue('87654321')
    expect(wrapper.get('#numeroComprobante').attributes('aria-invalid')).toBe('false')
  })

  it('no cierra ni vuelve a emitir guardar mientras hay un envío en curso', async () => {
    const wrapper = modal!
    await wrapper.setProps({ guardando: true })
    await wrapper.get('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('control estricto de efectivo: bloquea el avance si el monto supera el saldo pendiente y ya no ofrece autorizar como sobrante', async () => {
    modal?.unmount()
    modal = crearModal(53.39)
    const wrapper = modal
    await flushPromises()

    // La casilla "Autorizar como excedente / sobrante" fue removida por completo.
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('sobrante')

    const botonContinuar = () => wrapper.findAll('button').find(button => button.text().includes('Continuar al Paso 2'))!

    await wrapper.get('#numeroComprobante').setValue('12345678')
    await wrapper.get('#montoDepositado').setValue('60.00')
    await adjuntar(wrapper)
    expect(botonContinuar().attributes('disabled')).toBeDefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('no puede superar el saldo pendiente')

    await wrapper.get('#montoDepositado').setValue('53.39')
    expect(botonContinuar().attributes('disabled')).toBeUndefined()
  })
})
