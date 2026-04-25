migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = "@request.auth.perfil = 'admin'"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = ''
    app.save(users)
  },
)
