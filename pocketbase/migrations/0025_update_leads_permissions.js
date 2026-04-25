migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    leads.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.createRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.updateRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.deleteRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    app.save(leads)
  },
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    leads.listRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')"
    leads.viewRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')"
    leads.createRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    leads.updateRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')"
    leads.deleteRule = "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id"
    app.save(leads)
  },
)
