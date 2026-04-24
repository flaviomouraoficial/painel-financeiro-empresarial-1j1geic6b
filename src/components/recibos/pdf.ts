import { exportToPdf } from '@/lib/pdf-export'
import { formatCurrency, formatDate } from '@/lib/format'

export async function generateReciboPDF(recibo: any, itens: any[]) {
  const tableHtml = `
    <div style="margin-bottom: 20px;">
      <h3>Dados do Recibo</h3>
      <p><strong>Número:</strong> ${recibo.numero_recibo}</p>
      <p><strong>Status:</strong> ${String(recibo.status).toUpperCase()}</p>
      <p><strong>Data da Criação:</strong> ${formatDate(recibo.data_criacao)}</p>
    </div>
    <div style="margin-bottom: 20px;">
      <h3>Dados do Cliente</h3>
      <p><strong>Nome:</strong> ${recibo.expand?.cliente_id?.nome || '-'}</p>
      <p><strong>Documento:</strong> ${recibo.expand?.cliente_id?.cpf_cnpj || '-'}</p>
    </div>
    <div style="margin-bottom: 20px;">
      <h3>Dados da Nota Fiscal (NF)</h3>
      <p><strong>Número NF:</strong> ${recibo.numero_nf}</p>
      <p><strong>Data NF:</strong> ${formatDate(recibo.data_nf)}</p>
      <p><strong>Descrição:</strong> ${recibo.descricao_nf || '-'}</p>
      <p><strong>Valor Total NF:</strong> ${formatCurrency(recibo.valor_nf)}</p>
    </div>
    <h3>Itens de Despesa</h3>
    <table class="pdf-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th style="text-align: center;">Qtd</th>
          <th style="text-align: right;">V. Unitário</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itens
          .map(
            (i) => `
          <tr>
            <td>${i.descricao}</td>
            <td style="text-align: center;">${i.quantidade}</td>
            <td style="text-align: right;">${formatCurrency(i.valor_unitario)}</td>
            <td style="text-align: right;">${formatCurrency(i.quantidade * i.valor_unitario)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <th colspan="3" style="text-align: right; padding-top: 15px;">Subtotal Itens:</th>
          <th style="text-align: right; padding-top: 15px;">${formatCurrency(itens.reduce((a, b) => a + b.quantidade * b.valor_unitario, 0))}</th>
        </tr>
      </tfoot>
    </table>
  `

  await exportToPdf({
    filename: `${recibo.numero_recibo}.pdf`,
    title: 'Recibo de Despesa de Viagem',
    period: formatDate(recibo.data_criacao),
    tableHtml,
  })
}
