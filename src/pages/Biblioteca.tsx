import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getLivros,
  createLivro,
  updateLivro,
  deleteLivro,
  getLivroFileUrl,
  searchLivros,
  Livro,
} from '@/services/livros'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { ExportDropdown } from '@/components/ExportDropdown'
import { exportToPdf } from '@/lib/pdf-export'
import { exportToExcel } from '@/lib/export-utils'
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Search,
  Plus,
  Book,
  Trash2,
  Edit,
  Loader2,
  WifiOff,
  FileText,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const CACHE_KEY = 'biblioteca_livros_cache'
const QUEUE_KEY = 'biblioteca_sync_queue'

type SyncAction = 'create' | 'update' | 'delete'
interface SyncItem {
  id: string
  action: SyncAction
  payload?: any
}

const COMMON_TAGS = [
  'finanças',
  'vendas',
  'marketing',
  'gestão',
  'liderança',
  'investimentos',
  'contabilidade',
  'tecnologia',
  'planejamento',
  'estratégia',
  'economia',
  'rh',
  'operações',
  'produtividade',
  'inovação',
  'startup',
]

const getSuggestedTags = (title: string, desc: string, currentTags: string) => {
  const text = `${title} ${desc}`.toLowerCase()
  const existingTags = currentTags.split(',').map((t) => t.trim().toLowerCase())
  return COMMON_TAGS.filter((tag) => text.includes(tag) && !existingTags.includes(tag))
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

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('')

  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncQueueLength, setSyncQueueLength] = useState(() =>
    user?.empresa_id ? getQueue(user.empresa_id).length : 0,
  )

  const [useSemanticSearch, setUseSemanticSearch] = useState(false)

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
    async (currentSearch: string, isSemantic: boolean) => {
      if (!user?.empresa_id) return
      try {
        let data: Livro[] = []
        if (currentSearch && isOnline) {
          if (isSemantic) {
            data = await searchLivros(currentSearch)
          } else {
            data = await getLivros(currentSearch)
          }
        } else {
          data = await getLivros(currentSearch)
        }
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
    [user?.empresa_id, isOnline],
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
    loadData(search, useSemanticSearch)
  }, [user?.empresa_id, isSyncing, search, useSemanticSearch, loadData])

  useEffect(() => {
    if (isOnline && syncQueueLength > 0 && !isSyncing) processQueue()
  }, [isOnline, syncQueueLength, isSyncing, processQueue])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search, useSemanticSearch)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, useSemanticSearch, loadData])

  useRealtime(
    'livros',
    (e) => {
      if (e.record?.empresa_id === user?.empresa_id && !isSyncing)
        loadData(search, useSemanticSearch)
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

  const openPdfViewer = (livro: Livro) => {
    const url = getLivroFileUrl(livro)
    if (url) {
      setSelectedPdfUrl(url)
      setPdfViewerOpen(true)
    }
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
        loadData(search, useSemanticSearch)
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
        loadData(search, useSemanticSearch)
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    } finally {
      setIsAlertOpen(false)
    }
  }

  const suggestedTags = getSuggestedTags(
    formData.titulo,
    formData.descricao,
    formData.palavras_chave,
  )

  const handleExportPdf = async () => {
    const rows = livros
      .map(
        (l) => `
      <tr>
        <td>${l.titulo}</td>
        <td>${l.autor}</td>
        <td>${(l.palavras_chave || []).join(', ') || '-'}</td>
      </tr>
    `,
      )
      .join('')

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Palavras-chave</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `

    await exportToPdf({
      filename: 'biblioteca.pdf',
      title: 'Acervo da Biblioteca',
      filters: search ? `Busca: ${search}` : 'Nenhum',
      tableHtml,
      userName: user?.name,
    })
  }

  const handleExportExcel = async () => {
    const data = [
      ['Título', 'Autor', 'Descrição', 'Palavras-chave'],
      ...livros.map((l) => [
        l.titulo,
        l.autor,
        l.descricao || '',
        (l.palavras_chave || []).join(', '),
      ]),
    ]
    exportToExcel('biblioteca.xlsx', [{ name: 'Biblioteca', data }])
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Book className="h-8 w-8 text-primary" /> Biblioteca
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-1.5 cursor-help">
                    {isOnline ? (
                      syncQueueLength > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-500/30"
                        >
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Pendente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 border-green-500/30"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Sincronizado
                        </Badge>
                      )
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-500/10 text-gray-600 border-gray-500/30"
                      >
                        <WifiOff className="h-3 w-3 mr-1" /> Offline
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isOnline
                    ? syncQueueLength > 0
                      ? 'Sincronizando as alterações locais...'
                      : 'Todos os dados estão sincronizados com a nuvem'
                    : 'Aguardando conexão (Modo Offline)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full mt-1">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  A pesquisa de biblioteca utiliza inteligência artificial para encontrar resultados
                  pelo contexto e significado, não apenas por palavras exatas.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
            disabled={livros.length === 0}
          />
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Livro
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              useSemanticSearch
                ? 'Descreva o que você procura (ex: livros sobre gestão financeira)...'
                : 'Pesquise por título, autor ou palavra-chave...'
            }
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 border-l pl-4 md:ml-2 w-full md:w-auto justify-end">
          <Switch
            checked={useSemanticSearch}
            onCheckedChange={setUseSemanticSearch}
            id="semantic-search"
          />
          <Label htmlFor="semantic-search" className="text-sm font-medium cursor-pointer">
            Busca Semântica
          </Label>
        </div>
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
                    onClick={() => openPdfViewer(livro)}
                    className="w-full mt-auto bg-primary/5 hover:bg-primary/10 border-primary/20"
                  >
                    <FileText className="h-4 w-4 mr-2 text-primary" /> Visualizar Arquivo
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
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
              {errors.descricao && <p className="text-sm text-destructive">{errors.descricao}</p>}
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
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-muted-foreground w-full">Sugestões:</span>
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        const current = formData.palavras_chave.trim()
                        setFormData({
                          ...formData,
                          palavras_chave: current ? `${current}, ${tag}` : tag,
                        })
                      }}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              )}
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

      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Visualizador de Documento
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 relative w-full h-full">
            {selectedPdfUrl ? (
              <iframe src={selectedPdfUrl} className="w-full h-full border-0" title="PDF Viewer" />
            ) : (
              <div className="flex items-center justify-center h-full">
                Documento não encontrado
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
