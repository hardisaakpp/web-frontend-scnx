/**
 * Valores de `cargo` permitidos por el backend (ortografía y mayúsculas exactas).
 */
export const STORE_EMPLOYEE_CARGOS = [
  'Administrador de tienda',
  'Jefe de tienda',
  'Asesor de ventas'
] as const

export type StoreEmployeeCargo = (typeof STORE_EMPLOYEE_CARGOS)[number]

const CARGO_SET = new Set<string>(STORE_EMPLOYEE_CARGOS)

export function isValidCargo(value: string): value is StoreEmployeeCargo {
  return CARGO_SET.has(value)
}
