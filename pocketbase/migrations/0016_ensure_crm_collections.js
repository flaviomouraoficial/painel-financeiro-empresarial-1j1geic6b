migrate(
  (app) => {
    // Collection: leads
    let leads
    try {
      leads = app.findCollectionByNameOrId('leads')
    } catch (_) {}

    if (!leads) {
      leads = new Collection({
        name: 'leads',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
        viewRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
        createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || consultor_id = @request.auth.id || @request.auth.perfil = 'admin')",
        deleteRule: "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id",
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
          { name: 'nome_lead', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'telefone', type: 'text' },
          { name: 'empresa_lead', type: 'text' },
          { name: 'cargo', type: 'text' },
          {
            name: 'servico_produto_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('produtos_servicos').id,
            maxSelect: 1,
          },
          {
            name: 'cliente_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('clientes').id,
            maxSelect: 1,
          },
          { name: 'consultor_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
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
          {
            name: 'temperatura',
            type: 'select',
            values: ['quente', 'morna', 'fria'],
            maxSelect: 1,
          },
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
    } else {
      leads.deleteRule = "@request.auth.perfil = 'admin' && empresa_id = @request.auth.empresa_id"
      app.save(leads)
    }

    // Collection: interacoes_leads
    let interacoes
    try {
      interacoes = app.findCollectionByNameOrId('interacoes_leads')
    } catch (_) {}

    if (!interacoes) {
      interacoes = new Collection({
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
            collectionId: app.findCollectionByNameOrId('leads').id,
            cascadeDelete: true,
            maxSelect: 1,
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
          {
            name: 'usuario_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
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
    }

    // Collection: documentos_leads
    let documentos
    try {
      documentos = app.findCollectionByNameOrId('documentos_leads')
    } catch (_) {}

    if (!documentos) {
      documentos = new Collection({
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
            collectionId: app.findCollectionByNameOrId('leads').id,
            cascadeDelete: true,
            maxSelect: 1,
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
          {
            name: 'usuario_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_documentos_lead ON documentos_leads (lead_id)',
          'CREATE INDEX idx_documentos_tipo ON documentos_leads (tipo_documento)',
        ],
      })
      app.save(documentos)
    }

    // Collection: etapas_funil
    let etapas
    try {
      etapas = app.findCollectionByNameOrId('etapas_funil')
    } catch (_) {}

    if (!etapas) {
      etapas = new Collection({
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
            collectionId: app.findCollectionByNameOrId('empresas').id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'nome_etapa', type: 'text', required: true },
          { name: 'ordem', type: 'number', required: true, min: 1, max: 8 },
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
    }
  },
  (app) => {
    // Safe down migration: just revert the rule changes if the collection existed before this patch
    try {
      const leads = app.findCollectionByNameOrId('leads')
      leads.deleteRule =
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.perfil = 'admin')"
      app.save(leads)
    } catch (_) {}
  },
)
