import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAlmacenesPermitidos } from '@/modules/recepcion-proveedores/composables/useAlmacenesPermitidos'
import type { WarehouseAccessInfo } from '@/stores/auth'

function mockWarehouseAccesses(accesos: WarehouseAccessInfo[]) {
  const localStorageMock = {
    getItem: (key: string) => (key === 'user' ? JSON.stringify({ warehouseAccesses: accesos }) : null),
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  }
  globalThis.localStorage = localStorageMock as unknown as Storage
}

describe('useAlmacenesPermitidos', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('usuario Tienda: solo devuelve su propio almacen', () => {
    mockWarehouseAccesses([{ codAlmacen: 'RL-PSC', accesoAlmacen: 'Tienda', warehouseGroups: [] }])

    const { almacenesPermitidos, esSupervisor } = useAlmacenesPermitidos()

    expect(almacenesPermitidos.value).toEqual(['RL-PSC'])
    expect(esSupervisor.value).toBe(false)
  })

  it('usuario Supervisor: incluye almacenes y bodegaCentral de su grupo', () => {
    mockWarehouseAccesses([
      {
        codAlmacen: 'RL-MAN',
        accesoAlmacen: 'Supervisor',
        warehouseGroups: [
          { id: 'g1', name: 'Roland Sierra Norte', almacenes: ['RL-QSN', 'RL-PSC', 'RL-CON'], bodegaCentral: 'RL-CD' },
        ],
      },
    ])

    const { almacenesPermitidos, esSupervisor } = useAlmacenesPermitidos()

    expect(new Set(almacenesPermitidos.value)).toEqual(
      new Set(['RL-MAN', 'RL-QSN', 'RL-PSC', 'RL-CON', 'RL-CD']),
    )
    expect(esSupervisor.value).toBe(true)
  })

  it('Supervisor con varios grupos: une los almacenes y bodegaCentral de todos', () => {
    mockWarehouseAccesses([
      {
        codAlmacen: 'LP-MAN',
        accesoAlmacen: 'Supervisor',
        warehouseGroups: [
          { id: 'g1', name: 'Roland Sierra Norte', almacenes: ['RL-QSN'], bodegaCentral: 'RL-CD' },
          { id: 'g2', name: 'BIMBA Y LOLA', almacenes: ['BYL-QSN', 'BYL-SCA'], bodegaCentral: 'BYL-CD' },
        ],
      },
    ])

    const { almacenesPermitidos } = useAlmacenesPermitidos()

    expect(new Set(almacenesPermitidos.value)).toEqual(
      new Set(['LP-MAN', 'RL-QSN', 'RL-CD', 'BYL-QSN', 'BYL-SCA', 'BYL-CD']),
    )
  })

  it('Tienda con grupo poblado por inconsistencia de datos: ignora el grupo', () => {
    mockWarehouseAccesses([
      {
        codAlmacen: 'RL-PSC',
        accesoAlmacen: 'Tienda',
        warehouseGroups: [
          { id: 'g1', name: 'Roland Sierra Norte', almacenes: ['RL-QSN', 'RL-CON'], bodegaCentral: 'RL-CD' },
        ],
      },
    ])

    const { almacenesPermitidos } = useAlmacenesPermitidos()

    expect(almacenesPermitidos.value).toEqual(['RL-PSC'])
  })
})
