migrate(
  (app) => {
    const contasPagar = app.findCollectionByNameOrId('contas_pagar')

    const statusField = contasPagar.fields.getByName('status')
    statusField.values = ['pendente', 'vencida', 'paga', 'cancelada']

    if (!contasPagar.fields.getByName('descricao')) {
      contasPagar.fields.add(new TextField({ name: 'descricao' }))
    }
    if (!contasPagar.fields.getByName('forma_pagamento')) {
      contasPagar.fields.add(new TextField({ name: 'forma_pagamento' }))
    }
    if (!contasPagar.fields.getByName('numero_documento')) {
      contasPagar.fields.add(new TextField({ name: 'numero_documento' }))
    }
    if (!contasPagar.fields.getByName('centro_custo_id')) {
      contasPagar.fields.add(
        new RelationField({
          name: 'centro_custo_id',
          collectionId: app.findCollectionByNameOrId('centros_custo').id,
          maxSelect: 1,
        }),
      )
    }
    if (!contasPagar.fields.getByName('observacoes')) {
      contasPagar.fields.add(new TextField({ name: 'observacoes' }))
    }
    if (!contasPagar.fields.getByName('usuario_id')) {
      contasPagar.fields.add(
        new RelationField({ name: 'usuario_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }
    if (!contasPagar.fields.getByName('data_pagamento')) {
      contasPagar.fields.add(new DateField({ name: 'data_pagamento' }))
    }

    app.save(contasPagar)

    const pagamentos = app.findCollectionByNameOrId('pagamentos')
    if (!pagamentos.fields.getByName('conta_bancaria_id')) {
      pagamentos.fields.add(
        new RelationField({
          name: 'conta_bancaria_id',
          collectionId: app.findCollectionByNameOrId('contas_bancarias').id,
          maxSelect: 1,
        }),
      )
    }
    if (!pagamentos.fields.getByName('usuario_id')) {
      pagamentos.fields.add(
        new RelationField({ name: 'usuario_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }

    app.save(pagamentos)
  },
  (app) => {
    // Revert not needed for this additive update
  },
)
