onRecordAfterCreateSuccess(
  (e) => {
    try {
      if (!e.requestInfo || !e.requestInfo().auth) return e.next()

      const auth = e.requestInfo().auth
      const empresa_id = e.record.getString('empresa_id') || auth.getString('empresa_id')
      if (!empresa_id) return e.next()

      const log = new Record($app.findCollectionByNameOrId('auditoria_logs'))
      log.set('empresa_id', empresa_id)
      log.set('usuario_id', auth.id)
      log.set('acao', 'create')
      log.set('tabela', e.collection.name)
      log.set('registro_id', e.record.id)
      log.set('detalhes', e.record.publicExport())

      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('audit create error', err.message)
    }
    return e.next()
  },
  'lancamentos',
  'livros',
  'users',
)
