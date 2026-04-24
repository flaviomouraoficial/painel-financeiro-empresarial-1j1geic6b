onRecordAfterUpdateSuccess((e) => {
  const statusAtual = e.record.getString('status')
  const statusOriginal = e.record.original().getString('status')

  if (statusAtual === 'recebida' && statusOriginal !== 'recebida') {
    const empresaId = e.record.getString('empresa_id')
    const clienteId = e.record.getString('cliente_id')

    let clienteNome = 'Cliente'
    if (clienteId) {
      try {
        const c = $app.findRecordById('clientes', clienteId)
        clienteNome = c.getString('nome') || 'Cliente'
      } catch (_) {}
    }

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
      notif.set('tipo', 'recebimento')
      notif.set('titulo', 'Conta Recebida')
      notif.set(
        'mensagem',
        `Recebimento de R$ ${e.record.getFloat('valor_total').toFixed(2)} de ${clienteNome} registrado`,
      )
      notif.set('icone', 'CheckCircle')
      notif.set('cor', 'green')
      notif.set('link', '/financeiro/contas-receber')
      notif.set('lida', false)
      $app.save(notif)
    })
  }
  e.next()
}, 'contas_receber')
