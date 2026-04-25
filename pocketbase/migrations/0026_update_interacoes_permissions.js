migrate(
  (app) => {
    const interacoes = app.findCollectionByNameOrId('interacoes_leads')
    interacoes.listRule = "@request.auth.id != ''"
    interacoes.viewRule = "@request.auth.id != ''"
    interacoes.createRule = "@request.auth.id != ''"
    interacoes.updateRule = "@request.auth.id != ''"
    interacoes.deleteRule = "@request.auth.id != ''"
    app.save(interacoes)
  },
  (app) => {
    const interacoes = app.findCollectionByNameOrId('interacoes_leads')
    interacoes.listRule = "@request.auth.id != ''"
    interacoes.viewRule = "@request.auth.id != ''"
    interacoes.createRule = "@request.auth.id != ''"
    interacoes.updateRule = "@request.auth.id != ''"
    interacoes.deleteRule = "@request.auth.id != ''"
    app.save(interacoes)
  },
)
