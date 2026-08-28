import { describe, it, expect } from 'vitest'
import { statusMeta } from '@/modules/recepcion-mercaderia/utils/statusMeta'

describe('statusMeta', () => {
  it.each([
    ['pending', 'Pendiente'],
    ['in-progress', 'En curso'],
    ['confirmed', 'Confirmada'],
    ['error', 'Error'],
  ] as const)('maps "%s" to the label "%s"', (status, label) => {
    expect(statusMeta(status).label).toBe(label)
  })

  it('falls back to a neutral gray badge with the raw status as the label for an unrecognized status', () => {
    // @ts-expect-error — deliberately passing a value outside ReceptionTransferStatus to exercise the fallback.
    const result = statusMeta('unknown-status')

    expect(result.label).toBe('unknown-status')
    expect(result.classes).toContain('bg-gray-100')
  })
})
