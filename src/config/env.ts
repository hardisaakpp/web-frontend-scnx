/**
 * Utilidad para acceder a variables de entorno de forma segura (Runtime + Build-time)
 */
declare global {
  interface Window {
    CONFIG?: Record<string, any>;
  }
}

export function getEnv(key: string, defaultValue = ''): string {
  if (typeof window !== 'undefined' && window.CONFIG?.[key]) {
    return window.CONFIG[key];
  }
  return import.meta.env[key] || defaultValue;
}

/**
 * URLs base para los servicios. 
 * Los valores por defecto son las rutas relativas que maneja el proxy (Vite/Nginx).
 */
export const ENV = {
  CORE_URL: getEnv('VITE_API_CORE_URL', '/api'),
  MBA3_URL: getEnv('VITE_MBA3_API_URL', '/api/mba3'),
  CAJA_CHICA_URL: getEnv('VITE_CAJA_CHICA_API_URL', '/caja-chica-api'),
  PYG_URL: getEnv('VITE_PYG_API_URL', '/pyg-api'),
  MAESTRO_URL: getEnv('VITE_MAESTRO_API_URL', '/maestro-api'),
  CONCILIACION_URL: getEnv('VITE_CONCILIACION_API_URL', '/conciliacion-api'),
  SCAN_URL: getEnv('VITE_ARTICULO_SCAN_API_URL', '/scan-api'),
  INVENTORY_URL: getEnv('VITE_SCNEXUS_INVENTORY_API_URL', '/inventario-api'),
  PROMO_SOBRES_URL: getEnv('VITE_PROMOCION_SOBRES_API_URL', '/promocion-sobres-api'),
  REPOSICIONES_URL: getEnv('VITE_REPOSICIONES_API_URL', '/api/reposicion-api'),
  TRANSFERENCIAS_DIRECTAS_URL: getEnv('VITE_TRANSFERENCIAS_DIRECTAS_API_URL', '/api/transferencias-directas-api'),
  DEMANDA_OTB_URL: getEnv('VITE_DEMANDA_OTB_API_URL', '/api/demanda-otb-api'),
  SLAYER_URL: getEnv('VITE_SLAYER_API_URL', '/slayer-api'),
  PREFERENCES_URL: getEnv('VITE_PREFERENCES_API_URL', ''),
  CEDI_URL: getEnv('VITE_CEDI_API_URL', '/cedi-api'),
  /** mIAApi — asistente de IA (Cool-turito / SCNEXUS AI) */
  MIA_URL: getEnv('VITE_MIA_API_URL', '/mia-api'),
};
