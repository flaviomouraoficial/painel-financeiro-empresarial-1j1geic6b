migrate(
  (app) => {
    const etapasCol = app.findCollectionByNameOrId('etapas_funil')

    let empresas = []
    try {
      empresas = app.findRecordsByFilter('empresas', '1=1', '', 100, 0)
    } catch (_) {
      return // No companies, nothing to seed
    }

    const stages = [
      { nome_etapa: 'Prospecção', ordem: 1 },
      { nome_etapa: 'Contato', ordem: 2 },
      { nome_etapa: 'Briefing', ordem: 3 },
      { nome_etapa: 'Proposta', ordem: 4 },
      { nome_etapa: 'Apresentação', ordem: 5 },
      { nome_etapa: 'Análise', ordem: 6 },
      { nome_etapa: 'Fechou', ordem: 7 },
      { nome_etapa: 'Não Fechou', ordem: 8 },
    ]

    for (const empresa of empresas) {
      let existingNames = []
      try {
        const existing = app.findRecordsByFilter(
          'etapas_funil',
          "empresa_id = '" + empresa.id + "'",
          '',
          100,
          0,
        )
        existingNames = existing.map((e) => e.getString('nome_etapa'))
      } catch (_) {}

      for (const stage of stages) {
        if (existingNames.includes(stage.nome_etapa)) {
          continue
        }

        try {
          const record = new Record(etapasCol)
          record.set('empresa_id', empresa.id)
          record.set('nome_etapa', stage.nome_etapa)
          record.set('ordem', stage.ordem)
          app.save(record)
        } catch (err) {
          console.log(
            'Failed to seed stage ' + stage.nome_etapa + ' for empresa ' + empresa.id,
            err,
          )
        }
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('etapas_funil', '1=1', '', 1000, 0)
      const stages = [
        'Prospecção',
        'Contato',
        'Briefing',
        'Proposta',
        'Apresentação',
        'Análise',
        'Fechou',
        'Não Fechou',
      ]
      for (const record of records) {
        if (stages.includes(record.getString('nome_etapa'))) {
          app.delete(record)
        }
      }
    } catch (_) {}
  },
)
