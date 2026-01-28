/**
 * Utilidades para validación de archivos
 */

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Valida que un archivo cumpla con los requisitos de tipo y tamaño
 */
export function validateFile(file: File): void {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('El archivo excede el tamaño máximo de 10 MB')
  }
}
