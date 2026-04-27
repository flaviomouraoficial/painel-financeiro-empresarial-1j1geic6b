import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getLivros,
  createLivro,
  updateLivro,
  deleteLivro,
  getLivroFileUrl,
  Livro,
} from '@/services/livros'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Search, Plus, Book, Trash2, Edit, Loader2, WifiOff, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const CACHE_KEY = 'biblioteca_livros_cache'
const QUEUE_KEY = 'biblioteca_sync_queue'

type SyncAction = 'create' | 'update' | 'delete'
interface SyncItem {
  id: string
  action: SyncAction
  payload?: any
}

const getCache = (empresaId?: string): Livro[] | null => {
  if (!empresaId) return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.empresa_id === empresaId) return parsed.data
      else localStorage.removeItem(CACHE_KEY)
    }
  } catch {
    /* intentionally ignored */
  }
  return null
}
const setCache = (empresaId: string, data: Livro[]) =>
  localStorage.setItem(CACHE_KEY, JSON.stringify({ empresa_id: empresaId, data }))
const getQueue = (empresaId: string): SyncItem[] => {
  try {
    return JSON.parse(localStorage.getItem(`${QUEUE_KEY}_${empresaId}`) || '[]')
  } catch {
    return []
  }
}
const setQueue = (empresaId: string, queue: SyncItem[]) =>
  localStorage.setItem(`${QUEUE_KEY}_${empresaId}`, JSON.stringify(queue))
const applyQueueToLivros = (serverLivros: Livro[], queue: SyncItem[]) => {
  let result = [...serverLivros]
  queue.forEach((item) => {
    if (item.action === 'create')
      result.unshift({ ...item.payload, id: item.id, _pending: true } as any)
    else if (item.action === 'update') {
      const idx = result.findIndex((l) => l.id === item.id)
      if (idx !== -1) result[idx] = { ...result[idx], ...item.payload, _pending: true }
      else result.push({ ...item.payload, id: item.id, _pending: true } as any)
    } else if (item.action === 'delete') result = result.filter((l) => l.id !== item.id)
  })
  return result
}

export default function Biblioteca() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [livros, setLivros] = useState<Livro[]>(() => getCache(user?.empresa_id) || [])
  const [loading, setLoading] = useState(() => !getCache(user?.empresa_id))
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedLivro, setSelectedLivro] = useState<Livro | null>(null)

  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncQueueLength, setSyncQueueLength] = useState(() =>
    user?.empresa_id ? getQueue(user.empresa_id).length : 0,
  )

  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    palavras_chave: '',
    descricao: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadData = useCallback(
    async (currentSearch: string) => {
      if (!user?.empresa_id) return
      try {
        const data = await getLivros(currentSearch)
        const queue = getQueue(user.empresa_id)
        setLivros(applyQueueToLivros(data, queue))
        if (!currentSearch) setCache(user.empresa_id, data)
      } catch (err: any) {
        if (err?.isAbort || err?.status === 0) {
          const cached = getCache(user.empresa_id) || []
          const queue = getQueue(user.empresa_id)
          let filtered = cached
          if (currentSearch) {
            const q = currentSearch.toLowerCase()
            filtered = cached.filter(
              (l) =>
                l.titulo?.toLowerCase().includes(q) ||
                l.autor?.toLowerCase().includes(q) ||
                l.descricao?.toLowerCase().includes(q),
            )
          }
          setLivros(applyQueueToLivros(filtered, queue))
        }
      } finally {
        setLoading(false)
      }
    },
    [user?.empresa_id],
  )

  const processQueue = useCallback(async () => {
    if (!user?.empresa_id || isSyncing) return
    const queue = getQueue(user.empresa_id)
    if (queue.length === 0) return

    setIsSyncing(true)
    const remaining = []
    for (const item of queue) {
      try {
        if (item.action === 'create') await createLivro(item.payload)
        else if (item.action === 'update') await updateLivro(item.id, item.payload)
        else if (item.action === 'delete') await deleteLivro(item.id)
      } catch (err: any) {
        if (err?.status === 0) remaining.push(item)
      }
    }
    setQueue(user.empresa_id, remaining)
    setSyncQueueLength(remaining.length)
    setIsSyncing(false)
    loadData(search)
  }, [user?.empresa_id, isSyncing, search, loadData])

  useEffect(() => {
    if (isOnline && syncQueueLength > 0 && !isSyncing) processQueue()
  }, [isOnline, syncQueueLength, isSyncing, processQueue])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, loadData])

  useRealtime(
    'livros',
    (e) => {
      if (e.record?.empresa_id === user?.empresa_id && !isSyncing) loadData(search)
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
    setSelectedFile(null)
    setRemoveFile(false)
    setErrors({})
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.empresa_id) return
    setSubmitting(true)
    setErrors({})

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

    try {
      if (isOnline) {
        let dataToSubmit: any = payload
        if (selectedFile || removeFile) {
          dataToSubmit = new FormData()
          Object.entries(payload).forEach(([k, v]) =>
            dataToSubmit.append(k, Array.isArray(v) ? JSON.stringify(v) : v),
          )
          if (selectedFile) dataToSubmit.append('arquivo', selectedFile)
          if (removeFile) dataToSubmit.append('arquivo', '')
        }
        if (selectedLivro) await updateLivro(selectedLivro.id, dataToSubmit)
        else await createLivro(dataToSubmit)
        toast({ title: 'Sucesso', description: 'Livro salvo com sucesso.' })
      } else {
        if (selectedFile)
          toast({
            title: 'Aviso',
            description: 'Arquivos não são enviados offline. Livro salvo apenas com dados.',
            variant: 'default',
          })
        const opId = selectedLivro ? selectedLivro.id : `temp_${Date.now()}`
        const action = selectedLivro ? 'update' : 'create'
        const queue = getQueue(user.empresa_id)
        const existing = queue.find((q) => q.id === opId && q.action === 'create')
        if (existing) existing.payload = { ...existing.payload, ...payload }
        else queue.push({ id: opId, action, payload })
        setQueue(user.empresa_id, queue)
        setSyncQueueLength(queue.length)
        toast({ title: 'Offline', description: 'Operação salva na fila local.' })
        loadData(search) // Apply queue optimism
      }
      setIsDialogOpen(false)
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro', description: 'Verifique os campos.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedLivro || !user?.empresa_id) return
    try {
      if (isOnline) {
        await deleteLivro(selectedLivro.id)
        toast({ title: 'Sucesso', description: 'Livro excluído com sucesso.' })
      } else {
        const queue = getQueue(user.empresa_id)
        if (selectedLivro.id.startsWith('temp_')) {
          const newQ = queue.filter((q) => q.id !== selectedLivro.id)
          setQueue(user.empresa_id, newQ)
          setSyncQueueLength(newQ.length)
        } else {
          queue.push({ id: selectedLivro.id, action: 'delete' })
          setQueue(user.empresa_id, queue)
          setSyncQueueLength(queue.length)
        }
        toast({ title: 'Offline', description: 'Exclusão salva na fila local.' })
        loadData(search)
      }
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Book className="h-8 w-8 text-primary" /> Biblioteca
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-3 w-3 rounded-full mt-1.5 cursor-help',
                    isOnline
                      ? syncQueueLength > 0
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-green-500'
                      : 'bg-gray-400',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {isOnline
                  ? syncQueueLength > 0
                    ? 'Sincronizando...'
                    : 'Sincronizado'
                  : 'Aguardando conexão (Offline)'}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">Gerencie livros e materiais de referência.</p>
            {!isOnline && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-500/30 bg-amber-500/10 font-medium"
              >
                <WifiOff className="h-3 w-3 mr-1" /> Modo Offline
              </Badge>
            )}
          </div>
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
            <Card
              key={livro.id}
              className="flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {livro._pending && (
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 z-10 border-0"
                >
                  Pendente Sync
                </Badge>
              )}
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="line-clamp-2 text-lg pr-16">{livro.titulo}</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">por {livro.autor}</p>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <p className="text-sm line-clamp-4 mb-4 text-foreground/80 flex-1">
                  {livro.descricao || (
                    <span className="italic text-muted-foreground">Sem descrição</span>
                  )}
                </p>
                {livro.palavras_chave && livro.palavras_chave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {livro.palavras_chave.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {livro.arquivo && !livro._pending && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full mt-auto bg-primary/5 hover:bg-primary/10 border-primary/20"
                  >
                    <a href={getLivroFileUrl(livro)} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2 text-primary" /> Visualizar Arquivo
                    </a>
                  </Button>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-6 flex justify-end gap-2 border-t mt-auto pt-4 bg-muted/5">
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
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                required
              />
              {errors.autor && <p className="text-sm text-destructive">{errors.autor}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo (PDF/DOCX, máx 50MB)</Label>
              <Input
                id="arquivo"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null)
                  setRemoveFile(false)
                }}
              />
              {errors.arquivo && <p className="text-sm text-destructive">{errors.arquivo}</p>}
              {selectedLivro?.arquivo && !removeFile && !selectedFile && (
                <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md mt-2 border border-dashed text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    Atual: {selectedLivro.arquivo}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveFile(true)}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                </div>
              )}
              {removeFile && (
                <p className="text-sm text-amber-600 mt-1">
                  O arquivo atual será removido ao salvar.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="palavras_chave">Palavras-chave</Label>
              <Input
                id="palavras_chave"
                value={formData.palavras_chave}
                onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                placeholder="Separadas por vírgula"
              />
              {errors.palavras_chave && (
                <p className="text-sm text-destructive">{errors.palavras_chave}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
              {errors.descricao && <p className="text-sm text-destructive">{errors.descricao}</p>}
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
