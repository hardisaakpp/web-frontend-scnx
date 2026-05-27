<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Accesos rápidos para administrar usuarios, permisos y roles</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              type="button"
              @click="$router.push('/usuarios/users')"
              class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A9 9 0 1119.9 6.362 7.5 7.5 0 0112 20.5a7.5 7.5 0 01-6.879-2.696z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">Usuarios</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Administrar cuentas y perfiles</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              @click="$router.push('/permisos')"
              class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">Permisos</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Definir accesos y acciones</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              @click="$router.push('/roles')"
              class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">Roles</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configurar perfiles por rol</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              @click="$router.push('/datos-adicionales')"
              class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h10" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">Datos adicionales</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Accesos a almacenes por usuario</div>
                </div>
              </div>
            </button>
      </div>
    </div>
  </div>
</template>