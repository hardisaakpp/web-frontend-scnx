import { describe, it, expect } from 'vitest'
import {
  buildMba3ApiUrl,
  plantillaStreamUrl,
  procesoSapStreamUrl,
  cruceProductosStreamUrl,
} from '@/modules/mba3-consultas/utils/asyncJobStreamUrls'

describe('asyncJobStreamUrls', () => {
  it('buildMba3ApiUrl concatena base y ruta API', () => {
    const url = buildMba3ApiUrl('/api/plantillas/stream/abc')
    expect(url).toContain('/api/plantillas/stream/abc')
  })

  it('plantillaStreamUrl codifica process_id', () => {
    expect(plantillaStreamUrl('pedido prueba')).toContain(encodeURIComponent('pedido prueba'))
  })

  it('procesoSapStreamUrl usa stream_url del backend si viene', () => {
    expect(procesoSapStreamUrl('id-1', '/api/pedidos/proceso-sap/stream/id-1')).toContain(
      '/api/pedidos/proceso-sap/stream/id-1'
    )
  })

  it('cruceProductosStreamUrl apunta al stream de cruce', () => {
    expect(cruceProductosStreamUrl('proc-99')).toContain('/cruce-productos/stream/proc-99')
  })
})
