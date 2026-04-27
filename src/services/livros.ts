import pb from '@/lib/pocketbase/client'

export interface Livro {
  id: string
  empresa_id: string
  usuario_id: string
  titulo: string
  autor: string
  palavras_chave: string[] | null
  descricao: string
  created: string
  updated: string
  expand?: any
}

export const getLivros = (search?: string) => {
  let filter = ''
  if (search) {
    const q = search.replace(/"/g, '\\"')
    filter = `titulo ~ "${q}" || autor ~ "${q}" || descricao ~ "${q}" || palavras_chave ~ "${q}"`
  }
  return pb.collection('livros').getFullList<Livro>({
    filter,
    sort: '-created',
    expand: 'usuario_id',
  })
}

export const createLivro = (data: Partial<Livro>) => pb.collection('livros').create<Livro>(data)
export const updateLivro = (id: string, data: Partial<Livro>) =>
  pb.collection('livros').update<Livro>(id, data)
export const deleteLivro = (id: string) => pb.collection('livros').delete(id)
