migrate(
  (app) => {
    let empresaId = null
    try {
      // Attempt to find the default admin user's company
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'flavio@trendconsultoria.com.br',
      )
      empresaId = adminUser.get('empresa_id')
    } catch (_) {
      try {
        // Fallback to the first available company in the system
        const empresas = app.findRecordsByFilter('empresas', '1=1', '', 1, 0)
        if (empresas.length > 0) {
          empresaId = empresas[0].id
        }
      } catch (_) {}
    }

    if (!empresaId) return

    const etapas = [
      { nome: 'Prospecção', ordem: 1 },
      { nome: 'Contato', ordem: 2 },
      { nome: 'Briefing', ordem: 3 },
      { nome: 'Proposta', ordem: 4 },
      { nome: 'Apresentação', ordem: 5 },
      { nome: 'Análise', ordem: 6 },
      { nome: 'Fechou', ordem: 7 },
      { nome: 'Não Fechou', ordem: 8 },
    ]

    const col = app.findCollectionByNameOrId('etapas_funil')

    for (const etapa of etapas) {
      const records = app.findRecordsByFilter(
        'etapas_funil',
        `empresa_id = '${empresaId}' && nome_etapa = '${etapa.nome}'`,
        '',
        1,
        0,
      )
      if (records.length === 0) {
        const record = new Record(col)
        record.set('empresa_id', empresaId)
        record.set('nome_etapa', etapa.nome)
        record.set('ordem', etapa.ordem)
        app.save(record)
      }
    }
  },
  (app) => {
    let empresaId = null
    try {
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'flavio@trendconsultoria.com.br',
      )
      empresaId = adminUser.get('empresa_id')
    } catch (_) {
      try {
        const empresas = app.findRecordsByFilter('empresas', '1=1', '', 1, 0)
        if (empresas.length > 0) {
          empresaId = empresas[0].id
        }
      } catch (_) {}
    }

    if (!empresaId) return

    try {
      const records = app.findRecordsByFilter(
        'etapas_funil',
        `empresa_id = '${empresaId}'`,
        '',
        100,
        0,
      )
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
)
