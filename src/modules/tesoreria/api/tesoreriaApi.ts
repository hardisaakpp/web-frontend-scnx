/**
 * Re-exporta el cliente canónico de tesorería desde services/tesoreriaService
 * para garantizar compatibilidad con importaciones existentes.
 */
export * from '../services/tesoreriaService'
export { tesoreriaService as default } from '../services/tesoreriaService'
