const DEFAULT_MAX_EXCEL_UPLOAD_SIZE_MB = 50

const parsedMaxExcelUploadSizeMb = Number(import.meta.env.VITE_MAX_EXCEL_UPLOAD_SIZE_MB)

export const MAX_EXCEL_UPLOAD_SIZE_MB =
  Number.isFinite(parsedMaxExcelUploadSizeMb) && parsedMaxExcelUploadSizeMb > 0
    ? parsedMaxExcelUploadSizeMb
    : DEFAULT_MAX_EXCEL_UPLOAD_SIZE_MB

export const MAX_EXCEL_UPLOAD_SIZE_BYTES = MAX_EXCEL_UPLOAD_SIZE_MB * 1024 * 1024
