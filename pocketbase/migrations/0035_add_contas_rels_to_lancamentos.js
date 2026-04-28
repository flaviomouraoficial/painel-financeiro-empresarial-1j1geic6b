migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')

    if (!col.fields.getByName('conta_pagar_id')) {
      col.fields.add(
        new RelationField({
          name: 'conta_pagar_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('contas_pagar').id,
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('conta_receber_id')) {
      col.fields.add(
        new RelationField({
          name: 'conta_receber_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('contas_receber').id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')
    col.fields.removeByName('conta_pagar_id')
    col.fields.removeByName('conta_receber_id')
    app.save(col)
  },
)
