import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export function useCadastros() {
  const { user } = useAuth()
  const [data, setData] = useState<any>({ fornecedores: [], bancos: [], projetos: [], centros: [] })

  useEffect(() => {
    if (!user?.empresa_id) return
    const opts = { filter: `empresa_id="${user.empresa_id}"`, sort: 'nome' }
    Promise.all([
      pb.collection('fornecedores').getFullList(opts),
      pb.collection('contas_bancarias').getFullList({ ...opts, sort: 'banco' }),
      pb.collection('projetos').getFullList(opts),
      pb.collection('centros_custo').getFullList(opts),
    ]).then(([fornecedores, bancos, projetos, centros]) => {
      setData({ fornecedores, bancos, projetos, centros })
    })
  }, [user?.empresa_id])

  return data
}
