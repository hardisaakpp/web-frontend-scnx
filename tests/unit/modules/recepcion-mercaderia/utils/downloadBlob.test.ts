import { describe, expect, it, vi } from 'vitest'
import { triggerBlobDownload } from '@/modules/recepcion-mercaderia/utils/downloadBlob'

describe('triggerBlobDownload', () => {
  it('creates an object URL, clicks a temporary anchor with the given filename, then revokes the URL', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => (tag === 'a' ? (mockAnchor as unknown as HTMLElement) : originalCreateElement(tag)))
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n)
    window.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    window.URL.revokeObjectURL = vi.fn()

    const blob = new Blob(['content'])
    triggerBlobDownload(blob, 'archivo-de-prueba.xlsx')

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(mockAnchor.href).toBe('blob:test-url')
    expect(mockAnchor.download).toBe('archivo-de-prueba.xlsx')
    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor)
    expect(mockAnchor.click).toHaveBeenCalledTimes(1)
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
