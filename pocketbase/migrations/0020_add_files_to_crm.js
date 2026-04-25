migrate(
  (app) => {
    // Documentos Leads - add explicit file handling
    const docs = app.findCollectionByNameOrId('documentos_leads')
    docs.fields.add(
      new FileField({
        name: 'arquivo',
        maxSelect: 1,
        maxSize: 10485760, // 10MB
      }),
    )
    const urlField = docs.fields.getByName('url_arquivo')
    if (urlField) {
      urlField.required = false
    }
    app.save(docs)

    // Interacoes Leads - allow attachments on interaction timelines
    const ints = app.findCollectionByNameOrId('interacoes_leads')
    ints.fields.add(
      new FileField({
        name: 'arquivo',
        maxSelect: 1,
        maxSize: 10485760, // 10MB
      }),
    )
    app.save(ints)
  },
  (app) => {
    const docs = app.findCollectionByNameOrId('documentos_leads')
    docs.fields.removeByName('arquivo')
    const urlField = docs.fields.getByName('url_arquivo')
    if (urlField) {
      urlField.required = true
    }
    app.save(docs)

    const ints = app.findCollectionByNameOrId('interacoes_leads')
    ints.fields.removeByName('arquivo')
    app.save(ints)
  },
)
