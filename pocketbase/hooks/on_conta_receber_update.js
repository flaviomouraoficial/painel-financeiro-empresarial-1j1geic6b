onRecordAfterUpdateSuccess((e) => {
  const statusAtual = e.record.getString('status')
  const statusOriginal = e.record.original().getString('status')

  if (statusAtual === 'recebida' && statusOriginal !== 'recebida') {
    let exists = false
    try {
      $app.findFirstRecordByData('lancamentos', 'conta_receber_id', e.record.id)
      exists = true
    } catch (_) {}

    if (!exists) {
      const lancamentosCol = $app.findCollectionByNameOrId('lancamentos')
      const lancamento = new Record(lancamentosCol)
      lancamento.set('empresa_id', e.record.getString('empresa_id'))

      let userId = e.record.getString('usuario_id')
      if (!userId && e.auth) userId = e.auth.id
      if (userId) lancamento.set('usuario_id', userId)

      lancamento.set('tipo', 'receita')
      lancamento.set('conta_receber_id', e.record.id)

      if (e.record.getString('cliente_id'))
        lancamento.set('cliente_id', e.record.getString('cliente_id'))
      if (e.record.getString('projeto_id'))
        lancamento.set('projeto_id', e.record.getString('projeto_id'))

      lancamento.set(
        'descricao',
        `Recebimento: ${e.record.getString('descricao') || e.record.getString('numero_nf') || 'Conta a Receber'}`,
      )
      lancamento.set('valor', e.record.getFloat('valor_total'))
      lancamento.set(
        'data_lancamento',
        e.record.getString('data_vencimento') || new Date().toISOString(),
      )
      lancamento.set(
        'data_competencia',
        e.record.getString('data_emissao') ||
          e.record.getString('data_vencimento') ||
          new Date().toISOString(),
      )
      lancamento.set('forma_pagamento', e.record.getString('forma_pagamento') || 'Outros')
      lancamento.set('status', 'confirmado')

      $app.save(lancamento)
    }
  }
  e.next()
}, 'contas_receber')
