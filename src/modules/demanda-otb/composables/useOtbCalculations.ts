import { reactive, type Ref } from 'vue'
import type { NodoFila, OtbResponse, OtbSkuItem } from '../types'

// ── Claves de fila — el drill-down agrupa por Nivel1×Nivel2×Nivel3 (sin Género, así lo
// expone el backend); la fila visible en pantalla es un grano más fino (+Género). ──
export function nodeKey(row: NodoFila): string {
  return `${row.nivel1}|${row.nivel2}|${row.nivel3}`
}
export function rowKey(row: NodoFila): string {
  return nodeKey(row) + '|' + row.genero
}

// ── Colores de Semáforo/Tendencia — mismos para nodo y SKU ──
const SEMAFORO_COLOR: Record<string, string> = {
  OK: 'text-emerald-600 dark:text-emerald-400',
  BAJO: 'text-amber-600 dark:text-amber-400',
  CRITICO: 'text-red-600 dark:text-red-400',
  SOBRESTOCK: 'text-blue-600 dark:text-blue-400',
  MARGINAL: 'text-gray-500 dark:text-gray-400',
  'SIN DEMANDA': 'text-gray-500 dark:text-gray-400',
}
const SEMAFORO_DOT: Record<string, string> = {
  OK: 'bg-emerald-500',
  BAJO: 'bg-amber-500',
  CRITICO: 'bg-red-500',
  SOBRESTOCK: 'bg-blue-500',
  MARGINAL: 'bg-gray-400',
  'SIN DEMANDA': 'bg-gray-400',
}
export function semaforoColor(v: string | null): string {
  return v ? SEMAFORO_COLOR[v.toUpperCase()] ?? 'text-gray-900 dark:text-white' : 'text-gray-400'
}
export function semaforoDot(v: string | null): string {
  return v ? SEMAFORO_DOT[v.toUpperCase()] ?? 'bg-gray-400' : 'bg-gray-300 dark:bg-gray-600'
}

const TENDENCIA_COLOR: Record<string, string> = {
  ACELERANDO: 'text-emerald-600 dark:text-emerald-400',
  ESTABLE: 'text-gray-500 dark:text-gray-400',
  DESACELERANDO: 'text-red-600 dark:text-red-400',
}
export function tendenciaColor(v: string | null): string {
  return v ? TENDENCIA_COLOR[v.toUpperCase()] ?? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
}

/**
 * Estado editable + fórmulas de Cobertura Deseada/Inv. Final Planificado/OTB/Pedido y la
 * selección para el Excel ("Nivel 3 → Excel") — compartido entre OtbView.vue (export,
 * checkbox maestro, pie de tabla) y OtbRow.vue (cada fila), para que ambos lean/escriban los
 * mismos Maps/Set reactivos sin duplicar la lógica. Se crea UNA sola vez en OtbView.vue y se
 * pasa hacia abajo — llamar useOtbCalculations() más de una vez crearía Maps separados.
 */
export function useOtbCalculations(otb: Ref<OtbResponse | null>, tipoMes: Ref<'regular' | 'pico'>) {
  // Fórmula literal de NEXUS_OTB_ENDPOINT_OTB.md §5 (otbInvFinal): Inventario Final
  // Planificado para la Cobertura Deseada editada, usando el ritmo de venta diario (Total
  // Nivel = ventas + catálogo nuevo — NUNCA entra a este cálculo, es una estimación de
  // productos que todavía no existen: solo informativa, no participa en inventario/compra,
  // ver NEXUS_OTB_BUG_INVFINAL.md). En modo "pico" el ritmo diario se calcula sobre 1/3 del
  // mes (demanda concentrada), no sobre el mes completo.
  const coberturaDeseada = reactive(new Map<string, number>())
  function coberturaDeseadaValue(row: NodoFila): number {
    const key = rowKey(row)
    if (!coberturaDeseada.has(key)) {
      coberturaDeseada.set(key, otb.value?.otbParams.target ?? 90)
    }
    return coberturaDeseada.get(key)!
  }
  function setCoberturaDeseada(row: NodoFila, value: number) {
    coberturaDeseada.set(rowKey(row), value)
  }
  function invFinalPlanificado(row: NodoFila): number {
    const ventas = row.ventasPlanificada ?? 0
    const cobertura = coberturaDeseadaValue(row)
    const ritmoDiario = tipoMes.value === 'pico' ? (ventas / 3) / 30 : ventas / 30
    return cobertura * ritmoDiario
  }
  // OTB = Inv. Final Planificado + Ventas Planificada − Stock Inicial − Tránsito
  // (NEXUS_OTB_BUG_INVFINAL.md §4-5, otbCalc() del original).
  function otbUnidades(row: NodoFila): number {
    const ventas = row.ventasPlanificada ?? 0
    const stock = row.stockInicial ?? 0
    const transito = row.transito ?? 0
    return invFinalPlanificado(row) + ventas - stock - transito
  }

  // Pedido es editable — el default es dinámico: Pedido = ceil(max(OTB, 0)) (fórmula
  // golden-tested del backend, ver types.ts) — así que mientras no se edite a mano, sigue en
  // vivo cualquier cambio de OTB (por Cobertura Deseada o Tipo de mes). En cuanto se edita,
  // queda fijo.
  const pedidoEditado = reactive(new Map<string, number>())
  function pedidoValue(row: NodoFila): number {
    const key = rowKey(row)
    if (pedidoEditado.has(key)) return pedidoEditado.get(key)!
    return Math.ceil(Math.max(otbUnidades(row), 0))
  }
  function setPedido(row: NodoFila, value: number) {
    pedidoEditado.set(rowKey(row), value)
  }

  // Selección de filas para el Excel ("Nivel 3 → Excel") — checkbox por fila (Nivel3+Género),
  // independiente de los filtros de columna, no toca la tabla en pantalla. Vacío = exporta
  // todo (comportamiento actual, sin cambios).
  const exportSelectedRows = reactive(new Set<string>())
  function toggleExportRow(row: NodoFila) {
    const key = rowKey(row)
    if (exportSelectedRows.has(key)) exportSelectedRows.delete(key)
    else exportSelectedRows.add(key)
  }

  // ── Mismo cálculo, a nivel de SKU individual (filas del drill-down) — Cobertura Deseada
  // propia por SKU, igual que en el dashboard original. `/otb/skus` no trae Tránsito por SKU
  // (solo a nivel de nodo), así que el OTB por SKU queda sin ese descuento — aproximado, no
  // idéntico al nodo padre.
  const coberturaDeseadaSku = reactive(new Map<string, number>())
  function coberturaDeseadaSkuValue(sku: OtbSkuItem): number {
    if (!coberturaDeseadaSku.has(sku.codigo)) {
      coberturaDeseadaSku.set(sku.codigo, otb.value?.otbParams.target ?? 90)
    }
    return coberturaDeseadaSku.get(sku.codigo)!
  }
  function setCoberturaDeseadaSku(sku: OtbSkuItem, value: number) {
    coberturaDeseadaSku.set(sku.codigo, value)
  }
  function invFinalPlanificadoSku(sku: OtbSkuItem): number {
    const ventas = sku.predUnidades ?? 0
    const cobertura = coberturaDeseadaSkuValue(sku)
    const ritmoDiario = tipoMes.value === 'pico' ? (ventas / 3) / 30 : ventas / 30
    return cobertura * ritmoDiario
  }
  function otbUnidadesSku(sku: OtbSkuItem): number {
    const ventas = sku.predUnidades ?? 0
    const stock = sku.stockInicial ?? 0
    return invFinalPlanificadoSku(sku) + ventas - stock
  }

  return {
    coberturaDeseada, coberturaDeseadaValue, setCoberturaDeseada,
    invFinalPlanificado, otbUnidades,
    pedidoEditado, pedidoValue, setPedido,
    exportSelectedRows, toggleExportRow,
    coberturaDeseadaSku, coberturaDeseadaSkuValue, setCoberturaDeseadaSku,
    invFinalPlanificadoSku, otbUnidadesSku,
  }
}

export type OtbCalculations = ReturnType<typeof useOtbCalculations>
