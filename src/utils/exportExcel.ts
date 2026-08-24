import * as XLSX from 'xlsx'

export interface ExcelColumn<T> {
  header: string
  key: keyof T | ((row: T) => string | number | null | undefined)
  /**
   * Force this column's cells to be stored as text (not inferred as a number). Without this,
   * Excel auto-detects numeric-looking strings (item codes, barcodes) and can mangle long ones
   * into scientific notation (e.g. a barcode showing as "8E+21") or strip leading zeros.
   */
  text?: boolean
}

/** Builds and downloads a real .xlsx file (not CSV) from tabular data. */
export function downloadExcel<T>(filename: string, columns: ExcelColumn<T>[], rows: T[], sheetName = 'Datos') {
  const headerRow = columns.map(c => c.header)
  const dataRows = rows.map(row =>
    columns.map(c => {
      const value = typeof c.key === 'function' ? c.key(row) : row[c.key]
      return value ?? ''
    })
  )

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

  const textColumnIndexes = columns
    .map((c, i) => (c.text ? i : -1))
    .filter(i => i >= 0)

  for (let r = 0; r < dataRows.length; r++) {
    for (const c of textColumnIndexes) {
      const address = XLSX.utils.encode_cell({ r: r + 1, c })
      const cell = worksheet[address]
      if (cell) {
        cell.t = 's'
        cell.v = String(cell.v)
        cell.z = '@' // text number format, so Excel doesn't re-infer it as numeric on open
      }
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}
