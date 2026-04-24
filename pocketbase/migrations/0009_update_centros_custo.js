migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('centros_custo')

    if (!col.fields.getByName('codigo')) {
      col.fields.add(new TextField({ name: 'codigo', max: 10 }))
    }
    if (!col.fields.getByName('departamento')) {
      col.fields.add(
        new SelectField({
          name: 'departamento',
          values: [
            'Vendas',
            'Marketing',
            'Operações',
            'Financeiro',
            'RH',
            'TI',
            'Administrativo',
            'Outros',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('responsavel_id')) {
      col.fields.add(
        new RelationField({
          name: 'responsavel_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('orcamento_anual')) {
      col.fields.add(new NumberField({ name: 'orcamento_anual', min: 0 }))
    }
    if (!col.fields.getByName('email_contato')) {
      col.fields.add(new EmailField({ name: 'email_contato' }))
    }
    if (!col.fields.getByName('telefone')) {
      col.fields.add(new TextField({ name: 'telefone' }))
    }

    app.save(col)

    col.addIndex('idx_centros_codigo_unique', true, 'codigo, empresa_id', "codigo != ''")
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('centros_custo')
    col.removeIndex('idx_centros_codigo_unique')
    col.fields.removeByName('codigo')
    col.fields.removeByName('departamento')
    col.fields.removeByName('responsavel_id')
    col.fields.removeByName('orcamento_anual')
    col.fields.removeByName('email_contato')
    col.fields.removeByName('telefone')
    app.save(col)
  },
)
