migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('recebimentos')
    if (!col.fields.getByName('usuario_id')) {
      col.fields.add(
        new RelationField({
          name: 'usuario_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('recebimentos')
    col.fields.removeByName('usuario_id')
    app.save(col)
  },
)
