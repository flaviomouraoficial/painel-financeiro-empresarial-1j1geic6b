migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contas_receber')

    if (!col.fields.getByName('descricao')) {
      col.fields.add(new TextField({ name: 'descricao' }))
    }
    if (!col.fields.getByName('forma_pagamento')) {
      col.fields.add(new TextField({ name: 'forma_pagamento' }))
    }
    if (!col.fields.getByName('numero_documento')) {
      col.fields.add(new TextField({ name: 'numero_documento' }))
    }
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes' }))
    }

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['pendente', 'vencida', 'recebida', 'cancelada']
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contas_receber')
    col.fields.removeByName('descricao')
    col.fields.removeByName('forma_pagamento')
    col.fields.removeByName('numero_documento')
    col.fields.removeByName('observacoes')

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['aberta', 'parcial', 'recebida', 'vencida']
    }

    app.save(col)
  },
)
