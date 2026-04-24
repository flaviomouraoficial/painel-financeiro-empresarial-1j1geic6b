import pb from '@/lib/pocketbase/client'

export interface CentroCusto {
  id: string
  empresa_id: string
  nome: string
  codigo?: string
  departamento?: string
  responsavel_id?: string
  orcamento_anual?: number
  email_contato?: string
  telefone?: string
  descricao?: string
  ativo: boolean
  expand?: {
    responsavel_id?: { name: string }
  }
}

export const getCentrosCusto = () =>
  pb.collection('centros_custo').getFullList<CentroCusto>({
    sort: 'nome',
    expand: 'responsavel_id',
  })

export const createCentroCusto = (data: Partial<CentroCusto>) =>
  pb.collection('centros_custo').create<CentroCusto>(data)

export const updateCentroCusto = (id: string, data: Partial<CentroCusto>) =>
  pb.collection('centros_custo').update<CentroCusto>(id, data)

export const deleteCentroCusto = (id: string) => pb.collection('centros_custo').delete(id)
