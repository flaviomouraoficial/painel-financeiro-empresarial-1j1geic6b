migrate(
  (app) => {
    const etapas = [
      { nome: 'prospecção', ordem: 1 },
      { nome: 'contato', ordem: 2 },
      { nome: 'briefing', ordem: 3 },
      { nome: 'proposta', ordem: 4 },
      { nome: 'apresentação', ordem: 5 },
      { nome: 'análise', ordem: 6 },
      { nome: 'fechou', ordem: 7 },
      { nome: 'não fechou', ordem: 8 },
    ]
    const col = app.findCollectionByNameOrId('etapas_funil')

    const empresas = app.findRecordsByFilter('empresas', '1=1', '', 100, 0)
    empresas.forEach((empresa) => {
      etapas.forEach((e) => {
        try {
          app.findFirstRecordByFilter(
            'etapas_funil',
            `empresa_id='${empresa.id}' && nome_etapa='${e.nome}'`,
          )
        } catch (_) {
          const record = new Record(col)
          record.set('empresa_id', empresa.id)
          record.set('nome_etapa', e.nome)
          record.set('ordem', e.ordem)
          app.save(record)
        }
      })
    })
  },
  (app) => {
    // empty down
  },
)
