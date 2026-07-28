// Extrae el nombre de archivo desde el header Content-Disposition. */
export function nombreArchivoDesdeHeader(contentDisposition?: string, porDefecto = 'archivo'): string {
  if (!contentDisposition) return porDefecto
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (utf8?.[1]) return decodeURIComponent(utf8[1])
  const simple = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return simple?.[1]?.trim() ?? porDefecto
}

// Descarga un Blob en el navegador liberando el ObjectURL. */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

// Si el back devolvió el error como Blob JSON (responseType blob), extrae su mensaje. */
export async function mensajeDeErrorBlob(data: unknown): Promise<string | null> {
  if (!(data instanceof Blob)) return null
  try {
    const json = JSON.parse(await data.text())
    return json.mensaje ?? json.error ?? null
  } catch {
    return null
  }
}
