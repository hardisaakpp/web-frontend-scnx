/**
 * Re-export del store de auth para que las importaciones desde archivos .js
 * que resuelven @/stores/auth a auth.js no fallen con 404.
 * La implementación real está en auth.ts (defineStore('auth')).
 */
export { useAuthStore } from './auth.ts'
