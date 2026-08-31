import { describe, it, expect } from 'vitest'
import { processUploadError } from '@/modules/mba3-consultas/composables/useFileUpload'

describe('processUploadError', () => {
  describe('error genérico (sin error_code, sin patrones reconocidos)', () => {
    it('usa el mensaje del backend y título por defecto', () => {
      const e = { response: { data: { error: 'Algo salió mal' } } }
      const info = processUploadError(e, 'plantilla.xlsx')
      expect(info.title).toBe('Error al cargar plantilla')
      expect(info.message).toBe('Algo salió mal')
      expect(info.fileName).toBe('plantilla.xlsx')
      expect(info.errors).toBeUndefined()
    })

    it('usa mensaje por defecto cuando no hay ninguna fuente de mensaje', () => {
      const e = {}
      const info = processUploadError(e, 'x.xlsx')
      expect(info.message).toBe('Error desconocido al subir plantilla')
    })

    it('prioriza e.message sobre response.data.error', () => {
      const e = { message: 'Network Error', response: { data: { error: 'otro mensaje' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.message).toBe('Network Error')
    })
  })

  describe('error_code específicos del backend', () => {
    it('FORMATO_EXCEL_INVALIDO', () => {
      const e = { response: { data: { error_code: 'FORMATO_EXCEL_INVALIDO' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Formato Excel Inválido')
      expect(info.error_code).toBe('FORMATO_EXCEL_INVALIDO')
    })

    it('ARCHIVO_SIN_DATOS', () => {
      const e = { response: { data: { error_code: 'ARCHIVO_SIN_DATOS' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Archivo Sin Datos Válidos')
    })

    it('FORMATO_RESPUESTA_PROVEEDOR_INVALIDO', () => {
      const e = { response: { data: { error_code: 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Formato de Respuesta Proveedor Inválido')
    })

    it('PACK_PVP_INVALIDOS_SAP conserva el mensaje original del backend', () => {
      const e = { response: { data: { error_code: 'PACK_PVP_INVALIDOS_SAP', error: 'Detalle de discrepancias Pack/PVP' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Discrepancias de Pack/PVP')
      expect(info.message).toBe('Detalle de discrepancias Pack/PVP')
    })

    it('COSTO_UNITARIO_EXCEL_INCONSISTENTE conserva el mensaje original del backend', () => {
      const e = { response: { data: { error_code: 'COSTO_UNITARIO_EXCEL_INCONSISTENTE', error: 'Detalle de costo unitario' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Discrepancias de Costo Unitario')
      expect(info.message).toBe('Detalle de costo unitario')
    })

    it('lee error_code también desde response.data.data (BusinessException anidado)', () => {
      const e = { response: { data: { data: { error_code: 'ARCHIVO_SIN_DATOS' } } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Archivo Sin Datos Válidos')
    })
  })

  describe('códigos SAP no encontrados — formato estructurado (validacion_sap.no_encontrados)', () => {
    it('un solo producto no encontrado', () => {
      const e = {
        response: {
          data: {
            error: 'Validación SAP falló',
            validacion_sap: { no_encontrados: ['PROD-001'] }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos de producto no encontrados en SAP')
      expect(info.message).toContain('PROD-001')
      expect(info.errors).toEqual([
        { tipo: 'ERROR', campo: 'Producto SAP', mensaje: 'El código no existe en SAP', producto: 'PROD-001' }
      ])
    })

    it('múltiples productos no encontrados, sin duplicados', () => {
      const e = {
        response: {
          data: {
            validacion_sap: { no_encontrados: ['PROD-001', 'PROD-002', 'PROD-001'] }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.errors).toHaveLength(2)
      expect(info.message).toContain('Existen 2 código(s) no válidos en SAP')
    })

    it('estructura anidada en response.data.data.validacion_sap (BusinessException)', () => {
      const e = {
        response: {
          data: {
            data: { validacion_sap: { no_encontrados: ['PROD-XYZ'] } }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos de producto no encontrados en SAP')
      expect(info.message).toContain('PROD-XYZ')
    })

    it('validacion_sap.detalle_validacion se conserva en el resultado', () => {
      const detalle = { 'PROD-001': { existe: false } }
      const e = {
        response: {
          data: { validacion_sap: { no_encontrados: ['PROD-001'], detalle_validacion: detalle } }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.validacion_sap?.detalle_validacion).toEqual(detalle)
    })
  })

  describe('códigos SAP no encontrados — tiendas y bodegas', () => {
    it('tiendas no encontradas via validacion.tiendas.no_encontradas', () => {
      const e = {
        response: {
          data: {
            validacion: { tiendas: { no_encontradas: ['T001'] } }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos de tienda/bodega no encontrados en SAP')
      expect(info.errors).toEqual([
        { tipo: 'ERROR', campo: 'Tienda/Bodega SAP', mensaje: 'El código no existe en SAP OWHS', producto: 'T001' }
      ])
    })

    it('bodegas no encontradas via validacion.bodegas.no_encontradas', () => {
      const e = {
        response: {
          data: {
            validacion: { bodegas: { no_encontradas: ['B001'] } }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos de bodega no encontrados en SAP')
    })

    it('productos + tiendas combinados producen título genérico "no válidos en SAP"', () => {
      const e = {
        response: {
          data: {
            validacion_sap: { no_encontrados: ['PROD-001'] },
            validacion: { tiendas: { no_encontradas: ['T001'] } }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos no válidos en SAP')
      expect(info.message).toContain('PROD-001')
      expect(info.message).toContain('T001')
    })
  })

  describe('códigos SAP — extracción por regex del mensaje (formato legacy, sin datos estructurados)', () => {
    it('formato "Validación SAP productos falló: Productos no encontrados (N): ..."', () => {
      const e = {
        response: {
          data: {
            error: '❌ Validación SAP productos falló: Productos no encontrados (2): PROD-001, PROD-002'
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Códigos de producto no encontrados en SAP')
      expect(info.errors?.map(x => (typeof x === 'string' ? x : x.producto))).toEqual(['PROD-001', 'PROD-002'])
    })

    it('formato genérico "Productos no encontrados (N): ..." sin el prefijo de validación', () => {
      const e = { response: { data: { error: 'Productos no encontrados (1): PROD-999' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.errors?.some(x => typeof x !== 'string' && x.producto === 'PROD-999')).toBe(true)
    })

    it('conteo sin códigos específicos (no_encontrados como número legacy)', () => {
      const e = {
        response: {
          data: {
            error: 'algo de SAP',
            validacion_sap: { no_encontrados: 3 }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.message).toContain('Existen 3 código(s) de producto no válidos en SAP')
      expect(info.message).toContain('Los códigos específicos no están disponibles')
    })
  })

  describe('looksLikeProductCode: filtra falsos positivos de la extracción por regex', () => {
    it('descarta una frase de error de formato que el regex habría tomado como "código", y cae al título de formato', () => {
      const e = {
        response: {
          data: {
            error: 'Productos no encontrados (1): el formato del archivo es incorrecto'
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      // La frase se descarta por looksLikeProductCode (contiene "formato"), no queda ningún
      // código "fantasma" en errors, y el mensaje cae al título genérico de error de formato.
      expect(info.errors).toBeUndefined()
      expect(info.title).toBe('Error de formato')
    })
  })

  describe('número de pedido duplicado', () => {
    it('con error_code NUMERO_PEDIDO_DUPLICADO y numero_pedido en la respuesta', () => {
      const e = { response: { data: { error_code: 'NUMERO_PEDIDO_DUPLICADO', numero_pedido: 'PED-123' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Número de pedido duplicado')
      expect(info.message).toContain('PED-123')
      expect(info.numero_pedido).toBe('PED-123')
    })

    it('detectado por texto del mensaje (sin error_code), numero_pedido extraído entre comillas', () => {
      const e = { response: { data: { error: 'El número de pedido "PED-999" ya existe en el sistema' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Número de pedido duplicado')
      expect(info.message).toContain('PED-999')
    })

    it('detectado por error_tipo=numero_pedido_duplicado', () => {
      const e = { response: { data: { error: 'ya existe', error_tipo: 'numero_pedido_duplicado' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Número de pedido duplicado')
    })

    it('sin numero_pedido identificable usa el mensaje genérico', () => {
      const e = { response: { data: { error: 'este pedido ya existe en el sistema' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Número de pedido duplicado')
      expect(info.message).toContain('El número de pedido que intentaste utilizar ya existe')
    })

    it('un mensaje de SAP no se clasifica como duplicado aunque contenga "ya existe" (isSAPError tiene precedencia)', () => {
      const e = {
        response: {
          data: {
            error: 'ya existe en el sistema',
            validacion_sap: { no_encontrados: ['PROD-1'] }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).not.toBe('Número de pedido duplicado')
    })
  })

  describe('longitud de campo excedida (100 caracteres)', () => {
    it('detectado por texto libre del mensaje sobre numero_pedido', () => {
      const e = { response: { data: { error: 'El campo numero_pedido no puede exceder 100 caracteres' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Longitud de campo excedida')
      expect(info.message).toContain('Número de pedido')
    })

    it('detectado desde errorData.errores[] con campo+mensaje explícitos', () => {
      const e = {
        response: {
          data: {
            errores: [{ campo: 'mensaje', mensaje: 'excede los 100 caracteres permitidos' }]
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Longitud de campo excedida')
      expect(info.message).toContain('Mensaje')
    })

    it('menciona "campo" de forma genérica (sin decir cuál) -> fallback incluye ambos campos por defecto', () => {
      const e = { response: { data: { error: 'El campo excede los 100 caracteres permitidos' } } }
      const info = processUploadError(e, 'x.xlsx')
      // Dispara isLongitudError (100+caracteres+"campo"), pero "campo" no identifica cuál de los
      // dos (numero_pedido/mensaje) -> camposAfectados queda vacío -> fallback a ambos.
      expect(info.title).toBe('Longitud de campo excedida')
      expect(info.message).toContain('Número de pedido')
      expect(info.message).toContain('Mensaje')
    })

    it('un mensaje de 100 caracteres que no nombra ningún campo NO dispara esta rama', () => {
      const e = { response: { data: { error: 'excede los 100 caracteres máximo' } } }
      const info = processUploadError(e, 'x.xlsx')
      // Sin "numero_pedido"/"mensaje"/"campo" en el texto, isLongitudError es false: el mensaje
      // del backend pasa tal cual (no hay ninguna otra regla que lo reclasifique).
      expect(info.title).not.toBe('Longitud de campo excedida')
      expect(info.message).toBe('excede los 100 caracteres máximo')
    })
  })

  describe('error de formato (sin error_code)', () => {
    it('mensaje que menciona "formato" activa el título de formato', () => {
      const e = { response: { data: { error: 'El archivo no tiene el formato esperado' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Error de formato')
    })

    it('si hay error_code, NO se activa el título de formato aunque el mensaje mencione "formato"', () => {
      const e = { response: { data: { error_code: 'ARCHIVO_SIN_DATOS', error: 'problema de formato' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('Archivo Sin Datos Válidos')
    })
  })

  describe('BusinessException genérica (sin error_code ni patrones)', () => {
    it('usa el mensaje combinado cuando isBusinessException=true', () => {
      const e = { isBusinessException: true, response: { data: { error: 'Regla de negocio violada' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.title).toBe('No se puede procesar el archivo')
      expect(info.message).toBe('Regla de negocio violada')
    })
  })

  describe('validacion_pack_pvp pasa al resultado tal cual venga del backend', () => {
    it('incluye pack_mismatches, pvp_mismatches y mensajes', () => {
      const e = {
        response: {
          data: {
            validacion_pack_pvp: {
              pack_mismatches: [{ codigo: 'A', pack_excel: '1', pack_sap: '2' }],
              pvp_mismatches: [],
              mensajes: ['aviso']
            }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.validacion_pack_pvp?.pack_mismatches).toHaveLength(1)
      expect(info.validacion_pack_pvp?.mensajes).toEqual(['aviso'])
    })

    it('es undefined cuando el backend no lo envía', () => {
      const e = { response: { data: { error: 'algo' } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.validacion_pack_pvp).toBeUndefined()
    })
  })

  describe('errors[] adicionales del backend (errorData.errores y e.errors)', () => {
    it('agrega errorData.errores[] al resultado', () => {
      const e = { response: { data: { errores: ['error suelto 1', 'error suelto 2'] } } }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.errors).toEqual(['error suelto 1', 'error suelto 2'])
    })

    it('agrega e.errors[] (fuera de response.data) al resultado', () => {
      const e = { errors: ['fallo A'] }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.errors).toEqual(['fallo A'])
    })
  })

  describe('validacion.cantidades inválida agrega un error de Cantidad', () => {
    it('cuando valid=false', () => {
      const e = {
        response: {
          data: {
            validacion: { cantidades: { valid: false, errors: 2, warnings: 1 } }
          }
        }
      }
      const info = processUploadError(e, 'x.xlsx')
      expect(info.errors).toEqual([
        { tipo: 'ERROR', campo: 'Cantidad', mensaje: 'Errores de validación en cantidades (2 error(es), 1 advertencia(s))', producto: undefined }
      ])
    })
  })
})
