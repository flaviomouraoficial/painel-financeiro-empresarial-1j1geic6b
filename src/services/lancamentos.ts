import pb from '@/lib/pocketbase/client'

export const createLancamento = (data: any) => pb.collection('lancamentos').create(data)
export const getLancamentos = () => pb.collection('lancamentos').getFullList()
