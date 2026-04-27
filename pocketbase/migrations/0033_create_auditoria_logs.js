migrate(
  (app) => {
    const collection = new Collection({
      name: 'auditoria_logs',
      type: 'base',
      listRule:
        "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'gerente')",
      viewRule:
        "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'gerente')",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'empresa_id', type: 'text', required: true },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'acao', type: 'select', required: true, values: ['create', 'update', 'delete'] },
        { name: 'tabela', type: 'text', required: true },
        { name: 'registro_id', type: 'text', required: true },
        { name: 'detalhes', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_auditoria_empresa ON auditoria_logs (empresa_id)',
        'CREATE INDEX idx_auditoria_tabela ON auditoria_logs (tabela)',
        'CREATE INDEX idx_auditoria_created ON auditoria_logs (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('auditoria_logs')
    app.delete(collection)
  },
)
