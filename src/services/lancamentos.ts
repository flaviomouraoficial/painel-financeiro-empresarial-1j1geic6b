import pb from '@/lib/pocketbase/client'

export const createLancamento = (data: any) => pb.collection('lancamentos').create(data)
export const getLancamentos = () => pb.collection('lancamentos').getFullList()

export const listarLancamentos = (options?: any) =>
  pb.collection('lancamentos').getFullList(options)
export const criarLancamento = (data: any) => pb.collection('lancamentos').create(data)
export const editarLancamento = (id: string, data: any) =>
  pb.collection('lancamentos').update(id, data)
export const deletarLancamento = (id: string) => pb.collection('lancamentos').delete(id)
