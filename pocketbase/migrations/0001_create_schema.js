migrate(
  (app) => {
    const adminRule = "@request.auth.profile = 'admin' && empresa_id = @request.auth.empresa_id"
    const baseRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    const managerRule =
      "@request.auth.profile != 'usuario' && empresa_id = @request.auth.empresa_id"
    const userOwnedRule =
      "(@request.auth.profile != 'usuario' || usuario_id = @request.auth.id) && empresa_id = @request.auth.empresa_id"

    const empresas = new Collection({
      name: 'empresas',
      type: 'base',
      listRule: "@request.auth.id != '' && id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && id = @request.auth.empresa_id",
      createRule: null,
      updateRule: "@request.auth.profile = 'admin' && id = @request.auth.empresa_id",
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
    users.fields.add(
      new SelectField({ name: 'profile', values: ['admin', 'gerente', 'usuario'], maxSelect: 1 }),
    )
    users.fields.add(
      new RelationField({ name: 'empresa_id', collectionId: empresas.id, maxSelect: 1 }),
    )
    users.fields.add(new BoolField({ name: 'ativo' }))

    users.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.profile = 'admin')"
    users.deleteRule = "@request.auth.profile = 'admin' && empresa_id = @request.auth.empresa_id"
    app.save(users)

    const createBaseCollection = (name, fields, hasOwner = false) => {
      return new Collection({
        name,
        type: 'base',
        listRule: baseRule,
        viewRule: baseRule,
        createRule: hasOwner ? userOwnedRule : managerRule,
        updateRule: hasOwner ? userOwnedRule : managerRule,
        deleteRule: adminRule,
        fields: [
          {
            name: 'empresa_id',
            type: 'relation',
            required: true,
            collectionId: empresas.id,
            maxSelect: 1,
          },
          ...fields,
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
    }

    app.save(
      createBaseCollection('clientes', [
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['pf', 'pj'], maxSelect: 1 },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'endereco', type: 'text' },
      ]),
    )

    app.save(
      createBaseCollection('fornecedores', [
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['pf', 'pj'], maxSelect: 1 },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'endereco', type: 'text' },
      ]),
    )

    app.save(
      createBaseCollection('produtos_servicos', [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'tipo', type: 'select', values: ['produto', 'servico'], maxSelect: 1 },
        { name: 'preco_unitario', type: 'number' },
        { name: 'categoria', type: 'text' },
        { name: 'margem_lucro', type: 'number' },
        { name: 'ativo', type: 'bool' },
      ]),
    )

    app.save(
      createBaseCollection('contas_bancarias', [
        { name: 'banco', type: 'text', required: true },
        { name: 'agencia', type: 'text' },
        { name: 'numero_conta', type: 'text' },
        { name: 'tipo', type: 'select', values: ['corrente', 'poupanca'], maxSelect: 1 },
        { name: 'saldo_inicial', type: 'number' },
        { name: 'saldo_atual', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'saldo_inicial_definido', type: 'bool' },
      ]),
    )

    app.save(
      createBaseCollection('cartoes_credito', [
        { name: 'banco', type: 'text', required: true },
        { name: 'numero_ultimos_digitos', type: 'text' },
        { name: 'limite', type: 'number' },
        { name: 'vencimento', type: 'date' },
        { name: 'bandeira', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ]),
    )

    app.save(
      createBaseCollection('categorias', [
        { name: 'nome', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ]),
    )

    app.save(
      createBaseCollection('projetos', [
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        },
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
      ]),
    )

    app.save(
      createBaseCollection('centros_custo', [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
      ]),
    )

    app.save(
      createBaseCollection(
        'lancamentos',
        [
          { name: 'usuario_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
          { name: 'tipo', type: 'select', values: ['receita', 'despesa'], maxSelect: 1 },
          {
            name: 'categoria_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('categorias').id,
            maxSelect: 1,
          },
          {
            name: 'cliente_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('clientes').id,
            maxSelect: 1,
          },
          {
            name: 'fornecedor_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('fornecedores').id,
            maxSelect: 1,
          },
          {
            name: 'projeto_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('projetos').id,
            maxSelect: 1,
          },
          {
            name: 'centro_custo_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('centros_custo').id,
            maxSelect: 1,
          },
          { name: 'descricao', type: 'text' },
          { name: 'valor', type: 'number', required: true },
          { name: 'data_lancamento', type: 'date' },
          { name: 'data_competencia', type: 'date' },
          {
            name: 'conta_bancaria_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('contas_bancarias').id,
            maxSelect: 1,
          },
          {
            name: 'cartao_credito_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('cartoes_credito').id,
            maxSelect: 1,
          },
          { name: 'forma_pagamento', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'confirmado', 'cancelado'],
            maxSelect: 1,
          },
        ],
        true,
      ),
    )

    app.save(
      createBaseCollection('contas_receber', [
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        },
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projetos').id,
          maxSelect: 1,
        },
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
      ]),
    )

    app.save(
      createBaseCollection('contas_pagar', [
        {
          name: 'fornecedor_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('fornecedores').id,
          maxSelect: 1,
        },
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projetos').id,
          maxSelect: 1,
        },
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
      ]),
    )

    app.save(
      createBaseCollection('recebimentos', [
        {
          name: 'conta_receber_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('contas_receber').id,
          maxSelect: 1,
        },
        { name: 'valor_recebido', type: 'number', required: true },
        { name: 'data_recebimento', type: 'date' },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'desconto', type: 'number' },
        { name: 'juros', type: 'number' },
      ]),
    )

    app.save(
      createBaseCollection('pagamentos', [
        {
          name: 'conta_pagar_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('contas_pagar').id,
          maxSelect: 1,
        },
        { name: 'valor_pago', type: 'number', required: true },
        { name: 'data_pagamento', type: 'date' },
        { name: 'forma_pagamento', type: 'text' },
        { name: 'desconto', type: 'number' },
        { name: 'juros', type: 'number' },
      ]),
    )
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
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('profile')
    users.fields.removeByName('empresa_id')
    users.fields.removeByName('ativo')
    app.save(users)
  },
)
