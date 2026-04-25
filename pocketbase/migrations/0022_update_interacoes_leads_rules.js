migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes_leads')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('interacoes_leads')
    col.listRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    col.viewRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    col.createRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    col.updateRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    col.deleteRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
    app.save(col)
  },
)
