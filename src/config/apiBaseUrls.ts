/**
 * URLs base del bundle (rutas relativas al origen del front).
 * Los hosts reales van en VITE_*_PROXY_TARGET (dev) o *_UPSTREAM (prod Docker).
 */
export const MBA3_API_BASE_URL = import.meta.env.VITE_MBA3_API_BASE_URL || '/api/mba3'
/** Auth/me y capabilities en el servicio MBA3 (ruta /api/Auth/me, no bajo /api/mba3). */
export const MBA3_AUTH_API_URL = import.meta.env.VITE_MBA3_API_URL || '/api'
