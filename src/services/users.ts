import pb from '@/lib/pocketbase/client'

export interface User {
  id: string
  name: string
  email: string
  perfil: string
  ativo: boolean
}

export const getCompanyUsers = () =>
  pb.collection('users').getFullList<User>({
    sort: 'name',
    filter: 'ativo = true',
  })
