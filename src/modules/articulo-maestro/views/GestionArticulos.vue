<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Artículos</h1>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Administración de artículos maestros
                    </p>
                </div>
                <router-link
                    class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    to="/articulo-maestro">
                    Volver
                </router-link>
            </div>
            
            <!-- Actions -->
            <div class="mt-6 flex gap-3">
                <button
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                    @click="router.push('/articulo-maestro/nuevo')"
                >
                    + Agregar artículo
                </button>
                <button
                    class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                    @click="showCargaModal = true"
                >
                    + Cargar archivo
                </button>
            </div>
            
            <!-- Table Container -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                
                <!-- Filters and Controls -->
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ filteredArticulos.length }}</span> 
                        <span class="text-gray-400 font-normal ml-1">de {{ totalCount }}</span>
                    </div>
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                            v-model.trim="searchQuery"
                            type="text"
                            placeholder="Buscar por código o nombre..."
                            class="w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        <select v-model.number="pageSize" class="w-full sm:w-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                            <option :value="5">5 filas</option>
                            <option :value="10">10 filas</option>
                            <option :value="20">20 filas</option>
                            <option :value="50">50 filas</option>
                        </select>
                    </div>
                </div>

                <!-- States -->
                <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    Cargando artículos...
                </div> 
                <div v-else-if="error" class="py-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800">
                    {{ error }}
                </div>
                <div v-else-if="filteredArticulos.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron artículos con la búsqueda actual.
                </div>
                
                <!-- Table -->
                <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CODIGO INTERNO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CODIGO DE BARRAS</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">GENERO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">DESCRIPCION SAP</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">DESCRIPCION ETIQUETA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">DESCRIPCION FACTURA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COD COLOR PRIMARIO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COLOR PRIMARIO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COD COLOR SECUNDARIO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COLOR SECUNDARIO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">REFERENCIA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">TALLA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">MATERIAL</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COMPOSICION</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">LINEA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CATEGORIA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">SECCION</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ATRIBUTO UNICO TEXTIL/CALZADO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ATRIBUTO UNICO 2</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">UNIDAD DE VENTA (PACK)</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CODIGO PROVEEDOR</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">MARCA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">NOMBRE COLECCION</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ESTATUS DE PERMANENCIA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ORIGEN DE COMPRA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">PAIS DE ORIGEN</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">LEAD TIME PROVEEDOR (DIAS)</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CANTIDAD MINIMA DE COMPRA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ENVIO DIRECTO A TIENDA DESDE PROVEEDOR</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">UNIDAD DE EMPAQUE - OUTER</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">UNIDAD DE EMPAQUE - INNER</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">CANAL DE VENTA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">REGION DE VENTA</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">COSTO DE ARRANQUE</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">PVP</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">LIQUIDACION</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">NOMBRE GRUPO DE ARTICULOS</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">NEGOCIO</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ItemType</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">EvalSystem</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">GLMethod</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ByWh</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">PrchseItem</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">SellItem</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">InvntItem</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">VATLiable</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">WTLiable</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">IndirctTax</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">TaxCodeAR</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">TaxCodeAP</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">FirmCode</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ShipType</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">ManBtchNum</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">PlaningSys</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">PrcrmntMtd</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">InvntryUom</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">BuyUnitMsr</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">NumInBuy</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">SalUnitMsr</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">NumInSale</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">U_TIPO_BIEN</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">QryGroup63</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max whitespace-nowrap">Columna1</th>
                                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            <tr v-for="articulo in pagedArticulos" :key="articulo.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.itemCode || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.barCode || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uGEN || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.foreignName || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uDescEcomm || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.itemName || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uCodColor || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxColores || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uCodColSecu || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uColorSecu || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uSxxSkuSinTalla || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxTalla || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxMaterial || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxComposicion || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uNv3 || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uNv2 || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uNv1 || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uAtrMed || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uAtrUni || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxPack || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uCodPvr || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uMarca || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uNomColeccion || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uReposicion || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uOrigen || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uPOri || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.leadTime || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.minOrderQuantity || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uTipAbs || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uUnidadDespacho || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uDespIn || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uCanalVenta || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uRegion || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uPrArq || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap">
                                    ${{ articulo.price !== null && articulo.price !== undefined ? articulo.price : '0.00' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uLiq || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.itemsGroupCode || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uIxxMarca || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.itemType || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.costAccountingMethod || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.glMethod || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.manageStockByWarehouse || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.purchaseItem || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.salesItem || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.inventoryItem || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.vatLiable || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.wtLiable || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.indirectTax || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.arTaxCode || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.apTaxCode || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.manufacturer || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.shipType || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.manageBatchNumbers || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.planningSystem || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.procurementMethod || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.inventoryUom || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.purchaseUnit || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.purchaseItemsPerUnit || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.salesUnit || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.salesItemsPerUnit || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.uTipoBien || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.properties63 || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-max whitespace-nowrap">
                                    {{ articulo.properties64 || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                                    <button
                                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 transition-colors"
                                        @click="router.push(`/articulo-maestro/editar/${articulo.itemCode}`)"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        class="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors"
                                        :disabled="deletingCode === articulo.itemCode"
                                        @click="handleDelete(articulo.itemCode)"
                                    >
                                        {{ deletingCode === articulo.itemCode ? 'Eliminando...' : 'Eliminar' }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Footer -->
                <div v-if="filteredArticulos.length > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ pageStart }}</span> a <span class="font-medium text-gray-900 dark:text-white">{{ pageEnd }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            :disabled="page === 1"
                            @click="page--"
                        >
                            Anterior
                        </button>
                        <div class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            {{ page }} / {{ totalPages }}
                        </div>
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            :disabled="page >= totalPages"
                            @click="page++"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal Carga Masiva -->
    <Teleport to="body">
        <div v-if="showCargaModal" class="fixed inset-0 z-50 flex items-center justify-center">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/50" @click="closeCargaModal"></div>

            <!-- Modal Content -->
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Carga Masiva de Artículos</h2>
                    <button @click="closeCargaModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="px-6 py-5 overflow-y-auto flex-1 space-y-5">

                    <!-- Paso 1: Descargar Plantilla -->
                    <div class="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-blue-900 dark:text-blue-200">1. Descarga la plantilla Excel</p>
                            <p class="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Completa los datos de los artículos y súbela en el paso 2.</p>
                        </div>
                        <button
                            @click="handleDownloadTemplate"
                            :disabled="downloadingTemplate"
                            class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                        >
                            {{ downloadingTemplate ? 'Descargando...' : 'Descargar .xlsx' }}
                        </button>
                    </div>

                    <!-- Paso 2: Subir Archivo -->
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">2. Sube el archivo completado</p>
                        <div
                            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
                            :class="dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
                            @dragover.prevent="dragOver = true"
                            @dragleave.prevent="dragOver = false"
                            @drop.prevent="onDrop"
                        >
                            <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileSelect" />
                            <div v-if="!selectedFile" class="space-y-2">
                                <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Arrastra tu archivo aquí o <button type="button" @click="fileInputRef?.click()" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">selecciona uno</button></p>
                                <p class="text-xs text-gray-400">.xlsx únicamente</p>
                            </div>
                            <div v-else class="flex items-center justify-center gap-3">
                                <svg class="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="text-sm text-gray-900 dark:text-white font-medium">{{ selectedFile.name }}</span>
                                <button type="button" @click="selectedFile = null" class="text-xs text-red-500 hover:underline">Quitar</button>
                            </div>
                        </div>
                    </div>

                    <!-- Resultados -->
                    <div v-if="cargaResults" class="space-y-3">
                        <div class="flex gap-3">
                            <div class="flex-1 rounded-lg p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                                <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{{ cargaResults.success_count }}</p>
                                <p class="text-xs text-emerald-600 dark:text-emerald-500">Exitosos</p>
                            </div>
                            <div class="flex-1 rounded-lg p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                                <p class="text-2xl font-bold text-red-700 dark:text-red-400">{{ cargaResults.error_count }}</p>
                                <p class="text-xs text-red-600 dark:text-red-500">Con errores</p>
                            </div>
                            <div class="flex-1 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-center">
                                <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ cargaResults.total }}</p>
                                <p class="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                        <div class="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table class="w-full text-xs">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">ItemCode</th>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Estado</th>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Mensaje</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr v-for="r in cargaResults.results" :key="r.item_code">
                                        <td class="px-3 py-1.5 font-mono text-gray-900 dark:text-white">{{ r.item_code }}</td>
                                        <td class="px-3 py-1.5">
                                            <span :class="r.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'" class="font-medium">
                                                {{ r.success ? '✓ OK' : '✗ Error' }}
                                            </span>
                                        </td>
                                        <td class="px-3 py-1.5 text-gray-500 dark:text-gray-400">{{ r.message || '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Error general -->
                    <div v-if="cargaError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        {{ cargaError }}
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        @click="closeCargaModal"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {{ cargaResults ? 'Cerrar' : 'Cancelar' }}
                    </button>
                    <button
                        v-if="!cargaResults"
                        @click="handleUpload"
                        :disabled="!selectedFile || uploading"
                        class="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                    >
                        <svg v-if="uploading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {{ uploading ? 'Procesando...' : 'Subir y Procesar' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticuloStore } from '../stores/articuloStore'
import { articuloService } from '../services/articuloService'
import type { CargaMasivaResponse } from '../services/articuloService'

const router = useRouter()
const store = useArticuloStore()

// Obtenemos el estado reactivo desde el store
const { articulos, loading, error, filters } = storeToRefs(store)

const searchQuery = computed({
    get: () => filters.value.search || '',
    set: (val: string) => store.setSearchFilter(val)
})

const pageSize = computed({
    get: () => filters.value.pageSize || 10,
    set: (val: number) => {
        store.filters.pageSize = val
        store.setPage(1)
    }
})

const page = computed({
    get: () => store.pagination.page,
    set: (val: number) => store.setPage(val)
})

const totalCount = computed(() => store.pagination.total)

// 1. Filtrar artículos en base a la búsqueda en la vista, aunque ya vengan paginados del servidor.
// Como el backend devuelve todos y simulamos paginacion real:
const filteredArticulos = computed(() => {
    // Si la bsuqueda es "server side", el store.articulos ya viene filtrado
    // Como el endpoint devuelve todo, filtramos local por ahora
    const query = searchQuery.value.toLowerCase().trim()
    
    // Casting temporal para saltarnos el type-checking de camelCase vs PascalCase
    const artlist = articulos.value as any[]

    if (!query) {
        return artlist
    }
    return artlist.filter(articulo => {
        const cod = articulo.itemCode || ''
        const nom = articulo.itemName || ''
        return cod.toLowerCase().includes(query) || nom.toLowerCase().includes(query)
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticulos.value.length / pageSize.value)))

const pagedArticulos = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return filteredArticulos.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
    if (filteredArticulos.value.length === 0) return 0
    return (page.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
    const end = page.value * pageSize.value
    return Math.min(end, filteredArticulos.value.length)
})

// Observadores (Watchers)
watch(filteredArticulos, () => {
    if (page.value > totalPages.value && totalPages.value > 0) {
        page.value = totalPages.value
    }
})

// Si el usuario cambia la búsqueda o la cantidad de ítems por página, lo regresamos a la página 1.
watch([searchQuery, pageSize], () => {
    page.value = 1
})

// Ciclo de Vida
onMounted(() => {
    store.fetchArticulos()
})

// Eliminar artículo con confirmación
const deletingCode = ref<string | null>(null)

async function handleDelete(itemCode: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el artículo "${itemCode}"? Esta acción no se puede deshacer.`)) return
    deletingCode.value = itemCode
    try {
        await articuloService.deleteArticulo(itemCode)
        await store.fetchArticulos()
    } catch (err) {
        alert('No se pudo eliminar el artículo. Inténtalo de nuevo.')
        console.error(err)
    } finally {
        deletingCode.value = null
    }
}

// ─── Carga Masiva ─────────────────────────────────────────────────────────────────────
const showCargaModal = ref(false)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const uploading = ref(false)
const downloadingTemplate = ref(false)
const cargaResults = ref<CargaMasivaResponse | null>(null)
const cargaError = ref('')

function closeCargaModal() {
    showCargaModal.value = false
    selectedFile.value = null
    cargaError.value = ''
    // Si hubo resultados, recargar la tabla al cerrar
    if (cargaResults.value) {
        cargaResults.value = null
        store.fetchArticulos()
    }
}

function onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        selectedFile.value = input.files[0]
    }
}

function onDrop(event: DragEvent) {
    dragOver.value = false
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        const file = event.dataTransfer.files[0]
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            selectedFile.value = file
        } else {
            cargaError.value = 'Solo se permiten archivos .xlsx'
        }
    }
}

async function handleDownloadTemplate() {
    downloadingTemplate.value = true
    try {
        await articuloService.downloadTemplate()
    } catch (err) {
        cargaError.value = 'No se pudo descargar la plantilla.'
        console.error(err)
    } finally {
        downloadingTemplate.value = false
    }
}

async function handleUpload() {
    if (!selectedFile.value) return
    uploading.value = true
    cargaError.value = ''
    cargaResults.value = null
    try {
        cargaResults.value = await articuloService.cargaMasiva(selectedFile.value)
    } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        cargaError.value = axiosErr?.response?.data?.detail || 'Error al procesar el archivo. Verifica el formato.'
        console.error(err)
    } finally {
        uploading.value = false
    }
}
</script>