import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import permissionDirective from './directives/permission'
import { setupErrorHandler } from './plugins/errorHandler'
import { useThemeStore } from './stores/theme'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// Configurar manejador global de errores
setupErrorHandler(app)

app.use(pinia)
app.use(router)
app.directive('permission', permissionDirective)

app.mount('#app')

// Inicializar el tema después de montar la app
const themeStore = useThemeStore()
themeStore.initTheme()
themeStore.watchSystemPreference()
