migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes_leads')
    col.createRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes_leads')
    col.createRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    app.save(col)
  },
)
