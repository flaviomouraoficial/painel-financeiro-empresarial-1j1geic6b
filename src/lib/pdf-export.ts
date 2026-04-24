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
    .map(
      (img) =>
        `<div class="chart-container"><img src="${img}" style="max-width: 100%; height: auto;" /></div>`,
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: ${orientation}; margin: 15mm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px;
            color: #333; 
            margin: 0;
            padding: 0;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #268C83; 
            padding-bottom: 10px; 
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #268C83; 
            margin: 0 0 5px 0; 
          }
          .period { color: #666; margin: 0; font-size: 12px; }
          .filters { color: #666; margin: 5px 0 0 0; font-size: 11px; font-style: italic; }
          .logo { height: 40px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
          th { font-weight: 600; color: #fff; background: #268C83; }
          tbody tr:nth-child(even) { background-color: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .chart-container { margin-top: 20px; text-align: center; page-break-inside: avoid; }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #999;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            ${period ? `<p class="period">Período: ${period}</p>` : ''}
            ${filters ? `<p class="filters">Filtros: ${filters}</p>` : ''}
          </div>
          <img class="logo" src="/Avatar-Branco.png" onerror="this.src='https://img.usecurling.com/i?q=company&color=azure'" alt="Logo" />
        </div>
        ${chartsHtml}
        ${tableHtml}
        <div class="footer">
          Gerado em ${dateNow} por Trend Consultoria
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
