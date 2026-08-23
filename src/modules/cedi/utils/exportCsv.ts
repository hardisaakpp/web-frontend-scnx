/**
 * Export CSV liviano y sin dependencias — Excel lo abre nativamente (doble click). No usamos
 * la librería `xlsx` porque no es dependencia en esta rama (existe un util equivalente
 * `src/utils/exportExcel.ts` en otra rama sin mergear todavía, `fix/cchica-reportes-070826` —
 * agregar la librería solo para esto no se justifica).
 */
export interface CsvColumn<T> {
  header: string
  key: keyof T | ((row: T) => string | number | boolean | null | undefined)
}

function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  // Comillas dobles si el valor tiene coma, comilla o salto de línea (regla estándar CSV).
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const headerLine = columns.map(c => escapeCsvCell(c.header)).join(',')
  const dataLines = rows.map(row =>
    columns.map((c) => {
      const value = typeof c.key === 'function' ? c.key(row) : row[c.key]
      return escapeCsvCell(value)
    }).join(','),
  )

  // BOM (﻿) para que Excel detecte UTF-8 y no rompa tildes/ñ al abrir el archivo.
  const csv = '﻿' + [headerLine, ...dataLines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
