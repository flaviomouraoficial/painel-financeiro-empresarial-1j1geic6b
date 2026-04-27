import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getLivros, createLivro, updateLivro, deleteLivro, Livro } from '@/services/livros'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Book, Trash2, Edit, Loader2 } from 'lucide-react'

export default function Biblioteca() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedLivro, setSelectedLivro] = useState<Livro | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    palavras_chave: '',
    descricao: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      setLivros(await getLivros(search))
    } catch (error) {
      const err = error as any
      if (err?.isAbort || err?.status === 0) return
      toast({
        title: 'Erro',
        description: 'Falha ao carregar a biblioteca.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
  }, [search])

  useRealtime(
    'livros',
    (e) => {
      if (e.record?.empresa_id === user?.empresa_id) {
        loadData()
      }
    },
    !!user?.id,
  )

  const openDialog = (livro?: Livro) => {
    setSelectedLivro(livro || null)
    setFormData(
      livro
        ? {
            titulo: livro.titulo,
            autor: livro.autor,
            palavras_chave: (livro.palavras_chave || []).join(', '),
            descricao: livro.descricao,
          }
        : { titulo: '', autor: '', palavras_chave: '', descricao: '' },
    )
    setErrors({})
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        empresa_id: user.empresa_id,
        usuario_id: user.id,
        titulo: formData.titulo,
        autor: formData.autor,
        descricao: formData.descricao,
        palavras_chave: formData.palavras_chave
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      if (selectedLivro) await updateLivro(selectedLivro.id, payload)
      else await createLivro(payload)
      toast({ title: 'Sucesso', description: 'Livro salvo com sucesso.' })
      setIsDialogOpen(false)
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro', description: 'Verifique os campos.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedLivro) return
    try {
      await deleteLivro(selectedLivro.id)
      toast({ title: 'Sucesso', description: 'Livro excluído com sucesso.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    } finally {
      setIsAlertOpen(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Book className="h-8 w-8 text-primary" /> Biblioteca
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie livros e materiais de referência.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Livro
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por título, autor ou palavra-chave..."
          className="pl-9 bg-background shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : livros.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum livro encontrado</h3>
          <p className="text-muted-foreground mt-1">
            {search ? 'Tente outros termos de pesquisa.' : 'Adicione seu primeiro livro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {livros.map((livro) => (
            <Card key={livro.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="line-clamp-2 text-lg">{livro.titulo}</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">por {livro.autor}</p>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <p className="text-sm line-clamp-4 mb-4 text-foreground/80">
                  {livro.descricao || (
                    <span className="italic text-muted-foreground">Sem descrição</span>
                  )}
                </p>
                {livro.palavras_chave && livro.palavras_chave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {livro.palavras_chave.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-6 flex justify-end gap-2 border-t mt-4 pt-4 bg-muted/5">
                <Button variant="ghost" size="sm" onClick={() => openDialog(livro)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
                {user?.perfil !== 'usuario' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedLivro(livro)
                      setIsAlertOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedLivro ? 'Editar Livro' : 'Adicionar Livro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="palavras_chave">Palavras-chave</Label>
              <Input
                id="palavras_chave"
                value={formData.palavras_chave}
                onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                placeholder="Separadas por vírgula"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir livro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedLivro?.titulo}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
