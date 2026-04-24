import pb from '@/lib/pocketbase/client'

export const getProjetos = () => pb.collection('projetos').getFullList({ sort: 'nome' })
