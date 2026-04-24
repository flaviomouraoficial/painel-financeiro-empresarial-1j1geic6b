import pb from '@/lib/pocketbase/client'

export interface LancamentoFiltros {
  data_inicio?: string
  data_fim?: string
  tipo?: string
  categoria_id?: string
}

export const listarLancamentos = async (filtros?: LancamentoFiltros) => {
  try {
    const user = pb.authStore.record
    if (!user) throw new Error('Usuário não autenticado')

    const conditions: string[] = [`empresa_id = "${user.empresa_id}"`]

    if (user.perfil === 'usuario') {
      conditions.push(`usuario_id = "${user.id}"`)
    }

    if (filtros) {
      if (filtros.data_inicio) {
        conditions.push(`data_lancamento >= "${filtros.data_inicio} 00:00:00"`)
      }
      if (filtros.data_fim) {
        conditions.push(`data_lancamento <= "${filtros.data_fim} 23:59:59"`)
      }
      if (filtros.tipo && filtros.tipo !== 'todos') {
        conditions.push(`tipo = "${filtros.tipo}"`)
      }
      if (filtros.categoria_id && filtros.categoria_id !== 'todas') {
        conditions.push(`categoria_id = "${filtros.categoria_id}"`)
      }
    }

    return await pb.collection('lancamentos').getFullList({
      filter: conditions.join(' && '),
      sort: '-data_lancamento',
      expand: 'categoria_id,conta_bancaria_id,cartao_credito_id',
    })
  } catch (error) {
    throw new Error('Erro ao carregar lançamentos. Tente novamente.')
  }
}

export const criarLancamento = async (data: any) => {
  try {
    const user = pb.authStore.record
    if (!user) throw new Error('Usuário não autenticado')

    const payload = {
      ...data,
      empresa_id: user.empresa_id,
      usuario_id: user.id,
      status: 'pendente',
    }

    return await pb.collection('lancamentos').create(payload)
  } catch (error) {
    throw new Error('Erro ao criar lançamento. Tente novamente.')
  }
}

export const editarLancamento = async (id: string, data: any) => {
  try {
    const user = pb.authStore.record
    if (!user) throw new Error('Usuário não autenticado')

    return await pb.collection('lancamentos').update(id, data)
  } catch (error) {
    throw new Error('Erro ao editar lançamento. Você não tem permissão ou o lançamento não existe.')
  }
}

export const deletarLancamento = async (id: string) => {
  try {
    const user = pb.authStore.record
    if (!user || user.perfil !== 'admin') {
      throw new Error('Você não tem permissão')
    }
    return await pb.collection('lancamentos').delete(id)
  } catch (error) {
    throw new Error('Erro ao deletar lançamento. Você não tem permissão.')
  }
}
