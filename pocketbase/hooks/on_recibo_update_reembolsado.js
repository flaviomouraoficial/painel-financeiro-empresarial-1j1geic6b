onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  if (
    record.getString('status') === 'reembolsado' &&
    original.getString('status') !== 'reembolsado'
  ) {
    try {
      $app.findFirstRecordByData('contas_receber', 'numero_documento', record.id)
      return e.next()
    } catch (_) {
      const col = $app.findCollectionByNameOrId('contas_receber')
      const cr = new Record(col)

      cr.set('empresa_id', record.get('empresa_id'))
      cr.set('cliente_id', record.get('cliente_id'))
      cr.set('valor_total', record.get('valor_nf'))
      cr.set('data_emissao', new Date().toISOString())
      cr.set('status', 'pendente')
      cr.set(
        'descricao',
        'Reembolso de Despesa de Viagem - Recibo #' + record.getString('numero_recibo'),
      )
      cr.set('numero_documento', record.id)

      $app.save(cr)
    }
  }

  return e.next()
}, 'recibos')
