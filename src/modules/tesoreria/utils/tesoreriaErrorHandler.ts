/**
 * Traduce errores crudos de integración con SAP Business One (ProblemDetails del backend,
 * envueltos por api-tesoreria como SapIntegrationException/502, o fallos de red/timeout) a
 * mensajes claros y accionables para el usuario de tienda — sin exponer JSONs técnicos, códigos
 * de error de SAP (-10, -2028) ni trazas de excepción en crudo.
 */

export interface SapErrorFriendly {
  titulo: string
  mensaje: string
  accionSugerida?: string
}

interface ErrorConRespuestaHttp {
  response?: {
    status?: number
    data?: {
      detail?: string
      title?: string
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

/** Extrae el texto de error más específico disponible, sin asumir una única forma de payload. */
function extraerDetalleCrudo(error: unknown): string {
  const err = error as ErrorConRespuestaHttp
  const data = err?.response?.data

  if (data?.errors) {
    const mensajes = Object.values(data.errors).flat()
    if (mensajes.length > 0) return mensajes.join(' ')
  }

  return (
    data?.detail ||
    data?.title ||
    err?.message ||
    (typeof error === 'string' ? error : JSON.stringify(error ?? 'Error desconocido'))
  )
}

/**
 * Interpreta el rechazo de una integración a SAP y devuelve un mensaje amigable listo para
 * mostrar al usuario. api-tesoreria envuelve el error real de api-middleware-sap dentro de
 * `SapIntegrationException` (HTTP 502), incrustando el detalle crudo de SAP en su mensaje — por
 * eso la detección se hace por coincidencia de texto en vez de por un código de error tipado.
 */
export function parsearErrorIntegracionSap(error: unknown): SapErrorFriendly {
  const err = error as ErrorConRespuestaHttp
  const rawDetail = extraerDetalleCrudo(error)
  const lower = rawDetail.toLowerCase()

  // eslint-disable-next-line no-console
  console.warn('[SAP Integration Rejected]', rawDetail)

  // 1. Cuenta bancaria inactiva o congelada en SAP (código SAP -10)
  if (lower.includes('is inactive') || lower.includes('-10') || (lower.includes('account') && lower.includes('inactive'))) {
    return {
      titulo: 'Cuenta bancaria inactiva en SAP',
      mensaje: 'La cuenta bancaria seleccionada está desactivada o congelada en el catálogo contable de SAP Business One.',
      accionSugerida: 'Anule esta papeleta con el icono de la papelera y regístrela nuevamente con una cuenta bancaria activa, o solicite la activación a Contabilidad.'
    }
  }

  // 2. Tienda o cuenta inexistente en las tablas maestras de SAP (código SAP -2028)
  if (lower.includes('-2028') || lower.includes('no matching records found')) {
    return {
      titulo: 'Datos no encontrados en SAP',
      mensaje: 'La cuenta bancaria receptora o el código de tienda no existen en las tablas maestras del ERP.',
      accionSugerida: 'Verifique que la tienda y la cuenta bancaria estén correctamente dadas de alta en SAP.'
    }
  }

  // 3. N.° de papeleta (ODPS.BankRef) supera el máximo de 8 caracteres admitido por SAP
  if (lower.includes('bankreference') || lower.includes('value too long') || lower.includes('setpropertyvaluestring')) {
    return {
      titulo: 'Número de comprobante inválido',
      mensaje: 'El número de papeleta supera el límite de 8 caracteres alfanuméricos permitido por SAP.',
      accionSugerida: 'Anule la papeleta y vuelva a ingresarla digitando únicamente hasta 8 dígitos.'
    }
  }

  // 4. Periodo contable cerrado en SAP para la fecha del depósito
  if (lower.includes('period') && (lower.includes('closed') || lower.includes('locked'))) {
    return {
      titulo: 'Periodo contable cerrado',
      mensaje: 'El periodo contable correspondiente a la fecha del depósito ya se encuentra cerrado en SAP.',
      accionSugerida: 'Comuníquese con Contabilidad para gestionar la apertura temporal del periodo.'
    }
  }

  // 5. Middleware/SAP no disponible: api-tesoreria mapea SapIntegrationException a 502, el
  // circuit breaker abierto a 503 y el timeout a 504 (ver ExceptionHandlingMiddleware).
  const statusServicioCaido = [502, 503, 504]
  if (
    (err?.response?.status !== undefined && statusServicioCaido.includes(err.response.status)) ||
    lower.includes('circuito') ||
    lower.includes('tiempo de espera agotado') ||
    lower.includes('encolado para reintento') ||
    lower.includes('network error')
  ) {
    return {
      titulo: 'Servicio SAP no disponible',
      mensaje: 'No se pudo establecer comunicación con el servidor de integración SAP en este momento.',
      accionSugerida: 'El comprobante quedó guardado localmente como "Pendiente de envío". Puede presionar "Enviar a SAP" más tarde.'
    }
  }

  // Fallback genérico para rechazos de SAP no mapeados explícitamente
  return {
    titulo: 'Error en integración SAP',
    mensaje: 'SAP rechazó la creación del depósito bancario.',
    accionSugerida: 'Revise los datos de la papeleta o contacte a Soporte de Sistemas indicando el número de depósito.'
  }
}
