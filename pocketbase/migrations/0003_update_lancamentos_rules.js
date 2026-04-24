migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')

    col.listRule =
      "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && (@request.auth.perfil != 'usuario' || usuario_id = @request.auth.id)"
    col.viewRule =
      "@request.auth.id != '' && empresa_id = @request.auth.empresa_id && (@request.auth.perfil != 'usuario' || usuario_id = @request.auth.id)"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')

    col.listRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"
    col.viewRule = "@request.auth.id != '' && empresa_id = @request.auth.empresa_id"

    app.save(col)
  },
)
