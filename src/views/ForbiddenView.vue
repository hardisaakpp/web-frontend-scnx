<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center transition-colors duration-300">
    <h1 class="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
      Acceso Denegado
    </h1>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      No tienes los permisos necesarios para acceder a esta página.
    </p>
    <router-link
      to="/"
      class="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded transition-colors"
    >
      Volver al Inicio
    </router-link>
  </div>
</template>