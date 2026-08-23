import { defineStore } from 'pinia'
import { ref } from 'vue'
import stockApi from '../services/stockApi'
import type { ConsultaStockDto, ItemBusquedaDto } from '../types'

/** "Consulta Stock" (P-012) — sin caché local, el stock cambia todo el tiempo. */
export const useConsultaStockStore = defineStore('cediConsultaStock', () => {
  const query = ref('')
  const resultados = ref<ItemBusquedaDto[]>([])
  const buscando = ref(false)
  const error = ref<string | null>(null)

  const itemSeleccionado = ref<ItemBusquedaDto | null>(null)
  const stock = ref<ConsultaStockDto | null>(null)
  const cargandoStock = ref(false)
  const filtroAlmacen = ref('')

  async function buscar() {
    if (!query.value.trim()) return
    buscando.value = true
    error.value = null
    resultados.value = []
    try {
      resultados.value = await stockApi.buscarItems(query.value.trim())
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al buscar'
    } finally {
      buscando.value = false
    }
  }

  async function verStock(item: ItemBusquedaDto) {
    itemSeleccionado.value = item
    cargandoStock.value = true
    error.value = null
    stock.value = null
    try {
      stock.value = await stockApi.getStock(item.itemCode, filtroAlmacen.value || undefined)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al consultar el stock'
    } finally {
      cargandoStock.value = false
    }
  }

  async function refiltrarPorAlmacen() {
    if (!itemSeleccionado.value) return
    await verStock(itemSeleccionado.value)
  }

  return {
    query, resultados, buscando, error,
    itemSeleccionado, stock, cargandoStock, filtroAlmacen,
    buscar, verStock, refiltrarPorAlmacen,
  }
})
