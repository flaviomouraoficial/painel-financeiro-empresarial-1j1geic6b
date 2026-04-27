onRecordAfterCreateSuccess(
  (e) => {
    try {
      if (!e.requestInfo || !e.requestInfo().auth) return e.next()

      const auth = e.requestInfo().auth
      const empresa_id = e.record.getString('empresa_id')
      if (!empresa_id) return e.next()

      const users = $app.findRecordsByFilter(
        'users',
        "empresa_id = {:empresa} && (perfil = 'admin' || perfil = 'gerente') && id != {:authId}",
        '',
        100,
        0,
        { empresa: empresa_id, authId: auth.id },
      )

      if (users.length === 0) return e.next()

      const isLivro = e.collection.name === 'livros'
      const titulo = isLivro ? 'Novo Documento' : 'Novo Lançamento'
      const nomeUsuario = auth.getString('name') || 'Um usuário'

      let mensagem = ''
      if (isLivro) {
        mensagem = `${nomeUsuario} adicionou o livro "${e.record.getString('titulo')}" à biblioteca.`
      } else {
        const tipo = e.record.getString('tipo') === 'receita' ? 'receita' : 'despesa'
        mensagem = `${nomeUsuario} registrou uma nova ${tipo} no valor de R$ ${e.record.getFloat('valor').toFixed(2)}.`
      }

      const notifCol = $app.findCollectionByNameOrId('notificacoes')

      for (const u of users) {
        const notif = new Record(notifCol)
        notif.set('empresa_id', empresa_id)
        notif.set('usuario_id', u.id)
        notif.set('tipo', isLivro ? 'alerta_crm' : 'lancamento')
        notif.set('titulo', titulo)
        notif.set('mensagem', mensagem)
        notif.set('icone', isLivro ? 'BookOpen' : 'Activity')
        notif.set('cor', isLivro ? 'blue' : 'teal')
        notif.set('lida', false)
        notif.set('link', isLivro ? '/biblioteca' : '/lancamentos')

        $app.saveNoValidate(notif)
      }
    } catch (err) {
      $app.logger().error('notifica novo registro error', err.message)
    }

    return e.next()
  },
  'lancamentos',
  'livros',
)
