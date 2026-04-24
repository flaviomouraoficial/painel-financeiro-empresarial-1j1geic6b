onRecordAfterUpdateSuccess((e) => {
  const statusAtual = e.record.getString('status')
  const statusOriginal = e.record.original().getString('status')

  if (statusAtual === 'paga' && statusOriginal !== 'paga') {
    const empresaId = e.record.getString('empresa_id')
    const users = $app.findRecordsByFilter(
      'users',
      `empresa_id = '${empresaId}' && ativo = true`,
      '',
      100,
      0,
    )
    const col = $app.findCollectionByNameOrId('notificacoes')

    users.forEach((user) => {
      const notif = new Record(col)
      notif.set('usuario_id', user.id)
      notif.set('empresa_id', empresaId)
      notif.set('tipo', 'pagamento')
      notif.set('titulo', 'Conta Paga')
      notif.set(
        'mensagem',
        `A conta no valor de R$ ${e.record.getFloat('valor_total').toFixed(2)} foi marcada como paga.`,
      )
      notif.set('icone', 'CheckCircle')
      notif.set('cor', 'blue')
      notif.set('link', '/financeiro/contas-pagar')
      notif.set('lida', false)
      $app.save(notif)
    })
  }
  e.next()
}, 'contas_pagar')
