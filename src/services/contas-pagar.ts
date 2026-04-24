import pb from '@/lib/pocketbase/client'

export const getContasPagar = async (empresaId: string) => {
  return pb.collection('contas_pagar').getFullList({
    filter: `empresa_id = "${empresaId}"`,
    sort: 'data_vencimento',
    expand: 'fornecedor_id,projeto_id,centro_custo_id',
  })
}

export const createContaPagar = async (data: any) => {
  return pb.collection('contas_pagar').create(data)
}

export const updateContaPagar = async (id: string, data: any) => {
  return pb.collection('contas_pagar').update(id, data)
}

export const deleteContaPagar = async (id: string) => {
  return pb.collection('contas_pagar').delete(id)
}

export const pagarConta = async (id: string, data: any) => {
  return pb.send(`/backend/v1/contas-pagar/${id}/pagar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
