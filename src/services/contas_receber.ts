import pb from '@/lib/pocketbase/client'

export const getContasReceber = () =>
  pb
    .collection('contas_receber')
    .getFullList({ expand: 'cliente_id,projeto_id', sort: 'data_vencimento' })
export const createContaReceber = (data: any) => pb.collection('contas_receber').create(data)
export const updateContaReceber = (id: string, data: any) =>
  pb.collection('contas_receber').update(id, data)
export const deleteContaReceber = (id: string) => pb.collection('contas_receber').delete(id)
