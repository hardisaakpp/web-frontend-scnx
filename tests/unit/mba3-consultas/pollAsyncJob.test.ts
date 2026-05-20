import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pollAsyncJob } from '@/modules/mba3-consultas/utils/pollAsyncJob'

describe('pollAsyncJob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve en el primer poll si ya no está processing', async () => {
    const poll = vi.fn().mockResolvedValue({ status: 'success', data: 1 })

    const resultPromise = pollAsyncJob({
      poll,
      pollIntervalMs: 100,
      maxWaitMs: 5000,
      isProcessing: (r) => r.status === 'processing',
    })

    const result = await resultPromise
    expect(result).toEqual({ status: 'success', data: 1 })
    expect(poll).toHaveBeenCalledTimes(1)
  })

  it('hace poll inmediato y luego espera el intervalo', async () => {
    const poll = vi
      .fn()
      .mockResolvedValueOnce({ status: 'processing', progress: 10 })
      .mockResolvedValueOnce({ status: 'success' })

    const resultPromise = pollAsyncJob({
      poll,
      pollIntervalMs: 1000,
      maxWaitMs: 10000,
      isProcessing: (r) => r.status === 'processing',
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(poll).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    const result = await resultPromise
    expect(result).toEqual({ status: 'success' })
    expect(poll).toHaveBeenCalledTimes(2)
  })

  it('lanza getTerminalError cuando el poll devuelve error de negocio', async () => {
    const poll = vi.fn().mockResolvedValue({ status: 'error', message: 'falló SAP' })

    await expect(
      pollAsyncJob({
        poll,
        pollIntervalMs: 50,
        maxWaitMs: 5000,
        isProcessing: (r) => r.status === 'processing',
        getTerminalError: (r) =>
          r.status === 'error' ? new Error(String(r.message)) : null,
      })
    ).rejects.toThrow('falló SAP')
  })

  it('falla si el worker no arranca en workerPickupTimeoutMs', async () => {
    const poll = vi.fn().mockResolvedValue({ status: 'processing', step: 'iniciando', progress: 0 })

    const resultPromise = pollAsyncJob({
      poll,
      pollIntervalMs: 100,
      maxWaitMs: 10000,
      workerPickupTimeoutMs: 500,
      hasWorkerStarted: (r) => (r.progress ?? 0) > 0 || (r.step && r.step !== 'iniciando'),
      isProcessing: (r) => r.status === 'processing',
    })

    const assertPromise = expect(resultPromise).rejects.toThrow(/Celery|segundo plano/i)
    await vi.advanceTimersByTimeAsync(600)
    await assertPromise
  })
})
