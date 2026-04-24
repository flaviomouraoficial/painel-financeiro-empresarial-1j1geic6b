routerAdd(
  'POST',
  '/backend/v1/contas-pagar/{id}/pagar',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const { data_pagamento, valor_pago, forma_pagamento, conta_bancaria_id } = body

    if (!valor_pago || valor_pago <= 0) return e.badRequestError('Valor pago inválido')
    if (!conta_bancaria_id) return e.badRequestError('Conta bancária obrigatória')

    const authRecord = e.auth
    if (!authRecord) return e.unauthorizedError('Não autorizado')

    let result = {}

    $app.runInTransaction((txApp) => {
      const contaPagar = txApp.findRecordById('contas_pagar', id)
      if (contaPagar.getString('empresa_id') !== authRecord.getString('empresa_id')) {
        throw new ForbiddenError('Não autorizado')
      }
      if (contaPagar.getString('status') === 'paga') {
        throw new BadRequestError('Conta já está paga')
      }

      const dataPagamentoFmt = data_pagamento
        ? new Date(data_pagamento).toISOString()
        : new Date().toISOString()

      contaPagar.set('status', 'paga')
      contaPagar.set('data_pagamento', dataPagamentoFmt)
      txApp.save(contaPagar)

      const contaBancaria = txApp.findRecordById('contas_bancarias', conta_bancaria_id)
      const saldoAtual = contaBancaria.getFloat('saldo_atual')
      contaBancaria.set('saldo_atual', saldoAtual - valor_pago)
      txApp.save(contaBancaria)

      const pagamentosCol = txApp.findCollectionByNameOrId('pagamentos')
      const pagamento = new Record(pagamentosCol)
      pagamento.set('empresa_id', authRecord.getString('empresa_id'))
      pagamento.set('conta_pagar_id', id)
      pagamento.set('valor_pago', valor_pago)
      pagamento.set('data_pagamento', dataPagamentoFmt)
      pagamento.set('forma_pagamento', forma_pagamento || contaPagar.getString('forma_pagamento'))
      pagamento.set('conta_bancaria_id', conta_bancaria_id)
      pagamento.set('usuario_id', authRecord.id)
      txApp.save(pagamento)

      const lancamentosCol = txApp.findCollectionByNameOrId('lancamentos')
      const lancamento = new Record(lancamentosCol)
      lancamento.set('empresa_id', authRecord.getString('empresa_id'))
      lancamento.set('usuario_id', authRecord.id)
      lancamento.set('tipo', 'despesa')

      if (contaPagar.getString('fornecedor_id'))
        lancamento.set('fornecedor_id', contaPagar.getString('fornecedor_id'))
      if (contaPagar.getString('projeto_id'))
        lancamento.set('projeto_id', contaPagar.getString('projeto_id'))
      if (contaPagar.getString('centro_custo_id'))
        lancamento.set('centro_custo_id', contaPagar.getString('centro_custo_id'))

      lancamento.set(
        'descricao',
        `Pagamento: ${contaPagar.getString('descricao') || contaPagar.getString('numero_nf') || 'Conta a Pagar'}`,
      )
      lancamento.set('valor', valor_pago)
      lancamento.set('data_lancamento', dataPagamentoFmt)
      lancamento.set('data_competencia', contaPagar.getString('data_emissao') || dataPagamentoFmt)
      lancamento.set('conta_bancaria_id', conta_bancaria_id)
      lancamento.set('forma_pagamento', forma_pagamento || contaPagar.getString('forma_pagamento'))
      lancamento.set('status', 'confirmado')
      txApp.save(lancamento)

      result = { success: true }
    })

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
