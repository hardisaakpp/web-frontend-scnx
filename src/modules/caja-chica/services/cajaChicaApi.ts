/**
 * Instancia HTTP centralizada para el módulo Caja Chica.
 *
 * Reemplaza las ~8 instancias `axios.create()` inline que estaban
 * dispersas en cada vista .vue del módulo.
 *
 * Uso:
 * ```ts
 * import { cajaChicaApi } from '@/lib/http'
 * const { data } = await cajaChicaApi.get('/Liquidaciones')
 * ```
 *
 * Todas las vistas ahora importan desde `@/lib/http` directamente.
 */
export { cajaChicaApi } from '@/lib/http'
