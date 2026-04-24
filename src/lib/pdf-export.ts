export async function exportToPdf({
  filename,
  title,
  period,
  filters,
  tableHtml,
  chartImages = [],
  orientation = 'portrait',
}: {
  filename: string
  title: string
  period?: string
  filters?: string
  tableHtml: string
  chartImages?: string[]
  orientation?: 'portrait' | 'landscape'
}) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const dateNow = new Date().toLocaleString('pt-BR')

  const chartsHtml = chartImages
    .map((img) => `<div class="chart-container"><img src="${img}" alt="Gráfico" /></div>`)
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { 
            size: A4 ${orientation}; 
            margin: 15mm 15mm 20mm 15mm; 
            @bottom-right {
              content: "Página " counter(page) " de " counter(pages);
              font-size: 10px;
              color: #9ca3af;
              font-family: 'Inter', Arial, sans-serif;
            }
          }
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            font-size: 11px;
            color: #1f2937; 
            margin: 0;
            padding: 0;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: block;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            background-color: #268C83 !important; 
            color: white !important;
            padding: 15px 20px; 
            border-radius: 6px;
          }
          .header-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            color: white !important; 
            margin: 0; 
            text-transform: uppercase;
          }
          .company-name {
            font-size: 12px;
            font-weight: 600;
            color: #e0f2f1 !important;
            margin: 0 0 4px 0;
          }
          .period, .filters { 
            color: #ccfbf1 !important; 
            margin: 0; 
            font-size: 11px; 
          }
          .filters { font-style: italic; }
          .logo { height: 40px; object-fit: contain; max-width: 150px; }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            page-break-inside: auto;
            font-size: 11px;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { 
            padding: 8px; 
            text-align: left; 
            border-bottom: 1px solid #e5e7eb; 
          }
          th { 
            font-weight: 600; 
            color: #fff !important; 
            background-color: #268C83 !important; 
          }
          tbody tr:nth-child(even) { background-color: #f9fafb !important; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .chart-container { 
            margin-top: 20px; 
            margin-bottom: 20px;
            text-align: center; 
            page-break-inside: avoid;
            width: 100%;
          }
          .chart-container img {
            max-width: 100%;
            height: auto;
            max-height: 350px;
            object-fit: contain;
          }
          .pdf-table {
            table-layout: fixed;
            word-wrap: break-word;
          }
          .pdf-table th, .pdf-table td {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .content {
            margin-bottom: 40px;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            padding-top: 10px;
            padding-bottom: 10px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            background: white;
            z-index: 100;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <h1 class="title">${title}</h1>
            <p class="company-name">Trend Consultoria LTDA - CNPJ: 09.465.223/0001-07</p>
            ${period ? `<p class="period">Período: ${period}</p>` : ''}
            ${filters ? `<p class="filters">Filtros: ${filters}</p>` : ''}
          </div>
          <img class="logo" src="/Avatar-Branco.png" onerror="this.src='https://img.usecurling.com/i?q=company&color=white'" alt="Logo" />
        </div>
        <div class="content">
          ${chartsHtml}
          ${tableHtml}
        </div>
        <div class="footer">
          Gerado em ${dateNow} por Trend Consultoria - Relatório gerado automaticamente pelo sistema de gestão financeira.
        </div>
        <script>
          window.onload = () => {
            document.title = "${filename}";
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 500);
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

export function captureChart(ref: React.RefObject<HTMLElement>): string | null {
  if (!ref.current) return null
  const svg = ref.current.querySelector('svg')
  if (svg) {
    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svg)
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
  }
  return null
}
