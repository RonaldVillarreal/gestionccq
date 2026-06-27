import * as XLSX from 'xlsx'

// Lee un archivo Excel/CSV y devuelve filas como objetos JSON.
export function readExcel (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(rows)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

// Descarga un array de objetos como plantilla .xlsx
export function downloadTemplate (filename, headers) {
  const ws = XLSX.utils.json_to_sheet([Object.fromEntries(headers.map(h => [h, '']))])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
  XLSX.writeFile(wb, filename)
}
