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
                <div class="flex items-center gap-3">
                    <button
                        class="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        @click="showKeyboardHelp = true"
                        type="button"
                        title="Atajos de teclado"
                    >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V6ZM7.5 9h.008v.008H7.5V9Zm3 0h.008v.008H10.5V9Zm3 0h.008v.008H13.5V9Zm3 0h.008v.008H16.5V9Zm-9 3h.008v.008H7.5V12Zm3 0h.008v.008H10.5V12Zm3 0h.008v.008H13.5V12Zm3 0h.008v.008H16.5V12Zm-6 3h.008v.008H10.5V15Zm3 0h.008v.008H13.5V15Z" />
                        </svg>
                    </button>
                    <router-link
                        class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                        to="/articulo-maestro/lista">
                        ← Volver a la Lista
                    </router-link>
                </div>
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
                            <h4 class="text-sm font-bold text-amber-800 dark:text-amber-300">Artículo sincronizado con SAP / con historial contable</h4>
                            <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">Los parámetros estructurales se encuentran bloqueados para proteger la integridad de datos: Categoría, Línea, Atributo Único y Gestión por Lotes ya no pueden modificarse en este artículo.</p>
                        </div>
                    </div>

                    <!-- Tab: General -->
                    <div v-show="activeTab === 'general'" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-field">
                            <label for="formItemCode">Código Interno (ItemCode)</label>
                            <input id="formItemCode" :value="form.itemCode" type="text" disabled placeholder="[Generación Automática en Backend]" />
                            <span class="help">{{ isEdit ? LOCK_REASON.identidadItemCode : 'Se genera automáticamente al crear.' }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formItemName">Descripción Factura (ItemName)</label>
                            <input id="formItemName" v-model="form.itemName" type="text" maxlength="50" placeholder="Se sugiere automáticamente; puede editarla" />
                            <span class="help">Sugerido: Línea + Género + Marca + Atributo + Color + Pack. Editable: sus cambios no se sobrescriben.</span>
                        </div>

                        <!-- Nuevos campos SIS-CCPYTD-00014 -->
                        <div class="form-field sm:col-span-2 flex flex-row flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <input id="formTieneCodigoProveedor" v-model="form.tieneCodigoProveedor" type="checkbox" class="w-5 h-5 text-blue-600 rounded border-gray-300" :disabled="isEdit" :title="isEdit ? LOCK_REASON.barCodeSellado : ''" />
                            <label for="formTieneCodigoProveedor" class="!text-sm !m-0 !font-medium">¿El producto posee código de barras del proveedor?</label>
                            <span v-if="isEdit" class="help w-full text-amber-600 dark:text-amber-400">{{ LOCK_REASON.barCodeSellado }}</span>
                        </div>
                        <div class="form-field" :class="{ required: form.tieneCodigoProveedor }">
                            <label for="formBarCode">Código de Barras</label>
                            <input id="formBarCode" v-model.trim="form.barCode" type="text" maxlength="15" :required="form.tieneCodigoProveedor" :placeholder="form.tieneCodigoProveedor ? 'EAN / UPC' : '[Asignación Automática desde Bolsa]'" :disabled="isEdit || !form.tieneCodigoProveedor" :title="isEdit ? LOCK_REASON.barCodeSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.barCodeSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formCodigoAlterno">Código Alterno</label>
                            <div class="flex items-center gap-2">
                                <input id="formCodigoAlterno" :value="form.codigoAlterno" type="text" disabled class="flex-1" placeholder="Se genera automáticamente al crear" />
                                <button
                                    v-if="isEdit && puedePromoverAlterno"
                                    type="button"
                                    :disabled="promoviendo"
                                    @click="handlePromoverAlterno"
                                    class="shrink-0 px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60 transition-colors whitespace-nowrap"
                                    title="Reemplaza el ItemCode actual por este Código Alterno"
                                >
                                    {{ promoviendo ? 'Promoviendo...' : 'Promover a Código Principal' }}
                                </button>
                            </div>
                            <span class="help">No editable: solo cambia con "Promover a Código Principal".</span>
                        </div>
                        <div class="form-field">
                            <label for="formSkuSinTalla">Referencia / SKU sin talla</label>
                            <input id="formSkuSinTalla" :value="form.uSxxSkuSinTalla" type="text" disabled placeholder="[Generación Automática en Backend]" :title="LOCK_REASON.skuSelladoAlCrear" />
                            <span class="help">{{ isEdit ? LOCK_REASON.skuSelladoAlCrear : 'Se genera automáticamente al crear (ItemCode sin el sufijo de talla).' }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectTalla">Talla</label>
                            <SearchableSelect
                                inputId="selectTalla"
                                v-model="form.uIxxTalla"
                                :options="cats.talla"
                                placeholder="Seleccionar talla..."
                                valueKey="nombre"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.tallaInmutable : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.tallaInmutable }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectGenero">Género</label>
                            <SearchableSelect
                                inputId="selectGenero"
                                v-model="form.uGen"
                                :options="cats.genero"
                                placeholder="Seleccionar género..."
                                valueKey="nombre"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.generoInmutable : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.generoInmutable }}</span>
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
                                valueKey="nombre"
                                required
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.negocioInmutable : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.negocioInmutable }}</span>
                            <small
                                v-if="!isEdit && showValidationErrors && !form.uIxxMarca"
                                class="text-red-500 text-xs font-semibold mt-1"
                            >
                                Debe seleccionar un Negocio para generar el código del producto.
                            </small>
                        </div>

                        <div class="form-field required">
                            <label for="formMarca">Marca</label>
                            <input id="formMarca" v-model="form.uMarca" type="text" placeholder="Ej: ROLLY" required />
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
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.seccionInmutable : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.seccionInmutable }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectCategoria">Categoría (U_NV2)</label>
                            <SearchableSelect
                                inputId="selectCategoria"
                                v-model="form.uNv2"
                                :options="cats.categorias"
                                placeholder="Seleccionar categoría..."
                                :disabled="!form.uNv1 || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? LOCK_REASON.historialSap : ''"
                                @change="onCategoriaChange"
                                valueKey="nombre"
                            />
                            <span v-if="form.isStructuralLocked" class="help text-amber-600 dark:text-amber-400">{{ LOCK_REASON.historialSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectLinea">Línea (U_NV3)</label>
                            <SearchableSelect
                                inputId="selectLinea"
                                v-model="form.uNv3"
                                :options="cats.lineas"
                                placeholder="Seleccionar línea..."
                                :disabled="!form.uNv2 || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? LOCK_REASON.historialSap : ''"
                                valueKey="nombre"
                            />
                            <span v-if="form.isStructuralLocked" class="help text-amber-600 dark:text-amber-400">{{ LOCK_REASON.historialSap }}</span>
                        </div>

                        <div class="form-field">
                            <label for="selectColeccion">Nombre Colección</label>
                            <SearchableSelect
                                inputId="selectColeccion"
                                v-model="form.uNomColeccion"
                                :options="cats.coleccion"
                                placeholder="Seleccionar colección..."
                                valueKey="nombre"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectPermanencia">Estatus de Permanencia</label>
                            <SearchableSelect
                                inputId="selectPermanencia"
                                v-model="form.uReposicion"
                                :options="cats.permanencia"
                                placeholder="Seleccionar estatus..."
                                valueKey="nombre"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectCanal">Canal de Venta</label>
                            <SearchableSelect
                                inputId="selectCanal"
                                v-model="form.uCanalVenta"
                                :options="cats.canal"
                                placeholder="Seleccionar canal..."
                                valueKey="nombre"
                            />
                        </div>
                        <div class="form-field">
                            <label for="selectRegion">Región de Venta</label>
                            <SearchableSelect
                                inputId="selectRegion"
                                v-model="form.uRegion"
                                :options="cats.region"
                                placeholder="Seleccionar región..."
                                valueKey="nombre"
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
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.colorSellado : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.colorSellado }}</span>
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
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.colorSellado : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.colorSellado }}</span>
                        </div>

                        <div class="form-field">
                            <label for="formCodColSecuDisplay">Cód. Color Secundario</label>
                            <input id="formCodColSecuDisplay" :value="form.uCodColSecu ?? '-'" type="text" disabled />
                            <span class="help">Se asigna automáticamente al seleccionar un color.</span>
                        </div>
                        <div class="form-field">
                            <label for="formMaterial">Material</label>
                            <input id="formMaterial" v-model="form.uIxxMaterial" type="text" placeholder="Tela, Cuero, Sintético..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.materialSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.materialSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formComposicion">Composición</label>
                            <input id="formComposicion" v-model="form.uIxxComposicion" type="text" placeholder="80% Algodón 20% Poliéster" :disabled="isEdit" :title="isEdit ? LOCK_REASON.materialSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.materialSellado }}</span>
                        </div>

                        <!-- Cascada: Línea de Atributo → Atributo Único. El disabled de la
                             línea sigue al de su Atributo Único (mismo criterio: historial SAP),
                             para no dejar seleccionable un padre cuyo hijo ya está bloqueado. -->
                        <div class="form-field">
                            <label for="selectLineaAtributo">Línea de Atributo</label>
                            <SearchableSelect
                                inputId="selectLineaAtributo"
                                v-model="selectedLineaAtributo"
                                :options="cats.lineasAtributo"
                                placeholder="Seleccionar línea..."
                                @change="onLineaAtributoChange"
                                valueKey="nombre"
                                :disabled="form.isStructuralLocked"
                                :title="form.isStructuralLocked ? LOCK_REASON.historialSap : ''"
                            />
                            <span v-if="form.isStructuralLocked" class="help text-amber-600 dark:text-amber-400">{{ LOCK_REASON.historialSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectAtributo">Atributo Único Textil/Calzado</label>
                            <SearchableSelect
                                inputId="selectAtributo"
                                v-model="form.uAtrMed"
                                :options="cats.atributos"
                                placeholder="Seleccionar atributo..."
                                :disabled="!selectedLineaAtributo || form.isStructuralLocked"
                                :title="form.isStructuralLocked ? LOCK_REASON.historialSap : ''"
                                valueKey="nombre"
                            />
                            <span v-if="form.isStructuralLocked" class="help text-amber-600 dark:text-amber-400">{{ LOCK_REASON.historialSap }}</span>
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
                            <input id="formCodPvr" v-model="form.uCodPvr" type="text" placeholder="Código del proveedor" :disabled="isEdit" :title="isEdit ? LOCK_REASON.procedenciaSellada : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.procedenciaSellada }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectOrigen">Origen de Compra</label>
                            <SearchableSelect
                                inputId="selectOrigen"
                                v-model="form.uOrigen"
                                :options="cats.origen"
                                placeholder="Seleccionar origen..."
                                valueKey="nombre"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.procedenciaSellada : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.procedenciaSellada }}</span>
                        </div>
                        <div class="form-field">
                            <label for="selectPais">País de Origen</label>
                            <SearchableSelect
                                inputId="selectPais"
                                v-model="form.uPOri"
                                :options="cats.pais"
                                placeholder="Seleccionar país..."
                                valueKey="nombre"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.procedenciaSellada : ''"
                            />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.procedenciaSellada }}</span>
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
                                valueKey="nombre"
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
                            <input id="formPrice" :value="form.price ?? ''" @input="onPvpInput($event)" @blur="onPvpBlur" type="number" step="0.01" placeholder="0.00" min="0" />
                        </div>
                        <fieldset class="form-field sm:col-span-2 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <legend class="!text-sm !m-0 !p-0 !font-medium">Listas de Precios Aplicables</legend>
                            <div class="flex items-center gap-6">
                                <div class="flex items-center gap-2">
                                    <input id="formAplicaPrecioMinorista" v-model="form.aplicaPrecioMinorista" @change="onPrecioListasChange('minorista')" type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                    <label for="formAplicaPrecioMinorista" class="!text-sm !m-0">Minorista</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input id="formAplicaPrecioInternacional" v-model="form.aplicaPrecioInternacional" @change="onPrecioListasChange('internacional')" type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                    <label for="formAplicaPrecioInternacional" class="!text-sm !m-0">Internacional</label>
                                </div>
                            </div>
                        </fieldset>
                        <div class="form-field">
                            <label for="formCostoArranque">Costo de Arranque</label>
                            <input id="formCostoArranque" :value="form.uPrArq ?? ''" @input="onCostoArranqueInput($event)" @blur="onCostoArranqueBlur" type="number" step="0.01" min="0" placeholder="0.00" />
                        </div>
                        <div class="form-field">
                            <label for="selectLiquidacion">Liquidación</label>
                            <SearchableSelect
                                inputId="selectLiquidacion"
                                v-model="form.uLiq"
                                :options="cats.liquidacion"
                                placeholder="Seleccionar..."
                                valueKey="nombre"
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
                            <select id="formItemType" v-model="form.itemType" required :disabled="isEdit" :title="isEdit ? LOCK_REASON.estructuralSap : ''">
                                <option value="I">I - Artículo de inventario</option>
                                <option value="L">L - Mano de obra</option>
                                <option value="T">T - Viaje</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.estructuralSap }}</span>
                        </div>
                        <div class="form-field required">
                            <label for="formItemsGroupCode">Grupo de Artículos (ItemsGroupCode)</label>
                            <input id="formItemsGroupCode" v-model.number="form.itemsGroupCode" type="number" required placeholder="100" :disabled="isEdit" :title="isEdit ? LOCK_REASON.estructuralSap : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.estructuralSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formCostAccounting">Sistema de Evaluación</label>
                            <select
                                id="formCostAccounting"
                                v-model="form.costAccountingMethod"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.sapRechazaCambio : ''"
                            >
                                <option v-for="opt in OPCIONES_COST_ACCOUNTING" :key="opt.value" :value="opt.value" :title="opt.description">
                                    {{ opt.label }}
                                </option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.sapRechazaCambio }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formGlMethod">GL Method</label>
                            <select
                                id="formGlMethod"
                                v-model="form.glMethod"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.sapRechazaCambio : ''"
                            >
                                <option value="C">C - Clase de Artículo</option>
                                <option value="W">W - Almacén</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.sapRechazaCambio }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formInventoryItem">Artículo de Inventario</label>
                            <select id="formInventoryItem" v-model="form.inventoryItem" :disabled="isEdit" :title="isEdit ? LOCK_REASON.estructuralSap : ''">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.estructuralSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formSalesItem">Artículo de Venta</label>
                            <select id="formSalesItem" v-model="form.salesItem" :disabled="isEdit" :title="isEdit ? LOCK_REASON.estructuralSap : ''">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.estructuralSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseItem">Artículo de Compra</label>
                            <select id="formPurchaseItem" v-model="form.purchaseItem" :disabled="isEdit" :title="isEdit ? LOCK_REASON.estructuralSap : ''">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.estructuralSap }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formManageStock">Gestión por Almacén</label>
                            <select id="formManageStock" v-model="form.manageStockByWarehouse" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formVatLiable">IVA (VATLiable)</label>
                            <select
                                id="formVatLiable"
                                v-model="form.vatLiable"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.sapRechazaCambio : ''"
                            >
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.sapRechazaCambio }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formWtLiable">Retención (WTLiable)</label>
                            <select
                                id="formWtLiable"
                                v-model="form.wtLiable"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.sapRechazaCambio : ''"
                            >
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.sapRechazaCambio }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formIndirectTax">Impuesto Indirecto</label>
                            <select id="formIndirectTax" v-model="form.indirectTax" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''">
                                <option value="Y">Y - Sí</option>
                                <option value="N">N - No</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formArTaxCode">Código Impuesto AR</label>
                            <input id="formArTaxCode" v-model="form.arTaxCode" type="text" placeholder="IVA, IVAI..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formApTaxCode">Código Impuesto AP</label>
                            <input id="formApTaxCode" v-model="form.apTaxCode" type="text" placeholder="IVA, IVAI..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formPlanningSystem">Sistema de Planificación</label>
                            <select
                                id="formPlanningSystem"
                                v-model="form.planningSystem"
                                :disabled="isEdit"
                                :title="isEdit ? LOCK_REASON.sapRechazaCambio : ''"
                            >
                                <option value="M">M - MRP</option>
                                <option value="N">N - Ninguno</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.sapRechazaCambio }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formProcurementMethod">Método de Abastecimiento</label>
                            <select id="formProcurementMethod" v-model="form.procurementMethod" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''">
                                <option value="B">B - Compra</option>
                                <option value="M">M - Fabricación</option>
                            </select>
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formInventoryUom">Unidad de Medida Inventario</label>
                            <input id="formInventoryUom" v-model="form.inventoryUom" type="text" placeholder="PAR, UND..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseUnit">Unidad de Compra</label>
                            <input id="formPurchaseUnit" v-model="form.purchaseUnit" type="text" placeholder="PAR, UND..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formPurchaseItemsPerUnit">Unidades por Compra</label>
                            <input id="formPurchaseItemsPerUnit" v-model.number="form.purchaseItemsPerUnit" type="number" placeholder="1" min="0" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formSalesUnit">Unidad de Venta</label>
                            <input id="formSalesUnit" v-model="form.salesUnit" type="text" placeholder="PAR, UND..." :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formSalesItemsPerUnit">Unidades por Venta</label>
                            <input id="formSalesItemsPerUnit" v-model.number="form.salesItemsPerUnit" type="number" placeholder="1" min="0" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formManageBatch">Gestión por Lotes (ManBtchNum)</label>
                            <select
                                id="formManageBatch"
                                v-model="form.manageBatchNumbers"
                                :disabled="isEdit && form.isStructuralLocked"
                                :title="isEdit && form.isStructuralLocked ? LOCK_REASON.historialSapLotes : ''"
                            >
                                <option value="N">N - No</option>
                                <option value="Y">Y - Sí</option>
                            </select>
                            <span v-if="isEdit && form.isStructuralLocked" class="help text-amber-600 dark:text-amber-400">
                                {{ LOCK_REASON.historialSapLotes }}
                            </span>
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
                            <input id="formManufacturer" v-model.number="form.manufacturer" type="number" placeholder="0" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formShipType">Tipo de Envío</label>
                            <input id="formShipType" v-model.number="form.shipType" type="number" placeholder="0" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                        <div class="form-field">
                            <label for="formTipoBien">Tipo de Bien</label>
                            <input id="formTipoBien" v-model="form.uTipoBien" type="text" placeholder="Tipo de bien" :disabled="isEdit" :title="isEdit ? LOCK_REASON.parametroSapSellado : ''" />
                            <span v-if="isEdit" class="help">{{ LOCK_REASON.parametroSapSellado }}</span>
                        </div>
                    </div>

                    <!-- Tab: Imágenes -->
                    <div v-show="activeTab === 'img'" class="p-6">
                        <GestorImagenes
                            ref="gestorImagenesRef"
                            :item-code="isEdit ? (route.params.itemCode as string) : null"
                            :images="form.imagenes"
                            :disabled="submitting"
                            @update:images="onImagesUpdate"
                        />
                    </div>
                </div>

                <!-- Error al guardar -->
                <div v-if="submitError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {{ submitError }}
                </div>
                <div v-if="submitSuccess" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <span>{{ submitSuccess }}</span>
                    <router-link
                        v-if="puedeVerMonitoreoSap"
                        :to="monitoreoSapLink"
                        class="shrink-0 font-semibold underline hover:text-emerald-800 dark:hover:text-emerald-300"
                    >
                        Ver monitoreo de SAP →
                    </router-link>
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

    <KeyboardHelpModal
        :is-open="showKeyboardHelp"
        :shortcuts="shortcuts"
        @close="showKeyboardHelp = false"
    />

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { articuloService, catalogoService } from '../services/articuloService'
import type {
    CatalogoItem,
    JerarquiaItem
} from '../services/articuloService'
import type { Articulo, ImagenArticuloReferencia } from '../types'
import SearchableSelect from '../components/SearchableSelect.vue'
import GestorImagenes from '../components/GestorImagenes.vue'
import KeyboardHelpModal from '../components/KeyboardHelpModal.vue'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { OPCIONES_COST_ACCOUNTING, DEFAULT_COST_ACCOUNTING } from '../constants/costAccounting'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const puedeVerMonitoreoSap = computed(() =>
    authStore.isAdmin || authStore.hasPermission('articulomaestro.migracion')
)
// Código del artículo recién creado/editado/promovido, para que el enlace al
// monitoreo de SAP abra ya filtrado por ese ItemCode en vez de la lista completa.
const ultimoItemCodeSap = ref('')
const monitoreoSapLink = computed(() => ({
    path: '/articulo-maestro/migracion',
    query: ultimoItemCodeSap.value ? { codigo: ultimoItemCodeSap.value } : {},
}))

// Mismo destino que "Ver monitoreo de SAP →" del banner in-place (edición
// sin redirect), pero como acción de toast: los flujos que sí redirigen
// (creación, promover alterno) no pueden depender del ref reactivo
// ultimoItemCodeSap/monitoreoSapLink porque el router.replace remonta el
// componente (:key="route.path" en MainLayout) y ese ref local se pierde
// antes de que el usuario llegue a hacer clic. Se captura itemCode por
// valor, no por referencia reactiva.
function accionMonitoreoSap(itemCode: string) {
    if (!puedeVerMonitoreoSap.value) return undefined
    return {
        label: 'Ver monitoreo de SAP →',
        onClick: () => router.push({ path: '/articulo-maestro/migracion', query: { codigo: itemCode } })
    }
}

const isEdit = computed(() => !!route.params.itemCode)
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

// uIxxMarca/itemType/itemsGroupCode son estructurales (ver
// STRUCTURAL_LOCKED_KEYS/CAMPOS_ESTRUCTURALES_BLOQUEADOS): en edición ya
// vienen cargados desde el backend y están deshabilitados en pantalla, así
// que exigirlos aquí solo podía disparar un modal de "campo requerido" al
// guardar deltas puramente comerciales sobre un artículo que en realidad
// ya los tiene válidos.
const tabsWithErrors = computed(() => {
    const errorTabs = new Set<string>()
    if (!form.value.itemName) errorTabs.add('general')
    if (form.value.tieneCodigoProveedor && !form.value.barCode) errorTabs.add('general')
    if (!isEdit.value) {
        if (!form.value.uIxxMarca) errorTabs.add('cat')
        if (!form.value.itemType) errorTabs.add('sap')
        if (form.value.itemsGroupCode == null) errorTabs.add('sap')
    }
    return errorTabs
})

const validationErrorsList = computed(() => {
    const errors: string[] = []
    if (!form.value.itemName) errors.push('Descripción Factura (Tab General)')
    if (form.value.tieneCodigoProveedor && !form.value.barCode) {
        errors.push('Código de Barras (Tab General)')
    }
    if (!isEdit.value) {
        if (!form.value.uIxxMarca) errors.push('Negocio (Tab Categorización)')
        if (!form.value.itemType) errors.push('Tipo de Artículo (Tab Config. SAP)')
        if (form.value.itemsGroupCode == null) errors.push('Grupo de Artículos (Tab Config. SAP)')
    }
    return errors
})

function getFirstErrorTab() {
    if (!form.value.itemName) return 'general'
    if (form.value.tieneCodigoProveedor && !form.value.barCode) return 'general'
    if (!isEdit.value) {
        if (!form.value.uIxxMarca) return 'cat'
        if (!form.value.itemType) return 'sap'
        if (form.value.itemsGroupCode == null) return 'sap'
    }
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

function onPrecioListasChange(tipo: 'minorista' | 'internacional') {
    if (!form.value.aplicaPrecioMinorista && !form.value.aplicaPrecioInternacional) {
        if (tipo === 'minorista') {
            form.value.aplicaPrecioMinorista = true
        } else {
            form.value.aplicaPrecioInternacional = true
        }
        alert('Debe seleccionar al menos una lista de precios aplicable.')
    }
}

// RF-021/CA-10: Costo de Arranque conserva únicamente dos decimales en toda la app.
function onCostoArranqueInput(event: Event) {
    const input = event.target as HTMLInputElement
    const raw = input.value

    if (raw === '' || raw === '-') {
        form.value.uPrArq = null
        return
    }

    const truncado = raw.match(/^-?\d*(?:\.\d{0,2})?/)?.[0] ?? raw
    if (truncado !== raw) {
        input.value = truncado
    }

    const parsed = Number(truncado)
    form.value.uPrArq = Number.isNaN(parsed) ? null : Math.round(parsed * 100) / 100
}

// Red de seguridad al perder el foco: re-redondea por si el navegador dejó
// pasar un valor con más de 2 decimales (autocompletado, pegado, spinners).
function onCostoArranqueBlur(): void {
    if (form.value.uPrArq == null) return
    form.value.uPrArq = Math.round(form.value.uPrArq * 100) / 100
}

// PVP homologado con Costo de Arranque: mismo truncado a 2 decimales.
function onPvpInput(event: Event) {
    const input = event.target as HTMLInputElement
    const raw = input.value

    if (raw === '' || raw === '-') {
        form.value.price = null
        return
    }

    const truncado = raw.match(/^-?\d*(?:\.\d{0,2})?/)?.[0] ?? raw
    if (truncado !== raw) {
        input.value = truncado
    }

    const parsed = Number(truncado)
    form.value.price = Number.isNaN(parsed) ? null : Math.round(parsed * 100) / 100
}

function onPvpBlur(): void {
    if (form.value.price == null) return
    form.value.price = Math.round(form.value.price * 100) / 100
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
    itemType: 'I',
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
    aplicaEcommerce: false,
    aplicaPrecioMinorista: true,
    aplicaPrecioInternacional: false,
    imagenes: [] as ImagenArticuloReferencia[],
    isStructuralLocked: false,
})

// RF-003: Auto-generación de ItemName (Descripción Factura) sin bloquear el
// input. Solo se sobrescribe mientras el valor actual siga siendo la última
// sugerencia (o esté vacío); en cuanto el usuario escribe algo distinto,
// dejamos de pisarlo aunque cambie Marca/Talla/etc. después.
const ultimoItemNameSugerido = ref('')

function calcularItemNameSugerido(): string {
    // Buscar descripciones en lugar de usar códigos directamente
    const n3 = cats.value.lineas.find(l => l.nombre === form.value.uNv3)?.nombre || form.value.uNv3 || ''
    const genero = cats.value.genero.find(g => g.codigo === String(form.value.uGen))?.nombre || form.value.uGen || ''
    const marca = form.value.uMarca || ''
    const atributo = form.value.uAtrMed || ''
    const color = cats.value.color.find(c => c.codigo === String(form.value.uCodColor))?.nombre || form.value.uCodColor || ''
    const pack = form.value.uIxxPack || ''

    const parts = [n3, genero, marca, atributo, color, pack].filter(Boolean)
    return parts.join(' ').toUpperCase().substring(0, 50)
}

watch([
    () => form.value.uNv3,
    () => form.value.uGen,
    () => form.value.uMarca,
    () => form.value.uAtrMed,
    () => form.value.uCodColor,
    () => form.value.uIxxPack
], () => {
    const sugerido = calcularItemNameSugerido()
    const valorActual = (form.value.itemName || '').trim()
    const sigueSiendoLaSugerencia = valorActual === '' || valorActual === ultimoItemNameSugerido.value.trim()

    if (sigueSiendoLaSugerencia) {
        form.value.itemName = sugerido
    }
    ultimoItemNameSugerido.value = sugerido
}, { deep: true })

const loadingData = ref(false)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const gestorImagenesRef = ref<InstanceType<typeof GestorImagenes> | null>(null)

// ─── Dirty Checking (edición) ──────────────────────────────────────────────
// Copia inmutable de `form` tomada justo después de que cargarDatosEdicion
// termina de poblar el formulario y las cascadas de catálogo. handleSubmit
// compara contra esta copia para enviar en el PATCH únicamente las
// propiedades que realmente cambiaron.
const originalSnapshot = ref<typeof form.value | null>(null)

// Campos estructurales de SAP (CAMPOS_ESTRUCTURALES_BLOQUEADOS en el
// backend): están bloqueados de por vida, no solo mientras el artículo esté
// sincronizado. El backend rechaza el PATCH completo con 422 si CUALQUIERA
// de estas claves llega en el body, sin importar si el valor es igual al
// actual, así que se excluyen siempre en edición, no solo cuando cambian.
const STRUCTURAL_LOCKED_KEYS = new Set([
    'itemCode', 'codigoAlterno', 'uIxxMarca',
    'itemsGroupCode', 'itemType', 'purchaseItem', 'salesItem', 'inventoryItem',
    'uGen', 'uIxxTalla', 'uNv1'
])

// Campos que no existen en ArticuloUpdate (o se gestionan por endpoints
// dedicados): incluirlos en el PATCH también dispara un 422 por extra="forbid".
const READONLY_KEYS = new Set(['imagenes', 'isStructuralLocked', 'controlSap', 'activo', 'id'])

// ─── Muro de Contención: mensajes de bloqueo de campos ────────────────────
// Un artículo ya creado, sincronizado con SAP o con historial transaccional
// restringe la edición de ciertos campos. Se centralizan aquí las razones
// (en vez de repetir el texto en cada :title/<span>) para que el mensaje
// mostrado al usuario sea consistente y se pueda ajustar en un solo lugar.
const LOCK_REASON = {
    identidadItemCode: 'Este valor compone el ItemCode del artículo y no puede modificarse después de creado.',
    estructuralSap: 'Es un parámetro estructural de SAP y no puede modificarse una vez creado el artículo.',
    sapRechazaCambio: 'SAP rechaza este dato si difiere de lo ya existente en una actualización; solo puede definirse al crear el artículo.',
    historialSap: 'El artículo posee historial en SAP y no puede modificar su estructura.',
    historialSapLotes: 'Este artículo posee historial en SAP y su gestión por lotes ya no puede modificarse.',
    negocioInmutable: 'El Negocio define el ItemCode del artículo y no puede modificarse después de creado.',
    seccionInmutable: 'La Sección define el ItemCode del artículo y no puede modificarse después de creado.',
    tallaInmutable: 'La Talla es información tomada del comprador al crear el artículo y no puede modificarse después.',
    generoInmutable: 'El Género es información tomada del comprador al crear el artículo y no puede modificarse después.',
    skuSelladoAlCrear: 'Es la referencia base del artículo (SKU sin talla) y no puede modificarse después de creado.',
    barCodeSellado: 'El código de barras del proveedor se definió al crear el artículo y queda sellado.',
    colorSellado: 'El color es un atributo de ficha técnica definido al crear el artículo y no puede modificarse después.',
    materialSellado: 'Es un dato de catalogación técnica definido al crear el artículo y no puede modificarse después.',
    procedenciaSellada: 'Es un dato de procedencia fijado al crear el artículo y no puede modificarse después.',
    parametroSapSellado: 'Es un parámetro contable/de inventario de SAP fijado al crear el artículo; su edición podría generar inconsistencias en el ERP.',
} as const

// ─── RF-002: Promoción de Código Alterno ──────────────────────────────────────
const promoviendo = ref(false)
const puedePromoverAlterno = computed(() =>
    !!form.value.codigoAlterno && form.value.codigoAlterno !== form.value.itemCode
)

async function handlePromoverAlterno(): Promise<void> {
    const itemCodeActual = route.params.itemCode as string
    const confirmado = window.confirm(
        `Esto reemplazará el ItemCode "${itemCodeActual}" por el código alterno ` +
        `"${form.value.codigoAlterno}" y se encolará una nueva sincronización con SAP. ` +
        '¿Desea continuar?'
    )
    if (!confirmado) return

    promoviendo.value = true
    submitError.value = ''
    submitSuccess.value = ''
    try {
        const resultado = await articuloService.promoverCodigoAlterno(itemCodeActual)
        // Mismo motivo que en la creación: este router.replace cambia de
        // itemCode y remonta el componente (:key="route.path" en MainLayout),
        // así que el banner local no sobreviviría — se usa el toast global.
        toast.addToast({
            type: 'success',
            title: 'Código alterno promovido',
            message: resultado.message,
            action: accionMonitoreoSap(resultado.item_code_nuevo)
        })
        ultimoItemCodeSap.value = resultado.item_code_nuevo
        await router.replace(`/articulo-maestro/editar/${resultado.item_code_nuevo}`)
        await cargarDatosEdicion(resultado.item_code_nuevo)
    } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        submitError.value = axiosErr?.response?.data?.detail
            || 'No se pudo promover el código alterno. Inténtalo de nuevo.'
    } finally {
        promoviendo.value = false
    }
}

function onImagesUpdate(images: ImagenArticuloReferencia[]): void {
    form.value.imagenes = images
}

// En edición: cargar los datos del artículo desde la API y pre-poblar la jerarquía de catálogos
function aplicarDatosArticuloAlForm(articulo: Articulo) {
    Object.keys(form.value).forEach(key => {
        const k = key as keyof typeof form.value
        if (articulo && key in articulo) {
            const val = (articulo as unknown as Record<string, unknown>)[key]
            if (val != null) {
                (form.value as Record<string, unknown>)[k] = val
            }
        }
    })
    // Fallback seguro: costAccountingMethod puede llegar con un valor legacy
    // (ej. 'B' en un artículo sin gestión de lotes, o null) que ya no es una
    // opción visible del selector. Sin este resguardo, el <select> se
    // renderiza en blanco porque ningún <option> coincide con el v-model.
    const esValorValido = OPCIONES_COST_ACCOUNTING.some(
        opt => opt.value === form.value.costAccountingMethod
    )
    if (!esValorValido) {
        form.value.costAccountingMethod = DEFAULT_COST_ACCOUNTING
    }
}

async function cargarCascadasCatalogoParaEdicion() {
    if (form.value.uNv1) {
        cats.value.categorias = await catalogoService.getCategorias(form.value.uNv1).catch(() => [])
    }
    if (form.value.uNv2) {
        cats.value.lineas = await catalogoService.getLineas(form.value.uNv2).catch(() => [])
    }
}

// Busca, entre las líneas de atributo ya cargadas, cuál es la dueña del
// uAtrMed guardado (el backend no indica a qué línea pertenece un atributo,
// así que hay que probar una por una contra el catálogo de cada línea).
async function restaurarLineaAtributoSeleccionada() {
    if (!form.value.uAtrMed || cats.value.lineasAtributo.length === 0) return
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

function resolverMensajeErrorCarga(err: unknown, itemCode: string): string {
    const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] } } }
    const detail = axiosErr?.response?.data?.detail
    if (Array.isArray(detail)) {
        return detail.map(d => d.msg).join('. ')
    }
    if (typeof detail === 'string') {
        return detail
    }
    return `No se pudo cargar el artículo "${itemCode}". Verifica que el código es correcto.`
}

async function cargarDatosEdicion(itemCode: string) {
    loadingData.value = true
    try {
        const articulo = await articuloService.getArticuloByCode(itemCode)
        aplicarDatosArticuloAlForm(articulo)
        await cargarCascadasCatalogoParaEdicion()
        await restaurarLineaAtributoSeleccionada()
        // RF-003: recién con las cascadas de catálogo ya cargadas podemos
        // calcular la sugerencia "real" y usarla como base de comparación;
        // si el ItemName guardado coincide, seguirá auto-actualizándose al
        // tocar Marca/Talla/etc. Si no coincide (fue editado a mano), el
        // watcher ya no lo va a pisar.
        ultimoItemNameSugerido.value = calcularItemNameSugerido()

        // Snapshot para dirty checking: se toma al final, con el formulario
        // ya asentado (incluyendo la sugerencia de ItemName), para que no
        // se considere "cambiado" algo que el propio watcher acabó de fijar.
        // Se usa stringify/parse en lugar de structuredClone para desvincular
        // limpiamente el proxy reactivo de Vue (previene DataCloneError).
        originalSnapshot.value = JSON.parse(JSON.stringify(form.value))
    } catch (err: unknown) {
        console.error(`[FormularioArticulo] Error al cargar ${itemCode}:`, err)
        loadError.value = resolverMensajeErrorCarga(err, itemCode)
    } finally {
        loadingData.value = false
    }
}

onMounted(async () => {
    await cargarCatalogos()
    if (isEdit.value) {
        await cargarDatosEdicion(route.params.itemCode as string)
    }
})

// Lista de campos que sí deben ser enviados como numéricos. Vive fuera de
// handleSubmit porque es una constante: no necesita recrearse en cada guardado.
const NUMERIC_FIELDS = new Set([
    'uCodColor', 'uCodColSecu', 'leadTime', 'minOrderQuantity',
    'uUnidadDespacho', 'uDespIn', 'uPrArq', 'price',
    'itemsGroupCode', 'manufacturer', 'shipType',
    'purchaseItemsPerUnit', 'salesItemsPerUnit'
])

function coerceValorSubmit(key: string, val: unknown): unknown {
    // Pydantic strictness: forzar a string los campos que backend espera como texto
    // pero que Catálogos/jerarquías pudieron asignar como número.
    if (typeof val === 'number' && !NUMERIC_FIELDS.has(key)) {
        return String(val)
    }
    return val
}

// Creación: se sigue enviando el formulario completo (menos vacíos/nulos
// opcionales), ya que ArticuloCreate exige varios campos obligatorios.
function buildCreatePayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {}
    Object.entries(form.value).forEach(([key, val]) => {
        if (READONLY_KEYS.has(key)) return
        if (val === '' || val == null) return
        payload[key] = coerceValorSubmit(key, val)
    })
    return payload
}

// Edición: Dirty Checking real contra originalSnapshot. Solo viajan las
// propiedades que cambiaron respecto a lo cargado desde el backend, y
// nunca las estructurales (bloqueadas de por vida, sin importar si el
// valor "cambió" o no: su sola presencia en el body dispara un 422).
// Un valor vacío/null intencional se envía como null, nunca como 0/N/false.
function buildPatchPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {}
    const original = originalSnapshot.value
    if (!original) return payload

    Object.entries(form.value).forEach(([key, rawVal]) => {
        if (STRUCTURAL_LOCKED_KEYS.has(key) || READONLY_KEYS.has(key)) return
        // manageBatchNumbers queda bloqueado por el backend en PATCH cuando
        // el artículo ya tiene historial en SAP (ver
        // _ensure_manage_batch_numbers_editable); se aproxima con
        // isStructuralLocked, ya que la confirmación real requiere una
        // consulta en vivo a SAP que el frontend no puede anticipar.
        if (key === 'manageBatchNumbers' && form.value.isStructuralLocked) return

        const val = rawVal === '' ? null : rawVal
        const originalRaw = (original as Record<string, unknown>)[key]
        const originalVal = originalRaw === '' ? null : originalRaw

        if (val === originalVal) return // sin cambios reales: no reenviar

        payload[key] = val === null ? null : coerceValorSubmit(key, val)
    })
    return payload
}

// Resalta la pestaña/campos inválidos y, si aplica, muestra el toast
// dedicado de Negocio faltante. Extraído de handleSubmit para mantener su
// complejidad cognitiva dentro del límite de SonarQube.
function mostrarErroresValidacion(firstErrorTab: string): void {
    showValidationErrors.value = true
    activeTab.value = firstErrorTab
    showValidationModal.value = true

    // RF-001: el Negocio (uIxxMarca) faltante es el único error de
    // creación con un toast dedicado -- define la letra del ItemCode y
    // no admite fallback a Marca (uMarca), así que merece una
    // notificación explícita además del resaltado en rojo del campo.
    if (!isEdit.value && !form.value.uIxxMarca) {
        toast.addToast({
            type: 'error',
            title: 'Validación',
            message: 'El campo Negocio es obligatorio para la creación.'
        })
    }

    // Intentar hacer focus al primer campo inválido después de cambiar de pestaña
    setTimeout(() => {
        const firstInvalid = document.querySelector('input:invalid, select:invalid, .form-field.required input') as HTMLElement
        if (firstInvalid) firstInvalid.focus()
    }, 100)
}

function resolverMensajeErrorSubmit(detail: string | { msg: string; loc?: string[] }[] | undefined): string {
    if (Array.isArray(detail)) return detail.map(d => d.msg).join('. ')
    if (typeof detail === 'string') return detail
    return 'Ocurrió un error al guardar. Revisa los datos e inténtalo de nuevo.'
}

// HTTP 422: el backend rechazó por Negocio ausente/no registrado en el
// catálogo (ver GeneradorCodigosService.obtener_codigo_negocio) -- se
// intercepta el detail crudo para mostrar un mensaje de negocio claro en
// vez del texto técnico del backend. HTTP 409: conflicto de identificador.
function mostrarToastErrorSubmit(
    status: number | undefined,
    detail: string | { msg: string; loc?: string[] }[] | undefined,
    mensaje: string
): void {
    const detalleTexto = Array.isArray(detail)
        ? detail.map(d => `${d.loc?.join('.') ?? ''} ${d.msg}`).join(' ')
        : (detail ?? '')

    if (status === 422 && /u_ixx_marca|uIxxMarca|Negocio/i.test(detalleTexto)) {
        toast.addToast({
            type: 'error',
            title: 'No se pudo generar el código',
            message: 'El Negocio seleccionado no es válido o no está registrado en el catálogo.'
        })
    } else if (status === 409) {
        toast.addToast({
            type: 'error',
            title: 'Conflicto de identificadores',
            message: mensaje || 'Ya existe un artículo con ese código o identificador.'
        })
    }
}

function manejarErrorSubmit(err: unknown): void {
    const axiosErr = err as {
        response?: { status?: number; data?: { detail?: string | { msg: string; loc?: string[] }[] } }
    }
    const status = axiosErr?.response?.status
    const detail = axiosErr?.response?.data?.detail

    submitError.value = resolverMensajeErrorSubmit(detail)
    mostrarToastErrorSubmit(status, detail, submitError.value)
}

// Guardar formulario. Único punto de captura de Ctrl+S (FE-CONCURRENCY,
// ver useKeyboardShortcuts(shortcuts) más abajo): antes coexistía un
// segundo listener manual (`handleKeydown` vía
// globalThis.addEventListener) que llamaba a esta misma función sin
// ningún resguardo de concurrencia, disparando dos POST /articulos en
// paralelo por cada Ctrl+S. El guardia de abajo (`submitting.value`)
// ahora vive DENTRO de handleSubmit, así que protege sin importar cuántos
// puntos de disparo existan (teclado, botón, o uno nuevo a futuro).
async function handleSubmit() {
    if (submitting.value) return

    const firstErrorTab = getFirstErrorTab()
    if (firstErrorTab) {
        mostrarErroresValidacion(firstErrorTab)
        return
    }

    submitting.value = true
    submitError.value = ''
    submitSuccess.value = ''

    try {
        if (isEdit.value) {
            const itemCode = route.params.itemCode as string
            const payload = buildPatchPayload()
            const article = await articuloService.updateArticulo(itemCode, payload)
            form.value.imagenes = article.imagenes ?? []
            submitSuccess.value = `Artículo ${itemCode} actualizado. Sincronización con SAP iniciada en segundo plano.`
            ultimoItemCodeSap.value = itemCode
        } else {
            const payload = buildCreatePayload()
            const article = await articuloService.createArticulo(payload)
            form.value.imagenes = article.imagenes ?? []
            // Las imágenes elegidas antes de crear el artículo quedaron en
            // espera (GestorImagenes no tenía ItemCode todavía); ahora que ya
            // existe, se suben.
            await gestorImagenesRef.value?.flushPendingUploads(article.itemCode)
            // El banner local (submitSuccess) no sobrevive al router.replace: el
            // <component :key="route.path"> de MainLayout remonta este componente
            // al cambiar de /nuevo a /editar/:itemCode, destruyendo sus refs antes
            // de que el mensaje llegue a pintarse. El toast global sí sobrevive,
            // porque vive fuera del árbol remontado (ver ToastContainer/useToast).
            toast.addToast({
                type: 'success',
                title: 'Artículo creado',
                message: `Artículo ${article.itemCode} creado. Sincronización con SAP iniciada en segundo plano.`,
                action: accionMonitoreoSap(article.itemCode)
            })
            ultimoItemCodeSap.value = article.itemCode
            await router.replace(`/articulo-maestro/editar/${article.itemCode}`)
        }
    } catch (err: unknown) {
        manejarErrorSubmit(err)
    } finally {
        submitting.value = false
    }
}

const showKeyboardHelp = ref(false)
const shortcuts = {
    'Ctrl+S': {
        description: 'Guardar artículo',
        action: () => {
            // El resguardo de re-entrancia (submitting.value) ahora vive
            // dentro de handleSubmit; aquí solo se filtran los estados en
            // los que no tiene sentido intentar guardar (carga en curso o
            // fallida).
            if (!loadingData.value && !loadError.value) {
                handleSubmit()
            }
        }
    },
    'Esc': {
        description: 'Cerrar modal o Volver',
        action: () => {
            if (showValidationModal.value) {
                showValidationModal.value = false
            } else if (showKeyboardHelp.value) {
                showKeyboardHelp.value = false
            } else {
                router.push('/articulo-maestro/lista')
            }
        }
    },
    'Alt+1': { description: 'Ir a General', action: () => { activeTab.value = 'general' } },
    'Alt+2': { description: 'Ir a Categorización', action: () => { activeTab.value = 'cat' } },
    'Alt+3': { description: 'Ir a Color y Material', action: () => { activeTab.value = 'mat' } },
    'Alt+4': { description: 'Ir a Logística y Precios', action: () => { activeTab.value = 'log' } },
    'Alt+5': { description: 'Ir a Config. SAP', action: () => { activeTab.value = 'sap' } },
    'Alt+6': { description: 'Ir a Imágenes', action: () => { activeTab.value = 'img' } }
}
useKeyboardShortcuts(shortcuts)

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
