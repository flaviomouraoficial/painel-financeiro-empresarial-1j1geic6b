import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import {
  getInteracoes,
  createInteracao,
  getDocumentos,
  createDocumento,
  updateLead,
  deleteLead,
} from '@/services/crm'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
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
import { Loader2, Download, Trash2, Edit, UserCheck, CheckCircle2 } from 'lucide-react'
import { LeadForm } from './lead-form'
import { formatCurrency } from '@/lib/format'

export function LeadDetails({ lead, open, onOpenChange, onUpdated }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interacoes, setInteracoes] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    if (!lead?.id) return
    try {
      const [ints, docs] = await Promise.all([getInteracoes(lead.id), getDocumentos(lead.id)])
      setInteracoes(ints.slice(0, 10)) // Last 10 interactions
      setDocumentos(docs)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (open) loadData()
  }, [open, lead])

  const handleAddInteracao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createInteracao({
        lead_id: lead.id,
        empresa_id: user.empresa_id,
        usuario_id: user.id,
        tipo: fd.get('tipo'),
        data_interacao: fd.get('data_interacao'),
        resumo: fd.get('resumo'),
      })
      await updateLead(lead.id, {
        data_ultimo_contato: fd.get('data_interacao') + ' 00:00:00.000Z',
      })
      e.currentTarget.reset()
      toast({ title: 'Interação registrada' })
      loadData()
      onUpdated?.()
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive', description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDocumento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createDocumento({
        lead_id: lead.id,
        empresa_id: user.empresa_id,
        usuario_id: user.id,
        tipo_documento: fd.get('tipo_documento'),
        nome_arquivo: fd.get('nome_arquivo'),
        url_arquivo: fd.get('url_arquivo'),
        data_upload: new Date().toISOString().split('T')[0],
      })
      e.currentTarget.reset()
      toast({ title: 'Documento salvo' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive', description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteLead(lead.id)
      toast({ title: 'Lead deletado com sucesso' })
      onUpdated?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  const handleConvert = async () => {
    if (lead.cliente_id) {
      toast({ title: 'Este lead já é um cliente', variant: 'default' })
      return
    }
    setIsConverting(true)
    try {
      // Create Client
      const newClient = await pb.collection('clientes').create({
        empresa_id: lead.empresa_id,
        nome: lead.nome_lead,
        tipo: 'pj',
        email: lead.email,
        telefone: lead.telefone,
        observacoes: `Convertido do lead: ${lead.empresa_lead || lead.nome_lead}`,
      })

      // Update Lead
      await updateLead(lead.id, {
        cliente_id: newClient.id,
        etapa: 'fechou',
      })

      toast({
        title: 'Lead convertido com sucesso!',
        className: 'bg-green-600 text-white border-none',
      })
      onUpdated?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro ao converter', description: error.message, variant: 'destructive' })
    } finally {
      setIsConverting(false)
    }
  }

  if (!lead) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <SheetHeader className="mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <SheetTitle className="text-2xl">{lead.nome_lead}</SheetTitle>
                  <SheetDescription className="text-base">{lead.empresa_lead}</SheetDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteAlert(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Deletar
                  </Button>
                </div>
              </div>
            </SheetHeader>
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Valor Estimado</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(lead.valor_estimado)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Probabilidade</span>
                <span className="font-semibold flex items-center gap-1">
                  {lead.probabilidade_fechamento}%
                  <span
                    className={`w-2 h-2 rounded-full ${lead.probabilidade_fechamento >= 70 ? 'bg-green-500' : lead.probabilidade_fechamento >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Etapa Atual</span>
                <span className="font-semibold capitalize">{lead.etapa}</span>
              </div>
            </div>

            {!lead.cliente_id && (
              <Button
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Converter em Cliente
              </Button>
            )}
            {lead.cliente_id && (
              <div className="w-full mt-4 flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Lead já convertido em cliente
              </div>
            )}
          </div>

          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b px-6 h-12 bg-transparent">
              <TabsTrigger
                value="info"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12"
              >
                Dados e Relacionamentos
              </TabsTrigger>
              <TabsTrigger
                value="interacoes"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12"
              >
                Histórico ({interacoes.length})
              </TabsTrigger>
              <TabsTrigger
                value="documentos"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12"
              >
                Documentos ({documentos.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="info" className="space-y-6 m-0">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">E-mail</span>
                      <p className="font-medium">{lead.email || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Telefone</span>
                      <p className="font-medium">{lead.telefone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Cargo</span>
                      <p className="font-medium">{lead.cargo || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        Último Contato
                      </span>
                      <p className="font-medium">
                        {lead.data_ultimo_contato
                          ? format(parseISO(lead.data_ultimo_contato), 'dd/MM/yyyy')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Descrição / Necessidade
                    </span>
                    <div className="text-sm bg-muted/40 p-4 rounded-lg min-h-[80px] border whitespace-pre-wrap">
                      {lead.descricao || 'Nenhuma descrição fornecida.'}
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold">Relacionamentos</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Produto / Serviço de Interesse
                        </span>
                        <p className="font-medium">
                          {lead.expand?.servico_produto_id?.nome || '-'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Consultor Responsável
                        </span>
                        <p className="font-medium flex items-center gap-2">
                          {lead.expand?.consultor_id?.name || '-'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Cliente Vinculado
                        </span>
                        <p className="font-medium">{lead.expand?.cliente_id?.nome || '-'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="interacoes" className="m-0 space-y-6">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3 px-4 pt-4 bg-muted/20">
                      <CardTitle className="text-sm">Nova Interação</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form
                        onSubmit={handleAddInteracao}
                        className="flex flex-wrap gap-3 items-end"
                      >
                        <div className="flex-1 min-w-[120px] space-y-1">
                          <label className="text-xs font-medium">Tipo</label>
                          <select
                            name="tipo"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            required
                          >
                            <option value="ligacao">Ligação</option>
                            <option value="email">E-mail</option>
                            <option value="reuniao">Reunião</option>
                            <option value="whatsapp">WhatsApp</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[130px] space-y-1">
                          <label className="text-xs font-medium">Data</label>
                          <Input
                            name="data_interacao"
                            type="date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="h-9"
                          />
                        </div>
                        <div className="flex-[2] min-w-[200px] space-y-1">
                          <label className="text-xs font-medium">Resumo</label>
                          <Input
                            name="resumo"
                            placeholder="Descreva a interação..."
                            required
                            className="h-9"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Adicionar'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="relative border-l-2 border-muted ml-3 pl-5 space-y-6 pb-4">
                    {interacoes.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma interação registrada.
                      </p>
                    )}
                    {interacoes.map((i) => (
                      <div key={i.id} className="relative group">
                        <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
                        <div className="bg-card border rounded-lg p-3 shadow-sm group-hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm capitalize text-foreground">
                              {i.tipo}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {format(new Date(i.data_interacao), 'dd/MMM/yy', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{i.resumo}</p>
                          <div className="mt-2 text-[10px] text-muted-foreground flex justify-end">
                            Por {i.expand?.usuario_id?.name?.split(' ')[0] || 'Usuário'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="m-0 space-y-6">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3 px-4 pt-4 bg-muted/20">
                      <CardTitle className="text-sm">Anexar Documento (Link)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form
                        onSubmit={handleAddDocumento}
                        className="flex flex-wrap gap-3 items-end"
                      >
                        <div className="w-[140px] space-y-1">
                          <label className="text-xs font-medium">Tipo</label>
                          <select
                            name="tipo_documento"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            required
                          >
                            <option value="proposta">Proposta</option>
                            <option value="contrato">Contrato</option>
                            <option value="briefing">Briefing</option>
                            <option value="apresentacao">Apresentação</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[150px] space-y-1">
                          <label className="text-xs font-medium">Nome</label>
                          <Input
                            name="nome_arquivo"
                            required
                            placeholder="Ex: Proposta v1"
                            className="h-9"
                          />
                        </div>
                        <div className="flex-[2] min-w-[200px] space-y-1">
                          <label className="text-xs font-medium">URL do Arquivo</label>
                          <Input
                            name="url_arquivo"
                            type="url"
                            placeholder="https://"
                            required
                            className="h-9"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documentos.length === 0 && (
                      <p className="text-sm text-muted-foreground italic col-span-full">
                        Nenhum documento anexado.
                      </p>
                    )}
                    {documentos.map((d) => (
                      <Card
                        key={d.id}
                        className="flex flex-col group hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                              <span
                                className="font-semibold text-sm truncate pr-2"
                                title={d.nome_arquivo}
                              >
                                {d.nome_arquivo}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize mt-0.5">
                                {d.tipo_documento}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-1 bg-muted px-1.5 py-0.5 rounded">
                              {format(new Date(d.data_upload), 'dd/MM/yy')}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs mt-2 group-hover:bg-primary group-hover:text-primary-foreground"
                            asChild
                          >
                            <a href={d.url_arquivo} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-2" /> Acessar Arquivo
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar este lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados, interações e documentos vinculados a
              este lead serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Deletar Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditOpen && (
        <LeadForm
          lead={lead}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => {
            loadData()
            onUpdated?.()
          }}
        />
      )}
    </>
  )
}
