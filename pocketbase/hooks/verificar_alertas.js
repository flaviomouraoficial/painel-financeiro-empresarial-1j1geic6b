routerAdd(
  'POST',
  '/backend/v1/alertas/verificar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Not authenticated')

    const empresaId = auth.getString('empresa_id')
    if (!empresaId) return e.badRequestError('Sem empresa')

    const todayStr = new Date().toISOString().split('T')[0]
    const todayStart = todayStr + ' 00:00:00.000Z'
    const col = $app.findCollectionByNameOrId('notificacoes')

    const contasPagar = $app.findRecordsByFilter(
      'contas_pagar',
      `empresa_id = '${empresaId}' && status = 'pendente' && data_vencimento < '${todayStart}'`,
      '',
      100,
      0,
    )
    contasPagar.forEach((c) => {
      try {
        $app.findFirstRecordByFilter(
          'notificacoes',
          `empresa_id = '${empresaId}' && tipo = 'alerta_financeiro' && link = '/financeiro/contas-pagar' && lida = false`,
        )
      } catch (_) {
        const notif = new Record(col)
        notif.set('usuario_id', auth.id)
        notif.set('empresa_id', empresaId)
        notif.set('tipo', 'alerta_financeiro')
        notif.set('titulo', 'Conta a Pagar Vencida')
        notif.set(
          'mensagem',
          `Conta no valor de R$ ${c.getFloat('valor_total').toFixed(2)} está vencida.`,
        )
        notif.set('icone', 'AlertTriangle')
        notif.set('cor', 'red')
        notif.set('link', '/financeiro/contas-pagar')
        notif.set('lida', false)
        $app.save(notif)
      }
    })

    const contasReceber = $app.findRecordsByFilter(
      'contas_receber',
      `empresa_id = '${empresaId}' && status = 'pendente' && data_vencimento < '${todayStart}'`,
      '',
      100,
      0,
    )
    contasReceber.forEach((c) => {
      try {
        $app.findFirstRecordByFilter(
          'notificacoes',
          `empresa_id = '${empresaId}' && tipo = 'alerta_financeiro' && link = '/financeiro/contas-receber' && lida = false`,
        )
      } catch (_) {
        const notif = new Record(col)
        notif.set('usuario_id', auth.id)
        notif.set('empresa_id', empresaId)
        notif.set('tipo', 'alerta_financeiro')
        notif.set('titulo', 'Conta a Receber Vencida')
        notif.set(
          'mensagem',
          `Recebimento no valor de R$ ${c.getFloat('valor_total').toFixed(2)} está vencido.`,
        )
        notif.set('icone', 'AlertTriangle')
        notif.set('cor', 'red')
        notif.set('link', '/financeiro/contas-receber')
        notif.set('lida', false)
        $app.save(notif)
      }
    })

    const contasBancarias = $app.findRecordsByFilter(
      'contas_bancarias',
      `empresa_id = '${empresaId}' && ativo = true && saldo_atual < 0`,
      '',
      100,
      0,
    )
    contasBancarias.forEach((c) => {
      try {
        $app.findFirstRecordByFilter(
          'notificacoes',
          `empresa_id = '${empresaId}' && tipo = 'alerta_fluxo_caixa' && link = '/cadastros/contas-bancarias' && lida = false`,
        )
      } catch (_) {
        const notif = new Record(col)
        notif.set('usuario_id', auth.id)
        notif.set('empresa_id', empresaId)
        notif.set('tipo', 'alerta_fluxo_caixa')
        notif.set('titulo', 'Saldo Negativo')
        notif.set('mensagem', `A conta ${c.getString('banco')} está com saldo negativo.`)
        notif.set('icone', 'TrendingDown')
        notif.set('cor', 'orange')
        notif.set('link', '/cadastros/contas-bancarias')
        notif.set('lida', false)
        $app.save(notif)
      }
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
