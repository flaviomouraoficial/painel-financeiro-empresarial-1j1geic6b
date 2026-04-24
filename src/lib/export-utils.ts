export function exportToCsv(filename: string, rows: any[][]) {
  const csvContent = rows
    .map((e) =>
      e
        .map((cell) => {
          const cellStr = cell === null || cell === undefined ? '' : String(cell)
          return `"${cellStr.replace(/"/g, '""')}"`
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const escapeXml = (unsafe: any) => {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

export function exportToExcel(filename: string, sheets: { name: string; data: any[][] }[]) {
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Interior ss:Color="#268C83" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format='"R$"#,##0.00'/>
  </Style>
 </Styles>
`

  for (const sheet of sheets) {
    xml += ` <Worksheet ss:Name="${escapeXml(sheet.name).replace(/[\\/?*[\]:]/g, '')}">\n  <Table>\n`
    for (let i = 0; i < sheet.data.length; i++) {
      const row = sheet.data[i]
      xml += `   <Row>\n`
      for (let j = 0; j < row.length; j++) {
        const cell = row[j]
        const isHeader = i === 0
        const isNumber = typeof cell === 'number'
        const style = isHeader ? ' ss:StyleID="Header"' : isNumber ? ' ss:StyleID="Currency"' : ''
        const type = isNumber ? 'Number' : 'String'
        xml += `    <Cell${style}><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>\n`
      }
      xml += `   </Row>\n`
    }
    xml += `  </Table>\n </Worksheet>\n`
  }
  xml += `</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
