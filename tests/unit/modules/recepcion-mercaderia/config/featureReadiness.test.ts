import { describe, it, expect } from 'vitest'
import { featureReadiness } from '@/modules/recepcion-mercaderia/config/featureReadiness'

describe('featureReadiness', () => {
  it('pendingTransfersReady is true — GET /pending-transfers and materialize confirmed working against real SAP data (RL-QSS2)', () => {
    expect(featureReadiness.pendingTransfersReady).toBe(true)
  })
})
