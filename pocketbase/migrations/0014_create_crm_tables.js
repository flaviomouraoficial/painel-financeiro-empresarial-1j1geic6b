migrate(
  (app) => {
    const empresasId = app.findCollectionByNameOrId('empresas').id
    const usersId = '_pb_users_auth_'
    const produtosServicosId = app.findCollectionByNameOrId('produtos_servicos').id
    const clientesId = app.findCollectionByNameOrId('clientes').id

    // 1. Leads
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
      viewRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
      deleteRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
        },
        { name: 'nome_lead', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'empresa_lead', type: 'text' },
        { name: 'cargo', type: 'text' },
        {
          name: 'servico_produto_id',
          type: 'relation',
          collectionId: produtosServicosId,
          maxSelect: 1,
        },
        { name: 'cliente_id', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        { name: 'consultor_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'valor_estimado', type: 'number' },
        {
          name: 'etapa',
          type: 'select',
          values: [
            'prospecção',
            'contato',
            'briefing',
            'proposta',
            'apresentação',
            'análise',
            'fechou',
            'não fechou',
          ],
          maxSelect: 1,
        },
        { name: 'probabilidade_fechamento', type: 'number', min: 0, max: 100 },
        { name: 'temperatura', type: 'select', values: ['quente', 'morna', 'fria'], maxSelect: 1 },
        { name: 'data_ultimo_contato', type: 'date' },
        { name: 'observacoes', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_empresa ON leads (empresa_id)',
        'CREATE INDEX idx_leads_usuario ON leads (usuario_id)',
        'CREATE INDEX idx_leads_consultor ON leads (consultor_id)',
        'CREATE INDEX idx_leads_etapa ON leads (etapa)',
        'CREATE INDEX idx_leads_temperatura ON leads (temperatura)',
        'CREATE INDEX idx_leads_created ON leads (created)',
        "CREATE UNIQUE INDEX idx_leads_email_unique ON leads (email) WHERE email != ''",
      ],
    })
    app.save(leads)

    const leadsId = leads.id

    // 2. Interacoes Leads
    const interacoes = new Collection({
      name: 'interacoes_leads',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      viewRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      deleteRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      fields: [
        {
          name: 'lead_id',
          type: 'relation',
          required: true,
          collectionId: leadsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['ligacao', 'email', 'reuniao', 'whatsapp', 'documento'],
          maxSelect: 1,
        },
        { name: 'data_interacao', type: 'date', required: true },
        { name: 'duracao_minutos', type: 'number' },
        { name: 'resumo', type: 'text' },
        { name: 'usuario_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'arquivo_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_interacoes_lead ON interacoes_leads (lead_id)',
        'CREATE INDEX idx_interacoes_tipo ON interacoes_leads (tipo)',
        'CREATE INDEX idx_interacoes_data ON interacoes_leads (data_interacao)',
      ],
    })
    app.save(interacoes)

    // 3. Documentos Leads
    const documentos = new Collection({
      name: 'documentos_leads',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      viewRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      deleteRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')",
      fields: [
        {
          name: 'lead_id',
          type: 'relation',
          required: true,
          collectionId: leadsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'tipo_documento',
          type: 'select',
          required: true,
          values: ['proposta', 'contrato', 'briefing', 'apresentacao', 'outro'],
          maxSelect: 1,
        },
        { name: 'nome_arquivo', type: 'text', required: true },
        { name: 'url_arquivo', type: 'text', required: true },
        { name: 'data_upload', type: 'date' },
        { name: 'usuario_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_documentos_lead ON documentos_leads (lead_id)',
        'CREATE INDEX idx_documentos_tipo ON documentos_leads (tipo_documento)',
      ],
    })
    app.save(documentos)

    // 4. Etapas Funil
    const etapas = new Collection({
      name: 'etapas_funil',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.perfil = 'admin'",
      updateRule: "@request.auth.perfil = 'admin'",
      deleteRule: "@request.auth.perfil = 'admin'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresasId,
          maxSelect: 1,
        },
        { name: 'nome_etapa', type: 'text', required: true },
        { name: 'ordem', type: 'number', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_etapas_empresa ON etapas_funil (empresa_id)',
        'CREATE INDEX idx_etapas_ordem ON etapas_funil (ordem)',
      ],
    })
    app.save(etapas)
  },
  (app) => {
    const collections = ['etapas_funil', 'documentos_leads', 'interacoes_leads', 'leads']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
