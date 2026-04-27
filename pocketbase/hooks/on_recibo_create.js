onRecordCreate((e) => {
  const empresa_id = e.record.get('empresa_id')
  if (!empresa_id) return e.next()

  const result = new DynamicModel({ max_num: 0 })
  try {
    $app
      .db()
      .newQuery(
        'SELECT MAX(CAST(numero_recibo AS INTEGER)) as max_num FROM recibos WHERE empresa_id = {:empresa_id}',
      )
      .bind({ empresa_id: empresa_id })
      .one(result)
  } catch (err) {
    // Ignore if no rows or execution error
  }

  const nextNum = (result.max_num || 0) + 1
  e.record.set('numero_recibo', String(nextNum).padStart(5, '0'))

  return e.next()
}, 'recibos')
