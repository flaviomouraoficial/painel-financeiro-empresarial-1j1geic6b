migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('produtos_servicos')
    const field = collection.fields.getByName('preco_unitario')
    if (field) {
      field.required = false
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('produtos_servicos')
    const field = collection.fields.getByName('preco_unitario')
    if (field) {
      field.required = true
      app.save(collection)
    }
  },
)
