/**
 * Utilidad para acceder a variables de entorno de forma segura (Runtime + Build-time)
 */
declare global {
  interface Window {
    CONFIG?: Record<string, any>;
  }
}

export function getEnv(key: string, defaultValue = ''): string {
  if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG[key]) {
    return window.CONFIG[key];
  }
  return import.meta.env[key] || defaultValue;
}

export const ENV = {
  CORE_URL: getEnv('VITE_API_CORE_URL', 'http://localhost:8000'),
  MBA3_URL: getEnv('VITE_MBA3_API_URL', 'http://localhost:5001'),
  CAJA_CHICA_URL: getEnv('VITE_CAJA_CHICA_API_URL', 'http://localhost:5005'),
  PYG_URL: getEnv('VITE_PYG_API_URL', 'http://localhost:5171'),
  MAESTRO_URL: getEnv('VITE_MAESTRO_API_URL', 'http://localhost:8001'),
  CONCILIACION_URL: getEnv('VITE_CONCILIACION_API_URL', 'http://localhost:5007'),
  SCAN_URL: getEnv('VITE_ARTICULO_SCAN_API_URL', 'http://localhost:5008'),
  INVENTORY_URL: getEnv('VITE_SCNEXUS_INVENTORY_API_URL', 'http://localhost:8094'),
  PROMO_SOBRES_URL: getEnv('VITE_PROMOCION_SOBRES_API_URL', 'http://localhost:5009'),
  PREFERENCES_URL: getEnv('VITE_PREFERENCES_API_URL', ''),
  REPOSICIONES_URL: getEnv('VITE_REPOSICIONES_API_URL', 'http://localhost:8006'),
  SLAYER_URL: getEnv('VITE_SLAYER_API_URL', '/slayer-api'),

};

