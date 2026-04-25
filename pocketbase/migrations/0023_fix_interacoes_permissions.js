migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('interacoes_leads')
    collection.listRule = "@request.auth.id != ''"
    collection.viewRule = "@request.auth.id != ''"
    collection.createRule = "@request.auth.id != ''"
    collection.updateRule = "@request.auth.id != ''"
    collection.deleteRule = "@request.auth.id != ''"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('interacoes_leads')
    app.save(collection)
  },
)
