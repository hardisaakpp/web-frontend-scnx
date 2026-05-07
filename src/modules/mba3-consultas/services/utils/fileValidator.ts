/**
 * Utilidades para validación de archivos
 */

import { MAX_EXCEL_UPLOAD_SIZE_BYTES, MAX_EXCEL_UPLOAD_SIZE_MB } from '@/config/uploadLimits'

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']

/**
 * Valida que un archivo cumpla con los requisitos de tipo y tamaño
 */
export function validateFile(file: File): void {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }
  
  if (file.size > MAX_EXCEL_UPLOAD_SIZE_BYTES) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_EXCEL_UPLOAD_SIZE_MB} MB`)
  }
}
