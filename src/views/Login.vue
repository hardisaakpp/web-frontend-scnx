<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300 relative">
    <!-- Theme Toggle Button -->
    <button
      @click="themeStore.toggleTheme()"
      class="absolute top-4 right-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 group"
      :title="themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro'"
    >
      <SunIcon v-if="themeStore.isDark" class="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
      <MoonIcon v-else class="h-6 w-6 text-gray-600 group-hover:scale-110 transition-transform" />
    </button>

    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-8 transition-colors duration-300">
      <div class="text-center mb-8 flex flex-col items-center">
        <img :src="logoUrl" alt="Logo" class="h-16 w-auto mb-4" />
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ appName }}</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Iniciar Sesión</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Usuario
          </label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
            placeholder="admin"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
            placeholder="••••••••"
          />
        </div>

        <!-- Active Directory Checkbox -->
        <div class="flex items-center">
          <input
            id="useAD"
            v-model="form.useActiveDirectory"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <label for="useAD" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Usar Active Directory
          </label>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
          {{ error }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-300"
        >
          <span v-if="!isLoading">Iniciar Sesión</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Iniciando...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import logoUrl from '@/assets/logo.png'

const appName = import.meta.env.VITE_APP_NAME
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const isLoading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  useActiveDirectory: true
})

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  try {
    const success = await authStore.login({
      username: form.username,
      password: form.password,
      useActiveDirectory: form.useActiveDirectory
    })
    if (success) {
      router.push('/')
    } else {
      error.value = 'Credenciales inválidas'
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('Login failed:', e)
    }
    error.value = 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}
</script>