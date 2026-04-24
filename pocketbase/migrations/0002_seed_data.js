migrate(
  (app) => {
    let empresa
    try {
      empresa = app.findFirstRecordByData('empresas', 'cnpj', '09.465.223/0001-07')
    } catch (_) {
      const col = app.findCollectionByNameOrId('empresas')
      empresa = new Record(col)
      empresa.set('cnpj', '09.465.223/0001-07')
      empresa.set('razao_social', 'Trend Consultoria')
      empresa.set('nome_fantasia', 'Trend')
      app.save(empresa)
    }

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, perfil) => {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const record = new Record(usersCol)
        record.setEmail(email)
        record.setPassword('Senha123!')
        record.setVerified(true)
        record.set('name', name)
        record.set('perfil', perfil)
        record.set('empresa_id', empresa.id)
        record.set('ativo', true)
        app.save(record)
      }
    }

    seedUser('admin@trendconsultoria.com.br', 'Flávio Moura', 'admin')
    seedUser('gerente@trendconsultoria.com.br', 'Ana Silva', 'gerente')
    seedUser('usuario@trendconsultoria.com.br', 'Carlos Oliveira', 'usuario')

    try {
      app.findFirstRecordByData('contas_bancarias', 'banco', 'Itaú')
    } catch (_) {
      const col = app.findCollectionByNameOrId('contas_bancarias')
      const conta = new Record(col)
      conta.set('empresa_id', empresa.id)
      conta.set('banco', 'Itaú')
      conta.set('agencia', '1234')
      conta.set('numero_conta', '56789-0')
      conta.set('tipo', 'corrente')
      conta.set('ativo', true)
      conta.set('saldo_inicial_definido', false)
      app.save(conta)
    }
  },
  (app) => {},
)
