migrate(
  (app) => {
    // Ensure "alerta_crm" is in notificacoes types
    const notificacoes = app.findCollectionByNameOrId('notificacoes')
    const tipoField = notificacoes.fields.getByName('tipo')
    if (tipoField && !tipoField.values.includes('alerta_crm')) {
      tipoField.values.push('alerta_crm')
      app.save(notificacoes)
    }
  },
  (app) => {
    const notificacoes = app.findCollectionByNameOrId('notificacoes')
    const tipoField = notificacoes.fields.getByName('tipo')
    if (tipoField && tipoField.values.includes('alerta_crm')) {
      tipoField.values = tipoField.values.filter((v) => v !== 'alerta_crm')
      app.save(notificacoes)
    }
  },
)
