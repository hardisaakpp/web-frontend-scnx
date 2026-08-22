<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAdminStore } from '../../stores/adminStore'
import { extraerMensajeError } from '../../services/utils/errorHandler'
import DuplicarCampanaModal from '../../components/admin/DuplicarCampanaModal.vue'
import type { SegmentoCliente, TipoPremio, CrearPremioDTO, PremioAdmin, Tienda, Campana } from '../../types'

const store  = useAdminStore()
const route  = useRoute()
const router = useRouter()
const toast  = useToast()

const campanaId = route.params.campanaId as string

let probInterval: ReturnType<typeof setInterval> | null = null

// ─── Carga inicial ────────────────────────────────────────────────────────────
onMounted(async () => {
  if (store.campanas.length === 0) await store.cargarCampanas()
  await store.cargarPremiosCampana(campanaId)
  await store.cargarTiendas()
})

onUnmounted(() => {
  revocarPreview()
  if (probInterval) clearInterval(probInterval)
})

const selectedTiendaInfo = ref<string>('')

async function refetchProbabilidades() {
  if (campanaId && selectedTiendaInfo.value) {
    await store.cargarProbabilidadesEnVivo(campanaId, selectedTiendaInfo.value)
  } else {
    store.probabilidadesEnVivo = []
  }
}

watch(selectedTiendaInfo, async () => {
  if (probInterval) {
    clearInterval(probInterval)
    probInterval = null
  }
  await refetchProbabilidades()
  
  if (selectedTiendaInfo.value) {
     probInterval = setInterval(refetchProbabilidades, 5 * 60 * 1000)
  }
})


// ─── Datos de la campaña ─────────────────────────────────────────────────────
const campana = computed(() => store.campanas.find(c => c.id === campanaId))

const hoy = new Date().toISOString().slice(0, 10)
// Puramente visual: solo alimenta el badge de estado. Nunca debe usarse para decidir qué
// botones de acción mostrar — para eso, usar el estado PERSISTIDO (campanaActiva/campanaPausada
// más abajo), que no varía según fecha_inicio.
const estadoEfectivo = computed(() => {
  if (!campana.value) return 'borrador'
  if (campana.value.estado === 'activa' && campana.value.fecha_inicio > hoy) return 'programada'
  return campana.value.estado
})

const estadoClase: Record<string, string> = {
  activa:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  programada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pausada:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  finalizada: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  borrador:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

// ─── Progreso global ──────────────────────────────────────────────────────────
const grupoActivo    = ref<string | null>(null)
const grupo          = computed(() => store.grupos.find(g => g.grupo === grupoActivo.value))

const gruposRequeridos = computed(() => {
  const permitidos = campana.value?.segmentos_permitidos
  if (!permitidos?.length) return store.grupos
  return store.grupos.filter(g => permitidos.includes(g.grupo))
})
const todosCompletos = computed(() => gruposRequeridos.value.length > 0 && gruposRequeridos.value.every(g => g.estado === 'completo'))
const gruposOk       = computed(() => gruposRequeridos.value.filter(g => g.estado === 'completo').length)

watch(gruposRequeridos, (nuevos) => {
  if (nuevos.length > 0 && (!grupoActivo.value || !nuevos.some(g => g.grupo === grupoActivo.value))) {
    grupoActivo.value = nuevos[0].grupo
  }
}, { immediate: true })

const estadoGrupoIcon: Record<string, { cls: string; dot: string; label: string }> = {
  completo:    { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', label: '✓' },
  advertencia: { cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',    dot: 'bg-yellow-500', label: '~' },
  incompleto:  { cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',               dot: 'bg-red-500',    label: '✗' },
}

// ─── Estado del grupo activo ──────────────────────────────────────────────────
const estadoGrupoActual = computed(() => grupo.value?.estado ?? 'incompleto')

const currentProbability = computed(() => {
  const g = grupo.value
  if (!g || store.probabilidadesEnVivo.length === 0) return null
  return store.probabilidadesEnVivo.find(p => p.grupo === g.grupo)?.porcentajeGanar ?? 0
})

// ─── Estado de bloqueo de edición ────────────────────────────────────────────
// Activa: bloquea estructura (nombre, fechas, premios) — solo permite monitoreo/stock.
// Finalizada: candado permanente, ninguna mutación (Regla de Oro).
// IMPORTANTE: se basan en el estado PERSISTIDO (campana.estado), no en `estadoEfectivo`
// — ese último solo deriva la etiqueta visual "Programada" y no debe alterar la botonera:
// una campaña Activa con fecha_inicio futura sigue siendo Activa a efectos de permisos.
const campanaActiva     = computed(() => store.esCampanaActiva(campana.value))
const campanaPausada    = computed(() => store.esCampanaPausada(campana.value))
const campanaBorrador   = computed(() => store.esCampanaBorrador(campana.value))
const campanaInmutable  = computed(() => store.esCampanaInmutable(campana.value))
// Los premios (editar/eliminar/agregar) se bloquean tanto en Activa como en Finalizada.
const bloqueaEdicionPremios = computed(() => campanaActiva.value || campanaInmutable.value)

// ─── Transiciones de estado ───────────────────────────────────────────────────
const activando   = ref(false)
const pausando    = ref(false)
const finalizando = ref(false)
const errorEstado = ref('')
const mostrarConfirmFinalizar = ref(false)

// Advertencia preventiva: si TODOS los premios reales (no relleno) están en 0 unidades — el caso
// típico de una campaña recién duplicada a la que aún no se le asignó inventario nuevo — activar
// dejaría la ruleta sin nada que entregar. Un premio con stock null (ilimitado) no cuenta como
// "en cero": esa es una configuración válida, no un olvido.
const stockTotalEnCero = computed(() => {
  const premiosReales = store.grupos.flatMap(g => g.premios).filter(p => !p.es_relleno)
  return premiosReales.length > 0 && premiosReales.every(p => p.stock_total === 0)
})
const confirmarActivarSinStock = ref(false)
watch(stockTotalEnCero, (enCero) => { if (!enCero) confirmarActivarSinStock.value = false })

async function activarCampana() {
  if (activando.value) return
  if (!todosCompletos.value) {
    // Antes: `return` silencioso — el botón parecía no responder (Ghost Click). Ahora se explica
    // exactamente por qué está bloqueado, con el verbo correcto según si es primera activación o reanudación.
    toast.warning(
      campanaPausada.value ? 'No se puede reanudar la campaña' : 'No se puede activar la campaña',
      'Existen grupos de clientes incompletos o falta el premio de consolación universal.'
    )
    return
  }
  if (stockTotalEnCero.value && !confirmarActivarSinStock.value) {
    confirmarActivarSinStock.value = true
    return
  }
  activando.value = true
  errorEstado.value = ''
  try {
    await store.cambiarEstado(campanaId, 'activa')
    toast.success(campanaPausada.value ? 'Campaña reanudada' : 'Campaña activada')
    router.push({ name: 'ruleta-admin-campanas' })
  } catch (e) {
    errorEstado.value = extraerMensajeError(e, 'Error al activar la campaña.')
    toast.error('No se pudo activar la campaña', errorEstado.value)
  } finally {
    activando.value = false
    confirmarActivarSinStock.value = false
  }
}

async function pausarCampana() {
  if (pausando.value) return
  pausando.value = true
  errorEstado.value = ''
  try {
    await store.cambiarEstado(campanaId, 'pausada')
    toast.success('Campaña pausada', 'Los enroladores no podrán girar hasta que la reanudes.')
  } catch (e) {
    errorEstado.value = extraerMensajeError(e, 'Error al pausar la campaña.')
    toast.error('No se pudo pausar la campaña', errorEstado.value)
  } finally {
    pausando.value = false
  }
}

function abrirConfirmFinalizar() {
  errorEstado.value = ''
  mostrarConfirmFinalizar.value = true
}

function cancelarFinalizar() {
  if (finalizando.value) return
  mostrarConfirmFinalizar.value = false
}

async function finalizarCampana() {
  if (finalizando.value) return
  finalizando.value = true
  errorEstado.value = ''
  try {
    await store.cambiarEstado(campanaId, 'finalizada')
    mostrarConfirmFinalizar.value = false
    toast.success('Campaña finalizada', 'Queda como registro histórico de solo lectura.')
  } catch (e) {
    errorEstado.value = extraerMensajeError(e, 'Error al finalizar la campaña.')
    toast.error('No se pudo finalizar la campaña', errorEstado.value)
  } finally {
    finalizando.value = false
  }
}

// ─── Duplicar campaña (deep clone limpio para una nueva temporada) ───────────
const mostrarDuplicar = ref(false)

function onCampanaDuplicada(nueva: Campana) {
  mostrarDuplicar.value = false
  router.push({ name: 'ruleta-admin-campana-detalle', params: { campanaId: nueva.id } })
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
const TIPO_LABELS: Record<TipoPremio, string> = {
  fisico: 'Premio Físico', digital: 'Cupón digital', descuento: 'Descuento en tienda', relleno: 'Relleno',
}

const SEGMENTO_LABELS: Record<SegmentoCliente, string> = {
  GRUPO_1: 'Grupo 1', GRUPO_2: 'Grupo 2', GRUPO_3: 'Grupo 3',
  GRUPO_4: 'Grupo 4', GRUPO_5: 'Grupo 5', GRUPO_6: 'Grupo 6 — No afiliados',
}

// ─── Modal stepped: estado ───────────────────────────────────────────────────
type ModalStep = 'cerrado' | 'paso1' | 'paso2'
const modalStep      = ref<ModalStep>('cerrado')
const premioRecienCreado = ref<PremioAdmin | null>(null)
const premioEditando = ref<PremioAdmin | null>(null)
const errorForm      = ref('')
const guardando      = ref(false)
const subiendoImagen = ref(false)

// ─── Paso 1: formulario de premio ────────────────────────────────────────────
const form = ref<CrearPremioDTO>({
  nombre: '',
  descripcion: '',
  es_vacio: false,
  tipo: 'fisico',
  segmento: 'GRUPO_1',
  controla_stock_por_tienda: false,
  stock_total: null,
  valor_referencial: null,
  imagen_url: '',
})
const imagenFile    = ref<File | null>(null)
const imagenPreview = ref<string | null>(null)

const MAX_IMAGEN_MB = 5

// Libera la referencia en memoria de la preview si era un blob local (evita memory leaks)
function revocarPreview() {
  if (imagenPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagenPreview.value)
  }
}

function abrirModal() {
  revocarPreview()
  form.value = {
    nombre: '',
    descripcion: '',
    es_vacio: false,
    tipo: 'fisico',
    segmento: grupo.value?.grupo ?? 'GRUPO_1',
    controla_stock_por_tienda: false,
    stock_total: null,
    valor_referencial: null,
    imagen_url: '',
  }
  imagenFile.value    = null
  imagenPreview.value = null
  errorForm.value     = ''
  errorPaso2.value    = ''
  premioRecienCreado.value = null
  stockAsignado.value = []
  modalStep.value = 'paso1'
}

function cerrarModal() {
  revocarPreview()
  // El paso 2 (repartir stock por tienda, ver asignarStock) guarda cada asignación contra el
  // backend y refleja el cambio en store.inventario (para InventarioView), pero nunca toca
  // store.grupos — el array que alimenta esta misma tabla y el aviso "sin stock"
  // (stockTotalEnCero). Sin este refetch al cerrar, la tabla se queda mostrando el stock
  // previo hasta que el usuario recarga la página a mano.
  const necesitaResincronizarGrupos = modalStep.value === 'paso2'
  modalStep.value = 'cerrado'
  premioRecienCreado.value = null
  premioEditando.value = null
  if (necesitaResincronizarGrupos) {
    store.cargarPremiosCampana(campanaId).catch(e =>
      console.error('Error al resincronizar premios tras repartir stock:', e)
    )
  }
}

function abrirModalEditar(premio: PremioAdmin) {
  revocarPreview()
  premioEditando.value = premio
  form.value = {
    nombre:                    premio.nombre,
    descripcion:               premio.descripcion ?? '',
    es_vacio:                  premio.es_relleno,
    tipo:                      premio.tipo,
    segmento:                  grupo.value?.grupo ?? 'GRUPO_1',
    controla_stock_por_tienda: premio.controla_stock_por_tienda,
    stock_total:               premio.stock_total,
    valor_referencial:         premio.valor_referencial ?? null,
    imagen_url:                premio.imagen_url ?? '',
  }
  imagenFile.value    = null
  imagenPreview.value = premio.imagen_url ?? null
  errorForm.value     = ''
  errorPaso2.value    = ''
  premioRecienCreado.value = null
  stockAsignado.value = []
  modalStep.value = 'paso1'
}

watch(() => form.value.es_vacio, (esVacio) => {
  if (esVacio) {
    form.value.tipo = 'relleno'
    form.value.controla_stock_por_tienda = false
    form.value.stock_total = null
    if (!form.value.nombre.trim()) form.value.nombre = '¡Sigue intentando!'
  } else {
    form.value.tipo = 'fisico'
  }
})

const deshabilitaRelleno = computed(() => {
  if (!grupo.value) return false
  const yaTiene = grupo.value.premios.some(p => p.es_relleno)
  if (!yaTiene) return false // No tiene, así que se puede
  
  // Si ya tiene, lo bloqueamos, A MENOS que estemos editando ese mismo premio
  if (premioEditando.value && premioEditando.value.es_relleno) return false
  
  return true
})

function handleImagenChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) { imagenFile.value = null; imagenPreview.value = null; return }

  if (!file.type.startsWith('image/')) {
    errorForm.value = 'El archivo debe ser una imagen (PNG, JPG).'
    input.value = ''
    return
  }
  if (file.size > MAX_IMAGEN_MB * 1024 * 1024) {
    errorForm.value = `La imagen no debe superar los ${MAX_IMAGEN_MB} MB.`
    input.value = ''
    return
  }

  errorForm.value = ''
  revocarPreview()
  imagenFile.value    = file
  imagenPreview.value = URL.createObjectURL(file)
  form.value.imagen_url = ''
}

function limpiarImagen() {
  revocarPreview()
  imagenFile.value    = null
  imagenPreview.value = null
  form.value.imagen_url = ''
}

function prePopulateStock(premioId: string) {
  const inventarioItem = store.inventario.find(i => i.premio_id === premioId)
  if (!inventarioItem || store.tiendasInventario.length === 0) return
  stockAsignado.value = Object.entries(inventarioItem.por_tienda)
    .filter(([, cant]) => cant > 0)
    .map(([tiendaId, cantidad]) => {
      const inv = store.tiendasInventario.find(t => t.id === Number(tiendaId))
      return inv ? { tienda: { id: inv.id, codigo: inv.codigo, nombre: inv.nombre, ciudad: '', activa: true }, cantidad } : null
    })
    .filter(Boolean) as { tienda: Tienda; cantidad: number }[]
}

function irAPaso2OCerrar(premioGuardado: PremioAdmin) {
  premioRecienCreado.value = premioGuardado
  if (!form.value.es_vacio && form.value.controla_stock_por_tienda) {
    prePopulateStock(premioGuardado.id)
    modalStep.value = 'paso2'
  } else {
    cerrarModal()
  }
}

function buildPremioData(): Omit<PremioAdmin, 'id'> {
  const esVacio = form.value.es_vacio
  return {
    nombre:                    form.value.nombre,
    descripcion:               form.value.descripcion ?? null,
    tipo:                      esVacio ? 'relleno' : form.value.tipo,
    stock_total:               esVacio ? null : (form.value.stock_total ?? null),
    valor_referencial:         esVacio ? null : (form.value.valor_referencial ?? null),
    es_relleno:                esVacio,
    controla_stock_por_tienda: !esVacio && form.value.controla_stock_por_tienda,
    imagen_url:                imagenPreview.value ?? form.value.imagen_url ?? undefined,
    // Preserva el orden visual en la ruleta: no hay ningún control en este formulario para
    // cambiarlo, así que al editar se reenvía el valor que ya tenía el premio (nunca 0 a
    // secas) — al crear, queda `undefined` y el backend asigna el siguiente índice disponible.
    orden_ruleta:              premioEditando.value?.orden_ruleta,
  }
}

// ─── Confirmación de reducción de stock con la campaña Activa ────────────────
// Editar el stock total reemplaza el valor absoluto, no lo suma: un admin que
// escribe "200" pensando en agregar 200 más a un premio que ya tenía 210 lo
// reduce sin darse cuenta. Con la campaña Activa ese error aplica de inmediato
// sobre lo que el SpinEngine ofrece al cliente, así que se pide confirmar antes
// de guardar (aumentar stock nunca pasa por aquí). El backend exige lo mismo
// como red de seguridad (ver PremioService.UpdateAsync / REDUCCION_STOCK_SIN_CONFIRMAR).
const premioParaConfirmarReduccion = ref<{
  grupoIdx: number
  premioId: string
  data: Omit<PremioAdmin, 'id'>
  stockActual: number
  stockNuevo: number
} | null>(null)

function cancelarReduccionStock() {
  premioParaConfirmarReduccion.value = null
}

async function confirmarReduccionStockYGuardar() {
  if (guardando.value) return
  const pendiente = premioParaConfirmarReduccion.value
  if (!pendiente) return
  guardando.value = true
  try {
    await store.actualizarPremio(pendiente.grupoIdx, pendiente.premioId, pendiente.data, true)
    premioParaConfirmarReduccion.value = null
    irAPaso2OCerrar({ id: pendiente.premioId, ...pendiente.data } as PremioAdmin)
  } catch (e) {
    premioParaConfirmarReduccion.value = null
    errorForm.value = extraerMensajeError(e, 'Error al guardar el premio.')
  } finally {
    guardando.value = false
  }
}

// Sube la imagen nueva (si hay una) y la vuelca en `data` — primero para obtener la URL
// real y pública del backend; nunca se persiste la URL temporal del navegador.
async function subirImagenSiCorresponde(data: Omit<PremioAdmin, 'id'>): Promise<boolean> {
  if (!imagenFile.value) return true
  subiendoImagen.value = true
  try {
    data.imagen_url = await store.subirImagen(imagenFile.value)
    return true
  } catch (err: any) {
    errorForm.value = 'Error al subir la imagen: ' + (err.response?.data?.error || err.message)
    return false
  } finally {
    subiendoImagen.value = false
  }
}

// Editar el stock total reemplaza el valor absoluto, no lo suma, así que con la campaña
// Activa ese cambio aplica de inmediato sobre lo que el SpinEngine ofrece al cliente:
// se detecta la reducción aquí para pedir confirmación antes de guardar (ver el comentario
// de premioParaConfirmarReduccion más abajo).
function detectarReduccionStockConCampanaActiva(
  grupoIdx: number,
  data: Omit<PremioAdmin, 'id'>,
): typeof premioParaConfirmarReduccion.value {
  const premioActual = premioEditando.value
  if (
    !premioActual ||
    !campanaActiva.value ||
    typeof data.stock_total !== 'number' ||
    typeof premioActual.stock_total !== 'number' ||
    data.stock_total >= premioActual.stock_total
  ) {
    return null
  }
  return {
    grupoIdx,
    premioId: premioActual.id,
    data,
    stockActual: premioActual.stock_total,
    stockNuevo: data.stock_total,
  }
}

async function persistirPremio(grupoIdx: number, data: Omit<PremioAdmin, 'id'>) {
  try {
    if (premioEditando.value) {
      const premioId = premioEditando.value.id
      await store.actualizarPremio(grupoIdx, premioId, data)
      irAPaso2OCerrar({ id: premioId, ...data } as PremioAdmin)
    } else {
      const nuevo = await store.agregarPremio(grupoIdx, data)
      if (!nuevo) { errorForm.value = 'No se pudo guardar el premio.'; return }
      irAPaso2OCerrar(nuevo)
    }
  } catch (e) {
    errorForm.value = extraerMensajeError(e, 'Error al guardar el premio.')
  }
}

async function guardarPremio() {
  if (guardando.value) return
  errorForm.value = ''
  if (form.value.es_vacio && !form.value.nombre.trim()) form.value.nombre = '¡Sigue intentando!'
  if (!form.value.nombre.trim()) { errorForm.value = 'El nombre es requerido.'; return }

  const grupoIdx = store.grupos.findIndex(g => g.grupo === form.value.segmento)
  if (grupoIdx === -1) { errorForm.value = 'Segmento no válido.'; return }

  guardando.value = true
  try {
    const data = buildPremioData()

    if (!(await subirImagenSiCorresponde(data))) return

    // Barrera de seguridad: bajo ninguna circunstancia se debe persistir un blob local.
    if (data.imagen_url?.startsWith('blob:')) {
      errorForm.value = 'No se pudo obtener la URL definitiva de la imagen. Intenta de nuevo.'
      return
    }

    const reduccionPendiente = detectarReduccionStockConCampanaActiva(grupoIdx, data)
    if (reduccionPendiente) {
      premioParaConfirmarReduccion.value = reduccionPendiente
      return
    }

    await persistirPremio(grupoIdx, data)
  } finally {
    guardando.value = false
  }
}

const premioAEliminar = ref<string | null>(null)
const eliminandoPremio = ref(false)
const errorEliminar = ref('')

function confirmarEliminarPremio(premioId: string) {
  premioAEliminar.value = premioId
  errorEliminar.value = ''
}

function cancelarEliminarPremio() {
  premioAEliminar.value = null
  errorEliminar.value = ''
}

async function ejecutarEliminarPremio() {
  if (eliminandoPremio.value || !premioAEliminar.value) return
  const grupoIdx = store.grupos.findIndex(g => g.grupo === grupoActivo.value)
  if (grupoIdx === -1) return

  eliminandoPremio.value = true
  errorEliminar.value = ''
  try {
    await store.eliminarPremio(grupoIdx, premioAEliminar.value)
    premioAEliminar.value = null
  } catch (e) {
    errorEliminar.value = extraerMensajeError(e, 'Error al eliminar el premio.')
  } finally {
    eliminandoPremio.value = false
  }
}

// ─── Paso 2: distribución de stock por tienda ─────────────────────────────────
const tiendaBusqueda    = ref('')
const tiendaSeleccionada = ref<Tienda | null>(null)
const stockCantidad     = ref<number | null>(null)
const stockAsignado     = ref<{ tienda: Tienda; cantidad: number }[]>([])
const asignando         = ref(false)
const mostrarDropdown   = ref(false)
const errorPaso2        = ref('')

const tiendasFiltradas = computed(() => {
  const q = tiendaBusqueda.value.toLowerCase().trim()
  if (!q) return store.tiendas.slice(0, 8)
  return store.tiendas.filter(t =>
    t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q)
  )
})

const totalAsignado = computed(() =>
  stockAsignado.value.reduce((s, a) => s + a.cantidad, 0)
)

const stockDisponible = computed(() =>
  (premioRecienCreado.value?.stock_total ?? 0) - totalAsignado.value
)

function seleccionarTienda(t: Tienda) {
  tiendaSeleccionada.value = t
  tiendaBusqueda.value     = `${t.nombre} (${t.codigo})`
  mostrarDropdown.value    = false
}

async function asignarStock() {
  if (asignando.value) return
  if (!tiendaSeleccionada.value || !stockCantidad.value || stockCantidad.value <= 0) return
  if (!premioRecienCreado.value) return
  errorPaso2.value = ''
  asignando.value = true
  const tiendaAux    = tiendaSeleccionada.value
  const cantidadAux  = stockCantidad.value
  try {
    await store.asignarStockTienda(premioRecienCreado.value.id, tiendaAux.codigo, cantidadAux)
    stockAsignado.value.push({ tienda: tiendaAux, cantidad: cantidadAux })
    // Reflejar en store.inventario si ya estaba cargado (para que InventarioView lo muestre)
    const premioId = premioRecienCreado.value.id
    const inventarioItem = store.inventario.find(i => i.premio_id === premioId)
    if (inventarioItem) {
      const tiendaInv = store.tiendasInventario.find(t => t.codigo === tiendaAux.codigo)
      if (tiendaInv) {
        inventarioItem.por_tienda[tiendaInv.id] = (inventarioItem.por_tienda[tiendaInv.id] ?? 0) + cantidadAux
        inventarioItem.total_asignado = Object.values(inventarioItem.por_tienda).reduce((a, b) => a + b, 0)
        inventarioItem.restante_bodega = inventarioItem.stock_total - inventarioItem.total_asignado
      }
    }
    tiendaSeleccionada.value = null
    tiendaBusqueda.value     = ''
    stockCantidad.value      = null
  } catch (e) {
    errorPaso2.value = extraerMensajeError(e, 'Error al asignar el stock. Intenta de nuevo.')
  } finally {
    asignando.value = false
  }
}

function quitarAsignacion(idx: number) {
  stockAsignado.value.splice(idx, 1)
}

function ocultarDropdown() {
  setTimeout(() => { mostrarDropdown.value = false }, 150)
}
</script>

<template>
  <div class="space-y-5 pb-8">

    <!-- Breadcrumbs -->
    <nav aria-label="Navegación" class="flex items-center gap-1.5 text-sm flex-wrap">
      <router-link
        to="/ruleta/admin"
        class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400
               hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
      >
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5 flex-shrink-0"
             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Administración
      </router-link>
      <svg class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0"
           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      <router-link
        to="/ruleta/admin/campanas"
        class="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Campañas
      </router-link>
      <svg class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0"
           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
        {{ campana?.nombre ?? '…' }}
      </span>
    </nav>

    <!-- ── Banner "Modo Reporte de Cierre" — campaña Finalizada ────────────── -->
    <div v-if="campanaInmutable"
         class="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
      <span class="text-xl flex-shrink-0" aria-hidden="true">📜</span>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        <span class="font-semibold text-gray-800 dark:text-gray-100">Campaña Finalizada (Modo Reporte de Cierre)</span>
        — Esta campaña es de solo lectura y no puede modificarse. Para iniciar una nueva temporada,
        utiliza el botón "Duplicar para Nueva Temporada".
      </p>
    </div>

    <!-- ── Header de campaña ───────────────────────────────────────────────── -->
    <div v-if="campana" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ campana.nombre }}</h2>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="estadoClase[estadoEfectivo]">
              <span v-if="estadoEfectivo === 'finalizada'" aria-hidden="true">🔒</span>
              {{ estadoEfectivo.charAt(0).toUpperCase() + estadoEfectivo.slice(1) }}
            </span>
            <span v-if="campana.requiere_validacion_onecard"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/>
              </svg>
              OneCard
            </span>
            <!-- Badge segmentos restringidos -->
            <span v-if="campana.segmentos_permitidos?.length"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#EFF8FD] dark:bg-[#0574AF]/20 text-[#0574AF] dark:text-[#13A8E7]"
                  title="Esta campaña aplica solo a los segmentos indicados">
              <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ campana.segmentos_permitidos.map(s => SEGMENTO_LABELS[s as keyof typeof SEGMENTO_LABELS] ?? s).join(', ') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ campana.fecha_inicio }} → {{ campana.fecha_fin }}
            </span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ campana.cooldown_dias }} días cooldown
            </span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Máx. {{ campana.max_giros }} giro{{ campana.max_giros !== 1 ? 's' : '' }} por cliente
            </span>
            <span v-if="campana.hora_feliz_inicio && campana.hora_feliz_fin" class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium ml-2">
              ✨ Hora Feliz: {{ campana.hora_feliz_inicio.slice(0, 5) }} - {{ campana.hora_feliz_fin.slice(0, 5) }}
            </span>
          </div>
        </div>

        <!-- Acciones de estado -->
        <div class="flex-shrink-0 flex flex-col items-end gap-2">

          <!-- Campaña FINALIZADA → solo lectura, sin transiciones posibles -->
          <template v-if="campanaInmutable">
            <p class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              🔒 Campaña finalizada: registro histórico de solo lectura. No puede reactivarse.
            </p>
            <button
              type="button"
              @click="mostrarDuplicar = true"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                     bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              <span aria-hidden="true">🔁</span>
              Duplicar para Nueva Temporada
            </button>
          </template>

          <!-- Campaña ACTIVA → Pausar / Finalizar -->
          <template v-else-if="campanaActiva">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="abrirConfirmFinalizar"
                :disabled="pausando || finalizando"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800
                       text-sm font-medium text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed">
                🔒 Finalizar
              </button>
              <button
                type="button"
                @click="pausarCampana"
                :disabled="pausando || finalizando"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                       bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-400/30
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                       disabled:opacity-60 disabled:cursor-not-allowed">
                <svg v-if="pausando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                {{ pausando ? 'Pausando…' : 'Pausar campaña' }}
              </button>
            </div>
            <p v-if="errorEstado" class="text-xs text-red-600 dark:text-red-400 text-right max-w-xs">{{ errorEstado }}</p>
            <p v-else class="text-xs text-gray-400 dark:text-gray-500 text-right">
              La campaña está en curso. Pausa para editar premios.
            </p>
          </template>

          <!-- Campaña PAUSADA → Reanudar / Finalizar -->
          <template v-else-if="campanaPausada">
            <div v-if="!todosCompletos" class="text-right">
              <span class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {{ gruposOk }} de {{ gruposRequeridos.length }} grupos completos
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="abrirConfirmFinalizar"
                :disabled="activando || finalizando || store.guardando"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800
                       text-sm font-medium text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed">
                🔒 Finalizar
              </button>
              <button
                type="button"
                @click="activarCampana"
                :disabled="activando || finalizando || store.guardando"
                :title="!todosCompletos ? 'Existen grupos de clientes incompletos o falta el premio de consolación universal.' : undefined"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                       focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                       disabled:opacity-60 disabled:cursor-not-allowed"
                :class="!todosCompletos
                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 focus:ring-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30 focus:ring-emerald-500'">
                <svg v-if="activando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else-if="!todosCompletos" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                {{ activando ? 'Reanudando…' : !todosCompletos ? 'Faltan datos para reanudar' : 'Reanudar campaña' }}
              </button>
            </div>
            <p v-if="errorEstado" class="text-xs text-red-600 dark:text-red-400 text-right max-w-xs">{{ errorEstado }}</p>
            <p v-else-if="!todosCompletos" class="text-xs text-amber-600 dark:text-amber-400 text-right max-w-xs">
              Completa los grupos de clientes o añade el premio de consolación universal para poder reanudar.
            </p>
            <p v-else class="text-xs text-gray-400 dark:text-gray-500 text-right">
              La campaña está pausada: nadie puede girar hasta que la reanudes.
            </p>
          </template>

          <!-- Campaña en BORRADOR → Activar -->
          <template v-else>
            <div v-if="!todosCompletos" class="text-right">
              <span class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {{ gruposOk }} de {{ gruposRequeridos.length }} grupos completos
              </span>
            </div>
            <div v-if="errorEstado" class="mb-3 text-right">
              <span class="inline-block text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                {{ errorEstado }}
              </span>
            </div>
            <div v-if="confirmarActivarSinStock" class="mb-3 max-w-xs text-right">
              <span class="inline-block text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                ⚠️ Ningún premio real tiene stock asignado. La ruleta solo entregará "Sigue participando". Haz clic de nuevo para activar de todas formas.
              </span>
            </div>
            <button
              @click="activarCampana"
              :disabled="!todosCompletos || activando"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                     focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              :class="!todosCompletos
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : confirmarActivarSinStock
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-400/30 focus:ring-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30 focus:ring-emerald-500'">
              <svg v-if="activando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3l14 9-14 9V3z"/>
              </svg>
              {{ activando ? 'Activando…' : confirmarActivarSinStock ? 'Sí, activar sin stock' : 'Activar campaña' }}
            </button>
            <p v-if="!todosCompletos" class="text-xs text-gray-400 dark:text-gray-500 text-right">
              Cada grupo necesita al menos una consolación y premios reales (excepto Grupos 4, 5 y 6).
            </p>
          </template>

        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loadingPremios" class="flex justify-center py-16">
      <div class="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style="border-color: #0A86C2 #0A86C2 #0A86C2 transparent"/>
    </div>

    <template v-else-if="store.grupos.length">

      <!-- ── Simulación de Probabilidades ──────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm mb-4">
        <div class="flex items-center gap-3">
           <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Simulador de Probabilidad
           </label>
           <select 
             v-model="selectedTiendaInfo"
             class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors">
              <option value="" disabled>Seleccione una tienda...</option>
              <option v-for="t in store.tiendas" :key="t.id" :value="t.codigo">{{ t.nombre }} ({{ t.codigo }})</option>
           </select>
        </div>
      </div>

      <!-- ── Resumen de progreso global ──────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="g in gruposRequeridos" :key="g.grupo"
          @click="grupoActivo = g.grupo"
          class="flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-left"
          :class="grupoActivo === g.grupo
            ? 'border-[#0A86C2] dark:border-[#0E97D4] bg-[#EFF8FD] dark:bg-[#0574AF]/15 ring-1 ring-[#0A86C2]/25'
            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'"
        >
          <!-- Círculo de progreso (SVG mini) -->
          <div class="relative flex-shrink-0 w-10 h-10">
            <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                      class="text-gray-100 dark:text-gray-700" stroke-width="3"/>
              <circle cx="18" cy="18" r="15" fill="none"
                      :stroke="g.estado === 'completo' ? '#10b981' : g.estado === 'advertencia' ? '#f59e0b' : '#ef4444'"
                      stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="`${g.estado === 'completo' ? 94.25 : g.estado === 'advertencia' ? 47.12 : 9.42} 94.25`"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                  :class="estadoGrupoIcon[g.estado].cls.split(' ').slice(0,2).join(' ')">
              {{ g.premios.length }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ g.label }}</p>
            <p class="text-xs" :class="estadoGrupoIcon[g.estado].cls.split(' ').slice(0,2).join(' ')">
              {{ g.estado === 'completo' ? '✓ Completo' : g.estado === 'advertencia' ? '~ Casi listo' : '✗ Incompleto' }}
            </p>
          </div>
        </button>
      </div>

      <!-- ── Panel de premios por grupo ─────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        <!-- Tabs -->
        <div class="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 px-4 gap-0">
          <button v-for="g in gruposRequeridos" :key="g.grupo"
            @click="grupoActivo = g.grupo"
            class="relative flex items-center gap-2 px-3.5 py-4 text-sm font-medium whitespace-nowrap
                   border-b-2 transition-colors mr-0.5"
            :class="grupoActivo === g.grupo
              ? 'border-[#0A86C2] text-[#0A86C2] dark:text-[#0E97D4]'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
            {{ g.label }}
            <span class="w-2 h-2 rounded-full flex-shrink-0" :class="estadoGrupoIcon[g.estado].dot" />
          </button>
        </div>

        <!-- Contenido del tab activo -->
        <div v-if="grupo" class="p-5 space-y-4">

          <!-- Estado del grupo y Probabilidad -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
             <div class="flex items-center gap-3">
               <div class="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                 <div class="h-full rounded-full transition-all duration-700"
                      :class="{
                        'bg-emerald-500 w-full':  estadoGrupoActual === 'completo',
                        'bg-yellow-400 w-1/2':    estadoGrupoActual === 'advertencia',
                        'bg-red-400 w-[10%]':     estadoGrupoActual === 'incompleto',
                      }"/>
               </div>
               <div class="flex items-center gap-1.5 text-sm font-bold whitespace-nowrap"
                    :class="{
                      'text-emerald-600 dark:text-emerald-400': estadoGrupoActual === 'completo',
                      'text-yellow-600 dark:text-yellow-400':   estadoGrupoActual === 'advertencia',
                      'text-red-500 dark:text-red-400':         estadoGrupoActual === 'incompleto',
                    }">
                 <svg v-if="estadoGrupoActual === 'completo'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                 </svg>
                 {{ estadoGrupoActual === 'completo' ? 'Grupo listo' : estadoGrupoActual === 'advertencia' ? 'Falta consolación' : 'Sin premios' }}
               </div>
             </div>
             
             <!-- Widget Live Probability -->
             <div v-if="selectedTiendaInfo" class="flex flex-col border-l border-gray-100 dark:border-gray-700 pl-6 pb-1">
               <span class="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Live Probability</span>
               <div v-if="store.loadingProbabilidades" class="flex items-center gap-2 text-indigo-500 text-xs">
                 <div class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
                 Calculando tiempo real...
               </div>
               <div v-else class="flex flex-col gap-1.5 w-full">
                  <div class="flex items-center justify-between text-xs font-medium dark:text-gray-200">
                     <span>Oportunidad de Ganar:</span>
                     <span class="text-emerald-600 dark:text-emerald-400 font-bold text-[13px]">{{ currentProbability?.toFixed(1) ?? '0.0' }}%</span>
                  </div>
                  <div class="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700 shadow-inner">
                     <div class="h-full bg-emerald-500 dark:bg-emerald-400 shadow-md transition-all duration-[2000ms] ease-out relative"
                          :style="{ width: `${currentProbability ?? 0}%` }">
                          <div class="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"/>
                     </div>
                  </div>
                  <p class="text-[10px] text-gray-400">Variación depende del pacing actual (refresh 5m).</p>
               </div>
             </div>
          </div>

          <!-- Aviso campaña activa / finalizada -->
          <div v-if="campanaInmutable" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            🔒 Campaña finalizada: los premios ya no pueden modificarse.
          </div>
          <div v-else-if="campanaActiva" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
            Para modificar los premios, primero debes pausar la campaña.
          </div>

          <!-- Lista vacía -->
          <div v-if="grupo.premios.length === 0"
               class="py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
            <svg class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4"/>
            </svg>
            <p class="text-sm text-gray-400 dark:text-gray-500">Sin premios configurados para este grupo.</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Haz clic en "+ Agregar Premio" para empezar.</p>
          </div>

          <!-- Tabla de premios -->
          <div v-else class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Premio</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Stock (Disp/Total)</th>
                  <th class="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="p in grupo.premios" :key="p.id"
                    class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-3">
                      <!-- Miniatura de imagen -->
                      <div class="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <img v-if="p.imagen_url" :src="p.imagen_url" :alt="p.nombre" class="w-full h-full object-cover"/>
                        <span v-else class="text-lg">{{ p.es_relleno ? '🎰' : '🎁' }}</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-800 dark:text-gray-200">{{ p.nombre }}</p>
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span v-if="p.es_relleno"
                            class="inline-flex px-1.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            Relleno
                          </span>
                          <span v-if="p.controla_stock_por_tienda"
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                            Por tienda
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 hidden sm:table-cell">
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ TIPO_LABELS[p.tipo] }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-right hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                    <template v-if="p.es_relleno">—</template>
                    <template v-else>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ p.stock_disponible ?? p.stock_total ?? '∞' }}</span>
                      <span class="text-gray-400"> / {{ p.stock_total ?? '∞' }}</span>
                    </template>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        :disabled="bloqueaEdicionPremios"
                        :title="campanaInmutable ? 'La campaña está finalizada: es de solo lectura' : campanaActiva ? 'Para modificar los premios, primero debes pausar la campaña' : 'Editar'"
                        @click="!bloqueaEdicionPremios && abrirModalEditar(p)"
                        class="p-1.5 rounded-lg transition-colors"
                        :class="bloqueaEdicionPremios
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button
                        :disabled="bloqueaEdicionPremios"
                        :title="campanaInmutable ? 'La campaña está finalizada: es de solo lectura' : campanaActiva ? 'Para eliminar premios, primero debes pausar la campaña' : 'Eliminar'"
                        @click="!bloqueaEdicionPremios && confirmarEliminarPremio(p.id)"
                        class="p-1.5 rounded-lg transition-colors"
                        :class="bloqueaEdicionPremios
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Acción de agregar -->
          <div class="flex items-center justify-between">
            <p v-if="estadoGrupoActual !== 'completo'" class="text-xs text-gray-400 dark:text-gray-500">
              <span v-if="estadoGrupoActual === 'advertencia'" class="font-semibold text-yellow-600 dark:text-yellow-500">Agrega al menos una casilla "¡Sigue intentando!" como consolación.</span>
              <span v-else class="font-semibold" style="color: #0A86C2">
                {{ (grupo.grupo === 'GRUPO_4' || grupo.grupo === 'GRUPO_5' || grupo.grupo === 'GRUPO_6') 
                  ? 'Agrega la casilla "¡Sigue intentando!" para habilitar este grupo.'
                  : 'Agrega al menos un premio real para este grupo.' }}
              </span>
            </p>
            <span v-else />
            <button
              type="button"
              @click="!bloqueaEdicionPremios && abrirModal()"
              :disabled="bloqueaEdicionPremios"
              :title="campanaInmutable ? 'La campaña está finalizada: es de solo lectura' : campanaActiva ? 'Para modificar los premios, primero debes pausar la campaña' : undefined"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors"
              :class="bloqueaEdicionPremios
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/40 cursor-not-allowed'
                : 'border-[#0A86C2]/40 dark:border-[#0E97D4]/40 text-[#0A86C2] dark:text-[#0E97D4] hover:bg-[#EFF8FD] dark:hover:bg-[#0574AF]/10'">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              + Agregar Premio
            </button>
          </div>

        </div><!-- /tab body -->
      </div><!-- /card -->
    </template>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL STEPPED — Teleport
    ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="modalStep !== 'cerrado'"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             @click.self="cerrarModal">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
          >
            <div v-if="modalStep === 'paso1' || modalStep === 'paso2'"
                 class="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[90vh]">

              <!-- ── Step indicator ──────────────────────────────────────── -->
              <div class="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-bold text-gray-900 dark:text-white">
                    {{ modalStep === 'paso2' ? `Repartir stock — ${premioRecienCreado?.nombre}` : premioEditando ? 'Editar Premio' : 'Agregar Premio' }}
                  </h3>
                  <button @click="cerrarModal" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <!-- Step dots -->
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                         :class="modalStep === 'paso1' ? 'text-white' : 'bg-emerald-500 text-white'"
                         :style="modalStep === 'paso1' ? 'background: #0A86C2' : ''">
                      <svg v-if="modalStep === 'paso2'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span v-else>1</span>
                    </div>
                    <span class="text-xs font-medium hidden sm:inline"
                          :style="modalStep === 'paso1' ? 'color: #0A86C2' : ''"
                          :class="modalStep === 'paso1' ? '' : 'text-emerald-600 dark:text-emerald-400'">
                      Datos del premio
                    </span>
                  </div>

                  <div class="flex-1 h-px" :class="modalStep === 'paso2' ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'" />

                  <div class="flex items-center gap-1.5">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                         :class="modalStep === 'paso2'
                           ? 'text-white'
                           : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'"
                         :style="modalStep === 'paso2' ? 'background: #0A86C2' : ''">
                      2
                    </div>
                    <span class="text-xs font-medium hidden sm:inline"
                          :style="modalStep === 'paso2' ? 'color: #0A86C2' : ''"
                          :class="modalStep !== 'paso2' ? 'text-gray-400 dark:text-gray-500' : ''">
                      Repartir stock
                    </span>
                  </div>
                </div>
              </div>

              <!-- ══ PASO 1 ══════════════════════════════════════════════ -->
              <div v-if="modalStep === 'paso1'" class="px-6 py-5 overflow-y-auto space-y-5">

                <!-- Switch: ¿Es relleno? -->
                <div class="flex items-center justify-between gap-4 p-4 rounded-xl transition-colors"
                     :class="form.es_vacio
                       ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700'
                       : 'bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700'">
                  <div>
                    <p class="text-sm font-semibold" :class="deshabilitaRelleno ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'">
                      Casilla "¡Sigue intentando!"
                    </p>
                    <p class="text-xs mt-0.5" :class="deshabilitaRelleno ? 'text-amber-500 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'">
                      {{ deshabilitaRelleno ? 'Ya agregaste un premio de consolación a este grupo.' : 'No tiene foto ni stock. Solo ocupa porcentaje de la ruleta.' }}
                    </p>
                  </div>
                  <button type="button" role="switch" :aria-checked="form.es_vacio"
                    @click="!deshabilitaRelleno && (form.es_vacio = !form.es_vacio)"
                    :disabled="deshabilitaRelleno"
                    class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                    :class="[
                      form.es_vacio ? 'bg-slate-500 dark:bg-slate-400' : 'bg-gray-300 dark:bg-gray-600',
                      deshabilitaRelleno ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    ]">
                    <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
                          :class="form.es_vacio ? 'translate-x-5' : 'translate-x-0'"/>
                  </button>
                </div>

                <!-- Nombre -->
                <div>
                  <label for="premio-nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre del premio <span class="text-red-500">*</span>
                  </label>
                  <input id="premio-nombre" v-model="form.nombre" type="text"
                    :placeholder="form.es_vacio ? '¡Sigue intentando!' : 'Ej: Mochila Roland'"
                    class="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           placeholder:text-gray-300 dark:placeholder:text-gray-600
                           focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2]"
                    :class="!form.nombre.trim() && errorForm ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'"/>
                </div>

                <!-- Descripción -->
                <div>
                  <label for="premio-descripcion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Descripción <span class="text-xs font-normal text-gray-400">(opcional)</span>
                  </label>
                  <textarea id="premio-descripcion" v-model="form.descripcion" rows="2"
                    placeholder="Ej: Mochila de tela resistente con logo Roland"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           placeholder:text-gray-300 dark:placeholder:text-gray-600
                           focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] resize-none transition-colors"/>
                </div>

                <!-- Tipo (ocultar si es relleno) -->
                <div v-if="!form.es_vacio">
                  <label for="premio-tipo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
                  <select id="premio-tipo" v-model="form.tipo"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors">
                    <option value="fisico">Premio Físico</option>
                    <option value="digital">Cupón digital</option>
                    <option value="descuento">Descuento en tienda</option>
                  </select>
                </div>

                <!-- Segmento -->
                <div>
                  <label for="premio-segmento" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Segmento
                  </label>
                  <select id="premio-segmento" v-model="form.segmento"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors">
                    <option v-for="g in gruposRequeridos" :key="g.grupo" :value="g.grupo">
                      {{ SEGMENTO_LABELS[g.grupo] }}
                    </option>
                  </select>
                </div>

                <!-- Imagen (solo si no es relleno) -->
                <div v-if="!form.es_vacio">
                  <label for="premio-imagen" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Imagen <span class="text-xs font-normal text-gray-400">(opcional)</span>
                  </label>

                  <!-- Preview o dropzone -->
                  <div v-if="imagenPreview"
                       class="relative flex items-center gap-3 p-3 rounded-xl border border-[#B3DFF5] dark:border-[#0574AF]/40 bg-[#EFF8FD] dark:bg-[#0574AF]/10">
                    <img :src="imagenPreview" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="Preview"/>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ imagenFile?.name }}</p>
                      <p class="text-xs text-gray-400">{{ imagenFile ? (imagenFile.size / 1024).toFixed(1) + ' KB' : '' }}</p>
                    </div>
                    <button @click="limpiarImagen" type="button"
                      class="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <label for="premio-imagen" v-else class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#0A86C2] dark:hover:border-[#0E97D4] transition-colors">
                    <svg class="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span class="text-sm text-gray-400 dark:text-gray-500">
                      Haz clic para subir imagen (PNG, JPG, máx. {{ MAX_IMAGEN_MB }}MB)
                    </span>
                    <input id="premio-imagen" type="file" accept="image/*" class="sr-only" @change="handleImagenChange"/>
                  </label>
                </div>

                <!-- Stock total + Valor referencial (solo si no es relleno) -->
                <template v-if="!form.es_vacio">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="premio-stock" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Stock total
                      </label>
                      <input id="premio-stock" v-model.number="form.stock_total" type="number" min="0"
                        placeholder="Ilimitado"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                               placeholder:text-gray-300 dark:placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors"/>
                    </div>
                    <div>
                      <label for="premio-valor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Valor referencial ($)
                        <span class="text-xs font-normal text-gray-400">(opcional)</span>
                      </label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                        <input id="premio-valor" v-model.number="form.valor_referencial" type="number" min="0" step="0.01"
                          placeholder="0.00"
                          class="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                                 placeholder:text-gray-300 dark:placeholder:text-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors"/>
                      </div>
                    </div>
                  </div>

                  <!-- Switch controla stock por tienda -->
                  <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Controlar stock por tienda</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Si activas esto, podrás repartir unidades entre tiendas en el siguiente paso.
                      </p>
                    </div>
                    <button type="button" role="switch" :aria-checked="form.controla_stock_por_tienda"
                      @click="form.controla_stock_por_tienda = !form.controla_stock_por_tienda"
                      class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                      :style="form.controla_stock_por_tienda ? 'background: #0A86C2' : ''"
                      :class="!form.controla_stock_por_tienda ? 'bg-gray-300 dark:bg-gray-600' : ''">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
                            :class="form.controla_stock_por_tienda ? 'translate-x-5' : 'translate-x-0'"/>
                    </button>
                  </div>
                </template>

                <!-- Error -->
                <p v-if="errorForm" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ errorForm }}
                </p>
              </div>

              <!-- ══ PASO 2 ══════════════════════════════════════════════ -->
              <div v-if="modalStep === 'paso2'" class="px-6 py-5 overflow-y-auto space-y-4">

                <!-- Banner éxito -->
                <div class="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Premio guardado</p>
                    <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Stock total: <span class="font-bold">{{ premioRecienCreado?.stock_total ?? '—' }} uds.</span>
                      Asignado: <span class="font-bold">{{ totalAsignado }} uds.</span>
                      Disponible: <span class="font-bold">{{ stockDisponible }} uds.</span>
                    </p>
                  </div>
                </div>

                <!-- Buscador de tiendas -->
                <div>
                  <label for="tienda-busqueda" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Buscar tienda
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <input id="tienda-busqueda" v-model="tiendaBusqueda" type="text"
                      placeholder="Ej: Portal, QUI-POR, CCI…"
                      @focus="mostrarDropdown = true"
                      @blur="ocultarDropdown"
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                             placeholder:text-gray-300 dark:placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors"/>

                    <!-- Dropdown autocomplete -->
                    <div v-if="mostrarDropdown && tiendasFiltradas.length"
                         class="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl
                                border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                      <button
                        v-for="t in tiendasFiltradas" :key="t.id"
                        type="button"
                        @mousedown.prevent="seleccionarTienda(t)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="flex-1 font-medium text-gray-800 dark:text-gray-200">{{ t.nombre }}</span>
                        <span class="text-xs text-gray-400 font-mono">{{ t.codigo }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Cantidad + Asignar -->
                <div class="flex items-end gap-2">
                  <div class="flex-1">
                    <label for="tienda-cantidad" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cantidad</label>
                    <input id="tienda-cantidad" v-model.number="stockCantidad" type="number" min="1"
                      :max="stockDisponible"
                      placeholder="0"
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-[#0A86C2]/30 focus:border-[#0A86C2] transition-colors"/>
                  </div>
                  <button @click="asignarStock"
                    :disabled="!tiendaSeleccionada || !stockCantidad || stockCantidad <= 0 || asignando"
                    class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    :style="tiendaSeleccionada && stockCantidad && stockCantidad > 0 ? 'background: #0A86C2' : ''"
                    :class="tiendaSeleccionada && stockCantidad && stockCantidad > 0
                      ? 'text-white hover:opacity-90'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400'">
                    <span v-if="asignando">
                      <svg class="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </span>
                    <span v-else>+ Asignar</span>
                  </button>
                </div>

                <!-- Error de asignación -->
                <div v-if="errorPaso2" class="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <svg class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <p class="text-sm text-red-700 dark:text-red-300">{{ errorPaso2 }}</p>
                </div>

                <!-- Lista de asignaciones -->
                <div v-if="stockAsignado.length" class="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tiendas asignadas
                    </span>
                    <span class="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {{ totalAsignado }} / {{ premioRecienCreado?.stock_total ?? '?' }} uds.
                    </span>
                  </div>
                  <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    <div v-for="(a, idx) in stockAsignado" :key="idx"
                         class="flex items-center gap-3 px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ a.tienda.nombre }}</p>
                        <p class="text-xs text-gray-400 font-mono">{{ a.tienda.codigo }}</p>
                      </div>
                      <span class="text-sm font-bold text-gray-700 dark:text-gray-200 mr-2">{{ a.cantidad }} uds.</span>
                      <button @click="quitarAsignacion(idx)"
                        class="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Barra de progreso de asignación -->
                  <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/30">
                    <div class="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           :class="totalAsignado >= (premioRecienCreado?.stock_total ?? 0) ? 'bg-emerald-500' : ''"
                           :style="{ background: totalAsignado < (premioRecienCreado?.stock_total ?? 0) ? '#0A86C2' : undefined, width: `${Math.min(100, (totalAsignado / (premioRecienCreado?.stock_total || 1)) * 100)}%` }"/>
                    </div>
                  </div>
                </div>

                <div v-else class="py-5 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p class="text-sm text-gray-400 dark:text-gray-500">Aún no hay tiendas asignadas.</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Puedes cerrar sin asignar y hacerlo desde Inventario.</p>
                </div>

              </div><!-- /paso 2 -->

              <!-- ── Footer del modal ────────────────────────────────────── -->
              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 rounded-b-2xl flex-shrink-0">

                <!-- PASO 1 footer -->
                <template v-if="modalStep === 'paso1'">
                  <div class="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg class="w-3.5 h-3.5" style="color: #0A86C2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    {{ form.controla_stock_por_tienda ? 'Continuarás a repartir stock.' : 'Se cerrará al guardar.' }}
                  </div>
                  <div class="flex gap-3">
                    <button @click="cerrarModal"
                      class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      Cancelar
                    </button>
                    <button @click="guardarPremio" :disabled="guardando"
                      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                      :style="guardando ? 'background: #0E97D4' : 'background: #0A86C2'"
                      :class="guardando ? 'text-white cursor-wait' : 'text-white hover:opacity-90 shadow-sm'">
                      <svg v-if="guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {{ subiendoImagen ? 'Subiendo imagen…' : guardando ? 'Guardando…' : form.controla_stock_por_tienda ? 'Guardar y repartir →' : 'Guardar premio' }}
                    </button>
                  </div>
                </template>

                <!-- PASO 2 footer -->
                <template v-if="modalStep === 'paso2'">
                  <p class="text-xs text-gray-400 hidden sm:block">
                    Puedes completar la distribución después desde Inventario.
                  </p>
                  <button @click="cerrarModal"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Terminar y cerrar
                  </button>
                </template>

              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL ELIMINAR PREMIO
    ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="premioAEliminar" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" @click.self="!eliminandoPremio && cancelarEliminarPremio()">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            appear
          >
            <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
              <div class="p-6 text-center">
                <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <svg class="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Eliminar Premio</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  ¿Estás seguro de que deseas eliminar este premio? Esta acción no se puede deshacer.
                </p>
                
                <div v-if="errorEliminar" class="mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 text-left">
                  {{ errorEliminar }}
                </div>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button 
                  @click="cancelarEliminarPremio" 
                  :disabled="eliminandoPremio"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button 
                  @click="ejecutarEliminarPremio"
                  :disabled="eliminandoPremio"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  <svg v-if="eliminandoPremio" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ eliminandoPremio ? 'Eliminando…' : 'Sí, eliminar' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL CONFIRMAR REDUCCIÓN DE STOCK (campaña Activa)
    ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="premioParaConfirmarReduccion" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" @click.self="!guardando && cancelarReduccionStock()">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            appear
          >
            <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
              <div class="p-6 text-center">
                <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                  <svg class="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Vas a reducir el stock</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Esta campaña está <span class="font-semibold text-emerald-600 dark:text-emerald-400">Activa</span>.
                  El stock total pasará de
                  <span class="font-semibold text-gray-800 dark:text-gray-200">{{ premioParaConfirmarReduccion?.stockActual }}</span>
                  a
                  <span class="font-semibold text-gray-800 dark:text-gray-200">{{ premioParaConfirmarReduccion?.stockNuevo }}</span>,
                  y el cambio aplica de inmediato para los clientes que estén girando ahora mismo.
                </p>

                <div v-if="errorForm" class="mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 text-left">
                  {{ errorForm }}
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  @click="cancelarReduccionStock"
                  :disabled="guardando"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="confirmarReduccionStockYGuardar"
                  :disabled="guardando"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  <svg v-if="guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ guardando ? 'Guardando…' : 'Sí, reducir stock' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL CONFIRMAR FINALIZAR CAMPAÑA (irreversible)
    ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="mostrarConfirmFinalizar" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" @click.self="cancelarFinalizar">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            appear
          >
            <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
              <div class="p-6 text-center">
                <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 text-2xl">
                  🔒
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Finalizar esta campaña?</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-semibold text-red-600 dark:text-red-400">Esta acción es irreversible.</span>
                  Una vez finalizada, la campaña queda bloqueada de forma permanente: no podrá volver a
                  Activa, Pausada ni Borrador, y no será posible modificar premios, stock ni configuración.
                </p>

                <div v-if="errorEstado" class="mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 text-left">
                  {{ errorEstado }}
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  @click="cancelarFinalizar"
                  :disabled="finalizando"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="finalizarCampana"
                  :disabled="finalizando"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  <svg v-if="finalizando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ finalizando ? 'Finalizando…' : 'Sí, finalizar permanentemente' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal Duplicar Campaña (nueva temporada) ────────────────────────── -->
    <DuplicarCampanaModal
      v-if="campana"
      :open="mostrarDuplicar"
      :campana-id="campanaId"
      :nombre-origen="campana.nombre"
      @close="mostrarDuplicar = false"
      @duplicated="onCampanaDuplicada"
    />

  </div>
</template>
