migrate(
  (app) => {
    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && usuario_id = @request.auth.id && empresa_id = @request.auth.empresa_id",
      viewRule:
        "@request.auth.id != '' && usuario_id = @request.auth.id && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule:
        "@request.auth.id != '' && usuario_id = @request.auth.id && empresa_id = @request.auth.empresa_id",
      deleteRule:
        "@request.auth.id != '' && usuario_id = @request.auth.id && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('empresas').id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'alerta_financeiro',
            'alerta_fluxo_caixa',
            'recebimento',
            'pagamento',
            'lancamento',
          ],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'icone', type: 'text' },
        { name: 'cor', type: 'text' },
        { name: 'link', type: 'text' },
        { name: 'lida', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notificacoes')
    app.delete(collection)
  },
)
