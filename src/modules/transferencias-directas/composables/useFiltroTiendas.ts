import { ref, computed } from 'vue'
import { useAuthStore, type WarehouseAccessInfo } from '@/stores/auth'
import { useWarehouseAccessType } from '@/modules/inventario/composables/useWarehouseAccessType'
import almacenesService from '../services/almacenesServices'
import type { TiendaDestino } from '../types'

/** Vuelca en `codes` el almacén directo del acceso y los de sus grupos. */
function agregarCodigosDeAcceso(codes: Set<string>, acceso: WarehouseAccessInfo): void {
  if (acceso?.codAlmacen) codes.add(acceso.codAlmacen)
  for (const grupo of acceso?.warehouseGroups ?? []) {
    for (const almacen of grupo?.almacenes ?? []) {
      codes.add(almacen)
    }
  }
}

/**
 * Filtro de Tienda Origen/Destino compartido entre el Historial y la Bandeja
 * de Aprobación: mismo criterio de visibilidad en ambas pantallas.
 *
 * Origen y Destino NO son la misma lista: el back resuelve cada `tipo` con una
 * regla de negocio distinta (Origen = marca propia del usuario; Destino = las
 * marcas que `configuracion_envios` permite recibir desde esa marca). Por eso
 * se piden por separado, igual que en CrearTransferenciasView.vue.
 *
 * - Origen se recorta además a las tiendas del usuario, salvo que tenga el
 *   permiso 'transferenciadirecta.filtro_todastiendas' (o sea Admin, ya
 *   cubierto por el back): el back no modela grupos/supervisor en este
 *   endpoint, solo marca.
 * - Destino no se recorta: el back ya resuelve su alcance.
 */
export function useFiltroTiendas() {
  const authStore = useAuthStore()

  const puedeFiltrarTiendas = computed(() =>
    authStore.hasPermission('transferenciadirecta.filtro_todastiendas')
  )

  const { accesses, isTienda } = useWarehouseAccessType()
  const almacenesOrigen = ref<TiendaDestino[]>([])
  const almacenesDestino = ref<TiendaDestino[]>([])

  const tiendasDelUsuario = computed<Set<string>>(() => {
    const codes = new Set<string>()
    accesses.value.forEach((a) => agregarCodigosDeAcceso(codes, a))
    return codes
  })

  const opcionesOrigen = computed(() =>
    puedeFiltrarTiendas.value
      ? almacenesOrigen.value
      : almacenesOrigen.value.filter((t) => tiendasDelUsuario.value.has(t.whsCode))
  )
  const opcionesDestino = computed(() => almacenesDestino.value)
  const mostrarFiltroOrigen = computed(() => puedeFiltrarTiendas.value || !isTienda.value)

  const cargarAlmacenes = async () => {
    try {
      const [destino, origen] = await Promise.all([
        almacenesService.listar('Destino'),
        almacenesService.listar('Origen'),
      ])
      almacenesDestino.value = destino
      almacenesOrigen.value = origen
    } catch {
      // Silencioso: sin almacenes cargados, los combos quedan vacíos pero
      // el resto de la pantalla (listado, paginación) sigue funcionando.
    }
  }

  return {
    puedeFiltrarTiendas,
    opcionesOrigen,
    opcionesDestino,
    mostrarFiltroOrigen,
    cargarAlmacenes,
  }
}

/** Clases compartidas de los inputs/selects de filtro (mismo estilo en ambas pantallas). */
export const FILTRO_INPUT_CLASS =
  'w-full h-[35px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'

export const FILTRO_MINI_LABEL = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
