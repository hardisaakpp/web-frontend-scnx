import type { OrdenCompra, OrdenCompraLog } from '../types'

export function useExport() {
  function exportToCSV(data: OrdenCompra[] | OrdenCompraLog[], filename: string = 'export') {
    if (data.length === 0) {
      throw new Error('No hay datos para exportar')
    }

    // Detectar si es OrdenCompra o OrdenCompraLog
    const isLog = 'log_id' in data[0] || 'timestamp' in data[0]
    
    if (isLog) {
      // Exportar logs - usar todas las claves disponibles
      const logs = data as OrdenCompraLog[]
      const allKeys = new Set<string>()
      
      logs.forEach(log => {
        Object.keys(log).forEach(key => {
          // Excluir objetos complejos
          if (typeof log[key] !== 'object' || log[key] === null || Array.isArray(log[key])) {
            allKeys.add(key)
          }
        })
      })
      
      const headers = Array.from(allKeys).sort()
      const rows = logs.map(log => 
        headers.map(header => {
          const value = log[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object' && !Array.isArray(value)) return JSON.stringify(value)
          return String(value)
        })
      )
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      return
    }

    // Exportar órdenes de compra (código original)
    const ordenes = data as OrdenCompra[]
    const headers = [
      'ODC ID',
      'Proveedor',
      'Referencia Despacho',
      'Fecha Generación',
      'Fecha Creación',
      'Fecha Procesado',
      'Estado',
      'Número ODC SAP',
      'Respuesta SAP'
    ]

    // Convert data to CSV rows
    const rows = ordenes.map(oc => [
      oc.oc_id,
      oc.proveedor,
      oc.referencia_despacho,
      oc.fecha_generacion,
      oc.created_at || '',
      oc.fecha_procesado || '',
      oc.estado,
      oc.numero_oc_sap || '',
      oc.respuesta_sap || ''
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  function exportToExcel(data: OrdenCompra[] | OrdenCompraLog[], filename: string = 'export') {
    // For Excel, we'll create a TSV (tab-separated) file which Excel can open
    // A more advanced implementation could use a library like xlsx
    if (data.length === 0) {
      throw new Error('No hay datos para exportar')
    }

    // Detectar si es OrdenCompra o OrdenCompraLog
    const isLog = 'log_id' in data[0] || 'timestamp' in data[0]
    
    if (isLog) {
      // Exportar logs - usar todas las claves disponibles
      const logs = data as OrdenCompraLog[]
      const allKeys = new Set<string>()
      
      logs.forEach(log => {
        Object.keys(log).forEach(key => {
          // Excluir objetos complejos
          if (typeof log[key] !== 'object' || log[key] === null || Array.isArray(log[key])) {
            allKeys.add(key)
          }
        })
      })
      
      const headers = Array.from(allKeys).sort()
      const rows = logs.map(log => 
        headers.map(header => {
          const value = log[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object' && !Array.isArray(value)) return JSON.stringify(value)
          return String(value).replace(/\t/g, ' ')
        })
      )
      
      const tsvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + tsvContent], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      return
    }

    // Exportar órdenes de compra (código original)
    const ordenes = data as OrdenCompra[]
    const headers = [
      'ODC ID',
      'Proveedor',
      'Referencia Despacho',
      'Fecha Generación',
      'Fecha Creación',
      'Fecha Procesado',
      'Estado',
      'Número ODC SAP',
      'Respuesta SAP'
    ]

    const rows = ordenes.map(oc => [
      oc.oc_id,
      oc.proveedor,
      oc.referencia_despacho,
      oc.fecha_generacion,
      oc.created_at || '',
      oc.fecha_procesado || '',
      oc.estado,
      oc.numero_oc_sap || '',
      oc.respuesta_sap || ''
    ])

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t'))
    ].join('\n')

    const blob = new Blob(['\ufeff' + tsvContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  return {
    exportToCSV,
    exportToExcel
  }
}

