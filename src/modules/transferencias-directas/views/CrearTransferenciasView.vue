<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'
import FormField from '../components/FormField.vue'
import { useAuthStore } from '@/stores/auth.js'
import { CANTIDAD_MAX, CrearSolicitudRequest, DetalleLinea, ProductoBusqueda, SolicitudDetalle, TiendaDestino, type StockFaltante } from '../types.js'
import { parsearErrorSolicitud } from '../utils/erroresApi'
import { randomUUID } from '@/utils/uuid'
import ErrorStockFaltante from '../components/ErrorStockFaltante.vue'
import almacenesService from '../services/almacenesServices.js'
import BuscadorProductos from '../components/BuscadorProductos.vue'
import { useRoute, useRouter } from 'vue-router'
import TablaDetalleProductos from '../components/TablaDetalleProductos.vue'
import ResumenTransferencia from '../components/ResumenTransferencia.vue'
import transferenciasService from '../services/transferenciasService.js'
import CargandoSpinner from '../components/CargandoSpinner.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ModalGuiaLaar from '../components/ModalGuiaLaar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const idEdicion = computed(() => (route.params.id ? Number(route.params.id) : null))
const modoEdicion = computed(() => idEdicion.value !== null)
const cargandoDetalle = ref(false)
const faltantesSubmit = ref<StockFaltante[]>([])

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800'

const selectClass = inputClass
const textareaClass = `${inputClass} resize-none`

const onResponsableInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  form.usuarioSolicitante = target.value.toUpperCase()
}

const fechaHoy = computed(() => new Date().toLocaleDateString(APP_LOCALE))
const puedeElegirOrigen = computed(() => authStore.hasPermission('transferenciadirecta.filtro_todastiendas'))

const detalle = ref<SolicitudDetalle | null>(null)
const formatFecha = (iso: string) => (iso ? new Date(iso).toLocaleDateString(APP_LOCALE) : '')
const bloqueadoEdicion = computed(
  () => modoEdicion.value && detalle.value != null && detalle.value.estado !== 'Borrador'
)


const codigoTiendaUsuario = computed<string>(() => {
  const accesses: any = authStore.userWarehouseAccesses
  const lista = Array.isArray(accesses) ? accesses : [accesses]
  return lista?.[0]?.codAlmacen ?? ''
})

const tiendasDestino = ref<TiendaDestino[]>([])
const tiendasOrigen=ref<TiendaDestino[]>([])
const cargandoTiendas = ref(false)
const errorTiendas = ref('')
const guardando = ref(false)
const errorSubmit = ref('')

// Clave de idempotencia: se genera UNA vez al abrir el formulario. Si el usuario
// reintenta (por timeout o error), viaja la misma y el backend no duplica.
const idempotencyKey = ref(randomUUID())

const nombreTiendaUsuario = computed(() => {
  const t = tiendasOrigen.value.find((x) => x.whsCode === codigoTiendaUsuario.value)
  return t?.whsNombre ?? codigoTiendaUsuario.value
})

const whsCodeOrigen = computed(() =>
  modoEdicion.value ? (detalle.value?.tiendaOrigenCodigo ?? '') : form.tiendaOrigenCodigo
)

const form = reactive({
  usuarioSolicitante: '',
  tiendaOrigenCodigo: '',   
  tiendaDestinoCodigo: '',  
  tiendaDestinoNombre: '',  
  guiaEnvio: '',
  justificacion: '',
})

const errores = reactive<Record<string, string>>({})
const limpiarErrores = () => {
  Object.keys(errores).forEach((k) => delete errores[k])
}
const limpiar = () => {
  productos.value = []
  form.usuarioSolicitante = ''
  form.guiaEnvio = ''
  form.justificacion = ''
  destinoSeleccionado.value = ''
  form.tiendaDestinoCodigo = ''
  form.tiendaDestinoNombre = ''
  if (puedeElegirOrigen.value) {
    origenSeleccionado.value = ''
    form.tiendaOrigenCodigo = ''
  }
  limpiarErrores()
  errorSubmit.value = ''
  faltantesSubmit.value = []
  idempotencyKey.value = randomUUID() // formulario nuevo ⇒ clave nueva
}

const destinoSeleccionado = ref('')
watch(destinoSeleccionado, (whsCode) => {
  const t = tiendasDestino.value.find((x) => x.whsCode === whsCode)
  form.tiendaDestinoCodigo = t?.uBogTra ?? ''
  form.tiendaDestinoNombre = t?.whsNombre ?? ''
})

// Cambiar la tienda origen invalida el stock visto: se pide confirmación y se
// vacía el detalle. Si el usuario cancela, se revierte al valor anterior (la
// bandera evita que esa reversión vuelva a disparar la confirmación).
const origenSeleccionado = ref('')
const confirmarCambioOrigen = ref(false)
let revirtiendoOrigen = false

watch(origenSeleccionado, (whsCode, anterior) => {
  if (revirtiendoOrigen) { revirtiendoOrigen = false; return }

  if (productos.value.length > 0 && anterior) {
    origenAnterior = anterior
    origenPendiente = whsCode
    confirmarCambioOrigen.value = true
    return
  }
  form.tiendaOrigenCodigo = whsCode
})

let origenAnterior = ''
let origenPendiente = ''

const aceptarCambioOrigen = () => {
  productos.value = []
  form.tiendaOrigenCodigo = origenPendiente
  confirmarCambioOrigen.value = false
}

const cancelarCambioOrigen = () => {
  revirtiendoOrigen = true
  origenSeleccionado.value = origenAnterior
  confirmarCambioOrigen.value = false
}

onMounted(async () => {
  if (modoEdicion.value) {
    await cargarParaEditar(idEdicion.value!)
    return
  }
  //crear
  if (!puedeElegirOrigen.value) form.tiendaOrigenCodigo = codigoTiendaUsuario.value
  cargandoTiendas.value = true
  errorTiendas.value = ''
  try {
    const [destino, origen] = await Promise.all([
      almacenesService.listar('Destino'),
      almacenesService.listar('Origen')
    ])
    tiendasDestino.value=destino
    tiendasOrigen.value=origen
  } catch {
    errorTiendas.value = 'No se pudieron cargar las tiendas.'
  } finally {
    cargandoTiendas.value = false
  }
})

const productos = ref<DetalleLinea[]>([])


// Regla de picking: si el itemCode ya está, SUMA; si no, crea la fila
// El stock ya no se valida aquí: lo valida el backend al enviar a aprobación (RN-22).
const agregarAlDetalle = (p: ProductoBusqueda, cantidad: number) => {
  const existente = productos.value.find((x) => x.itemCode === p.itemCode)
  if (existente) {
    // Al consolidar tampoco se supera el tope por producto
    existente.cantidadSolicitada = Math.min(existente.cantidadSolicitada + cantidad, CANTIDAD_MAX)
  } else {
    productos.value.push({
      itemCode: p.itemCode,
      codeBars: p.codeBars,
      itemName: p.itemName,
      foreignName: p.foreignName,
      cantidadSolicitada: cantidad,
    })
  }
  if (errores.productos) delete errores.productos
}
const eliminarDelDetalle = (itemCode: string) => {
  productos.value = productos.value.filter((p) => p.itemCode !== itemCode)
}

// Ajuste de cantidad desde el stepper de la tabla de detalle
const cambiarCantidadDetalle = (itemCode: string, cantidad: number) => {
  const linea = productos.value.find((p) => p.itemCode === itemCode)
  if (linea) linea.cantidadSolicitada = cantidad
}
const rutaVolver = computed(() => (modoEdicion.value ? '/transferencias-stock/historial' : '/transferencias-stock'))

const cancelar = () => {
  router.push(rutaVolver.value)
}

//payload para crear transferencia
const construirPayload = (enviarAAprobacion: boolean): CrearSolicitudRequest => ({
  usuarioSolicitante: form.usuarioSolicitante.trim(),
  tiendaOrigenCodigo: form.tiendaOrigenCodigo,
  tiendaDestinoCodigo: form.tiendaDestinoCodigo,
  tiendaDestinoNombre: form.tiendaDestinoNombre,
  justificacion: form.justificacion.trim() || '',
  // Sin guía (Guardar Borrador) el campo se omite: solo viaja al enviar a aprobación.
  guiaEnvio: form.guiaEnvio.trim().toUpperCase() || undefined,
  enviarAAprobacion,
  idempotencyKey: idempotencyKey.value,
  detalles: productos.value.map((p) => ({
    itemCode: p.itemCode,
    codeBars: p.codeBars,
    itemName: p.itemName,
    foreignName: p.foreignName,
    cantidadSolicitada: p.cantidadSolicitada,
  })),
})

// Validación en frontend, campo por campo, en el ORDEN del formulario
const validar = (): boolean => {
  limpiarErrores()

  if (!modoEdicion.value) {
    if (!form.tiendaOrigenCodigo) errores.tiendaOrigenCodigo = 'No se pudo determinar la tienda origen.'
    if (!form.tiendaDestinoCodigo) errores.tiendaDestinoCodigo = 'Selecciona la tienda destino.'
    if (!form.usuarioSolicitante.trim()) errores.usuarioSolicitante = 'Ingresa el responsable del envío.'
  }

  // La guía LAAR no se valida aquí: se pide en ModalGuiaLaar al enviar a
  // aprobación, que es cuando el usuario ya despachó y tiene el número real.

  if (productos.value.length === 0) errores.productos = 'Agrega al menos un producto.'
  const primerError = Object.keys(errores)[0]
  if (primerError) {
    requestAnimationFrame(() => {
      document.getElementById(primerError)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById(primerError)?.focus()
    })
  }

  return Object.keys(errores).length === 0
}

const enviar = async (enviarAAprobacion: boolean) => {
  if (!validar()) return
  if (guardando.value) return // evita un segundo envío mientras el primero está en curso
  guardando.value = true
  errorSubmit.value = ''
  faltantesSubmit.value = []
  try {
    await transferenciasService.crear(construirPayload(enviarAAprobacion))
    // No se reactiva el botón: la vista se desmonta al navegar. Reactivarlo aquí
    // dejaba una ventana en la que se podía volver a enviar (causó una duplicación).
    router.push({ name: 'transferencias-stock-historial' })
  } catch (e: any) {
    manejarErrorSubmit(e)
    guardando.value = false // solo se reactiva si hubo error y el usuario debe corregir
  }
}

const guardarBorrador = () => enviar(false)

// Enviar a aprobación pide primero la guía LAAR: el borrador puede guardarse sin
// ella, pero nada llega a aprobación sin guía.
const guiaAbierto = ref(false)
const abrirModalGuia = () => {
  if (!validar()) return // no pedir la guía si el formulario aún tiene errores
  errorSubmit.value = ''
  faltantesSubmit.value = []
  guiaAbierto.value = true
}
const cerrarModalGuia = () => {
  if (guardando.value) return
  guiaAbierto.value = false
}
const confirmarGuiaYEnviar = async (guia: string) => {
  form.guiaEnvio = guia
  await enviar(true)
  // Si falló, el modal queda abierto mostrando el error (faltantes de stock,
  // validaciones del back). Si tuvo éxito, la vista se desmonta al navegar.
}

const manejarErrorSubmit = (e: any) => {
  const { faltantes } = parsearErrorSolicitud(e)
  faltantesSubmit.value = faltantes ?? []
  const status = e?.response?.status
  const msg = e?.response?.data?.error ?? e?.response?.data?.mensaje
  // Timeout: la petición se cortó sin respuesta, pero el backend pudo haberla
  // procesado. Se evita el mensaje de "intenta de nuevo" para no inducir un reintento.
  if (e?.code === 'ECONNABORTED') {
    errorSubmit.value =
      'La solicitud está tardando más de lo esperado. Revisa el Historial: si no aparece, guárdala como Borrador y envíala a aprobación más tarde.'
    return
  }
  if (status === 400) errorSubmit.value = msg ?? 'Datos inválidos. Revisa el formulario.'
  else if (status === 404) errorSubmit.value = 'No se encontró el recurso.'
  else if (status === 409) errorSubmit.value = msg ?? 'La solicitud ya no está en Borrador.'
  // 503: SAP no respondió. El backend manda un mensaje explicativo; se muestra tal cual.
  else if (status === 503) errorSubmit.value = msg ?? 'SAP no está disponible en este momento. Intenta más tarde.'
  else errorSubmit.value = 'Ocurrió un error al guardar. Intenta de nuevo.'
}

const cargarParaEditar = async (id: number) => {
  cargandoDetalle.value = true
  errorSubmit.value = ''
  faltantesSubmit.value = []
  try {
    const d = await transferenciasService.obtenerDetalle(id)
    detalle.value = d
    if (d.estado !== 'Borrador') {
      errorSubmit.value = 'Esta solicitud ya no está en Borrador; no se puede editar.'
    }
    // Prefill de los campos EDITABLES (los demás son solo lectura)
    form.usuarioSolicitante = d.usuarioSolicitante
    form.guiaEnvio = d.guiaEnvio ?? ''
    form.justificacion = d.justificacion ?? ''
    productos.value = d.productos.map((p) => ({ ...p }))
  } catch {
    errorSubmit.value = 'No se pudo cargar la solicitud para editar.'
  } finally {
    cargandoDetalle.value = false
  }
}

const guardarEdicion = async () => {
  if (!validar()) return
  guardando.value = true
  errorSubmit.value = ''
  faltantesSubmit.value = []
  try {
    await transferenciasService.actualizar(idEdicion.value!, {
      justificacion: form.justificacion.trim() || undefined,
      // La guía ya no se edita aquí (se pide al enviar a aprobación): se reenvía
      // la guardada para que el PUT no la borre.
      guiaEnvio: detalle.value?.guiaEnvio?.trim().toUpperCase() || undefined,
      detalles: productos.value.map((p) => ({
        itemCode: p.itemCode,
        codeBars: p.codeBars,
        itemName: p.itemName,
        foreignName: p.foreignName,
        cantidadSolicitada: p.cantidadSolicitada,
      })),
    })
    router.push({ name: 'transferencias-stock-historial' })
  } catch (e: any) {
    manejarErrorSubmit(e)
  } finally {
    guardando.value = false
  }
}



</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div class="flex items-center gap-4">
      <router-link :to="rutaVolver"
        class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          {{ modoEdicion ? 'Editar Transferencia' : 'Crear Transferencia' }}
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ modoEdicion ? 'Solo puedes cambiar guía, observaciones y productos.' : 'Completa los datos de la solicitud y agrega los productos a transferir.' }}
        </p>
      </div>
    </div>
    <div v-if="modoEdicion && cargandoDetalle"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <CargandoSpinner mensaje="Cargando solicitud…" />
    </div>

    <section v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <!-- Datos Generales -->
      <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Datos Generales
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
          <FormField label="Fecha de Creación" v-slot="{ id }">
            <div class="relative">
              <input :id="id" type="text"
                :value="modoEdicion && detalle ? formatFecha(detalle.fechaSolicitud) : fechaHoy" disabled
                :class="[inputClass, 'pr-10 cursor-default bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400']" />
              <CalendarDaysIcon
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </FormField>
          <FormField label="Almacén Origen" required :error="errores.tiendaOrigenCodigo" v-slot="{ id }">
            <input v-if="modoEdicion" :id="id" type="text" :value="detalle?.tiendaOrigen ?? ''" disabled
              :class="inputClass" />
            <select v-else-if="puedeElegirOrigen" :id="id" v-model="origenSeleccionado" :class="selectClass"
              :disabled="cargandoTiendas">
              <option value="" disabled>{{ cargandoTiendas ? 'Cargando…' : 'Seleccione una tienda…' }}</option>
              <option v-for="t in tiendasOrigen" :key="t.whsCode" :value="t.whsCode">{{ t.whsNombre }}</option>
            </select>
            <input v-else :id="id" type="text" :value="nombreTiendaUsuario" disabled :class="inputClass" />
          </FormField>

          <FormField label="Almacén Destino (Tránsito)" required :error="errores.tiendaDestinoCodigo" v-slot="{ id }">
            <input v-if="modoEdicion" :id="id" type="text" :value="detalle?.tiendaDestino ?? ''" disabled
              :class="inputClass" />
            <select v-else :id="id" v-model="destinoSeleccionado" :class="selectClass" :disabled="cargandoTiendas">
              <option value="" disabled>{{ cargandoTiendas ? 'Cargando…' : 'Seleccione una tienda…' }}</option>
              <option v-for="t in tiendasDestino" :key="t.whsCode" :value="t.whsCode">{{ t.uBogTra }}</option>
            </select>
          </FormField>

          <FormField label="Responsable del Envío" required :error="errores.usuarioSolicitante" v-slot="{ id }">
            <input :id="id" :value="form.usuarioSolicitante" @input="onResponsableInput" type="text"
              placeholder="Nombre del responsable" :class="[inputClass, 'uppercase']" maxlength="139"
              :disabled="modoEdicion" />
          </FormField>

          <FormField label="Observaciones" class="lg:col-span-2" v-slot="{ id }">
            <textarea :id="id" v-model="form.justificacion" rows="1" placeholder="Detalle opcional de la transferencia…"
              :class="textareaClass" maxlength="100"></textarea>
          </FormField>
        </div>
        <p v-if="errorTiendas" class="mt-3 text-xs text-red-600 dark:text-red-400">{{ errorTiendas }}</p>
      </div>

      <!-- Bloque: Búsqueda de Productos -->
      <div class="px-5 py-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Búsqueda de Productos
        </h3>
        <buscador-productos :whs-code-origen="whsCodeOrigen" @agregar="agregarAlDetalle" />
      </div>
      <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 ">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Detalle de Productos
        </h3>
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1 min-w-0">
            <TablaDetalleProductos :productos="productos" @eliminar="eliminarDelDetalle"
              @cambiar-cantidad="cambiarCantidadDetalle" />
          </div>
          <div class="lg:w-64 shrink-0">
            <ResumenTransferencia :productos="productos" />
          </div>
        </div>
        <p v-if="errores.productos" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ errores.productos }}</p>
      </div>
      <!-- Footer -->
      <div class="px-5 py-4 space-y-3">
        <ErrorStockFaltante v-if="errorSubmit && faltantesSubmit.length > 0" :mensaje="errorSubmit"
          :faltantes="faltantesSubmit" />
        <p v-else-if="errorSubmit" class="text-xs text-red-600 dark:text-red-400">{{ errorSubmit }}</p>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Limpiar: solo en Crear -->
            <button v-if="!modoEdicion" type="button" @click="limpiar" :disabled="guardando"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
              Limpiar
            </button>
            <button type="button" @click="cancelar" :disabled="guardando"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
              Cancelar
            </button>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Guardar Borrador: Crear=POST · Editar=PUT -->
            <button type="button" @click="modoEdicion ? guardarEdicion() : guardarBorrador()"
              :disabled="guardando || bloqueadoEdicion"
              class="px-4 py-2 rounded-lg border border-blue-600 dark:border-blue-500 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60 transition-colors">
              {{ guardando ? 'Guardando…' : 'Guardar Borrador' }}
            </button>
            <!-- Enviar a Aprobación: solo en Crear -->
            <button v-if="!modoEdicion" type="button" @click="abrirModalGuia" :disabled="guardando"
              class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors shadow-sm">
              {{ guardando ? 'Enviando…' : 'Enviar a Aprobación' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <ModalConfirmacion :abierto="confirmarCambioOrigen" titulo="Cambiar tienda origen"
      mensaje="Los productos agregados se eliminarán, ya que el stock disponible corresponde a la tienda anterior. ¿Desea continuar?"
      texto-confirmar="Cambiar" variante="peligro" @confirmar="aceptarCambioOrigen"
      @cancelar="cancelarCambioOrigen" />

    <!-- Guía LAAR: se pide al enviar a aprobación, no en el formulario. -->
    <ModalGuiaLaar :abierto="guiaAbierto" :cargando="guardando" :error="errorSubmit" :faltantes="faltantesSubmit"
      @confirmar="confirmarGuiaYEnviar" @cancelar="cerrarModalGuia" />

    <!-- Bloquea toda la pantalla mientras se guarda: la validación con SAP tarda y
         sin esto el usuario puede seguir editando el detalle que ya se envió.
         Con el modal de guía abierto no se muestra: ese modal ya indica el progreso. -->
    <div v-if="guardando && !guiaAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div
        class="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="mx-auto animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">Validando stock con SAP…</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Esto puede tardar unos segundos. Por favor, no cierres esta ventana.
        </p>
      </div>
    </div>
  </div>
</template>
