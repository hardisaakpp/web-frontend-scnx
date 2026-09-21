import { describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ error: vi.fn() }) }))

import { ruletaService } from '@/modules/ruleta/services/ruletaApi'

describe('subida de imágenes de premios', () => {
  it('conserva la URL absoluta de MinIO y envía el archivo multipart', async () => {
    const url = 'http://172.30.152.155:8012/imagenes-ruleta/premios/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png'
    post.mockResolvedValueOnce({ data: { url } })
    const image = new File(['test'], 'premio.png', { type: 'image/png' })

    expect(await ruletaService.subirImagenPremio(image)).toBe(url)
    const [path, body] = post.mock.calls[0]!
    expect(path).toBe('/api/premios/imagenes')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('archivo')).toBe(image)
  })
})

