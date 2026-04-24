import { exportToPdf } from '@/lib/pdf-export'
import { formatCurrency, formatDate } from '@/lib/format'

export async function generateReciboPDF(recibo: any, itens: any[], empresa?: any) {
  const tableHtml = `
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
      <div style="flex: 1; min-width: 200px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
        <h3 style="margin-top: 0; color: #268C83; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Dados do Recibo</h3>
        <p style="margin: 4px 0;"><strong>Número:</strong> ${recibo.numero_recibo}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${String(recibo.status).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Data da Criação:</strong> ${formatDate(recibo.data_criacao)}</p>
      </div>
      <div style="flex: 1; min-width: 200px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
        <h3 style="margin-top: 0; color: #268C83; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Dados do Cliente</h3>
        <p style="margin: 4px 0;"><strong>Nome:</strong> ${recibo.expand?.cliente_id?.nome || '-'}</p>
        <p style="margin: 4px 0;"><strong>Documento:</strong> ${recibo.expand?.cliente_id?.cpf_cnpj || '-'}</p>
      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
      <div style="flex: 1; min-width: 200px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
        <h3 style="margin-top: 0; color: #268C83; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Dados da Nota Fiscal (NF)</h3>
        <p style="margin: 4px 0;"><strong>Número NF:</strong> ${recibo.numero_nf}</p>
        <p style="margin: 4px 0;"><strong>Data NF:</strong> ${formatDate(recibo.data_nf)}</p>
        <p style="margin: 4px 0;"><strong>Descrição:</strong> ${recibo.descricao_nf || '-'}</p>
        <p style="margin: 4px 0;"><strong>Valor Total NF:</strong> ${formatCurrency(recibo.valor_nf)}</p>
      </div>
      <div style="flex: 1; min-width: 200px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
        <h3 style="margin-top: 0; color: #268C83; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Dados Bancários para Reembolso</h3>
        <p style="margin: 4px 0;"><strong>Banco:</strong> ${recibo.expand?.conta_bancaria_id?.banco || '-'}</p>
        <p style="margin: 4px 0;"><strong>Agência/Conta:</strong> ${recibo.expand?.conta_bancaria_id?.agencia || '-'} / ${recibo.expand?.conta_bancaria_id?.numero_conta || '-'}</p>
        ${recibo.expand?.cartao_credito_id ? `<p style="margin: 4px 0;"><strong>Cartão de Crédito:</strong> ${recibo.expand.cartao_credito_id.banco} (Final ${recibo.expand.cartao_credito_id.numero_ultimos_digitos || '-'})</p>` : ''}
      </div>
    </div>
    <h3 style="color: #268C83; font-size: 14px;">Itens de Despesa</h3>
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
