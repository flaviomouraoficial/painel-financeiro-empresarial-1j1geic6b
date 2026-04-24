import pb from '@/lib/pocketbase/client'

export const getOpcoes = async () => {
  try {
    const user = pb.authStore.record
    if (!user) return { categorias: [], contas: [], cartoes: [] }

    const filter = `empresa_id = "${user.empresa_id}" && ativo = true`

    const [categorias, contas, cartoes] = await Promise.all([
      pb.collection('categorias').getFullList({ filter, sort: 'nome' }),
      pb.collection('contas_bancarias').getFullList({ filter, sort: 'banco' }),
      pb.collection('cartoes_credito').getFullList({ filter, sort: 'banco' }),
    ])
    return { categorias, contas, cartoes }
  } catch (error) {
    console.error(error)
    throw new Error('Erro ao carregar dados. Tente novamente.')
  }
}
