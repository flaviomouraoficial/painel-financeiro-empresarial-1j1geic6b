onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  const secret = $secrets.get('CARD_SECRET') || '12345678901234567890123456789012'

  if (body.numero_completo) {
    e.record.set('numero_ultimos_digitos', body.numero_completo.slice(-4))
    e.record.set('numero_completo', $security.encrypt(body.numero_completo, secret))
  }

  if (body.cvv) {
    e.record.set('cvv', $security.encrypt(body.cvv, secret))
  }

  e.next()
}, 'cartoes_credito')
