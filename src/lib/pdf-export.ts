export async function exportToPdf({
  filename,
  title,
  period,
  tableHtml,
}: {
  filename: string
  title: string
  period?: string
  tableHtml: string
}) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #111; margin: 0; }
          .period { color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { font-weight: 600; color: #111; background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .pdf-table { width: 100%; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            ${period ? `<p class="period">${period}</p>` : ''}
          </div>
        </div>
        ${tableHtml}
        <script>
          window.onload = () => {
            document.title = "${filename}";
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
