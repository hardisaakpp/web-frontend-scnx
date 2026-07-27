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
            <form v-else @submit.prevent="handleSubmit" novalidate class="space-y-5">

                <!-- Tabs -->
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <!-- Tab Navigation -->
                    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            type="button"
                            @click="activeTab = tab.id"
                            :class="[
                                'flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative',
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                                tabsWithErrors.has(tab.id) && showValidationErrors ? 'text-red-500' : ''
                            ]"
                        >
                            {{ tab.label }}
                            <span v-if="tabsWithErrors.has(tab.id) && showValidationErrors" class="absolute top-2 right-2 flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </button>
                    </div>

                    <!-- Banner de Bloqueo Estructural -->
                    <div v-if="isEdit && form.isStructuralLocked" class="m-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex gap-3">
                        <svg class="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <div>
                            <h4 class="text-sm font-bold text-amber-800 dark:text-amber-300">Modificación Estructural Bloqueada</h4>
                            <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">Este artículo ya se ha sincronizado con SAP. Los campos estructurales (Jerarquía y Marca) no pueden modificarse.</p>
                        </div>
                    </div>

                    <!-- Tab: General -->
                    <div v-show="activeTab === 'general'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label for="formItemCode">Código Interno (ItemCode)</label>
                            <input id="formItemCode" :value="form.itemCode" type="text" disabled placeholder="[Generación Automática en Backend]" />
                            <span v-if="!isEdit" class="help">Se genera automáticamente al crear.</span>
                        </div>
                        <div class="form-field">
                            <label for="formItemName">Descripción Factura (ItemName)</label>
                            <input id="formItemName" v-model="form.itemName" type="text" disabled placeholder="Generado automáticamente..." />
                            <span class="help">N3 + Género + Marca + Atributo + Color + Pack</span>
                        </div>

                        <!-- Nuevos campos SIS-CCPYTD-00014 -->
                        <div class="form-field sm:col-span-2 flex flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <input id="formTieneCodigoProveedor" v-model="form.tieneCodigoProveedor" type="checkbox" class="w-5 h-5 text-blue-600 rounded border-gray-300" />
                            <label for="formTieneCodigoProveedor" class="!text-sm !m-0 !font-medium">¿El producto posee código de barras del proveedor?</label>
                        </div>
                        <div class="form-field">
                            <label for="formBarCode">Código de Barras</label>
                            <input id="formBarCode" v-model="form.barCode" type="text" :placeholder="form.tieneCodigoProveedor ? 'EAN / UPC' : '[Asignación Automática desde Bolsa]'" :disabled="!form.tieneCodigoProveedor" />
                        </div>
                        <div class="form-field">
                            <label for="formCodigoAlterno">Código Alterno</label>
                            <input id="formCodigoAlterno" v-model="form.codigoAlterno" type="text" placeholder="Código interno alterno" />
                        </div>
                        <div class="form-field">
                            <label for="formSkuSinTalla">Referencia / SKU sin talla</label>
                            <input id="formSkuSinTalla" v-model="form.uSxxSkuSinTalla" type="text" placeholder="Código padre / referencia" />
                        </div>
                        <div class="form-field">
                            <label for="selectTalla">Talla</label>
                            <SearchableSelect
                                inputId="selectTalla"
                                v-model="form.uIxxTalla"
                                :options="cats.talla"
                                placeholder="Seleccionar talla..."
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectGenero">Género</label>
                            <SearchableSelect
                                inputId="selectGenero"
                                v-model="form.uGen"
                                :options="cats.genero"
                                placeholder="Seleccionar género..."
                            />
                        </div>

                        <div class="form-field sm:col-span-2">
                            <label for="formForeignName">Descripción SAP (ForeignName)</label>
                            <input id="formForeignName" v-model="form.foreignName" type="text" placeholder="Nombre en idioma extranjero" />
                        </div>
                        <div class="form-field sm:col-span-2">
                            <label for="formDescEcomm">Descripción Etiqueta (E-commerce)</label>
                            <input id="formDescEcomm" v-model="form.uDescEcomm" type="text" placeholder="Texto para etiqueta / tienda online" />
                        </div>
                    </div>

                    <!-- Tab: Categorización -->
                    <div v-show="activeTab === 'cat'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field required">
                            <label for="selectNegocio">Negocio (U_IXX_MARCA)</label>
                            <SearchableSelect
                                inputId="selectNegocio"
                                v-model="form.uIxxMarca"
                                :options="cats.negocio"
                                placeholder="Seleccionar negocio..."
                                required
                            />
                        </div>

                        <div class="form-field">
                            <label for="formMarca">Marca</label>
                            <input id="formMarca" v-model="form.uMarca" type="text" placeholder="Ej: ROLLY" :disabled="form.isStructuralLocked" :title="form.isStructuralLocked ? 'El artículo posee historial en SAP y no puede modificar su estructura' : ''" />
                        </div>

                        <!-- Jerarquía en cascada: Sección → Categoría → Línea -->
                        <div class="form-field">
                            <label for="selectSeccion">Sección (U_NV1)</label>
                            <SearchableSelect
                                inputId="selectSeccion"
                                v-model="form.uNv1"
                                :options="cats.secciones"
                                placeholder="Seleccionar sección..."
                                @change="onSeccionChange"
                                valueKey="nombre"
                                :disabled="form.isStructuralLocked"
                                :title="form.isStructuralLocked ? 'El artículo posee historial en SAP y no puede modificar su estructura' : ''"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectCategoria">Categoría (U_NV2)</label>
                            <SearchableSelect
                                inputId="selectCategoria"
                                v-model="form.uNv2"
                                :options="cats.categorias"
                                placeholder="Seleccionar categoría..."
                                :disabled="!form.uNv1 || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? 'El artículo posee historial en SAP y no puede modificar su estructura' : ''"
                                @change="onCategoriaChange"
                                valueKey="nombre"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectLinea">Línea (U_NV3)</label>
                            <SearchableSelect
                                inputId="selectLinea"
                                v-model="form.uNv3"
                                :options="cats.lineas"
                                placeholder="Seleccionar línea..."
                                :disabled="!form.uNv2 || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? 'El artículo posee historial en SAP y no puede modificar su estructura' : ''"
                                valueKey="nombre"
                            />
                        </div>

                        <div class="form-field">
                            <label for="selectColeccion">Nombre Colección</label>
                            <SearchableSelect
                                inputId="selectColeccion"
                                v-model="form.uNomColeccion"
                                :options="cats.coleccion"
                                placeholder="Seleccionar colección..."
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectPermanencia">Estatus de Permanencia</label>
                            <SearchableSelect
                                inputId="selectPermanencia"
                                v-model="form.uReposicion"
                                :options="cats.permanencia"
                                placeholder="Seleccionar estatus..."
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectCanal">Canal de Venta</label>
                            <SearchableSelect
                                inputId="selectCanal"
                                v-model="form.uCanalVenta"
                                :options="cats.canal"
                                placeholder="Seleccionar canal..."
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectRegion">Región de Venta</label>
                            <SearchableSelect
                                inputId="selectRegion"
                                v-model="form.uRegion"
                                :options="cats.region"
                                placeholder="Seleccionar región..."
                            />
                        </div>

                    </div>

                    <!-- Tab: Color y Material -->
                    <div v-show="activeTab === 'mat'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label for="selectColorPrimario">Color Primario</label>
                            <SearchableSelect
                                inputId="selectColorPrimario"
                                :modelValue="form.uCodColor"
                                :options="cats.color"
                                placeholder="Seleccionar color..."
                                @change="onColorPrimarioChangeManual"
                                valueKey="codigo"
                            />
                        </div>
                        <div class="form-field">
                            <label for="formCodColorDisplay">Cód. Color Primario</label>
                            <input id="formCodColorDisplay" :value="form.uCodColor ?? '-'" type="text" disabled />
                            <span class="help">Se asigna automáticamente al seleccionar un color.</span>
                        </div>
                        <div class="form-field">
                            <label for="selectColorSecundario">Color Secundario</label>
                            <SearchableSelect
                                inputId="selectColorSecundario"
                                :modelValue="form.uCodColSecu"
                                :options="cats.color"
                                placeholder="Seleccionar color..."
                                @change="onColorSecundarioChangeManual"
                                valueKey="codigo"
                            />
                        </div>

                        <div class="form-field">
                            <label for="formCodColSecuDisplay">Cód. Color Secundario</label>
                            <input id="formCodColSecuDisplay" :value="form.uCodColSecu ?? '-'" type="text" disabled />
                            <span class="help">Se asigna automáticamente al seleccionar un color.</span>
                        </div>
                        <div class="form-field">
                            <label for="formMaterial">Material</label>
                            <input id="formMaterial" v-model="form.uIxxMaterial" type="text" placeholder="Tela, Cuero, Sintético..." />
                        </div>
                        <div class="form-field">
                            <label for="formComposicion">Composición</label>
                            <input id="formComposicion" v-model="form.uIxxComposicion" type="text" placeholder="80% Algodón 20% Poliéster" />
                        </div>

                        <!-- Cascada: Línea de Atributo → Atributo Único -->
                        <div class="form-field">
                            <label for="selectLineaAtributo">Línea de Atributo</label>
                            <SearchableSelect
                                inputId="selectLineaAtributo"
                                v-model="selectedLineaAtributo"
                                :options="cats.lineasAtributo"
                                placeholder="Seleccionar línea..."
                                @change="onLineaAtributoChange"
                                valueKey="nombre"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectAtributo">Atributo Único Textil/Calzado</label>
                            <SearchableSelect
                                inputId="selectAtributo"
                                v-model="form.uAtrMed"
                                :options="cats.atributos"
                                placeholder="Seleccionar atributo..."
                                :disabled="!selectedLineaAtributo || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? 'El artículo posee historial en SAP y no puede modificar su estructura' : ''"
                                valueKey="nombre"
                            />
                        </div>

                        <div class="form-field">
                            <label for="formAtrUni">Atributo Único 2</label>
                            <input id="formAtrUni" v-model="form.uAtrUni" type="text" placeholder="Atributo adicional" />
                        </div>
                    </div>

                    <!-- Tab: Logística y Precios -->
                    <div v-show="activeTab === 'log'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label for="formCodPvr">Código Proveedor</label>
                            <input id="formCodPvr" v-model="form.uCodPvr" type="text" placeholder="Código del proveedor" />
                        </div>
                        <div class="form-field">
                            <label for="selectOrigen">Origen de Compra</label>
                            <SearchableSelect
                                inputId="selectOrigen"
                                v-model="form.uOrigen"
                                :options="cats.origen"
                                placeholder="Seleccionar origen..."
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectPais">País de Origen</label>
                            <SearchableSelect
                                inputId="selectPais"
                                v-model="form.uPOri"
                                :options="cats.pais"
                                placeholder="Seleccionar país..."
                            />
                        </div>

                        <div class="form-field">
                            <label for="formLeadTime">Lead Time Proveedor (días)</label>
                            <input id="formLeadTime" v-model.number="form.leadTime" type="number" placeholder="0" min="0" />
                        </div>
                        <div class="form-field">
                            <label for="formMinOrder">Cantidad Mínima de Compra</label>
                            <input id="formMinOrder" v-model.number="form.minOrderQuantity" type="number" placeholder="1" min="0" />
                        </div>
                        <div class="form-field">
                            <label for="selectEnvio">Envío Directo a Tienda</label>
                            <SearchableSelect
                                inputId="selectEnvio"
                                v-model="form.uTipAbs"
                                :options="cats.envio"
                                placeholder="Seleccionar tipo..."
                            />
                        </div>

                        <div class="form-field">
                            <label for="formUnidadDespacho">Unidad de Empaque - Outer</label>
                            <input id="formUnidadDespacho" v-model.number="form.uUnidadDespacho" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label for="formDespIn">Unidad de Empaque - Inner</label>
                            <input id="formDespIn" v-model.number="form.uDespIn" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label for="formPack">Unidad de Venta (Pack)</label>
                            <input id="formPack" v-model="form.uIxxPack" type="text" placeholder="PAR, UNIDAD..." />
                        </div>
                        <div class="form-field">
                            <label for="formPrice">PVP (Precio)</label>
                            <input id="formPrice" v-model.number="form.price" type="number" step="0.01" placeholder="0.00" min="0" />
                        </div>
                        <div class="form-field">
                            <label for="selectListaPrecios">Lista de Precios</label>
                            <SearchableSelect
                                inputId="selectListaPrecios"
                                v-model="form.idListaPrecios"
                                :options="cats.priceLists"
                                placeholder="Seleccionar lista..."
                                valueKey="id"
                            />
                        </div>
                        <div class="form-field">
                            <label for="formCostoArranque">Costo de Arranque</label>
                            <input id="formCostoArranque" v-model.number="form.costoArranque" type="number" step="0.01" placeholder="0.00" />
                        </div>
                        <div class="form-field">
                            <label for="selectLiquidacion">Liquidación</label>
                            <SearchableSelect
                                inputId="selectLiquidacion"
                                v-model="form.uLiq"
                                :options="cats.liquidacion"
                                placeholder="Seleccionar..."
                            />
                        </div>
                        <div class="form-field sm:col-span-2 flex flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <input id="formAplicaEcommerce" v-model="form.aplicaEcommerce" type="checkbox" class="w-5 h-5 text-blue-600 rounded border-gray-300" />
                            <label for="formAplicaEcommerce" class="!text-sm !m-0 !font-medium">Aplica para E-commerce</label>
                        </div>
                    </div>

                    <!-- Tab: Config. SAP / Impuestos -->
                    <div v-show="activeTab === 'sap'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field required">
                            <label for="formItemType">Tipo de Artículo (ItemType)</label>
                            <input id="formItemType" v-model="form.itemType" type="text" required placeholder="itItems" />
                        </div>
                        <div class="form-field required">
                            <label for="formItemsGroupCode">Grupo de Artículos (ItemsGroupCode)</label>
                            <input id="formItemsGroupCode" v-model.number="form.itemsGroupCode" type="number" required placeholder="100" />
                        </div>
                        <div class="form-field">
                            <label for="formCostAccounting">Sistema de Evaluación</label>
                            <select id="formCostAccounting" v-model="form.costAccountingMethod">
                                <option value="A">A - Promedio</option>
                                <option value="S">S - Estándar</option>
                                <option value="F">F - FIFO</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formGlMethod">GL Method</label>
                            <select id="formGlMethod" v-model="form.glMethod">
                                <option value="C">C - Clase de Artículo</option>
                                <option value="W">W - Almacén</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formInventoryItem">Artículo de Inventario</label>
                            <select id="formInventoryItem" v-model="form.inventoryItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formSalesItem">Artículo de Venta</label>
                            <select id="formSalesItem" v-model="form.salesItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseItem">Artículo de Compra</label>
                            <select id="formPurchaseItem" v-model="form.purchaseItem">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formManageStock">Gestión por Almacén</label>
                            <select id="formManageStock" v-model="form.manageStockByWarehouse">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formVatLiable">IVA (VATLiable)</label>
                            <select id="formVatLiable" v-model="form.vatLiable">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formWtLiable">Retención (WTLiable)</label>
                            <select id="formWtLiable" v-model="form.wtLiable">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formIndirectTax">Impuesto Indirecto</label>
                            <select id="formIndirectTax" v-model="form.indirectTax">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formArTaxCode">Código Impuesto AR</label>
                            <input id="formArTaxCode" v-model="form.arTaxCode" type="text" placeholder="IVA, IVAI..." />
                        </div>
                        <div class="form-field">
                            <label for="formApTaxCode">Código Impuesto AP</label>
                            <input id="formApTaxCode" v-model="form.apTaxCode" type="text" placeholder="IVA, IVAI..." />
                        </div>
                        <div class="form-field">
                            <label for="formPlanningSystem">Sistema de Planificación</label>
                            <select id="formPlanningSystem" v-model="form.planningSystem">
                                <option value="M">M - MRP</option>
                                <option value="N">N - Ninguno</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formProcurementMethod">Método de Abastecimiento</label>
                            <select id="formProcurementMethod" v-model="form.procurementMethod">
                                <option value="B">B - Compra</option>
                                <option value="M">M - Fabricación</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formInventoryUom">Unidad de Medida Inventario</label>
                            <input id="formInventoryUom" v-model="form.inventoryUom" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseUnit">Unidad de Compra</label>
                            <input id="formPurchaseUnit" v-model="form.purchaseUnit" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseItemsPerUnit">Unidades por Compra</label>
                            <input id="formPurchaseItemsPerUnit" v-model.number="form.purchaseItemsPerUnit" type="number" placeholder="1" min="0" />
                        </div>
                        <div class="form-field">
                            <label for="formSalesUnit">Unidad de Venta</label>
                            <input id="formSalesUnit" v-model="form.salesUnit" type="text" placeholder="PAR, UND..." />
                        </div>
                        <div class="form-field">
                            <label for="formSalesItemsPerUnit">Unidades por Venta</label>
                            <input id="formSalesItemsPerUnit" v-model.number="form.salesItemsPerUnit" type="number" placeholder="1" min="0" />
                        </div>
                        <div class="form-field">
                            <label for="formManageBatch">Gestión por Lotes (ManBtchNum)</label>
                            <select id="formManageBatch" v-model="form.manBtchNum">
                                <option value="N">N - No</option>
                                <option value="Y">Y - Sí</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="formEstadoProducto">Estado de Producto (SAP)</label>
                            <!-- Switch UI en vez de select simple -->
                            <div class="flex items-center gap-3 mt-1 h-[42px]">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="formEstadoProducto" v-model="form.estadoProducto" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ form.estadoProducto ? 'Activo' : 'Inactivo' }}</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-field">
                            <label for="formManufacturer">Fabricante (FirmCode)</label>
                            <input id="formManufacturer" v-model.number="form.manufacturer" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label for="formShipType">Tipo de Envío</label>
                            <input id="formShipType" v-model.number="form.shipType" type="number" placeholder="0" />
                        </div>
                        <div class="form-field">
                            <label for="formTipoBien">Tipo de Bien</label>
                            <input id="formTipoBien" v-model="form.uTipoBien" type="text" placeholder="Tipo de bien" />
                        </div>
                    </div>

                    <!-- Tab: Imágenes -->
                    <div v-show="activeTab === 'img'" class="p-6">
                        <GestorImagenes 
                            v-model:urlImagen1="form.urlImagen1" 
                            v-model:urlImagen2="form.urlImagen2" 
                            v-model:urlImagen3="form.urlImagen3" 
                        />
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

    <!-- Validation Modal -->
    <Teleport to="body">
        <div v-if="showValidationModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50" @click="showValidationModal = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
                <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h3 class="text-lg font-bold">Campos Requeridos</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Por favor completa los siguientes campos obligatorios antes de continuar:
                </p>
                <ul class="space-y-2 mb-6">
                    <li v-for="err in validationErrorsList" :key="err" class="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {{ err }}
                    </li>
                </ul>
                <button 
                    @click="showValidationModal = false"
                    class="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                >
                    Entendido
                </button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articuloService, catalogoService } from '../services/articuloService'
import type { CatalogoItem, JerarquiaItem } from '../services/articuloService'
import SearchableSelect from '../components/SearchableSelect.vue'
import GestorImagenes from '../components/GestorImagenes.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.itemCode)
const sessionToken = ref(!isEdit.value ? crypto.randomUUID().substring(0, 30) : '')

const tabs = [
    { id: 'general', label: 'General' },
    { id: 'cat',     label: 'Categorización' },
    { id: 'mat',     label: 'Color y Material' },
    { id: 'log',     label: 'Logística y Precios' },
    { id: 'sap',     label: 'Config. SAP / Impuestos' },
    { id: 'img',     label: 'Imágenes' },
]
const activeTab = ref('general')

// ─── Validación y Errores ────────────────────────────────────────────────────
const showValidationErrors = ref(false)
const showValidationModal = ref(false)

const tabsWithErrors = computed(() => {
    const errorTabs = new Set<string>()
    if (!form.value.itemName) errorTabs.add('general')
    if (!form.value.uIxxMarca) errorTabs.add('cat')
    if (!form.value.itemType) errorTabs.add('sap')
    if (form.value.itemsGroupCode == null) errorTabs.add('sap')
    return errorTabs
})

const validationErrorsList = computed(() => {
    const errors: string[] = []
    if (!form.value.itemName) errors.push('Descripción Factura (Tab General)')
    if (!form.value.uIxxMarca) errors.push('Negocio (Tab Categorización)')
    if (!form.value.itemType) errors.push('Tipo de Artículo (Tab Config. SAP)')
    if (form.value.itemsGroupCode == null) errors.push('Grupo de Artículos (Tab Config. SAP)')
    return errors
})

function getFirstErrorTab() {
    if (!form.value.itemName) return 'general'
    if (!form.value.uIxxMarca) return 'cat'
    if (!form.value.itemType) return 'sap'
    if (form.value.itemsGroupCode == null) return 'sap'
    return null
}

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
    secciones: JerarquiaItem[]
    categorias: JerarquiaItem[]
    lineas: JerarquiaItem[]
    lineasAtributo: JerarquiaItem[]
    atributos: JerarquiaItem[]
    priceLists: { id: number; name: string; nombre: string }[]
}>({
    talla: [], genero: [], color: [], coleccion: [], permanencia: [],
    origen: [], pais: [], envio: [], canal: [], region: [],
    liquidacion: [], negocio: [],
    secciones: [], categorias: [], lineas: [],
    lineasAtributo: [], atributos: [], priceLists: []
})

async function cargarCatalogos() {
    const [talla, genero, color, coleccion, permanencia, origen, pais, envio, canal, region, liquidacion, negocio, secciones, lineasAtributo, priceLists] = await Promise.allSettled([
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
        sapService.getPriceLists(),
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
    if (priceLists.status === 'fulfilled') cats.value.priceLists = priceLists.value
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

function onColorPrimarioChangeManual(item: CatalogoItem | null) {
    if (!item) {
        form.value.uCodColor = null
        form.value.uIxxColores = ''
        return
    }
    form.value.uCodColor = Number(item.codigo)
    form.value.uIxxColores = item.nombre
}

function onColorSecundarioChangeManual(item: CatalogoItem | null) {
    if (!item) {
        form.value.uCodColSecu = null
        form.value.uColorSecu = ''
        return
    }
    form.value.uCodColSecu = Number(item.codigo)
    form.value.uColorSecu = item.nombre
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
    uTipoBien: 'B',
    // Nuevos campos
    codigoAlterno: '',
    tieneCodigoProveedor: false,
    estadoProducto: true,
    idListaPrecios: null as number | null,
    aplicaEcommerce: false,
    manBtchNum: 'N',
    costoArranque: null as number | null,
    urlImagen1: '',
    urlImagen2: '',
    urlImagen3: '',
    isStructuralLocked: false,
})

// Auto-generación de ItemName (Descripción Factura)
watch([
    () => form.value.uNv3,
    () => form.value.uGen,
    () => form.value.uMarca,
    () => form.value.uAtrMed,
    () => form.value.uCodColor,
    () => form.value.uIxxPack
], () => {
    // Buscar descripciones en lugar de usar códigos directamente
    const n3 = cats.value.lineas.find(l => l.nombre === form.value.uNv3)?.nombre || form.value.uNv3 || ''
    const genero = cats.value.genero.find(g => g.codigo === String(form.value.uGen))?.nombre || form.value.uGen || ''
    const marca = form.value.uMarca || ''
    const atributo = form.value.uAtrMed || ''
    const color = cats.value.color.find(c => c.codigo === String(form.value.uCodColor))?.nombre || form.value.uCodColor || ''
    const pack = form.value.uIxxPack || ''

    const parts = [n3, genero, marca, atributo, color, pack].filter(Boolean)
    form.value.itemName = parts.join(' ').toUpperCase().substring(0, 100)
}, { deep: true })

const loadingData = ref(false)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')

// En edición: cargar los datos del artículo desde la API y pre-poblar la jerarquía de catálogos
// Shortcuts
const handleKeydown = (e: KeyboardEvent) => {
    // Ctrl + S: Guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSubmit()
    }
    // Escape: Cancelar
    if (e.key === 'Escape') {
        router.push('/articulo-maestro/lista')
    }
    // Ctrl + 1..5: Cambiar pestañas
    if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        activeTab.value = tabs[Number.parseInt(e.key, 10) - 1].id
    }
}

async function cargarDatosEdicion(itemCode: string) {
    loadingData.value = true
    try {
        const articulo = await articuloService.getArticuloByCode(itemCode)
        Object.keys(form.value).forEach(key => {
            const k = key as keyof typeof form.value
            if (articulo && key in articulo) {
                const val = (articulo as unknown as Record<string, unknown>)[key]
                if (val != null) {
                    (form.value as Record<string, unknown>)[k] = val
                }
            }
        })
        if (form.value.uNv1) {
            cats.value.categorias = await catalogoService.getCategorias(form.value.uNv1).catch(() => [])
        }
        if (form.value.uNv2) {
            cats.value.lineas = await catalogoService.getLineas(form.value.uNv2).catch(() => [])
        }
        if (form.value.uAtrMed && cats.value.lineasAtributo.length > 0) {
            for (const lineaItem of cats.value.lineasAtributo) {
                try {
                    const attrs = await catalogoService.getAtributos(lineaItem.nombre)
                    if (attrs.some(a => a.nombre === form.value.uAtrMed)) {
                        selectedLineaAtributo.value = lineaItem.nombre
                        cats.value.atributos = attrs
                        break
                    }
                } catch { /* continuar buscando */ }
            }
        }
    } catch {
        loadError.value = `No se pudo cargar el artículo "${itemCode}". Verifica que el código es correcto.`
    } finally {
        loadingData.value = false
    }
}

onMounted(async () => {
    globalThis.addEventListener('keydown', handleKeydown)
    await cargarCatalogos()
    if (isEdit.value) {
        await cargarDatosEdicion(route.params.itemCode as string)
    }
})

// Guardar formulario
async function handleSubmit() {
    const firstErrorTab = getFirstErrorTab()
    if (firstErrorTab) {
        showValidationErrors.value = true
        activeTab.value = firstErrorTab
        showValidationModal.value = true
        
        // Intentar hacer focus al primer campo inválido después de cambiar de pestaña
        setTimeout(() => {
            const firstInvalid = document.querySelector('input:invalid, select:invalid, .form-field.required input') as HTMLElement
            if (firstInvalid) firstInvalid.focus()
        }, 100)
        return
    }

    submitting.value = true
    submitError.value = ''

    // Construir el payload omitiendo nulos y strings vacíos opcionales
    const payload: Record<string, unknown> = {}
    
    // Lista de campos que sí deben ser enviados como numéricos
    const numericFields = new Set([
        'uCodColor', 'uCodColSecu', 'leadTime', 'minOrderQuantity',
        'uUnidadDespacho', 'uDespIn', 'costoArranque', 'price',
        'itemsGroupCode', 'manufacturer', 'shipType',
        'purchaseItemsPerUnit', 'salesItemsPerUnit'
    ])

    Object.entries(form.value).forEach(([key, val]) => {
        // No enviar el código de artículo en el body del PATCH (se envía en la URL)
        if (key === 'itemCode' && isEdit.value) return

        if (val === '' || val == null) return

        // Pydantic strictness: forzar a string los campos que backend espera como texto
        // pero que Catálogos/jerarquías pudieron asignar como número.
        if (typeof val === 'number' && !numericFields.has(key)) {
            payload[key] = String(val)
        } else {
            payload[key] = val
        }
    })

    try {
        if (isEdit.value) {
            const itemCode = route.params.itemCode as string
            await articuloService.updateArticulo(itemCode, payload)
        } else {
            payload.sessionToken = sessionToken.value
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
    } finally {
        submitting.value = false
    }
}

onUnmounted(() => {
    globalThis.removeEventListener('keydown', handleKeydown)
})
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
