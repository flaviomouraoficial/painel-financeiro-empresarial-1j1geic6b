migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.createRule =
      "@request.auth.perfil = 'admin' || @request.auth.email = 'admin@trendconsultoria.com.br' || @request.auth.email = 'flavio@trendconsultoria.com.br'"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || (@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id) || @request.auth.email = 'admin@trendconsultoria.com.br' || @request.auth.email = 'flavio@trendconsultoria.com.br')"
    users.deleteRule =
      "@request.auth.id != '' && ((@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id) || @request.auth.email = 'admin@trendconsultoria.com.br' || @request.auth.email = 'flavio@trendconsultoria.com.br')"
    app.save(users)

    const leads = app.findCollectionByNameOrId('leads')
    leads.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.createRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.updateRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    leads.deleteRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    app.save(leads)

    const interacoes = app.findCollectionByNameOrId('interacoes_leads')
    interacoes.listRule = "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
    interacoes.viewRule = "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
    interacoes.createRule =
      "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
    interacoes.updateRule =
      "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
    interacoes.deleteRule =
      "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
    app.save(interacoes)

    const lancamentos = app.findCollectionByNameOrId('lancamentos')
    lancamentos.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    lancamentos.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    app.save(lancamentos)

    const contasReceber = app.findCollectionByNameOrId('contas_receber')
    contasReceber.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    contasReceber.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    app.save(contasReceber)

    const contasPagar = app.findCollectionByNameOrId('contas_pagar')
    contasPagar.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    contasPagar.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    app.save(contasPagar)

    try {
      app.findAuthRecordByEmail('users', 'admin@trendconsultoria.com.br')
    } catch (_) {
      let empresa
      try {
        const empresas = app.findRecordsByFilter('empresas', '1=1', '', 1, 0)
        if (empresas.length > 0) empresa = empresas[0]
      } catch (_) {}

      if (empresa) {
        const record = new Record(users)
        record.setEmail('admin@trendconsultoria.com.br')
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', 'Administrador Principal')
        record.set('perfil', 'admin')
        record.set('empresa_id', empresa.id)
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert not required
  },
)
