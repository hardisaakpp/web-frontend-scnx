import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import permissionDirective from './directives/permission'
import { setupErrorHandler } from './plugins/errorHandler'
import { setupLocale } from './plugins/locale'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { getMsalClient } from './modules/articulo-maestro/services/microsoftFilePicker'
import '@fontsource-variable/inter/index.css'
import './style.css'

// Fija el idioma por defecto (es-EC) para fechas y números en toda la app
setupLocale()

// Procesa cuanto antes una posible respuesta de loginRedirect de Microsoft, antes
// de que el router reescriba la URL y se pierda el hash con el código de autenticación.
getMsalClient().catch(e => console.error('[FilePicker] Error en init global:', e))

const app = createApp(App)
const pinia = createPinia()

// Configurar manejador global de errores
setupErrorHandler(app)

app.use(pinia)
app.use(router)

// Restaurar sesión desde token y programar redirección al login cuando caduque
const authStore = useAuthStore()
authStore.initializeAuth()

// Refuerza control de sesión al volver de inactividad/reposo.
if (typeof window !== 'undefined') {
  const revalidateSession = () => authStore.initializeAuth()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) revalidateSession()
  })
  window.addEventListener('focus', revalidateSession)
}
app.directive('permission', permissionDirective)

app.mount('#app')

// Inicializar el tema después de montar la app
const themeStore = useThemeStore()
themeStore.initTheme()
themeStore.watchSystemPreference()


