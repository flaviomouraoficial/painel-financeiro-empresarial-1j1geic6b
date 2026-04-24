import pb from '@/lib/pocketbase/client'

export const getClientes = () => pb.collection('clientes').getFullList({ sort: 'nome' })
