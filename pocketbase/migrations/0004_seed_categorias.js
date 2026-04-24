migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('categorias')
    const empresas = app.findRecordsByFilter('empresas', '1=1', '', 100, 0)

    const cats = [
      { nome: 'Salário', tipo: 'despesa' },
      { nome: 'Vendas', tipo: 'receita' },
      { nome: 'Serviços', tipo: 'receita' },
      { nome: 'Aluguel', tipo: 'despesa' },
      { nome: 'Fornecedores', tipo: 'despesa' },
      { nome: 'Impostos', tipo: 'despesa' },
      { nome: 'Energia', tipo: 'despesa' },
      { nome: 'Água', tipo: 'despesa' },
      { nome: 'Internet', tipo: 'despesa' },
      { nome: 'Outros', tipo: '' },
    ]

    for (const emp of empresas) {
      for (const c of cats) {
        try {
          app.findFirstRecordByFilter(
            'categorias',
            `empresa_id = '${emp.id}' && nome = '${c.nome}'`,
          )
        } catch (_) {
          const record = new Record(col)
          record.set('empresa_id', emp.id)
          record.set('nome', c.nome)
          if (c.tipo) record.set('tipo', c.tipo)
          record.set('ativo', true)
          app.save(record)
        }
      }
    }
  },
  (app) => {
    // down
  },
)
