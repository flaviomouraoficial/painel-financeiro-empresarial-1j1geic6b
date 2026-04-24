import pb from '@/lib/pocketbase/client'

export const createRecebimento = (data: any) => pb.collection('recebimentos').create(data)
