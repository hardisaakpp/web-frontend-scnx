import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import permissionDirective from './directives/permission'
import { useThemeStore } from './stores/theme'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('permission', permissionDirective)

app.mount('#app')

// Inicializar el tema después de montar la app
const themeStore = useThemeStore()
themeStore.initTheme()
themeStore.watchSystemPreference()
