migrate(
  (app) => {
    const opCollections = [
      'clientes',
      'fornecedores',
      'produtos_servicos',
      'contas_bancarias',
      'cartoes_credito',
      'categorias',
      'projetos',
      'centros_custo',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
      'recebimentos',
      'pagamentos',
      'recibos',
      'itens_recibos',
      'leads',
      'interacoes_leads',
      'documentos_leads',
      'livros',
    ]

    opCollections.forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)

        const baseRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"

        let rule = baseRule
        if (name === 'interacoes_leads' || name === 'documentos_leads') {
          rule = "@request.auth.id != '' && lead_id.empresa_id = @request.auth.empresa_id"
        }

        col.listRule = rule
        col.viewRule = rule
        col.createRule = rule
        col.updateRule = rule
        col.deleteRule = rule + " && @request.auth.perfil != 'usuario'"

        app.save(col)
      } catch (err) {
        console.log('Failed to update ' + name)
      }
    })

    try {
      const col = app.findCollectionByNameOrId('users')
      col.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
      col.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
      col.createRule = "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id"
      col.updateRule =
        "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'gerente' || id = @request.auth.id)"
      col.deleteRule =
        "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && @request.auth.perfil = 'admin'"
      app.save(col)
    } catch (err) {
      console.log('Failed to update users')
    }
  },
  (app) => {
    // Up-only migration for permission enforcement
  },
)
