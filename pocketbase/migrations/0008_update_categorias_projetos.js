migrate((app) => {
  // Update categorias
  const categorias = app.findCollectionByNameOrId('categorias')
  if (!categorias.fields.getByName('cor')) {
    categorias.fields.add(new TextField({ name: 'cor' }))
  }
  if (!categorias.fields.getByName('icone')) {
    categorias.fields.add(
      new SelectField({
        name: 'icone',
        values: [
          'moeda',
          'salário',
          'venda',
          'aluguel',
          'energia',
          'água',
          'internet',
          'transporte',
          'alimentação',
          'saúde',
          'educação',
          'lazer',
          'outros',
        ],
        maxSelect: 1,
      }),
    )
  }
  app.save(categorias)

  // Update projetos
  const projetos = app.findCollectionByNameOrId('projetos')
  if (!projetos.fields.getByName('responsavel_id')) {
    projetos.fields.add(
      new RelationField({ name: 'responsavel_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
  }
  if (!projetos.fields.getByName('centro_custo_id')) {
    const centrosCusto = app.findCollectionByNameOrId('centros_custo')
    projetos.fields.add(
      new RelationField({ name: 'centro_custo_id', collectionId: centrosCusto.id, maxSelect: 1 }),
    )
  }
  if (!projetos.fields.getByName('ativo')) {
    projetos.fields.add(new BoolField({ name: 'ativo' }))
  }

  const statusField = projetos.fields.getByName('status')
  if (statusField) {
    statusField.values = ['planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado']
  }

  app.save(projetos)
})
