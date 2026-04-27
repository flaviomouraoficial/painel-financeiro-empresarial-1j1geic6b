migrate(
  (app) => {
    const collection = new Collection({
      name: 'livros',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule:
        "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && @request.auth.perfil != 'usuario'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('empresas').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'autor', type: 'text', required: true },
        { name: 'palavras_chave', type: 'json' },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_livros_empresa ON livros (empresa_id)',
        'CREATE INDEX idx_livros_usuario ON livros (usuario_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('livros')
      app.delete(collection)
    } catch (_) {}
  },
)
