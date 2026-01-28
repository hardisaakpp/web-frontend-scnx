/**
 * Utilidades para construcción de URLs con query parameters
 */

/**
 * Construye URL con query parameters de forma segura
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
  const urlParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => urlParams.append(key, String(item)))
      } else {
        urlParams.append(key, String(value))
      }
    }
  })
  
  const queryString = urlParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}
