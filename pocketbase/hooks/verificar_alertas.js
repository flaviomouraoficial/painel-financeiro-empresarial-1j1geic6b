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

    // 1. Alerta Financeiro: Contas a Pagar Vencidas
    const contasPagar = $app.findRecordsByFilter(
      'contas_pagar',
      `empresa_id = '${empresaId}' && status = 'pendente' && data_vencimento < '${todayStart}'`,
      '',
      100,
      0,
    )
    if (contasPagar.length > 0) {
      const totalPagar = contasPagar.reduce((sum, c) => sum + c.getFloat('valor_total'), 0)
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
        notif.set('titulo', 'Contas a Pagar Vencidas')
        notif.set(
          'mensagem',
          `Você tem ${contasPagar.length} contas vencidas — Total: R$ ${totalPagar.toFixed(2)}`,
        )
        notif.set('icone', 'AlertTriangle')
        notif.set('cor', 'red')
        notif.set('link', '/financeiro/contas-pagar')
        notif.set('lida', false)
        $app.save(notif)
      }
    }

    // 2. Alerta Financeiro: Contas a Receber Vencidas
    const contasReceber = $app.findRecordsByFilter(
      'contas_receber',
      `empresa_id = '${empresaId}' && status = 'pendente' && data_vencimento < '${todayStart}'`,
      '',
      100,
      0,
    )
    if (contasReceber.length > 0) {
      const totalReceber = contasReceber.reduce((sum, c) => sum + c.getFloat('valor_total'), 0)
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
        notif.set('titulo', 'Contas a Receber Vencidas')
        notif.set(
          'mensagem',
          `Você tem ${contasReceber.length} contas vencidas — Total: R$ ${totalReceber.toFixed(2)}`,
        )
        notif.set('icone', 'AlertTriangle')
        notif.set('cor', 'red')
        notif.set('link', '/financeiro/contas-receber')
        notif.set('lida', false)
        $app.save(notif)
      }
    }

    // 3. Alerta de Fluxo de Caixa
    const contasBancarias = $app.findRecordsByFilter(
      'contas_bancarias',
      `empresa_id = '${empresaId}' && ativo = true`,
      '',
      100,
      0,
    )
    contasBancarias.forEach((c) => {
      const limite = c.getFloat('limite_credito') || 0
      const saldoAtual = c.getFloat('saldo_atual') || 0

      if (saldoAtual < limite) {
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
          notif.set('titulo', 'Alerta de Saldo')
          notif.set('mensagem', `Saldo em conta corrente abaixo de R$ ${limite.toFixed(2)}`)
          notif.set('icone', 'TrendingDown')
          notif.set('cor', 'orange')
          notif.set('link', '/cadastros/contas-bancarias')
          notif.set('lida', false)
          $app.save(notif)
        }
      }
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
