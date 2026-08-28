import { describe, it, expect } from 'vitest'
import { tieneSolicitudesTransferenciaSinConfirmar } from '@/modules/mba3-consultas/composables/ejecutarProcesoCompletoSap'

describe('tieneSolicitudesTransferenciaSinConfirmar', () => {
  it('false cuando no hay resultado ni envios', () => {
    expect(tieneSolicitudesTransferenciaSinConfirmar({ status: 'completed' })).toBe(false)
  })

  it('false cuando todas las ITR están confirmadas (forma aplanada, GET resultado)', () => {
    const data = {
      status: 'success',
      envio_sap: {
        oc_id: 'oc-1',
        solicitudes_transferencia: { transferencias_pendientes_confirmacion: 0, transferencias_creadas: 23 },
      },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(false)
  })

  it('true cuando quedan pendientes (forma aplanada, GET resultado)', () => {
    const data = {
      status: 'success',
      envio_sap: {
        oc_id: 'oc-1',
        solicitudes_transferencia: { transferencias_pendientes_confirmacion: 8, transferencias_creadas: 15 },
      },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(true)
  })

  it('true cuando quedan pendientes (forma anidada bajo resultado, payload SSE)', () => {
    const data = {
      status: 'completed',
      resultado: {
        status: 'success',
        envio_sap: {
          oc_id: 'oc-1',
          solicitudes_transferencia: { transferencias_pendientes_confirmacion: 8 },
        },
      },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(true)
  })

  it('detecta pendientes en cualquiera de las 2 ODC de un pedido mixto (envios_sap)', () => {
    const data = {
      status: 'completed',
      resultado: {
        envios_sap: [
          { oc_id: 'oc-RL', solicitudes_transferencia: { transferencias_pendientes_confirmacion: 0 } },
          { oc_id: 'oc-RG', solicitudes_transferencia: { transferencias_pendientes_confirmacion: 3 } },
        ],
      },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(true)
  })

  it('false cuando ambas ODC de un pedido mixto ya están confirmadas', () => {
    const data = {
      status: 'completed',
      resultado: {
        envios_sap: [
          { oc_id: 'oc-RL', solicitudes_transferencia: { transferencias_pendientes_confirmacion: 0 } },
          { oc_id: 'oc-RG', solicitudes_transferencia: { transferencias_pendientes_confirmacion: 0 } },
        ],
      },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(false)
  })

  it('false cuando solicitudes_transferencia es null (OC sin ITR aplicable)', () => {
    const data = {
      status: 'success',
      envio_sap: { oc_id: 'oc-1', solicitudes_transferencia: null },
    }
    expect(tieneSolicitudesTransferenciaSinConfirmar(data)).toBe(false)
  })
})
