migrate(
  (app) => {
    const emails = ['flavio@trendconsultoria.com.br', 'admin@trendconsultoria.com.br']

    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('users', email)
        record.set('perfil', 'admin')
        app.save(record)
      } catch (_) {
        // Ignora se o usuário não existir
      }
    }
  },
  (app) => {
    // Reverter não é seguro sem saber o estado anterior
  },
)
