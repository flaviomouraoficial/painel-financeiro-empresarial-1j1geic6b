migrate(
  (app) => {
    const adminRule = "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id"
    const baseRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    const managerRule = "@request.auth.perfil != 'usuario' && empresa_id = @request.auth.empresa_id"
    const userOwnedRule =
      "(@request.auth.perfil != 'usuario' || usuario_id = @request.auth.id) && empresa_id = @request.auth.empresa_id"

    const empresas = new Collection({
      name: 'empresas',
      type: 'base',
      listRule: "@request.auth.id != '' && id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && id = @request.auth.empresa_id",
      createRule: null,
      updateRule: "@request.auth.perfil = 'admin' && id = @request.auth.empresa_id",
      deleteRule: null,
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'nome_fantasia', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'logo_url', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(empresas)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('perfil')) {
      users.fields.add(
        new SelectField({ name: 'perfil', values: ['admin', 'gerente', 'usuario'], maxSelect: 1 }),
      )
      users.fields.add(
        new RelationField({ name: 'empresa_id', collectionId: empresas.id, maxSelect: 1 }),
      )
      users.fields.add(new BoolField({ name: 'ativo' }))
    }

    users.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin')"
    users.deleteRule = "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id"
    app.save(users)

    const getBaseFields = () => [
      {
        name: 'empresa_id',
        type: 'relation',
        required: true,
        collectionId: empresas.id,
        maxSelect: 1,
      },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    const colClientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['pf', 'pj'], maxSelect: 1 },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'endereco', type: 'text' },
      ],
    })
    app.save(colClientes)

    const colFornecedores = new Collection({
      name: 'fornecedores',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['pf', 'pj'], maxSelect: 1 },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'endereco', type: 'text' },
      ],
    })
    app.save(colFornecedores)

    const colProdutos = new Collection({
      name: 'produtos_servicos',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'tipo', type: 'select', values: ['produto', 'servico'], maxSelect: 1 },
        { name: 'preco_unitario', type: 'number' },
        { name: 'categoria', type: 'text' },
        { name: 'margem_lucro', type: 'number' },
        { name: 'ativo', type: 'bool' },
      ],
    })
    app.save(colProdutos)

    const colContasBancarias = new Collection({
      name: 'contas_bancarias',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'banco', type: 'text', required: true },
        { name: 'agencia', type: 'text' },
        { name: 'numero_conta', type: 'text' },
        { name: 'tipo', type: 'select', values: ['corrente', 'poupanca'], maxSelect: 1 },
        { name: 'saldo_inicial', type: 'number' },
        { name: 'saldo_atual', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'saldo_inicial_definido', type: 'bool' },
      ],
    })
    app.save(colContasBancarias)

    const colCartoes = new Collection({
      name: 'cartoes_credito',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'banco', type: 'text', required: true },
        { name: 'numero_ultimos_digitos', type: 'text' },
        { name: 'limite', type: 'number' },
        { name: 'vencimento', type: 'date' },
        { name: 'bandeira', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ],
    })
    app.save(colCartoes)

    const colCategorias = new Collection({
      name: 'categorias',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ],
    })
    app.save(colCategorias)

    const colProjetos = new Collection({
      name: 'projetos',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'cliente_id', type: 'relation', collectionId: colClientes.id, maxSelect: 1 },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'orcamento', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['planejamento', 'em_andamento', 'concluido', 'cancelado'],
          maxSelect: 1,
        },
      ],
    })
    app.save(colProjetos)

    const colCentrosCusto = new Collection({
      name: 'centros_custo',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ],
    })
    app.save(colCentrosCusto)

    const colLancamentos = new Collection({
      name: 'lancamentos',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: userOwnedRule,
      updateRule: userOwnedRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'usuario_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
        { name: 'categoria_id', type: 'relation', collectionId: colCategorias.id, maxSelect: 1 },
        { name: 'cliente_id', type: 'relation', collectionId: colClientes.id, maxSelect: 1 },
        { name: 'fornecedor_id', type: 'relation', collectionId: colFornecedores.id, maxSelect: 1 },
        { name: 'projeto_id', type: 'relation', collectionId: colProjetos.id, maxSelect: 1 },
        {
          name: 'centro_custo_id',
          type: 'relation',
          collectionId: colCentrosCusto.id,
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_lancamento', type: 'date' },
        { name: 'data_competencia', type: 'date' },
        {
          name: 'conta_bancaria_id',
          type: 'relation',
          collectionId: colContasBancarias.id,
          maxSelect: 1,
        },
        { name: 'cartao_credito_id', type: 'relation', collectionId: colCartoes.id, maxSelect: 1 },
        { name: 'forma_pagamento', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'confirmado', 'cancelado'],
          maxSelect: 1,
        },
      ],
    })
    app.save(colLancamentos)

    const colContasReceber = new Collection({
      name: 'contas_receber',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'cliente_id', type: 'relation', collectionId: colClientes.id, maxSelect: 1 },
        { name: 'projeto_id', type: 'relation', collectionId: colProjetos.id, maxSelect: 1 },
        { name: 'numero_nf', type: 'text' },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'data_emissao', type: 'date' },
        { name: 'data_vencimento', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['aberta', 'parcial', 'recebida', 'vencida'],
          maxSelect: 1,
        },
      ],
    })
    app.save(colContasReceber)

    const colContasPagar = new Collection({
      name: 'contas_pagar',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'fornecedor_id', type: 'relation', collectionId: colFornecedores.id, maxSelect: 1 },
        { name: 'projeto_id', type: 'relation', collectionId: colProjetos.id, maxSelect: 1 },
        { name: 'numero_nf', type: 'text' },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'data_emissao', type: 'date' },
        { name: 'data_vencimento', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['aberta', 'parcial', 'paga', 'vencida'],
          maxSelect: 1,
        },
      ],
    })
    app.save(colContasPagar)

    const colRecebimentos = new Collection({
      name: 'recebimentos',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        {
          name: 'conta_receber_id',
          type: 'relation',
          collectionId: colContasReceber.id,
          maxSelect: 1,
        },
        { name: 'valor_recebido', type: 'number', required: true },
        { name: 'data_recebimento', type: 'date' },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'desconto', type: 'number' },
        { name: 'juros', type: 'number' },
      ],
    })
    app.save(colRecebimentos)

    const colPagamentos = new Collection({
      name: 'pagamentos',
      type: 'base',
      listRule: baseRule,
      viewRule: baseRule,
      createRule: managerRule,
      updateRule: managerRule,
      deleteRule: adminRule,
      fields: [
        ...getBaseFields(),
        { name: 'conta_pagar_id', type: 'relation', collectionId: colContasPagar.id, maxSelect: 1 },
        { name: 'valor_pago', type: 'number', required: true },
        { name: 'data_pagamento', type: 'date' },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'desconto', type: 'number' },
        { name: 'juros', type: 'number' },
      ],
    })
    app.save(colPagamentos)
  },
  (app) => {
    const collections = [
      'pagamentos',
      'recebimentos',
      'contas_pagar',
      'contas_receber',
      'lancamentos',
      'centros_custo',
      'projetos',
      'categorias',
      'cartoes_credito',
      'contas_bancarias',
      'produtos_servicos',
      'fornecedores',
      'clientes',
      'empresas',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('perfil')
      users.fields.removeByName('empresa_id')
      users.fields.removeByName('ativo')
      app.save(users)
    } catch (_) {}
  },
)
