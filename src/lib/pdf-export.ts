export interface ExportPdfOptions {
  filename: string
  title: string
  period: string
  orientation?: 'portrait' | 'landscape'
  tableHtml: string
  chartImages?: string[]
}

export async function exportToPdf(options: ExportPdfOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.top = '-10000px'
      document.body.appendChild(iframe)

      const doc = iframe.contentWindow?.document
      if (!doc) throw new Error('No iframe document')

      doc.open()
      doc.write('<!DOCTYPE html><html><head><title>' + options.filename + '</title>')

      doc.write(`
        <style>
          @page { size: A4 ${options.orientation || 'portrait'}; margin: 20mm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            font-family: Arial, sans-serif; 
            background: white;
            color: black;
            margin: 0;
            padding: 0;
          }
          .pdf-container { width: 100%; }
          .pdf-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            background-color: #268C83; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 8px;
          }
          .pdf-logo { height: 40px; }
          .pdf-company-info { text-align: right; font-size: 12px; line-height: 1.4; }
          .pdf-title { font-size: 18px; font-weight: bold; color: #268C83; margin: 0 0 5px 0; }
          .pdf-period { font-size: 14px; font-weight: bold; margin: 0 0 20px 0; color: #374151; }
          .pdf-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          .pdf-table th, .pdf-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .pdf-table th { font-weight: bold; background-color: #f3f4f6; color: #374151; }
          .pdf-table tr:nth-child(even) { background-color: #f9fafb; }
          .pdf-table tr:nth-child(odd) { background-color: #ffffff; }
          .pdf-chart-container { margin-bottom: 20px; page-break-inside: avoid; text-align: center; }
          .pdf-chart { max-width: 100%; height: auto; }
          .pdf-footer { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            font-size: 10px; 
            text-align: center; 
            color: #6b7280; 
            padding-top: 10px; 
            border-top: 1px solid #e5e7eb; 
          }
        </style>
      `)
      doc.write('</head><body>')

      const now = new Date()
      const generatedAt = now.toLocaleString('pt-BR')

      let html = `
        <div class="pdf-container">
          <div class="pdf-header">
            <div>
              <img src="/Avatar-Branco.png" class="pdf-logo" alt="Logo" />
            </div>
            <div class="pdf-company-info">
              <strong>Trend Consultoria LTDA</strong><br/>
              CNPJ: 09.465.223/0001-07
            </div>
          </div>
          
          <h1 class="pdf-title">${options.title}</h1>
          <div class="pdf-period">Período: ${options.period}</div>
      `

      if (options.chartImages && options.chartImages.length > 0) {
        options.chartImages.forEach((img) => {
          html += `<div class="pdf-chart-container"><img src="${img}" class="pdf-chart" /></div>`
        })
      }

      html += `
          ${options.tableHtml}
          
          <div class="pdf-footer">
            Gerado em ${generatedAt} por Trend Consultoria<br/>
            Relatório gerado automaticamente pelo sistema de gestão financeira
          </div>
        </div>
      `

      doc.write(html)
      doc.write('</body></html>')
      doc.close()

      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()

        setTimeout(() => {
          document.body.removeChild(iframe)
          resolve()
        }, 1000)
      }, 800)
    } catch (error) {
      reject(error)
    }
  })
}

export function captureChart(chartRef: React.RefObject<HTMLElement | null>): string | null {
  if (!chartRef.current) return null
  const svg = chartRef.current.querySelector('svg')
  if (!svg) return null

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement
  const containerStyle = chartRef.current.getAttribute('style')
  if (containerStyle) {
    clonedSvg.setAttribute('style', (clonedSvg.getAttribute('style') || '') + ';' + containerStyle)
  }

  const { width, height } = svg.getBoundingClientRect()
  clonedSvg.setAttribute('width', width.toString())
  clonedSvg.setAttribute('height', height.toString())

  const xml = new XMLSerializer().serializeToString(clonedSvg)
  const svg64 = btoa(unescape(encodeURIComponent(xml)))
  return 'data:image/svg+xml;base64,' + svg64
}
