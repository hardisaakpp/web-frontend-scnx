<template>
  <Teleport to="body">
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
    @click.self="solicitarCierre"
  >
    <div
      ref="modalRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-error-modal-title"
      tabindex="-1"
      @keydown.tab="atraparFoco"
      @keydown.esc="solicitarCierre"
      :class="[
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 focus:outline-none',
        isModalMaximized ? 'w-full h-full max-w-none max-h-none m-0 rounded-none' : `${anchoModal} w-full max-h-[90vh]`
      ]"
    >
      <!-- Confirmación antes de descartar correcciones ya seleccionadas (cierre accidental) -->
      <div
        v-if="mostrarConfirmacionDescarte"
        class="absolute inset-0 z-10 bg-white/98 dark:bg-gray-800/98 flex items-center justify-center p-6"
      >
        <div class="max-w-sm text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">¿Descartar las correcciones seleccionadas?</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Vas a perder las selecciones que ya hiciste. Vas a tener que volver a elegirlas si subís el archivo de nuevo.
            </p>
          </div>
          <div class="flex items-center justify-center gap-3">
            <button
              @click="cancelarDescarte"
              class="px-4 py-2 text-sm font-medium bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
            >
              Seguir editando
            </button>
            <button
              @click="confirmarDescarte"
              class="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>

      <!-- Encabezado del modal con color según tipo de error -->
      <div :class="[
        'px-6 py-4 border-b flex items-center justify-between transition-colors duration-300',
        getErrorStyle.header
      ]">
        <div class="flex items-center gap-3">
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            getErrorStyle.iconBg
          ]">
            <!-- Ícono de "decisión pendiente" cuando el usuario puede resolverlo aquí mismo -->
            <svg v-if="esResolubleEnElModal" :class="['w-6 h-6', getErrorStyle.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <svg v-else :class="['w-6 h-6', getErrorStyle.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 id="upload-error-modal-title" :class="[
              'text-lg font-semibold',
              getErrorStyle.titleColor
            ]">{{ uploadErrorInfo?.title || 'Error al cargar archivo Excel' }}</h3>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {{ esResolubleEnElModal
                ? 'Elegí cómo resolver cada diferencia y continuá sin volver a subir el archivo'
                : 'El archivo no pudo ser procesado' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Botón de maximizar/restaurar -->
          <button
            @click="isModalMaximized = !isModalMaximized"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            :title="isModalMaximized ? 'Restaurar' : 'Maximizar'"
            :aria-label="isModalMaximized ? 'Restaurar tamaño del modal' : 'Maximizar modal'"
          >
            <svg v-if="!isModalMaximized" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5 5m5-5v4m0-4h-4" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          </button>
          <!-- Botón de cerrar -->
          <button
            @click="solicitarCierre"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Contenido del modal con scroll -->
      <div class="overflow-y-auto flex-1 p-6">
        <div :class="['space-y-4', (isModalMaximized && !esResolubleEnElModal) ? 'max-w-3xl mx-auto' : '']">
          <!-- Mensaje de protección de datos + archivo (compacto: es contexto, no la acción principal) -->
          <div v-if="showDataProtectionMessage" class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 transition-colors duration-300">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p class="text-xs text-blue-800 dark:text-blue-300">
              <span class="font-semibold">Los datos actuales no han sido modificados.</span>
              La información del pedido que ves en pantalla sigue siendo válida.
            </p>
          </div>

          <!-- Información del archivo -->
          <div v-if="uploadErrorInfo?.fileName" class="bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <p class="text-xs text-gray-700 dark:text-gray-300 break-all">
              <span class="font-semibold text-gray-900 dark:text-white">{{ esResolubleEnElModal ? 'Archivo:' : 'Archivo rechazado:' }}</span>
              <span class="ml-2 font-mono text-gray-600 dark:text-gray-400">{{ uploadErrorInfo.fileName }}</span>
            </p>
          </div>

          <!-- ⭐ Sección específica para error de número de pedido duplicado -->
          <div v-if="uploadErrorInfo?.error_code === 'NUMERO_PEDIDO_DUPLICADO' && uploadErrorInfo?.numero_pedido" 
               class="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-6 transition-colors duration-300">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-base font-bold text-orange-900 dark:text-orange-200 mb-3">
                  Número de Pedido Duplicado
                </h4>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700 mb-4">
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    El siguiente número de pedido ya existe en el sistema:
                  </p>
                  <div class="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/40 rounded-lg p-3 border border-orange-300 dark:border-orange-600">
                    <svg class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span class="text-lg font-bold font-mono text-orange-900 dark:text-orange-100">
                      {{ uploadErrorInfo.numero_pedido }}
                    </span>
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    ¿Qué puedes hacer?
                  </p>
                  <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-1">
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Verifica que el número de pedido en tu archivo Excel sea el correcto</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Cambia el número de pedido en el archivo Excel por uno nuevo y único</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Vuelve a subir el archivo con el nuevo número de pedido</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- ⭐ Sección específica para formato Excel inválido -->
          <div v-if="uploadErrorInfo?.error_code === 'FORMATO_EXCEL_INVALIDO'" 
               class="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 transition-colors duration-300">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-base font-bold text-yellow-900 dark:text-yellow-200 mb-3">
                  Formato Excel Inválido
                </h4>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700 mb-4">
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    El archivo Excel no contiene la estructura requerida. El archivo debe tener las siguientes hojas:
                  </p>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg p-2 border border-yellow-200 dark:border-yellow-600">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm font-semibold font-mono text-yellow-900 dark:text-yellow-100">cabecera</span>
                      <span class="text-xs text-gray-600 dark:text-gray-400">(Información general del pedido)</span>
                    </div>
                    <div class="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg p-2 border border-yellow-200 dark:border-yellow-600">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm font-semibold font-mono text-yellow-900 dark:text-yellow-100">detalle</span>
                      <span class="text-xs text-gray-600 dark:text-gray-400">(Productos y distribuciones)</span>
                    </div>
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    ¿Cómo solucionarlo?
                  </p>
                  <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-1">
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Descarga la plantilla oficial del sistema</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Verifica que las hojas se llamen exactamente <strong class="font-mono">cabecera</strong> y <strong class="font-mono">detalle</strong></span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>No elimines ni renombres las hojas de la plantilla</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Asegúrate de usar el formato .xlsx o .xls</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- ⭐ Sección específica para archivo sin datos -->
          <div v-if="uploadErrorInfo?.error_code === 'ARCHIVO_SIN_DATOS'" 
               class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-6 transition-colors duration-300">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-base font-bold text-amber-900 dark:text-amber-200 mb-3">
                  Archivo Sin Datos Válidos
                </h4>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700 mb-4">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    El archivo Excel está vacío o no contiene productos válidos para procesar. El pedido debe incluir al menos un producto con su información completa.
                  </p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    ¿Qué revisar?
                  </p>
                  <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-1">
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Verifica que la hoja <strong class="font-mono">detalle</strong> contenga productos</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Asegúrate de que cada producto tenga código, cantidad y distribución</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Revisa que no haya filas vacías entre los productos</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Confirma que las cantidades sean valores numéricos válidos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- ⭐ Sección específica para formato de respuesta proveedor inválido -->
          <div v-if="uploadErrorInfo?.error_code === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO'" 
               class="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-6 transition-colors duration-300">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-base font-bold text-red-900 dark:text-red-200 mb-3">
                  Formato de Respuesta Proveedor Inválido
                </h4>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700 mb-4">
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    El archivo de respuesta del proveedor no contiene la hoja requerida. El archivo debe incluir una hoja llamada:
                  </p>
                  <div class="flex items-center gap-2 bg-red-50 dark:bg-red-900/40 rounded-lg p-3 border border-red-200 dark:border-red-600">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-base font-bold font-mono text-red-900 dark:text-red-100">RESUMEN</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    ¿Cómo corregirlo?
                  </p>
                  <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-1">
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Verifica que el archivo del proveedor contenga una hoja llamada <strong class="font-mono">RESUMEN</strong></span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>El nombre de la hoja debe estar en mayúsculas</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Solicita al proveedor que use el formato correcto de respuesta</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Si el problema persiste, contacta al área de sistemas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensaje de error principal (se oculta si ya mostramos un error específico) -->
          <div v-if="!shouldHideGenericMessage" 
               class="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Descripción del problema</p>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ uploadErrorInfo?.message }}</p>
              </div>
            </div>
          </div>

          <!-- Lista de errores detallados (si existen) -->
          <div v-if="uploadErrorInfo?.errors && uploadErrorInfo.errors.length > 0" class="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden bg-red-50 dark:bg-red-900/30 transition-colors duration-300">
            <div class="bg-red-100 dark:bg-red-900/50 px-4 py-3 border-b border-red-200 dark:border-red-800">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <p class="text-sm font-semibold text-red-900 dark:text-red-200">
                  Detalles del error ({{ uploadErrorInfo.errors.length }} problema{{ uploadErrorInfo.errors.length !== 1 ? 's' : '' }})
                </p>
                <!-- Progreso de correcciones de código: cuántos códigos inválidos ya tienen sugerencia elegida -->
                <div v-if="tieneErroresCodigo" class="flex items-center gap-2">
                  <div class="w-24 h-1.5 rounded-full bg-red-200 dark:bg-red-900 overflow-hidden">
                    <div
                      class="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
                      :style="{ width: `${totalCodigos ? (codigosResueltos / totalCodigos) * 100 : 0}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-red-800 dark:text-red-200 tabular-nums">
                    {{ codigosResueltos }} de {{ totalCodigos }} resueltos
                  </span>
                </div>
                <span v-else class="text-xs text-red-700 dark:text-red-300 font-medium">Revisar y corregir</span>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800">
              <!-- Tamaño normal: lista de una columna con separadores. Maximizado: columnas tipo "masonry"
                   (no grid) porque cada tarjeta tiene alto variable (sugerencias, motivos expandibles, info
                   MBA3) — con grid, una fila con una tarjeta larga dejaría huecos vacíos junto a las cortas. -->
              <ul
                :class="isModalMaximized ? 'columns-1 xl:columns-2 2xl:columns-3 gap-4 p-4' : 'divide-y divide-gray-200 dark:divide-gray-700'"
              >
                <li
                  v-for="(error, index) in uploadErrorInfo.errors"
                  :key="index"
                  :id="typeof error !== 'string' && error.producto ? `pendiente-codigo-${error.producto}` : undefined"
                  :class="isModalMaximized
                    ? 'break-inside-avoid mb-4 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                    : 'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'"
                >
                  <div v-if="typeof error !== 'string' && error.producto" class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold">
                        ✕
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">{{ error.producto }}</p>
                        <span v-if="error.campo" class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {{ error.campo }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-700 dark:text-gray-300">{{ error.mensaje }}</p>
                      
                      <!-- ⭐ Información de MBA3 (si está disponible del backend) -->
                      <div v-if="error.campo === 'Producto SAP' && error.producto && getInfoMba3(error.producto)" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <h6 class="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Resultado en MBA3
                        </h6>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span class="font-medium text-gray-600 dark:text-gray-300">Código:</span>
                            <p class="text-gray-900 dark:text-gray-100 font-mono">{{ getInfoMba3(error.producto)?.codigo || '-' }}</p>
                          </div>
                          <div>
                            <span class="font-medium text-gray-600 dark:text-gray-300">Nombre:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.nombre || '-' }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.corp">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Corp:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.corp }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.grupo_prenda">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Grupo:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.grupo_prenda }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.descontinuado !== undefined">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Descontinuado:</span>
                            <span
                              :class="getInfoMba3(error.producto)?.descontinuado ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                              class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {{ getInfoMba3(error.producto)?.descontinuado ? 'Sí' : 'No' }}
                            </span>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.inactive !== undefined">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Inactivo:</span>
                            <span
                              :class="getInfoMba3(error.producto)?.inactive ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                              class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {{ getInfoMba3(error.producto)?.inactive ? 'Sí' : 'No' }}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Sugerencias SAP automáticas (solo para códigos de producto no encontrados) -->
                      <div v-if="error.campo === 'Producto SAP' && error.producto" class="mt-4">
                        <!-- Estado de carga o sin estado (inicial) -->
                        <div v-if="!sugerenciasEstado[error.producto] || sugerenciasEstado[error.producto] === 'buscando' || sugerenciasEstado[error.producto] === 'idle'" class="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                          <div class="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="text-xs font-medium">Buscando sugerencias similares en SAP...</span>
                          </div>
                        </div>
                        
                        <!-- Sugerencias encontradas -->
                        <div v-else-if="sugerenciasEstado[error.producto] === 'completado' && sugerenciasPorCodigo[error.producto]?.length > 0" class="mt-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div class="flex items-center justify-between mb-2">
                            <h5 class="text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              Sugerencias similares en SAP ({{ sugerenciasPorCodigo[error.producto].length }})
                            </h5>
                            <!-- Control de cantidad de sugerencias a mostrar -->
                            <div class="flex items-center gap-2 flex-wrap">
                              <label class="text-xs text-purple-700 dark:text-purple-300 whitespace-nowrap">
                                Mostrar:
                              </label>
                              <input
                                type="number"
                                :value="getLimiteSugerencias(error.producto)"
                                @input="setLimiteSugerencias(error.producto, parseInt(($event.target as HTMLInputElement).value) || 5)"
                                :min="1"
                                :max="sugerenciasPorCodigo[error.producto].length"
                                class="w-16 px-2 py-1 text-xs border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                              />
                              <span class="text-xs text-purple-600 dark:text-purple-400">
                                / {{ sugerenciasPorCodigo[error.producto].length }}
                              </span>
                              <!-- Botones rápidos -->
                              <div class="flex items-center gap-1 ml-1">
                                <button
                                  v-if="getLimiteSugerencias(error.producto) < sugerenciasPorCodigo[error.producto].length"
                                  @click="setLimiteSugerencias(error.producto, Math.min(getLimiteSugerencias(error.producto) + 5, sugerenciasPorCodigo[error.producto].length))"
                                  class="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                  title="Mostrar 5 más"
                                >
                                  +5
                                </button>
                                <button
                                  v-if="getLimiteSugerencias(error.producto) < sugerenciasPorCodigo[error.producto].length"
                                  @click="setLimiteSugerencias(error.producto, sugerenciasPorCodigo[error.producto].length)"
                                  class="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors font-semibold"
                                  title="Mostrar todas"
                                >
                                  Todas
                                </button>
                                <button
                                  v-if="getLimiteSugerencias(error.producto) > 5"
                                  @click="setLimiteSugerencias(error.producto, 5)"
                                  class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Mostrar solo 5"
                                >
                                  Menos
                                </button>
                              </div>
                            </div>
                          </div>
                          <div class="space-y-2">
                            <label
                              v-for="sugerencia in getSugerenciasLimitadas(error.producto)"
                              :key="sugerencia.codigo"
                              class="flex items-start gap-2 cursor-pointer bg-white dark:bg-gray-800 border-l-4 rounded-lg p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              :class="{
                                'border-green-500': sugerencia.score_porcentaje >= 80,
                                'border-yellow-500': sugerencia.score_porcentaje >= 50 && sugerencia.score_porcentaje < 80,
                                'border-red-500': sugerencia.score_porcentaje < 50,
                                'ring-2 ring-purple-500': correccionesSeleccionadas[error.producto] === sugerencia.codigo
                              }"
                            >
                              <input
                                type="radio"
                                :name="`correccion-${error.producto}`"
                                :value="sugerencia.codigo"
                                v-model="correccionesSeleccionadas[error.producto]"
                                class="mt-0.5 w-3 h-3 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                              />
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                  <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">{{ sugerencia.codigo }}</span>
                                  <span
                                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                                    :class="getScoreBadgeClass(sugerencia.score_porcentaje)"
                                  >
                                    {{ sugerencia.score_porcentaje }}% de coincidencia
                                  </span>
                                </div>
                                <p class="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{{ sugerencia.nombre }}</p>
                                
                                <div class="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                                  <span v-if="sugerencia.pack">Pack: <span class="font-semibold">{{ sugerencia.pack }}</span></span>
                                  <span v-if="sugerencia.group_name">Grupo: <span class="font-semibold">{{ sugerencia.group_name }}</span></span>
                                  <span
                                    :class="sugerencia.estado === 'activo' ? 'text-green-700 dark:text-green-300 font-semibold' : 'text-red-700 dark:text-red-300 font-semibold'"
                                  >
                                    {{ sugerencia.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                                  </span>
                                </div>
                                
                                <!-- Motivos expandibles -->
                                <details v-if="sugerencia.motivos && sugerencia.motivos.length > 0" class="mt-2">
                                  <summary class="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200">
                                    Motivos de la sugerencia ({{ sugerencia.motivos.length }})
                                  </summary>
                                  <ul class="mt-1 ml-3 space-y-0.5">
                                    <li
                                      v-for="(motivo, motivoIndex) in sugerencia.motivos"
                                      :key="motivoIndex"
                                      class="text-xs text-gray-600 dark:text-gray-400 list-disc"
                                    >
                                      {{ motivo }}
                                    </li>
                                  </ul>
                                </details>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        <!-- Sin sugerencias -->
                        <div v-else-if="sugerenciasEstado[error.producto] === 'completado' && (!sugerenciasPorCodigo[error.producto] || sugerenciasPorCodigo[error.producto].length === 0)" class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                          <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-xs font-medium">No se encontraron sugerencias similares en SAP para este código.</span>
                          </div>
                        </div>
                        
                        <!-- Error en búsqueda de sugerencias -->
                        <div v-else-if="sugerenciasEstado[error.producto] === 'error'" class="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                          <div class="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-xs font-medium">No se pudieron obtener sugerencias (puede ser timeout).</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold">
                        !
                      </span>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm text-gray-900 dark:text-white">{{ formatError(error) }}</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div v-if="uploadErrorInfo.title && (uploadErrorInfo.title.includes('SAP') || uploadErrorInfo.title.includes('no encontrados'))" class="bg-amber-50 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-800 px-4 py-3 transition-colors duration-300">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-xs font-medium text-amber-900 dark:text-amber-200">⚠️ Acciones recomendadas:</p>
                  <ul class="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-1 ml-2">
                    <li>• Verifica que los códigos estén escritos correctamente en el Excel</li>
                    <li>• Confirma que los códigos estén registrados en SAP</li>
                    <li>• Revisa posibles errores de tipeo (mayúsculas/minúsculas, espacios, guiones)</li>
                    <li>• Contacta al área de maestros si los códigos deberían existir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- ⭐ Discrepancias de Pack/PVP contra SAP (RN-02) — agrupadas por código, comparación lado a lado, con acciones masivas -->
          <div v-if="tieneMismatchesPackPvp" class="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden bg-amber-50 dark:bg-amber-900/20 transition-colors duration-300">
            <div class="bg-amber-100 dark:bg-amber-900/40 px-4 py-3 border-b border-amber-200 dark:border-amber-800">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p class="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Discrepancias de Pack/PVP contra SAP
                  </p>
                  <p class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    {{ gruposPackPvp.length }} código{{ gruposPackPvp.length !== 1 ? 's' : '' }} con valores distintos entre el Excel y SAP —
                    {{ decisionesPackPvpResueltas }} de {{ totalDecisionesPackPvp }} resueltas
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="usarSapEnTodasLasDiscrepancias"
                    class="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    Usar SAP en todos
                  </button>
                  <button
                    type="button"
                    @click="usarExcelEnTodasLasDiscrepancias"
                    class="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Usar Excel en todos
                  </button>
                </div>
              </div>
            </div>
            <div
              :class="[
                'bg-white dark:bg-gray-800 p-4',
                isModalMaximized ? 'grid grid-cols-1 xl:grid-cols-4 gap-3' : 'space-y-3'
              ]"
            >
              <div
                v-for="grupo in gruposPackPvp"
                :key="grupo.codigo"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-sm font-semibold text-gray-900 dark:text-white font-mono">{{ grupo.codigo }}</span>
                  <span v-if="grupo.pack" class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">Pack</span>
                  <span v-if="grupo.pvp" class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">PVP</span>
                </div>

                <!-- Discrepancia de Pack: SAP y Excel enfrentados en dos columnas -->
                <div v-if="grupo.pack" :class="grupo.pvp ? 'mb-3' : ''">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Pack</p>
                  <div class="grid grid-cols-2 gap-2">
                    <label
                      class="flex flex-col gap-0.5 cursor-pointer rounded-lg border-2 px-3 py-2 transition-colors"
                      :class="correccionesPackPvp[grupo.codigo]?.pack === grupo.pack.sap
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <input
                          type="radio"
                          :name="`pack-${grupo.codigo}`"
                          :checked="correccionesPackPvp[grupo.codigo]?.pack === grupo.pack.sap"
                          @change="setPackCorreccion(grupo.codigo, grupo.pack!.sap)"
                          class="w-3.5 h-3.5 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                        />
                        SAP
                      </span>
                      <span class="font-mono font-semibold text-sm text-gray-900 dark:text-white pl-5">{{ grupo.pack.sap }}</span>
                    </label>
                    <label
                      class="flex flex-col gap-0.5 cursor-pointer rounded-lg border-2 px-3 py-2 transition-colors"
                      :class="correccionesPackPvp[grupo.codigo]?.pack === grupo.pack.excel
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <input
                          type="radio"
                          :name="`pack-${grupo.codigo}`"
                          :checked="correccionesPackPvp[grupo.codigo]?.pack === grupo.pack.excel"
                          @change="setPackCorreccion(grupo.codigo, grupo.pack!.excel)"
                          class="w-3.5 h-3.5 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                        />
                        Excel
                      </span>
                      <span class="font-mono font-semibold text-sm text-gray-900 dark:text-white pl-5">{{ grupo.pack.excel }}</span>
                    </label>
                  </div>
                </div>

                <!-- Discrepancia de PVP: SAP y Excel enfrentados, con la diferencia calculada -->
                <div v-if="grupo.pvp">
                  <div class="flex items-center justify-between mb-1.5">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400">PVP</p>
                    <span
                      class="text-xs font-semibold"
                      :class="grupo.pvp.excel > grupo.pvp.sap ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'"
                    >
                      Excel {{ grupo.pvp.excel > grupo.pvp.sap ? '+' : '' }}{{ formatCurrency(grupo.pvp.excel - grupo.pvp.sap) }} vs. SAP
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <label
                      class="flex flex-col gap-0.5 cursor-pointer rounded-lg border-2 px-3 py-2 transition-colors"
                      :class="correccionesPackPvp[grupo.codigo]?.pvp === grupo.pvp.sap
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <input
                          type="radio"
                          :name="`pvp-${grupo.codigo}`"
                          :checked="correccionesPackPvp[grupo.codigo]?.pvp === grupo.pvp.sap"
                          @change="setPvpCorreccion(grupo.codigo, grupo.pvp!.sap)"
                          class="w-3.5 h-3.5 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                        />
                        SAP
                      </span>
                      <span class="font-mono font-semibold text-sm text-gray-900 dark:text-white pl-5">{{ formatCurrency(grupo.pvp.sap) }}</span>
                    </label>
                    <label
                      class="flex flex-col gap-0.5 cursor-pointer rounded-lg border-2 px-3 py-2 transition-colors"
                      :class="correccionesPackPvp[grupo.codigo]?.pvp === grupo.pvp.excel
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <input
                          type="radio"
                          :name="`pvp-${grupo.codigo}`"
                          :checked="correccionesPackPvp[grupo.codigo]?.pvp === grupo.pvp.excel"
                          @change="setPvpCorreccion(grupo.codigo, grupo.pvp!.excel)"
                          class="w-3.5 h-3.5 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                        />
                        Excel
                      </span>
                      <span class="font-mono font-semibold text-sm text-gray-900 dark:text-white pl-5">{{ formatCurrency(grupo.pvp.excel) }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de acciones: fija fuera del área con scroll (progreso + botones), siempre visible sin bajar -->
      <div class="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
        <div class="flex flex-col gap-1">
          <!-- Mensaje de validación de correcciones (códigos de producto no encontrados en SAP) -->
          <div v-if="tieneErroresCodigo" class="flex items-center gap-2 text-sm flex-wrap">
            <span
              v-if="!todosCodigosTienenCorreccion"
              class="text-amber-600 dark:text-amber-400 font-medium"
            >
              ⚠️ Faltan {{ totalCodigos - codigosResueltos }} de {{ totalCodigos }} códigos por resolver
            </span>
            <span
              v-else
              class="text-green-600 dark:text-green-400 font-medium"
            >
              ✅ Todas las correcciones de código seleccionadas
            </span>
            <button
              v-if="!todosCodigosTienenCorreccion"
              type="button"
              @click="irAlSiguientePendiente"
              class="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Ir al siguiente pendiente
            </button>
          </div>
          <!-- Verificando Pack/PVP en SAP para la sugerencia recién elegida (antes de mostrar la discrepancia) -->
          <div v-if="consultandoInfoSapPendiente" class="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="font-medium">Verificando Pack/PVP en SAP para la corrección elegida...</span>
          </div>
          <!-- Mensaje de validación de correcciones de Pack/PVP (RN-02) -->
          <div v-if="tieneMismatchesPackPvp" class="flex items-center gap-2 text-sm">
            <span
              v-if="!todosPackPvpTienenCorreccion"
              class="text-amber-600 dark:text-amber-400 font-medium"
            >
              ⚠️ Faltan {{ totalDecisionesPackPvp - decisionesPackPvpResueltas }} de {{ totalDecisionesPackPvp }} discrepancias de Pack/PVP por resolver
            </span>
            <span
              v-else
              class="text-green-600 dark:text-green-400 font-medium"
            >
              ✅ Todas las correcciones de Pack/PVP seleccionadas
            </span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Botón único: aplica correcciones de código y/o pack/pvp, lo que esta respuesta reporte -->
          <button
            v-if="tieneErroresCodigo || tieneMismatchesPackPvp"
            @click="handleApplyCorrections"
            :disabled="!todasLasCorreccionesListas || aplicandoCorrecciones"
            class="px-4 py-2.5 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="aplicandoCorrecciones" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ aplicandoCorrecciones ? 'Aplicando correcciones...' : 'Aplicar correcciones y continuar' }}
          </button>
          <button
            @click="solicitarCierre"
            class="px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium shadow-sm"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { nextTick, onUnmounted } from '@vue/runtime-core'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { pedidosService } from '../services/domains/pedidos'
import type { SugerenciaSkuSap, SugerenciasSkuResponse, SapInfoProducto } from '../types'
import { formatError, formatCurrency } from '../utils/formatters'
import type { UploadErrorInfo, CorreccionesPlantilla } from '../composables/useFileUpload'

/** Discrepancia de Pack y/o PVP para un mismo código, agrupada para comparar SAP vs. Excel lado a lado */
interface GrupoPackPvp {
  codigo: string
  pack?: { excel: string; sap: string }
  pvp?: { excel: number; sap: number }
}


interface Props {
  modelValue: boolean
  uploadErrorInfo: UploadErrorInfo | null
  showDataProtectionMessage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDataProtectionMessage: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  // Único evento de correcciones: unifica código, pack y pvp (RN-02) en un solo payload
  'apply-corrections': [correcciones: CorreccionesPlantilla]
}>()

// Estado interno del modal
const isModalMaximized = ref(false)
const modalRef = ref<HTMLElement | null>(null)
const mostrarConfirmacionDescarte = ref(false)

// ⭐ Funcionalidad de sugerencias SAP
const sugerenciasPorCodigo = ref<Record<string, SugerenciaSkuSap[]>>({})
const sugerenciasEstado = ref<Record<string, 'idle' | 'buscando' | 'completado' | 'error'>>({})
const correccionesSeleccionadas = ref<Record<string, string>>({})
const limiteSugerenciasMostradas = ref<Record<string, number>>({})
const aplicandoCorrecciones = ref(false)

// ⭐ NUEVO: Selección "usar SAP / usar Excel" para discrepancias de Pack/PVP (RN-02)
const correccionesPackPvp = ref<Record<string, { pack?: string; pvp?: number }>>({})

// ⭐ NUEVO: Info de SAP (pack/pvp) para la sugerencia de código elegida, para detectar discrepancias
// Pack/PVP en la misma ronda en que se corrige el código (sin esperar a un reintento). Clave: código SAP elegido.
const sapInfoPorSugerencia = ref<Record<string, SapInfoProducto>>({})
const sapInfoEstado = ref<Record<string, 'buscando' | 'completado' | 'error'>>({})

/**
 * Computed: true cuando el usuario puede resolver el problema en este mismo modal
 * (eligiendo sugerencias de código y/o Pack/PVP), en vez de tener que corregir el Excel y volver a subirlo.
 * Cambia el tono del modal: de "rechazo" a "decisión pendiente".
 */
const esResolubleEnElModal = computed(() => tieneErroresCodigo.value || tieneMismatchesPackPvp.value)

/**
 * Computed: ancho del modal. Se ensancha cuando hay comparaciones SAP/Excel lado a lado,
 * que necesitan más espacio horizontal que un mensaje de error simple.
 */
const anchoModal = computed(() => {
  if (tieneMismatchesPackPvp.value) return 'max-w-4xl'
  if (tieneErroresCodigo.value) return 'max-w-3xl'
  return 'max-w-2xl'
})

/**
 * ⭐ Computed: Determina los estilos del modal según el tipo de error
 */
const getErrorStyle = computed(() => {
  const errorCode = props.uploadErrorInfo?.error_code
  const title = props.uploadErrorInfo?.title || ''
  
  // Estilos por código de error específico
  if (errorCode === 'NUMERO_PEDIDO_DUPLICADO') {
    return {
      header: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      titleColor: 'text-orange-900 dark:text-orange-200'
    }
  }
  
  if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
    return {
      header: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-200'
    }
  }
  
  if (errorCode === 'ARCHIVO_SIN_DATOS') {
    return {
      header: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-900 dark:text-amber-200'
    }
  }
  
  if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
    return {
      header: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-200'
    }
  }

  // Si el usuario puede resolverlo aquí mismo (elegir sugerencia de código y/o Pack/PVP), es una
  // decisión pendiente, no un archivo rechazado: tono ámbar en vez de rojo (independiente del título,
  // que para el caso de código sigue mencionando "SAP" por compatibilidad con el backend).
  if (esResolubleEnElModal.value) {
    return {
      header: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-900 dark:text-amber-200'
    }
  }

  // Fallback a detección por título (compatibilidad con versiones anteriores)
  if (title.includes('duplicado')) {
    return {
      header: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      titleColor: 'text-orange-900 dark:text-orange-200'
    }
  }
  
  if (title.includes('SAP')) {
    return {
      header: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-200'
    }
  }
  
  if (title.includes('formato')) {
    return {
      header: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-200'
    }
  }
  
  // Estilo por defecto (error genérico)
  return {
    header: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-200'
  }
})

/**
 * ⭐ Computed: Determina si se debe ocultar el mensaje genérico
 * Se oculta cuando hay un mensaje específico para el código de error
 */
const shouldHideGenericMessage = computed(() => {
  const errorCode = props.uploadErrorInfo?.error_code
  const numeroPedido = props.uploadErrorInfo?.numero_pedido
  
  // Ocultar si hay un mensaje específico para estos códigos de error
  if (errorCode === 'NUMERO_PEDIDO_DUPLICADO' && numeroPedido) {
    return true
  }
  
  if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
    return true
  }
  
  if (errorCode === 'ARCHIVO_SIN_DATOS') {
    return true
  }
  
  if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
    return true
  }
  
  return false
})

/**
 * Cierra el modal
 */
function closeModal(): void {
  emit('update:modelValue', false)
  limpiarSugerencias()
  mostrarConfirmacionDescarte.value = false
}

/**
 * Computed: true si el usuario ya hizo alguna selección (código y/o Pack/PVP) que se perdería al cerrar.
 */
const hayCorreccionesEnProgreso = computed(() => {
  return Object.keys(correccionesSeleccionadas.value).length > 0 || Object.keys(correccionesPackPvp.value).length > 0
})

/**
 * Pide cerrar el modal (botón "Descartar", click fuera del modal o Escape). Si el usuario ya eligió
 * alguna corrección, confirma antes de perder ese trabajo en vez de cerrar directamente.
 */
function solicitarCierre(): void {
  if (esResolubleEnElModal.value && hayCorreccionesEnProgreso.value) {
    mostrarConfirmacionDescarte.value = true
    return
  }
  closeModal()
}

function confirmarDescarte(): void {
  closeModal()
}

function cancelarDescarte(): void {
  mostrarConfirmacionDescarte.value = false
}

/**
 * Mantiene el foco del teclado dentro del modal (accesibilidad: Tab/Shift+Tab no debe escapar al fondo).
 */
function atraparFoco(evento: KeyboardEvent): void {
  if (!modalRef.value) return
  const focosDisponibles = modalRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )
  if (focosDisponibles.length === 0) return
  const primero = focosDisponibles[0]
  const ultimo = focosDisponibles[focosDisponibles.length - 1]
  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault()
    primero.focus()
  }
}

/**
 * Extrae códigos de producto no encontrados en SAP del modal de error
 */
function extraerCodigosProductoNoEncontrados(): string[] {
  if (!props.uploadErrorInfo?.errors) return []
  
  const codigos: string[] = []
  
  for (const error of props.uploadErrorInfo.errors) {
    if (typeof error !== 'string' && error.producto && error.campo === 'Producto SAP') {
      const codigo = error.producto.trim()
      if (codigo && !codigos.includes(codigo)) {
        codigos.push(codigo)
      }
    }
  }
  
  return codigos
}

/**
 * Obtiene información de MBA3 para un código desde el backend
 */
function getInfoMba3(codigo: string) {
  if (!props.uploadErrorInfo?.validacion_sap?.detalle_validacion) {
    return null
  }
  
  const detalle = props.uploadErrorInfo.validacion_sap.detalle_validacion[codigo]
  return detalle?.mba3 || null
}

/**
 * Consulta en SAP el Pack/PVP del código elegido como corrección (GET sap-info-productos), para
 * poder detectar una discrepancia contra el Excel en la misma ronda en que se elige la sugerencia,
 * sin esperar al reintento. Idempotente por código: no repite la consulta si ya está en curso o resuelta.
 */
async function consultarSapInfoParaSugerencia(codigoSap: string): Promise<void> {
  if (!codigoSap || sapInfoEstado.value[codigoSap]) {
    return
  }

  sapInfoEstado.value[codigoSap] = 'buscando'

  try {
    const resultado = await pedidosService.getSapInfoProductos([codigoSap])
    sapInfoPorSugerencia.value[codigoSap] = resultado.productos?.[codigoSap] ?? { encontrado: false, motivo: null }
    sapInfoEstado.value[codigoSap] = 'completado'
  } catch (error) {
    console.error(`❌ [UploadErrorModal] Error al consultar info SAP para ${codigoSap}:`, error)
    sapInfoEstado.value[codigoSap] = 'error'
  }
}

/**
 * Busca sugerencias SAP automáticamente para un código de producto
 */
async function buscarSugerenciasParaCodigo(codigo: string): Promise<void> {
  if (!codigo || sugerenciasEstado.value[codigo] === 'buscando') {
    return
  }
  
  sugerenciasEstado.value[codigo] = 'buscando'
  
  try {
    const resultado: SugerenciasSkuResponse = await mba3ConsultasService.buscarSugerenciasSku(codigo, 100)
    
    if (resultado.status === 'success' && resultado.sugerencias && resultado.sugerencias.length > 0) {
      sugerenciasPorCodigo.value[codigo] = resultado.sugerencias
      sugerenciasEstado.value[codigo] = 'completado'
      inicializarLimiteSugerencias(codigo)
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
    }
  } catch (error: any) {
    console.error(`❌ [UploadErrorModal] Error al buscar sugerencias para ${codigo}:`, error)
    if (error.response?.status === 504 || error.message?.includes('timeout')) {
      sugerenciasEstado.value[codigo] = 'error'
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
    }
  }
}

/**
 * Busca sugerencias automáticamente para todos los códigos no encontrados
 * ⭐ MEJORADO: Primero intenta usar información del backend (MBA3 + sugerencias)
 */
async function buscarSugerenciasAutomaticas(): Promise<void> {
  if (!props.uploadErrorInfo || (!props.uploadErrorInfo.title?.includes('producto') && !props.uploadErrorInfo.title?.includes('SAP'))) {
    return
  }
  
  const codigos = extraerCodigosProductoNoEncontrados()
  
  if (codigos.length === 0) {
    return
  }
  
  // ⭐ NUEVO: Primero intentar usar información del backend
  const validacionSap = props.uploadErrorInfo.validacion_sap
  const detalleValidacion = validacionSap?.detalle_validacion || {}
  
  let codigosSinInfoBackend: string[] = []
  
  // Procesar información del backend para cada código
  for (const codigo of codigos) {
    const detalle = detalleValidacion[codigo]
    
    // ⭐ Inicializar estado como 'buscando' primero para mostrar indicador de carga
    if (!sugerenciasEstado.value[codigo] || sugerenciasEstado.value[codigo] === 'idle') {
      sugerenciasEstado.value[codigo] = 'buscando'
    }
    
    // Verificar si hay sugerencias del backend
    if (detalle && 'sugerencias_sap' in detalle) {
      if (Array.isArray(detalle.sugerencias_sap) && detalle.sugerencias_sap.length > 0) {
        // ⭐ Usar sugerencias del backend (ya están formateadas)
        sugerenciasPorCodigo.value[codigo] = detalle.sugerencias_sap.map((s): SugerenciaSkuSap => ({
          codigo: s.codigo,
          nombre: s.nombre,
          pack: s.pack || '',
          group_code: s.group_code,
          group_name: s.group_name || '',
          estado: ((s.estado === 'activo' || s.estado === 'inactivo') ? s.estado : 'inactivo') as 'activo' | 'inactivo',
          score: s.score,
          score_porcentaje: s.score_porcentaje,
          motivos: s.motivos || []
        }))
        sugerenciasEstado.value[codigo] = 'completado'
        inicializarLimiteSugerencias(codigo)
      } else if (Array.isArray(detalle.sugerencias_sap) && detalle.sugerencias_sap.length === 0) {
        // Backend retornó array vacío - no hay sugerencias
        sugerenciasPorCodigo.value[codigo] = []
        sugerenciasEstado.value[codigo] = 'completado'
      } else {
        // Campo sugerencias_sap existe pero no es un array válido
        codigosSinInfoBackend.push(codigo)
      }
    } else {
      // No hay campo sugerencias_sap en el detalle, agregar a lista para búsqueda
      codigosSinInfoBackend.push(codigo)
    }
  }
  
  // Solo buscar sugerencias para códigos que no tienen información del backend
  if (codigosSinInfoBackend.length > 0) {
    const promesas = codigosSinInfoBackend
      .filter(codigo => !sugerenciasPorCodigo.value[codigo])
      .map(codigo => buscarSugerenciasParaCodigo(codigo))
    
    await Promise.allSettled(promesas)
  }
}

/**
 * Limpia las sugerencias cuando se cierra el modal
 */
function limpiarSugerencias(): void {
  sugerenciasPorCodigo.value = {}
  sugerenciasEstado.value = {}
  correccionesSeleccionadas.value = {}
  limiteSugerenciasMostradas.value = {}
  // ⭐ NUEVO: Limpiar selección de correcciones de Pack/PVP (RN-02)
  correccionesPackPvp.value = {}
  // ⭐ NUEVO: Limpiar info de SAP consultada para sugerencias elegidas
  sapInfoPorSugerencia.value = {}
  sapInfoEstado.value = {}
  isModalMaximized.value = false
}

/**
 * Computed: true si esta respuesta reporta al menos un código de producto no encontrado en SAP
 */
const tieneErroresCodigo = computed(() => extraerCodigosProductoNoEncontrados().length > 0)

/**
 * Computed: Verifica si todos los códigos inválidos tienen una corrección seleccionada
 */
const todosCodigosTienenCorreccion = computed(() => {
  const codigosInvalidos = extraerCodigosProductoNoEncontrados()

  if (codigosInvalidos.length === 0) {
    return false
  }

  return codigosInvalidos.every(codigo => {
    const correccion = correccionesSeleccionadas.value[codigo]
    return correccion && correccion.trim().length > 0
  })
})

/** Computed: total de códigos de producto no encontrados (para el indicador de progreso) */
const totalCodigos = computed(() => extraerCodigosProductoNoEncontrados().length)

/** Computed: cuántos de esos códigos ya tienen una sugerencia elegida */
const codigosResueltos = computed(() =>
  extraerCodigosProductoNoEncontrados().filter(codigo => {
    const correccion = correccionesSeleccionadas.value[codigo]
    return !!correccion && correccion.trim().length > 0
  }).length
)

/**
 * Desplaza el modal hasta el primer código inválido que todavía no tiene una sugerencia elegida.
 * Evita que el usuario tenga que hacer scroll manual buscando cuál de los N códigos le falta.
 */
function irAlSiguientePendiente(): void {
  const siguiente = extraerCodigosProductoNoEncontrados().find(codigo => {
    const correccion = correccionesSeleccionadas.value[codigo]
    return !correccion || correccion.trim().length === 0
  })
  if (!siguiente) return
  document.getElementById(`pendiente-codigo-${siguiente}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

/**
 * Computed: discrepancias Pack/PVP detectadas ANTES de reintentar, apenas el usuario elige una
 * sugerencia SAP para un código inválido. Compara pack_excel/pvp_excel de esa fila del Excel
 * (ya vienen en detalle_validacion) contra pack_sap/pvp_sap del código elegido (consultados vía
 * GET sap-info-productos apenas se elige la sugerencia). Evita una ronda extra: sin esto, la
 * discrepancia recién se vería en el reintento siguiente. Se agrupan con la clave del código SAP
 * elegido (no el código original inválido), igual que hace el backend en la ronda posterior.
 */
const gruposPackPvpPreemptivos = computed<GrupoPackPvp[]>(() => {
  const detalleValidacion = props.uploadErrorInfo?.validacion_sap?.detalle_validacion
  if (!detalleValidacion) return []

  const grupos: GrupoPackPvp[] = []
  for (const [producto, codigoSap] of Object.entries(correccionesSeleccionadas.value)) {
    if (!codigoSap) continue
    const info = sapInfoPorSugerencia.value[codigoSap]
    if (!info?.encontrado) continue
    const detalle = detalleValidacion[producto]
    if (!detalle) continue

    const grupo: GrupoPackPvp = { codigo: codigoSap }
    if (detalle.pack_excel != null && info.pack_sap != null && detalle.pack_excel.trim() !== info.pack_sap.trim()) {
      grupo.pack = { excel: detalle.pack_excel, sap: info.pack_sap }
    }
    if (detalle.pvp_excel != null && info.pvp_sap != null && detalle.pvp_excel !== info.pvp_sap) {
      grupo.pvp = { excel: detalle.pvp_excel, sap: info.pvp_sap }
    }
    if (grupo.pack || grupo.pvp) grupos.push(grupo)
  }
  return grupos
})

/**
 * Computed: agrupa pack_mismatches y pvp_mismatches (reportados por el backend, post-reintento)
 * junto con las discrepancias preemptivas (detectadas al elegir una sugerencia, antes de reintentar),
 * para comparar SAP vs. Excel en un solo bloque por SKU sin importar de qué momento venga el dato.
 */
const gruposPackPvp = computed<GrupoPackPvp[]>(() => {
  const validacion = props.uploadErrorInfo?.validacion_pack_pvp

  const porCodigo = new Map<string, GrupoPackPvp>()
  for (const m of validacion?.pack_mismatches ?? []) {
    const grupo = porCodigo.get(m.codigo) ?? { codigo: m.codigo }
    grupo.pack = { excel: m.pack_excel, sap: m.pack_sap }
    porCodigo.set(m.codigo, grupo)
  }
  for (const m of validacion?.pvp_mismatches ?? []) {
    const grupo = porCodigo.get(m.codigo) ?? { codigo: m.codigo }
    grupo.pvp = { excel: m.pvp_excel, sap: m.pvp_sap }
    porCodigo.set(m.codigo, grupo)
  }
  for (const grupo of gruposPackPvpPreemptivos.value) {
    porCodigo.set(grupo.codigo, grupo)
  }
  return Array.from(porCodigo.values())
})

/**
 * Computed: true si hay al menos una discrepancia de Pack o PVP contra SAP (RN-02), reportada por
 * el backend o detectada de forma preemptiva al elegir una sugerencia de código.
 */
const tieneMismatchesPackPvp = computed(() => gruposPackPvp.value.length > 0)

/**
 * Computed: true si todos los códigos con discrepancia de Pack y/o PVP tienen una elección
 * "usar SAP / usar Excel" seleccionada. Un mismo código puede requerir ambas elecciones si tiene
 * discrepancia de Pack y de PVP a la vez.
 */
const todosPackPvpTienenCorreccion = computed(() => {
  if (gruposPackPvp.value.length === 0) return false
  return gruposPackPvp.value.every(grupo => {
    const packOk = !grupo.pack || !!correccionesPackPvp.value[grupo.codigo]?.pack
    const pvpOk = !grupo.pvp || (correccionesPackPvp.value[grupo.codigo]?.pvp !== undefined && correccionesPackPvp.value[grupo.codigo]?.pvp !== null)
    return packOk && pvpOk
  })
})

/** Computed: total de decisiones Pack/PVP pendientes (un código con ambas discrepancias cuenta 2 veces) */
const totalDecisionesPackPvp = computed(() =>
  gruposPackPvp.value.reduce((total, grupo) => total + (grupo.pack ? 1 : 0) + (grupo.pvp ? 1 : 0), 0)
)

/** Computed: cuántas de esas decisiones ya están resueltas */
const decisionesPackPvpResueltas = computed(() =>
  gruposPackPvp.value.reduce((total, grupo) => {
    const packOk = grupo.pack && !!correccionesPackPvp.value[grupo.codigo]?.pack
    const pvpOk = grupo.pvp && correccionesPackPvp.value[grupo.codigo]?.pvp !== undefined && correccionesPackPvp.value[grupo.codigo]?.pvp !== null
    return total + (packOk ? 1 : 0) + (pvpOk ? 1 : 0)
  }, 0)
)

/**
 * Computed: true si hay al menos una consulta de info SAP en curso para una sugerencia recién
 * elegida. Mientras esté en curso, no se puede saber todavía si esa elección trajo una discrepancia
 * de Pack/PVP nueva, así que "Aplicar correcciones" debe esperar (ver todasLasCorreccionesListas).
 */
const consultandoInfoSapPendiente = computed(() =>
  Object.values(correccionesSeleccionadas.value).some(codigoSap => !!codigoSap && sapInfoEstado.value[codigoSap] === 'buscando')
)

/**
 * Computed: true si todas las discrepancias presentes en esta respuesta (código y/o pack/pvp)
 * ya tienen corrección seleccionada. El backend hoy nunca combina código con pack/pvp en una
 * misma respuesta (código se valida primero y bloquea), pero este chequeo cubre igual el caso
 * de que ambas aparezcan juntas si el backend cambia esa secuencia en el futuro.
 */
const todasLasCorreccionesListas = computed(() => {
  if (!tieneErroresCodigo.value && !tieneMismatchesPackPvp.value) {
    return false
  }
  if (consultandoInfoSapPendiente.value) {
    return false
  }
  const codigoOk = !tieneErroresCodigo.value || todosCodigosTienenCorreccion.value
  const packPvpOk = !tieneMismatchesPackPvp.value || todosPackPvpTienenCorreccion.value
  return codigoOk && packPvpOk
})

/**
 * Guarda la elección de Pack ("usar SAP" o "usar Excel") para un código, preservando
 * la elección de PVP si ya existía para ese mismo código (un código puede tener ambas discrepancias).
 */
function setPackCorreccion(codigo: string, valor?: string): void {
  correccionesPackPvp.value[codigo] = { ...correccionesPackPvp.value[codigo], pack: valor }
}

/**
 * Guarda la elección de PVP ("usar SAP" o "usar Excel") para un código, preservando
 * la elección de Pack si ya existía para ese mismo código.
 */
function setPvpCorreccion(codigo: string, valor?: number): void {
  correccionesPackPvp.value[codigo] = { ...correccionesPackPvp.value[codigo], pvp: valor }
}

/**
 * Acción masiva: usa el valor de SAP para todas las discrepancias de Pack y PVP de esta respuesta.
 * Cubre el caso típico (SAP es la fuente de verdad) sin obligar a elegir código por código.
 */
function usarSapEnTodasLasDiscrepancias(): void {
  for (const grupo of gruposPackPvp.value) {
    if (grupo.pack) setPackCorreccion(grupo.codigo, grupo.pack.sap)
    if (grupo.pvp) setPvpCorreccion(grupo.codigo, grupo.pvp.sap)
  }
}

/**
 * Acción masiva: usa el valor del Excel para todas las discrepancias de Pack y PVP de esta respuesta.
 */
function usarExcelEnTodasLasDiscrepancias(): void {
  for (const grupo of gruposPackPvp.value) {
    if (grupo.pack) setPackCorreccion(grupo.codigo, grupo.pack.excel)
    if (grupo.pvp) setPvpCorreccion(grupo.codigo, grupo.pvp.excel)
  }
}

/**
 * Maneja la aplicación de correcciones: emite en un solo evento las correcciones de código
 * y/o de pack/pvp, cualquiera que esté presente en esta respuesta (ver CorreccionesPlantilla).
 */
async function handleApplyCorrections(): Promise<void> {
  if (!todasLasCorreccionesListas.value) {
    return
  }

  aplicandoCorrecciones.value = true

  try {
    emit('apply-corrections', {
      correccionesCodigos: tieneErroresCodigo.value ? { ...correccionesSeleccionadas.value } : undefined,
      correccionesPackPvp: tieneMismatchesPackPvp.value ? { ...correccionesPackPvp.value } : undefined
    })
  } finally {
    aplicandoCorrecciones.value = false
  }
}

/**
 * Función auxiliar para obtener clase CSS del badge de score
 */
function getScoreBadgeClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

/**
 * Obtiene las sugerencias limitadas para un código específico
 */
function getSugerenciasLimitadas(codigo: string): SugerenciaSkuSap[] {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  const limite = limiteSugerenciasMostradas.value[codigo] || 5
  return todasLasSugerencias.slice(0, limite)
}

/**
 * Obtiene el límite actual de sugerencias para un código
 */
function getLimiteSugerencias(codigo: string): number {
  return limiteSugerenciasMostradas.value[codigo] || 5
}

/**
 * Establece el límite de sugerencias para un código
 */
function setLimiteSugerencias(codigo: string, limite: number): void {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  const maximo = todasLasSugerencias.length
  const limiteAjustado = Math.max(1, Math.min(limite, maximo))
  limiteSugerenciasMostradas.value[codigo] = limiteAjustado
}

/**
 * Inicializa el límite de sugerencias cuando se cargan nuevas sugerencias
 */
function inicializarLimiteSugerencias(codigo: string): void {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  if (!limiteSugerenciasMostradas.value[codigo]) {
    limiteSugerenciasMostradas.value[codigo] = Math.min(5, todasLasSugerencias.length)
  }
}

// ⭐ Watcher para detectar cuando se muestra el modal y buscar sugerencias automáticamente
watch(
  () => props.modelValue,
  async (isVisible) => {
    if (isVisible) {
      // Esperar a que el DOM se actualice y el modal esté completamente renderizado
      await nextTick()
      // Foco inicial en el modal (accesibilidad: lector de pantalla anuncia el diálogo, Escape/Tab funcionan de inmediato)
      modalRef.value?.focus()
      // Pequeño delay adicional para asegurar que el modal esté completamente visible
      await new Promise(resolve => setTimeout(resolve, 100))

      const esErrorSap = props.uploadErrorInfo?.title?.includes('SAP') ||
                         props.uploadErrorInfo?.title?.includes('no encontrados') ||
                         props.uploadErrorInfo?.title?.includes('producto')
      
      if (esErrorSap && props.uploadErrorInfo?.errors) {
        if (import.meta.env.DEV) console.log('🔍 [UploadErrorModal] Modal de error abierto, iniciando búsqueda automática de sugerencias...')
        if (import.meta.env.DEV) console.log('📋 [UploadErrorModal] uploadErrorInfo:', {
          title: props.uploadErrorInfo.title,
          tieneValidacionSap: !!props.uploadErrorInfo.validacion_sap,
          detalleValidacion: props.uploadErrorInfo.validacion_sap?.detalle_validacion,
          codigosEnDetalle: props.uploadErrorInfo.validacion_sap?.detalle_validacion ? Object.keys(props.uploadErrorInfo.validacion_sap.detalle_validacion) : []
        })
        await buscarSugerenciasAutomaticas()
      }
    } else {
      limpiarSugerencias()
    }
  }
)

// ⭐ Watcher adicional para cuando cambia uploadErrorInfo (por si el modal ya está abierto)
watch(
  () => props.uploadErrorInfo,
  async (newErrorInfo) => {
    if (props.modelValue && newErrorInfo) {
      const esErrorSap = newErrorInfo.title?.includes('SAP') || 
                         newErrorInfo.title?.includes('no encontrados') ||
                         newErrorInfo.title?.includes('producto')
      
      if (esErrorSap && newErrorInfo.errors) {
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
        await buscarSugerenciasAutomaticas()
      }
    }
  },
  { deep: true }
)

// ⭐ Watcher: apenas el usuario elige (o cambia) una sugerencia SAP para un código inválido,
// consulta el Pack/PVP de ese código en SAP para detectar una discrepancia en la misma ronda.
watch(
  () => correccionesSeleccionadas.value,
  () => {
    for (const codigoSap of Object.values(correccionesSeleccionadas.value)) {
      if (codigoSap) consultarSapInfoParaSugerencia(codigoSap)
    }
  },
  { deep: true }
)

// Limpiar al desmontar
onUnmounted(() => {
  limpiarSugerencias()
})
</script>
