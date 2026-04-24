migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const clientes = app.findCollectionByNameOrId('clientes')
    const contas = app.findCollectionByNameOrId('contas_bancarias')
    const cartoes = app.findCollectionByNameOrId('cartoes_credito')

    const recibos = new Collection({
      name: 'recibos',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id",
      fields: [
        { name: 'numero_recibo', type: 'text', required: true },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: clientes.id,
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'data_criacao', type: 'date', required: true },
        { name: 'data_nf', type: 'date', required: true },
        { name: 'numero_nf', type: 'text', required: true },
        { name: 'descricao_nf', type: 'text' },
        { name: 'valor_nf', type: 'number', required: true },
        { name: 'arquivo_nf', type: 'file', maxSelect: 1, maxSize: 5242880 },
        {
          name: 'conta_bancaria_id',
          type: 'relation',
          required: true,
          collectionId: contas.id,
          maxSelect: 1,
        },
        { name: 'cartao_credito_id', type: 'relation', collectionId: cartoes.id, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'aprovado', 'reembolsado'],
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_recibos_numero ON recibos (numero_recibo, empresa_id)'],
    })
    app.save(recibos)

    const itens = new Collection({
      name: 'itens_recibos',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'recibo_id',
          type: 'relation',
          required: true,
          collectionId: recibos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'valor_unitario', type: 'number', required: true },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(itens)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('itens_recibos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('recibos'))
    } catch (_) {}
  },
)
