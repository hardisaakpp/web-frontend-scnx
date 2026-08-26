/**
 * Shared browser-download trigger for blob responses (xlsx reports/exports). Extracted from four
 * near-identical call sites in TransferDetailView.vue and HistoryView.vue: creates a temporary
 * object URL for the blob, clicks a throwaway `<a download>` to trigger the browser's save dialog,
 * then cleans up both the anchor and the object URL.
 *
 * @param blob - The response body to save (e.g. an xlsx export).
 * @param filename - Suggested filename for the browser's save dialog.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
