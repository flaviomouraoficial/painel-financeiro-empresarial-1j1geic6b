onRecordAfterUpdateSuccess(
  (e) => {
    try {
      if (!e.requestInfo || !e.requestInfo().auth) return e.next()

      const auth = e.requestInfo().auth
      const empresa_id = e.record.getString('empresa_id') || auth.getString('empresa_id')
      if (!empresa_id) return e.next()

      const original = e.record.original().publicExport()
      const current = e.record.publicExport()
      const changes = {}
      for (const k in current) {
        if (k !== 'updated' && JSON.stringify(original[k]) !== JSON.stringify(current[k])) {
          changes[k] = { from: original[k], to: current[k] }
        }
      }

      if (Object.keys(changes).length === 0) return e.next()

      const log = new Record($app.findCollectionByNameOrId('auditoria_logs'))
      log.set('empresa_id', empresa_id)
      log.set('usuario_id', auth.id)
      log.set('acao', 'update')
      log.set('tabela', e.collection.name)
      log.set('registro_id', e.record.id)
      log.set('detalhes', changes)

      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('audit update error', err.message)
    }
    return e.next()
  },
  'lancamentos',
  'livros',
  'users',
)
