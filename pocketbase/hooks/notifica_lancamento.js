onRecordAfterCreateSuccess((e) => {
  const empresaId = e.record.getString('empresa_id')
  const creatorId = e.record.getString('usuario_id')
  const users = $app.findRecordsByFilter(
    'users',
    `empresa_id = '${empresaId}' && ativo = true`,
    '',
    100,
    0,
  )
  const col = $app.findCollectionByNameOrId('notificacoes')

  users.forEach((user) => {
    if (user.id === creatorId) return
    const notif = new Record(col)
    notif.set('usuario_id', user.id)
    notif.set('empresa_id', empresaId)
    notif.set('tipo', 'lancamento')
    notif.set('titulo', 'Novo Lançamento')
    notif.set(
      'mensagem',
      `Novo lançamento: ${e.record.getString('descricao') || e.record.getString('tipo')} de R$ ${e.record.getFloat('valor').toFixed(2)}`,
    )
    notif.set('icone', 'Activity')
    notif.set('cor', 'teal')
    notif.set('link', '/lancamentos')
    notif.set('lida', false)
    $app.save(notif)
  })
  e.next()
}, 'lancamentos')
