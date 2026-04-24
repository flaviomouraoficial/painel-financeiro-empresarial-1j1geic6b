import pb from '@/lib/pocketbase/client'

export const getContasBancarias = async () => {
  return pb.collection('contas_bancarias').getFullList({
    sort: '-created',
  })
}

export const updateContaBancaria = async (id: string, data: any) => {
  return pb.collection('contas_bancarias').update(id, data)
}
