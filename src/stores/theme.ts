import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Estado: 'light' o 'dark'
  const currentTheme = ref<'light' | 'dark'>('light')
  const isDark = ref(false)

  // Inicializar el tema desde localStorage o preferencia del sistema
  const initTheme = () => {
    // 1. Verificar localStorage
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme === 'dark' || savedTheme === 'light') {
      currentTheme.value = savedTheme
    } else {
      // 2. Si no hay tema guardado, usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    }
    
    isDark.value = currentTheme.value === 'dark'
    applyTheme()
  }

  // Aplicar el tema al DOM
  const applyTheme = () => {
    const html = document.documentElement
    
    if (currentTheme.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Cambiar entre light y dark
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    isDark.value = currentTheme.value === 'dark'
    applyTheme()
    localStorage.setItem('theme', currentTheme.value)
  }

  // Establecer un tema específico
  const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme
    isDark.value = theme === 'dark'
    applyTheme()
    localStorage.setItem('theme', theme)
  }

  // Observar cambios en la preferencia del sistema
  const watchSystemPreference = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    mediaQuery.addEventListener('change', (e) => {
      // Solo cambiar si el usuario no ha establecido una preferencia manual
      if (!localStorage.getItem('theme')) {
        currentTheme.value = e.matches ? 'dark' : 'light'
        isDark.value = e.matches
        applyTheme()
      }
    })
  }

  return {
    currentTheme,
    isDark,
    initTheme,
    toggleTheme,
    setTheme,
    watchSystemPreference
  }
})
