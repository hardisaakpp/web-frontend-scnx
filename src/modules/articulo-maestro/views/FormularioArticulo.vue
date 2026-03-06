<template>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-5">

            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                        {{ isEdit ? 'Editar Artículo' : 'Nuevo Artículo' }}
                    </h1>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {{ isEdit ? `Modificando: ${route.params.itemCode}` : 'Completa los campos del nuevo artículo' }}
                    </p>
                </div>
                <router-link
                    class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    to="/articulo-maestro/lista">
                    ← Volver a la Lista
                </router-link>
            </div>

            <!-- Loading state (edit mode fetching) -->
            <div v-if="loadingData" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Cargando datos del artículo...
            </div>

            <!-- Error de carga -->
            <div v-else-if="loadError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {{ loadError }}
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="handleSubmit" class="space-y-5">

                <!-- Tabs -->
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <!-- Tab Navigation -->
                    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            type="button"
                            @click="activeTab = tab.id"
                            :class="[
                                'flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                            ]"
                        >
                            {{ tab.label }}
                        </button>
                    </div>

                    <!-- Tab: General -->
                    <div v-show="activeTab === 'general'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field" :class="{ required: !isEdit }">
                            <label>Código Interno (ItemCode)</label>
                            <input v-model="form.itemCode" type="text" :disabled="isEdit" :required="!isEdit" placeholder="Ej: ART-001" />
                            <span v-if="isEdit" class="help">El código no puede cambiarse en edición.</span>
                        </div>
                        <div class="form-field required">
                            <label>Descripción Factura (ItemName)</label>
                            <input v-model="form.itemName" type="text" required placeholder="Nombre del artículo" />
                        </div>
                        <div class="form-field">
                            <label>Código de Barras</label>
                            <input v-model="form.barCode" type="text" placeholder="EAN / UPC" />
                        </div>
                        <div class="form-field">
                            <label>Referencia / SKU sin talla</label>
                            <input v-model="form.uSxxSkuSinTalla" type="text" placeholder="Código padre / referencia" />
                        </div>
                        <div class="form-field">
                            <label>Talla</label>
                            <select v-model="form.uIxxTalla">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.talla" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Género</label>
                            <select v-model="form.uGen">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.genero" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field sm:col-span-2">
                            <label>Descripción SAP (ForeignName)</label>
                            <input v-model="form.foreignName" type="text" placeholder="Nombre en idioma extranjero" />
                        </div>
                        <div class="form-field sm:col-span-2">
                            <label>Descripción Etiqueta (E-commerce)</label>
                            <input v-model="form.uDescEcomm" type="text" placeholder="Texto para etiqueta / tienda online" />
                        </div>
                    </div>

                    <!-- Tab: Categorización -->
                    <div v-show="activeTab === 'cat'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field required">
                            <label>Negocio (U_IXX_MARCA)</label>
                            <select v-model="form.uIxxMarca" required>
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.negocio" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Marca</label>
                            <input v-model="form.uMarca" type="text" placeholder="Ej: ROLLY" />
                        </div>

                        <!-- Jerarquía en cascada: Sección → Categoría → Línea -->
                        <div class="form-field">
                            <label>Sección (U_NV1)</label>
                            <select v-model="form.uNv1" @change="onSeccionChange">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="s in cats.secciones" :key="s" :value="s">{{ s }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Categoría (U_NV2)</label>
                            <select v-model="form.uNv2" @change="onCategoriaChange" :disabled="!form.uNv1">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="c in cats.categorias" :key="c" :value="c">{{ c }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Línea (U_NV3)</label>
                            <select v-model="form.uNv3" :disabled="!form.uNv2">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="l in cats.lineas" :key="l" :value="l">{{ l }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Nombre Colección</label>
                            <select v-model="form.uNomColeccion">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.coleccion" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Estatus de Permanencia</label>
                            <select v-model="form.uReposicion">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.permanencia" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Canal de Venta</label>
                            <select v-model="form.uCanalVenta">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.canal" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Región de Venta</label>
                            <select v-model="form.uRegion">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.region" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- Tab: Color y Material -->
                    <div v-show="activeTab === 'mat'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label>Color Primario</label>
                            <select @change="onColorPrimarioChange($event)">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.color" :key="item.codigo" :value="item.codigo" :selected="String(form.uCodColor) === item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Cód. Color Primario</label>
                            <input :value="form.uCodColor ?? '-'" type="text" disabled />
                            <span class="help">Se asigna automáticamente al seleccionar un color.</span>
                        </div>
                        <div class="form-field">
                            <label>Color Secundario</label>
                            <select @change="onColorSecundarioChange($event)">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.color" :key="item.codigo" :value="item.codigo" :selected="String(form.uCodColSecu) === item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Cód. Color Secundario</label>
                            <input :value="form.uCodColSecu ?? '-'" type="text" disabled />
                            <span class="help">Se asigna automáticamente al seleccionar un color.</span>
                        </div>
                        <div class="form-field">
                            <label>Material</label>
                            <input v-model="form.uIxxMaterial" type="text" placeholder="Tela, Cuero, Sintético..." />
                        </div>
                        <div class="form-field">
                            <label>Composición</label>
                            <input v-model="form.uIxxComposicion" type="text" placeholder="80% Algodón 20% Poliéster" />
                        </div>

                        <!-- Cascada: Línea de Atributo → Atributo Único -->
                        <div class="form-field">
                            <label>Línea de Atributo</label>
                            <select v-model="selectedLineaAtributo" @change="onLineaAtributoChange">
                                <option value="">-- Seleccionar línea --</option>
                                <option v-for="l in cats.lineasAtributo" :key="l" :value="l">{{ l }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Atributo Único Textil/Calzado</label>
                            <select v-model="form.uAtrMed" :disabled="!selectedLineaAtributo">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="a in cats.atributos" :key="a" :value="a">{{ a }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Atributo Único 2</label>
                            <input v-model="form.uAtrUni" type="text" placeholder="Atributo adicional" />
                        </div>
                    </div>

                    <!-- Tab: Logística y Precios -->
                    <div v-show="activeTab === 'log'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label>Código Proveedor</label>
                            <input v-model="form.uCodPvr" type="text" placeholder="Código del proveedor" />
                        </div>
                        <div class="form-field">
                            <label>Origen de Compra</label>
                            <select v-model="form.uOrigen">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.origen" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>País de Origen</label>
                            <select v-model="form.uPOri">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.pais" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Lead Time Proveedor (días)</label>
                            <input v-model.number="form.leadTime" type="number" placeholder="0" min="0" />
                        </div>
                        <div class="form-field">
                            <label>Cantidad Mínima de Compra</label>
                            <input v-model.number="form.minOrderQuantity" type="number" placeholder="1" min="1" />
                        </div>
                        <div class="form-field">
                            <label>Envío Directo a Tienda</label>
                            <select v-model="form.uTipAbs">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.envio" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Unidad de Empaque - Outer</label>
                            <input v-model.number="form.uUnidadDespacho" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label>Unidad de Empaque - Inner</label>
                            <input v-model.number="form.uDespIn" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label>Unidad de Venta (Pack)</label>
                            <input v-model="form.uIxxPack" type="text" placeholder="PAR, UNIDAD..." />
                        </div>
                        <div class="form-field">
                            <label>PVP (Precio)</label>
                            <input v-model.number="form.price" type="number" step="0.01" placeholder="0.00" min="0" />
                        </div>
                        <div class="form-field">
                            <label>Costo de Arranque</label>
                            <input v-model.number="form.uPrArq" type="number" step="0.01" placeholder="0.00" />
                        </div>
                        <div class="form-field">
                            <label>Liquidación</label>
                            <select v-model="form.uLiq">
                                <option value="">-- Seleccionar --</option>
                                <option v-for="item in cats.liquidacion" :key="item.codigo" :value="item.codigo">{{ item.nombre }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- Tab: Config. SAP / Impuestos -->
                    <div v-show="activeTab === 'sap'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field required">
                            <label>Tipo de Artículo (ItemType)</label>
                            <input v-model="form.itemType" type="text" required placeholder="itItems" />
                        </div>
                        <div class="form-field required">
                            <label>Grupo de Artículos (ItemsGroupCode)</label>
                            <input v-model.number="form.itemsGroupCode" type="number" required placeholder="100" />
                        </div>
                        <div class="form-field">
                            <label>Sistema de Evaluación</label>
                            <select v-model="form.costAccountingMethod">
                                <option value="A">A - Promedio</option>
                                <option value="S">S - Estándar</option>
                                <option value="F">F - FIFO</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>GL Method</label>
                            <select v-model="form.glMethod">
                                <option value="C">C - Clase de Artículo</option>
                                <option value="W">W - Almacén</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Artículo de Inventario</label>
                            <select v-model="form.inventoryItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Artículo de Venta</label>
                            <select v-model="form.salesItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Artículo de Compra</label>
                            <select v-model="form.purchaseItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Gestión por Almacén</label>
                            <select v-model="form.manageStockByWarehouse">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>IVA (VATLiable)</label>
                            <select v-model="form.vatLiable">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Retención (WTLiable)</label>
                            <select v-model="form.wtLiable">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Impuesto Indirecto</label>
                            <select v-model="form.indirectTax">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Código Impuesto AR</label>
                            <input v-model="form.arTaxCode" type="text" placeholder="IVA, IVAI..." />
                        </div>
                        <div class="form-field">
                            <label>Código Impuesto AP</label>
                            <input v-model="form.apTaxCode" type="text" placeholder="IVA, IVAI..." />
                        </div>
                        <div class="form-field">
                            <label>Sistema de Planificación</label>
                            <select v-model="form.planningSystem">
                                <option value="M">M - MRP</option>
                                <option value="N">N - Ninguno</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Método de Abastecimiento</label>
                            <select v-model="form.procurementMethod">
                                <option value="B">B - Compra</option>
                                <option value="M">M - Fabricación</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Unidad de Medida Inventario</label>
                            <input v-model="form.inventoryUom" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label>Unidad de Compra</label>
                            <input v-model="form.purchaseUnit" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label>Unidades por Compra</label>
                            <input v-model.number="form.purchaseItemsPerUnit" type="number" placeholder="1" min="1" />
                        </div>
                        <div class="form-field">
                            <label>Unidad de Venta</label>
                            <input v-model="form.salesUnit" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label>Unidades por Venta</label>
                            <input v-model.number="form.salesItemsPerUnit" type="number" placeholder="1" min="1" />
                        </div>
                        <div class="form-field">
                            <label>Gestión por Lotes</label>
                            <select v-model="form.manageBatchNumbers">
                                <option value="N">N - No</option>
                                <option value="Y">Y - Sí</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Fabricante (FirmCode)</label>
                            <input v-model.number="form.manufacturer" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label>Tipo de Envío</label>
                            <input v-model.number="form.shipType" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label>Tipo de Bien</label>
                            <input v-model="form.uTipoBien" type="text" placeholder="Tipo de bien" />
                        </div>
                    </div>
                </div>

                <!-- Error al guardar -->
                <div v-if="submitError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {{ submitError }}
                </div>

                <!-- Botones de acción -->
                <div class="flex items-center justify-end gap-3">
                    <router-link
                        to="/articulo-maestro/lista"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancelar
                    </router-link>
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {{ submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Artículo' }}
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articuloService, catalogoService } from '../services/articuloService'
import type { CatalogoItem } from '../services/articuloService'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.itemCode)

const tabs = [
    { id: 'general', label: 'General' },
    { id: 'cat',     label: 'Categorización' },
    { id: 'mat',     label: 'Color y Material' },
    { id: 'log',     label: 'Logística y Precios' },
    { id: 'sap',     label: 'Config. SAP / Impuestos' },
]
const activeTab = ref('general')

// ─── Catálogos dinámicos ──────────────────────────────────────────────────────
const selectedLineaAtributo = ref('')

const cats = ref<{
    talla: CatalogoItem[]
    genero: CatalogoItem[]
    color: CatalogoItem[]
    coleccion: CatalogoItem[]
    permanencia: CatalogoItem[]
    origen: CatalogoItem[]
    pais: CatalogoItem[]
    envio: CatalogoItem[]
    canal: CatalogoItem[]
    region: CatalogoItem[]
    liquidacion: CatalogoItem[]
    negocio: CatalogoItem[]
    secciones: string[]
    categorias: string[]
    lineas: string[]
    lineasAtributo: string[]
    atributos: string[]
}>({
    talla: [], genero: [], color: [], coleccion: [], permanencia: [],
    origen: [], pais: [], envio: [], canal: [], region: [],
    liquidacion: [], negocio: [],
    secciones: [], categorias: [], lineas: [],
    lineasAtributo: [], atributos: []
})

async function cargarCatalogos() {
    const [talla, genero, color, coleccion, permanencia, origen, pais, envio, canal, region, liquidacion, negocio, secciones, lineasAtributo] = await Promise.allSettled([
        catalogoService.getGenerales('TALLA'),
        catalogoService.getGenerales('GENERO'),
        catalogoService.getGenerales('COLOR'),
        catalogoService.getGenerales('NOMBRE COLECCION'),
        catalogoService.getGenerales('ESTATUS DE PERMANENCIA'),
        catalogoService.getGenerales('ORIGEN DE COMPRA'),
        catalogoService.getGenerales('PAIS DE ORIGEN'),
        catalogoService.getGenerales('ENVIO'),
        catalogoService.getGenerales('CANAL DE VENTA'),
        catalogoService.getGenerales('REGION DE VENTA'),
        catalogoService.getGenerales('LIQUIDACION'),
        catalogoService.getGenerales('NEGOCIO'),
        catalogoService.getSecciones(),
        catalogoService.getLineasAtributo(),
    ])

    if (talla.status === 'fulfilled') cats.value.talla = talla.value
    if (genero.status === 'fulfilled') cats.value.genero = genero.value
    if (color.status === 'fulfilled') cats.value.color = color.value
    if (coleccion.status === 'fulfilled') cats.value.coleccion = coleccion.value
    if (permanencia.status === 'fulfilled') cats.value.permanencia = permanencia.value
    if (origen.status === 'fulfilled') cats.value.origen = origen.value
    if (pais.status === 'fulfilled') cats.value.pais = pais.value
    if (envio.status === 'fulfilled') cats.value.envio = envio.value
    if (canal.status === 'fulfilled') cats.value.canal = canal.value
    if (region.status === 'fulfilled') cats.value.region = region.value
    if (liquidacion.status === 'fulfilled') cats.value.liquidacion = liquidacion.value
    if (negocio.status === 'fulfilled') cats.value.negocio = negocio.value
    if (secciones.status === 'fulfilled') cats.value.secciones = secciones.value
    if (lineasAtributo.status === 'fulfilled') cats.value.lineasAtributo = lineasAtributo.value
}

async function onSeccionChange() {
    form.value.uNv2 = ''
    form.value.uNv3 = ''
    cats.value.categorias = []
    cats.value.lineas = []
    if (form.value.uNv1) {
        try {
            cats.value.categorias = await catalogoService.getCategorias(form.value.uNv1)
        } catch { /* ignorar si no hay */ }
    }
}

async function onCategoriaChange() {
    form.value.uNv3 = ''
    cats.value.lineas = []
    if (form.value.uNv2) {
        try {
            cats.value.lineas = await catalogoService.getLineas(form.value.uNv2)
        } catch { /* ignorar si no hay */ }
    }
}

function onColorPrimarioChange(event: Event) {
    const codigo = (event.target as HTMLSelectElement).value
    if (!codigo) {
        form.value.uCodColor = null
        form.value.uIxxColores = ''
        return
    }
    const found = cats.value.color.find(c => c.codigo === codigo)
    form.value.uCodColor = Number(codigo)
    form.value.uIxxColores = found ? found.nombre : ''
}

function onColorSecundarioChange(event: Event) {
    const codigo = (event.target as HTMLSelectElement).value
    if (!codigo) {
        form.value.uCodColSecu = null
        form.value.uColorSecu = ''
        return
    }
    const found = cats.value.color.find(c => c.codigo === codigo)
    form.value.uCodColSecu = Number(codigo)
    form.value.uColorSecu = found ? found.nombre : ''
}

async function onLineaAtributoChange() {
    form.value.uAtrMed = ''
    cats.value.atributos = []
    if (selectedLineaAtributo.value) {
        try {
            cats.value.atributos = await catalogoService.getAtributos(selectedLineaAtributo.value)
        } catch { /* ignorar si no hay */ }
    }
}

// ─── Formulario ──────────────────────────────────────────────────────────────
const form = ref({
    itemCode: '',
    barCode: '',
    uSxxSkuSinTalla: '',
    uIxxTalla: '',
    itemName: '',
    foreignName: '',
    uDescEcomm: '',
    uGen: '',
    uCodColor: null as number | null,
    uIxxColores: '',
    uCodColSecu: null as number | null,
    uColorSecu: '',
    uIxxMaterial: '',
    uIxxComposicion: '',
    uNv3: '',
    uNv2: '',
    uNv1: '',
    uMarca: '',
    uNomColeccion: '',
    uAtrMed: '',
    uAtrUni: '',
    uIxxPack: '',
    uCodPvr: '',
    uReposicion: '',
    uOrigen: '',
    uPOri: '',
    leadTime: 0,
    minOrderQuantity: 1,
    uTipAbs: '',
    uUnidadDespacho: null as number | null,
    uDespIn: null as number | null,
    uCanalVenta: '',
    uRegion: '',
    uPrArq: null as number | null,
    price: null as number | null,
    uLiq: '',
    itemsGroupCode: null as number | null,
    uIxxMarca: '',
    itemType: 'itItems',
    costAccountingMethod: 'A',
    glMethod: 'C',
    manageStockByWarehouse: 'Y',
    purchaseItem: 'Y',
    salesItem: 'Y',
    inventoryItem: 'Y',
    vatLiable: 'Y',
    wtLiable: 'N',
    indirectTax: 'N',
    arTaxCode: '',
    apTaxCode: '',
    manufacturer: null as number | null,
    shipType: null as number | null,
    manageBatchNumbers: 'N',
    planningSystem: 'M',
    procurementMethod: 'B',
    inventoryUom: '',
    purchaseUnit: '',
    purchaseItemsPerUnit: 1,
    salesUnit: '',
    salesItemsPerUnit: 1,
    uTipoBien: '',
    properties63: 'N',
    properties64: 'N',
})

const loadingData = ref(false)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')

// En edición: cargar los datos del artículo desde la API y pre-poblar la jerarquía de catálogos
onMounted(async () => {
    await cargarCatalogos()

    if (isEdit.value) {
        const itemCode = route.params.itemCode as string
        loadingData.value = true
        try {
            const articulo = await articuloService.getArticuloByCode(itemCode)
            // Rellenar el form con los datos recibidos
            Object.keys(form.value).forEach(key => {
                const k = key as keyof typeof form.value
                if (articulo && key in articulo) {
                    const val = (articulo as Record<string, unknown>)[key]
                    if (val !== undefined && val !== null) {
                        (form.value as Record<string, unknown>)[k] = val
                    }
                }
            })

            // Cargar la jerarquía en cascada si existen valores guardados
            if (form.value.uNv1) {
                cats.value.categorias = await catalogoService.getCategorias(form.value.uNv1).catch(() => [])
            }
            if (form.value.uNv2) {
                cats.value.lineas = await catalogoService.getLineas(form.value.uNv2).catch(() => [])
            }

            // Si el artículo tiene un atributo único, intentar encontrar la línea de atributo correspondiente
            if (form.value.uAtrMed && cats.value.lineasAtributo.length > 0) {
                // Intentar buscar en cada línea cuál contiene el atributo guardado
                for (const linea of cats.value.lineasAtributo) {
                    try {
                        const attrs = await catalogoService.getAtributos(linea)
                        if (attrs.includes(form.value.uAtrMed)) {
                            selectedLineaAtributo.value = linea
                            cats.value.atributos = attrs
                            break
                        }
                    } catch { /* continuar buscando */ }
                }
            }
        } catch (err) {
            loadError.value = `No se pudo cargar el artículo "${itemCode}". Verifica que el código es correcto.`
            console.error(err)
        } finally {
            loadingData.value = false
        }
    }
})

// Guardar formulario
async function handleSubmit() {
    submitting.value = true
    submitError.value = ''

    // Construir el payload omitiendo nulos y strings vacíos opcionales
    const payload: Record<string, unknown> = {}
    Object.entries(form.value).forEach(([key, val]) => {
        if (val === '' || val === null || val === undefined) return
        payload[key] = val
    })

    try {
        if (isEdit.value) {
            const itemCode = route.params.itemCode as string
            await articuloService.updateArticulo(itemCode, payload)
        } else {
            await articuloService.createArticulo(payload)
        }
        router.push('/articulo-maestro/lista')
    } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] } } }
        const detail = axiosErr?.response?.data?.detail
        if (Array.isArray(detail)) {
            submitError.value = detail.map(d => d.msg).join('. ')
        } else if (typeof detail === 'string') {
            submitError.value = detail
        } else {
            submitError.value = 'Ocurrió un error al guardar. Revisa los datos e inténtalo de nuevo.'
        }
        console.error(err)
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.form-field {
    @apply flex flex-col gap-1.5;
}
.form-field label {
    @apply text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide;
}
.form-field.required label::after {
    content: ' *';
    @apply text-red-500;
}
.form-field input,
.form-field select {
    @apply w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900
           px-3 py-2 text-sm text-gray-900 dark:text-white
           placeholder:text-gray-400 dark:placeholder:text-gray-600
           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all;
}
.form-field input:disabled,
.form-field select:disabled {
    @apply opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800;
}
.form-field .help {
    @apply text-xs text-gray-400 dark:text-gray-500;
}
</style>
