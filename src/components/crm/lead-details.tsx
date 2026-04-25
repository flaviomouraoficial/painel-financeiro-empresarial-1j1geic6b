import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import {
  getInteracoes,
  createInteracao,
  getDocumentos,
  createDocumento,
  updateLead,
} from '@/services/crm'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

export function LeadDetails({ lead, open, onOpenChange }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interacoes, setInteracoes] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])

  const loadData = async () => {
    if (!lead?.id) return
    const [ints, docs] = await Promise.all([getInteracoes(lead.id), getDocumentos(lead.id)])
    setInteracoes(ints)
    setDocumentos(docs)
  }

  useEffect(() => {
    if (open) loadData()
  }, [open, lead])

  const handleAddInteracao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleAddDocumento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  if (!lead) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader className="mb-4">
          <SheetTitle>{lead.nome_lead}</SheetTitle>
          <p className="text-sm text-muted-foreground">{lead.empresa_lead}</p>
        </SheetHeader>
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="interacoes">Interações</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">E-mail:</span> {lead.email || '-'}
              </div>
              <div>
                <span className="font-semibold">Telefone:</span> {lead.telefone || '-'}
              </div>
              <div>
                <span className="font-semibold">Cargo:</span> {lead.cargo || '-'}
              </div>
              <div>
                <span className="font-semibold">Valor:</span> R$ {lead.valor_estimado?.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">Etapa:</span> {lead.etapa}
              </div>
              <div>
                <span className="font-semibold">Temperatura:</span> {lead.temperatura}
              </div>
            </div>
            <div>
              <span className="font-semibold text-sm">Descrição:</span>
              <p className="text-sm mt-1 bg-muted/30 p-2 rounded">
                {lead.descricao || 'Sem descrição'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="interacoes" className="mt-4">
            <form
              onSubmit={handleAddInteracao}
              className="flex gap-2 items-end mb-4 border p-3 rounded bg-muted/30"
            >
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Tipo</label>
                <select
                  name="tipo"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="ligacao">Ligação</option>
                  <option value="email">E-mail</option>
                  <option value="reuniao">Reunião</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Data</label>
                <Input
                  name="data_interacao"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex-[2] space-y-1">
                <label className="text-xs font-medium">Resumo</label>
                <Input name="resumo" placeholder="Resumo da interação..." required />
              </div>
              <Button type="submit">Add</Button>
            </form>
            <ScrollArea className="h-[400px]">
              <div className="relative border-l ml-3 pl-4 space-y-4">
                {interacoes.map((i) => (
                  <div key={i.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    <Card className="mb-3">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold flex justify-between">
                          <span className="capitalize">{i.tipo}</span>
                          <span className="text-muted-foreground font-normal">
                            {format(new Date(i.data_interacao), 'dd/MM/yyyy')}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 px-4 text-sm">{i.resumo}</CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documentos" className="mt-4">
            <form
              onSubmit={handleAddDocumento}
              className="grid grid-cols-2 gap-2 items-end mb-4 border p-3 rounded bg-muted/30"
            >
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-medium">Tipo</label>
                <select
                  name="tipo_documento"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="proposta">Proposta</option>
                  <option value="contrato">Contrato</option>
                  <option value="briefing">Briefing</option>
                  <option value="apresentacao">Apresentação</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-medium">Nome</label>
                <Input name="nome_arquivo" required />
              </div>
              <div className="col-span-2 flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium">URL</label>
                  <Input name="url_arquivo" type="url" placeholder="https://" required />
                </div>
                <div className="flex items-end">
                  <Button type="submit">Add</Button>
                </div>
              </div>
            </form>
            <ScrollArea className="h-[400px]">
              {documentos.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center p-3 mb-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{d.nome_arquivo}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {d.tipo_documento} • {format(new Date(d.data_upload), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={d.url_arquivo} target="_blank" rel="noopener noreferrer">
                      Abrir
                    </a>
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
