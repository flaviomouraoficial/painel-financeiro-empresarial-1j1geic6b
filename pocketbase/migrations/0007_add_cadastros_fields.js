migrate(
  (app) => {
    const ufValues = [
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ]

    // Clientes
    const clientes = app.findCollectionByNameOrId('clientes')
    if (!clientes.fields.getByName('cidade')) clientes.fields.add(new TextField({ name: 'cidade' }))
    if (!clientes.fields.getByName('estado'))
      clientes.fields.add(new SelectField({ name: 'estado', values: ufValues }))
    if (!clientes.fields.getByName('cep')) clientes.fields.add(new TextField({ name: 'cep' }))
    if (!clientes.fields.getByName('observacoes'))
      clientes.fields.add(new TextField({ name: 'observacoes' }))
    app.save(clientes)

    // Fornecedores
    const fornecedores = app.findCollectionByNameOrId('fornecedores')
    if (!fornecedores.fields.getByName('cidade'))
      fornecedores.fields.add(new TextField({ name: 'cidade' }))
    if (!fornecedores.fields.getByName('estado'))
      fornecedores.fields.add(new SelectField({ name: 'estado', values: ufValues }))
    if (!fornecedores.fields.getByName('cep'))
      fornecedores.fields.add(new TextField({ name: 'cep' }))
    if (!fornecedores.fields.getByName('banco'))
      fornecedores.fields.add(new TextField({ name: 'banco' }))
    if (!fornecedores.fields.getByName('agencia'))
      fornecedores.fields.add(new TextField({ name: 'agencia' }))
    if (!fornecedores.fields.getByName('conta'))
      fornecedores.fields.add(new TextField({ name: 'conta' }))
    if (!fornecedores.fields.getByName('tipo_conta'))
      fornecedores.fields.add(
        new SelectField({ name: 'tipo_conta', values: ['corrente', 'poupanca'] }),
      )
    if (!fornecedores.fields.getByName('observacoes'))
      fornecedores.fields.add(new TextField({ name: 'observacoes' }))
    app.save(fornecedores)

    // Produtos e Serviços
    const produtos = app.findCollectionByNameOrId('produtos_servicos')
    if (!produtos.fields.getByName('sku')) produtos.fields.add(new TextField({ name: 'sku' }))
    if (!produtos.fields.getByName('estoque'))
      produtos.fields.add(new NumberField({ name: 'estoque' }))
    if (!produtos.fields.getByName('unidade_medida'))
      produtos.fields.add(new TextField({ name: 'unidade_medida' }))
    if (!produtos.fields.getByName('fornecedor_id'))
      produtos.fields.add(
        new RelationField({ name: 'fornecedor_id', collectionId: fornecedores.id, maxSelect: 1 }),
      )
    app.save(produtos)

    // Contas Bancárias
    const contas = app.findCollectionByNameOrId('contas_bancarias')
    if (!contas.fields.getByName('titular')) contas.fields.add(new TextField({ name: 'titular' }))
    if (!contas.fields.getByName('cpf_cnpj_titular'))
      contas.fields.add(new TextField({ name: 'cpf_cnpj_titular' }))
    if (!contas.fields.getByName('data_abertura'))
      contas.fields.add(new DateField({ name: 'data_abertura' }))
    if (!contas.fields.getByName('limite_credito'))
      contas.fields.add(new NumberField({ name: 'limite_credito' }))
    if (!contas.fields.getByName('observacoes'))
      contas.fields.add(new TextField({ name: 'observacoes' }))
    if (!contas.fields.getByName('usuario_id'))
      contas.fields.add(
        new RelationField({ name: 'usuario_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    app.save(contas)

    // Cartões de Crédito
    const cartoes = app.findCollectionByNameOrId('cartoes_credito')
    if (!cartoes.fields.getByName('titular')) cartoes.fields.add(new TextField({ name: 'titular' }))
    if (!cartoes.fields.getByName('numero_completo'))
      cartoes.fields.add(new TextField({ name: 'numero_completo', hidden: true }))
    if (!cartoes.fields.getByName('cvv'))
      cartoes.fields.add(new TextField({ name: 'cvv', hidden: true }))
    if (!cartoes.fields.getByName('data_validade'))
      cartoes.fields.add(new TextField({ name: 'data_validade' }))
    if (!cartoes.fields.getByName('conta_bancaria_id'))
      cartoes.fields.add(
        new RelationField({ name: 'conta_bancaria_id', collectionId: contas.id, maxSelect: 1 }),
      )
    if (!cartoes.fields.getByName('observacoes'))
      cartoes.fields.add(new TextField({ name: 'observacoes' }))
    if (!cartoes.fields.getByName('usuario_id'))
      cartoes.fields.add(
        new RelationField({ name: 'usuario_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    app.save(cartoes)
  },
  (app) => {},
)
