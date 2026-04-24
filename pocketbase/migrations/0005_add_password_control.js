migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(new BoolField({ name: 'trocar_senha_proximo_acesso' }))
    app.save(users)

    app.db().newQuery('UPDATE users SET trocar_senha_proximo_acesso = false').execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('trocar_senha_proximo_acesso')
    app.save(users)
  },
)
