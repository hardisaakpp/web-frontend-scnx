import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from '@/modules/recepcion-mercaderia/views/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

function mockAuth(overrides: { isAdmin?: boolean; permissions?: string[] }) {
  const permissions = overrides.permissions ?? []
  vi.mocked(useAuthStore).mockReturnValue({
    isAdmin: overrides.isAdmin ?? false,
    hasPermission: (permission: string) => permissions.includes(permission),
  } as unknown as ReturnType<typeof useAuthStore>)
}

describe('DashboardView (recepcion-mercaderia)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows only the cards the user has permission for', () => {
    mockAuth({ permissions: ['recepcion.history.view'] })

    const wrapper = mount(DashboardView)

    expect(wrapper.text()).not.toContain('Transferencias Pendientes')
    expect(wrapper.text()).not.toContain('En Curso / Picking')
    expect(wrapper.text()).toContain('Historial')
  })

  it('shows the single merged Historial card for a user with only recepcion.history.viewall', () => {
    mockAuth({ permissions: ['recepcion.history.viewall'] })

    const wrapper = mount(DashboardView)

    expect(wrapper.text()).toContain('Historial')
    expect(wrapper.findAll('router-link').map((link) => link.attributes('to'))).toEqual(['/recepcion-mercaderia/historial'])
  })

  it('shows every card for an Admin regardless of individual permissions', () => {
    mockAuth({ isAdmin: true, permissions: [] })

    const wrapper = mount(DashboardView)

    expect(wrapper.text()).toContain('Transferencias Pendientes')
    expect(wrapper.text()).toContain('En Curso / Picking')
    expect(wrapper.text()).toContain('Historial')
  })

  it('links each card to its corresponding route, with a single Historial link (no separate admin route)', () => {
    mockAuth({ isAdmin: true, permissions: [] })

    const wrapper = mount(DashboardView)
    const targets = wrapper.findAll('router-link').map((link) => link.attributes('to'))

    expect(targets).toContain('/recepcion-mercaderia/pendientes')
    expect(targets).toContain('/recepcion-mercaderia/en-curso')
    expect(targets).toContain('/recepcion-mercaderia/historial')
    expect(targets).not.toContain('/recepcion-mercaderia/historial/admin')
    expect(targets).toHaveLength(3)
  })
})
