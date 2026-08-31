import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GestorImagenes from '@/modules/articulo-maestro/components/GestorImagenes.vue'

describe('GestorImagenes', () => {
    it('muestra exactamente tres posiciones y define la principal', () => {
        const wrapper = mount(GestorImagenes, {
            props: { modelValue: [] }
        })

        expect(wrapper.text()).toContain('Imagen principal')
        expect(wrapper.text()).toContain('Secundaria 1')
        expect(wrapper.text()).toContain('Secundaria 2')
        expect(
            wrapper.findAll('button').filter(
                button => button.text() === 'Seleccionar desde SharePoint'
            )
        ).toHaveLength(3)
    })
})
