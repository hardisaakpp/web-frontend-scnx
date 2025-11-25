<template>
  <div class="bg-white rounded-lg shadow p-6 text-center">
    <h1 class="text-2xl font-semibold text-red-600 mb-4">
      Acceso Denegado
    </h1>
    <p class="text-gray-600 mb-4">
      No tienes los permisos necesarios para acceder a esta página.
    </p>
    <router-link
      to="/"
      class="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Volver al Inicio
    </router-link>
  </div>
</template>