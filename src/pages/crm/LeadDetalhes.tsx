import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  Download,
  Trash,
  Loader2,
  Plus,
} from 'lucide-react'
import { LeadForm } from '@/components/crm/lead-form'
import { format, parseISO } from 'date-fns'
import { ExportButtons } from '@/components/crm/export-buttons'
import { cn } from '@/lib/utils'
import { exportToCsv, exportToExcel } from '@/lib/export-utils'
import { exportToPdf } from '@/lib/pdf-export'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const getTempColor = (prob: number) => {
  if (prob >= 70) return 'bg-green-500'
  if (prob >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getIntIcon = (tipo: string) => {
  switch (tipo) {
    case 'ligacao':
      return <Phone className="h-4 w-4 text-blue-500" />
    case 'email':
      return <Mail className="h-4 w-4 text-orange-500" />
    case 'reuniao':
      return <Calendar className="h-4 w-4 text-purple-500" />
    case 'whatsapp':
      return <MessageCircle className="h-4 w-4 text-green-500" />
    case 'documento':
      return <FileText className="h-4 w-4 text-gray-500" />
    default:
      return <MessageCircle className="h-4 w-4" />
  }
}

export default function LeadDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [lead, setLead] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])

  const [loadingLead, setLoadingLead] = useState(true)
  const [probabilidade, setProbabilidade] = useState(0)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [showConvertAlert, setShowConvertAlert] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const [isConverting, setIsConverting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [tipoInteracao, setTipoInteracao] = useState('ligacao')
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false)

  const VALID_ETAPAS = [
    'prospecção',
    'contato',
    'briefing',
    'proposta',
    'apresentação',
    'análise',
    'fechou',
    'não fechou',
  ]

  const loadData = async () => {
    if (!id) return
    try {
      const [l, ints, d] = await Promise.all([
        pb.collection('leads').getOne(id, { expand: 'servico_produto_id,consultor_id,cliente_id' }),
        pb.collection('interacoes_leads').getFullList({
          filter: `lead_id="${id}"`,
          sort: '-data_interacao',
          expand: 'usuario_id',
        }),
        pb
          .collection('documentos_leads')
          .getFullList({ filter: `lead_id="${id}"`, sort: '-created', expand: 'usuario_id' }),
      ])
      setLead(l)
      setProbabilidade(l.probabilidade_fechamento || 0)
      setInteractions(ints)
      setDocs(d)
    } catch (err) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoadingLead(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('interacoes_leads', (e) => {
    if (e.record.lead_id === id) {
      loadData()
    }
  })

  const handleProbabilityChange = async (val: number) => {
    if (!lead) return
    try {
      await pb.collection('leads').update(lead.id, { probabilidade_fechamento: val })
      toast({ title: 'Probabilidade atualizada' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
      setProbabilidade(lead.probabilidade_fechamento || 0)
    }
  }

  const handleEtapaChange = async (novaEtapa: string) => {
    if (!lead || lead.etapa === novaEtapa) return
    const originalEtapa = lead.etapa
    setIsUpdatingEtapa(true)
    setLead((prev: any) => ({ ...prev, etapa: novaEtapa }))
    try {
      await pb.collection('leads').update(lead.id, { etapa: novaEtapa })
      toast({
        title: 'Sucesso',
        description: `Lead movido para ${novaEtapa}`,
        className: 'bg-green-600 text-white border-none',
      })
    } catch (err: any) {
      console.error('Erro ao atualizar o lead:', err)
      toast({
        title: 'Erro ao atualizar o lead.',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
      setLead((prev: any) => ({ ...prev, etapa: originalEtapa }))
    } finally {
      setIsUpdatingEtapa(false)
    }
  }

  const handleConvert = async () => {
    if (!lead) return
    setIsConverting(true)
    try {
      const novoCliente = await pb.collection('clientes').create({
        empresa_id: user.empresa_id,
        nome: lead.nome_lead,
        tipo: 'pj',
        email: lead.email,
        telefone: lead.telefone,
        observacoes: `Convertido do lead: ${lead.empresa_lead || lead.nome_lead}`,
      })
      await pb.collection('leads').update(lead.id, {
        cliente_id: novoCliente.id,
        etapa: 'fechou',
      })
      toast({
        title: 'Lead convertido em cliente!',
        className: 'bg-green-600 text-white border-none',
      })
      loadData()
      setShowConvertAlert(false)
    } catch (err: any) {
      toast({ title: 'Erro ao converter', description: err.message, variant: 'destructive' })
    } finally {
      setIsConverting(false)
    }
  }

  const handleDelete = async () => {
    if (!lead) return
    setIsDeleting(true)
    try {
      await pb.collection('leads').delete(lead.id)
      toast({ title: 'Lead deletado' })
      navigate('/crm/funil-vendas')
    } catch (err: any) {
      toast({ title: 'Erro ao deletar', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInteractionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmittingInteraction(true)
    const formData = new FormData(form)
    const tipoRaw = (formData.get('tipo') as string) || tipoInteracao
    const tipo = tipoRaw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    formData.set('tipo', tipo)

    let resumo = (formData.get('resumo') as string) || ''

    if (tipo === 'ligacao') {
      const notas = formData.get('notas')
      if (notas) resumo += `\nNotas: ${notas}`
    } else if (tipo === 'email') {
      const assunto = formData.get('assunto')
      resumo = `Assunto: ${assunto}\nResumo: ${resumo}`
    } else if (tipo === 'reuniao') {
      const local = formData.get('local')
      const participantes = formData.get('participantes')
      resumo = `Local: ${local}\nParticipantes: ${participantes}\nResumo: ${resumo}`
    } else if (tipo === 'documento') {
      const tipoDoc = formData.get('tipo_documento_int')
      resumo = `Tipo de Documento: ${tipoDoc}\nDescrição: ${resumo}`
      const file = formData.get('arquivo') as File
      if (file && file.size > 10 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande (Max 10MB)', variant: 'destructive' })
        setIsSubmittingInteraction(false)
        return
      }
    }

    formData.set('resumo', resumo)
    formData.set('lead_id', lead.id)
    if (user?.id) {
      formData.set('usuario_id', user.id)
    }

    const file = formData.get('arquivo') as File
    if (file && file.size === 0) formData.delete('arquivo')

    // Clean up non-schema fields to avoid issues
    const duracao = formData.get('duracao_minutos')
    if (!duracao) formData.delete('duracao_minutos')

    formData.delete('notas')
    formData.delete('assunto')
    formData.delete('local')
    formData.delete('participantes')
    formData.delete('tipo_documento_int')

    try {
      const dataInteracaoRaw = formData.get('data_interacao') as string
      const dataInteracao = dataInteracaoRaw
        ? new Date(dataInteracaoRaw).toISOString()
        : new Date().toISOString()

      formData.set('data_interacao', dataInteracao)

      await pb.collection('interacoes_leads').create(formData)

      try {
        await pb.collection('leads').update(lead.id, {
          data_ultimo_contato: dataInteracao,
        })
      } catch (leadErr) {
        console.error('Erro ao atualizar data de último contato do lead:', leadErr)
      }

      toast({
        title: 'Interação registrada com sucesso',
        className: 'bg-green-600 text-white border-none',
      })
      form.reset()
      setTipoInteracao('ligacao')
      loadData()
    } catch (err: any) {
      console.error('Erro do PocketBase:', err)
      toast({
        title: 'Erro ao registrar a interação',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingInteraction(false)
    }
  }

  const deleteInteraction = async (intId: string) => {
    if (!confirm('Deseja realmente deletar esta interação?')) return
    try {
      await pb.collection('interacoes_leads').delete(intId)
      toast({ title: 'Interação deletada' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    }
  }

  const handleUploadDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('arquivo') as File
    if (!file || file.size === 0) {
      toast({ title: 'Selecione um arquivo', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande (Max 10MB)', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 90))
    }, 100)

    try {
      formData.append('lead_id', lead.id)
      formData.append('usuario_id', user.id)
      formData.append('data_upload', new Date().toISOString())

      await pb.collection('documentos_leads').create(formData)
      toast({ title: 'Documento salvo com sucesso' })
      form.reset()
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      clearInterval(interval)
      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const deleteDoc = async (docId: string) => {
    if (!confirm('Deseja realmente deletar este documento?')) return
    try {
      await pb.collection('documentos_leads').delete(docId)
      toast({ title: 'Documento deletado' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const getExportFilename = (ext: string) => {
    const userName = user?.name?.replace(/\s+/g, '_') || 'Usuario'
    const leadName = lead?.nome_lead?.replace(/\s+/g, '_') || 'Lead'
    const dInicio = lead?.created ? format(parseISO(lead.created), 'dd_MM_yyyy') : 'Inicio'
    const dFim = format(new Date(), 'dd_MM_yyyy')
    return `Detalhes_Lead_${leadName}_${dInicio}_a_${dFim}_${userName}.${ext}`
  }

  const handleExportPdf = async () => {
    const tableHtml = `
      <h3>Dados do Lead</h3>
      <table>
        <tbody>
          <tr><td style="width:20%"><strong>Nome</strong></td><td style="width:30%">${lead.nome_lead}</td><td style="width:20%"><strong>Empresa</strong></td><td style="width:30%">${lead.empresa_lead || '-'}</td></tr>
          <tr><td><strong>Email</strong></td><td>${lead.email || '-'}</td><td><strong>Telefone</strong></td><td>${lead.telefone || '-'}</td></tr>
          <tr><td><strong>Cargo</strong></td><td>${lead.cargo || '-'}</td><td><strong>Temperatura</strong></td><td style="text-transform: capitalize">${lead.temperatura || '-'}</td></tr>
          <tr><td><strong>Valor Estimado</strong></td><td>${formatCurrency(lead.valor_estimado)}</td><td><strong>Probabilidade</strong></td><td>${probabilidade}%</td></tr>
          <tr><td><strong>Etapa do Funil</strong></td><td style="text-transform: capitalize">${lead.etapa}</td><td><strong>Produto/Serviço</strong></td><td>${lead.expand?.servico_produto_id?.nome || '-'}</td></tr>
        </tbody>
      </table>
      <br/>
      <h3>Histórico de Interações</h3>
      <table>
        <thead><tr><th>Data</th><th>Tipo</th><th>Usuário</th><th>Resumo</th></tr></thead>
        <tbody>
          ${interactions.map((i) => `<tr><td>${format(new Date(i.data_interacao), 'dd/MM/yyyy HH:mm')}</td><td style="text-transform: capitalize">${i.tipo}</td><td>${i.expand?.usuario_id?.name || '-'}</td><td>${i.resumo}</td></tr>`).join('')}
          ${interactions.length === 0 ? '<tr><td colspan="4" class="text-center">Nenhuma interação registrada</td></tr>' : ''}
        </tbody>
      </table>
      <br/>
      <h3>Documentos</h3>
      <table>
        <thead><tr><th>Nome do Arquivo</th><th>Tipo</th><th>Data de Upload</th></tr></thead>
        <tbody>
          ${docs.map((d) => `<tr><td>${d.nome_arquivo}</td><td style="text-transform: capitalize">${d.tipo_documento}</td><td>${format(new Date(d.data_upload), 'dd/MM/yyyy')}</td></tr>`).join('')}
          ${docs.length === 0 ? '<tr><td colspan="3" class="text-center">Nenhum documento anexado</td></tr>' : ''}
        </tbody>
      </table>
    `

    await exportToPdf({
      filename: getExportFilename('pdf'),
      title: `Detalhes do Lead: ${lead.nome_lead}`,
      tableHtml,
      userName: user?.name || 'Usuário',
    })
  }

  const handleExportExcel = async () => {
    const dadosData = [
      ['Campo', 'Valor'],
      ['Nome do Lead', lead.nome_lead],
      ['Empresa', lead.empresa_lead || ''],
      ['Email', lead.email || ''],
      ['Telefone', lead.telefone || ''],
      ['Cargo', lead.cargo || ''],
      ['Valor Estimado', lead.valor_estimado || 0],
      ['Probabilidade (%)', probabilidade],
      ['Temperatura', lead.temperatura || ''],
      ['Etapa do Funil', lead.etapa || ''],
      ['Produto/Serviço', lead.expand?.servico_produto_id?.nome || ''],
      ['Data de Criação', format(parseISO(lead.created), 'dd/MM/yyyy HH:mm')],
    ]

    const interacoesData = [
      ['Data/Hora', 'Tipo', 'Usuário', 'Resumo', 'Duração (min)'],
      ...interactions.map((i) => [
        format(new Date(i.data_interacao), 'dd/MM/yyyy HH:mm'),
        i.tipo,
        i.expand?.usuario_id?.name || '',
        i.resumo,
        i.duracao_minutos || 0,
      ]),
    ]

    const documentosData = [
      ['Nome do Arquivo', 'Tipo', 'Data de Upload', 'Usuário'],
      ...docs.map((d) => [
        d.nome_arquivo,
        d.tipo_documento,
        format(new Date(d.data_upload), 'dd/MM/yyyy'),
        d.expand?.usuario_id?.name || '',
      ]),
    ]

    const metadataData = [
      ['Gerado em', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Usuário', user?.name || 'Sistema'],
      ['Empresa', 'Trend Consultoria'],
    ]

    exportToExcel(getExportFilename('xlsx'), [
      { name: 'Detalhes do Lead', data: dadosData },
      { name: 'Interações', data: interacoesData },
      { name: 'Documentos', data: documentosData },
      { name: 'Metadados', data: metadataData },
    ])
  }

  const handleExportCsv = async () => {
    const rows = [
      ['Data/Hora', 'Tipo', 'Usuário', 'Resumo', 'Duração (min)'],
      ...interactions.map((i) => [
        format(new Date(i.data_interacao), 'dd/MM/yyyy HH:mm'),
        i.tipo,
        i.expand?.usuario_id?.name || '',
        i.resumo,
        i.duracao_minutos || 0,
      ]),
    ]
    exportToCsv(getExportFilename('csv'), rows)
  }

  if (loadingLead) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="lg:col-span-2 h-[400px]" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground">
        <p>Lead não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/crm/funil-vendas')}>
          Voltar ao Funil
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10 px-4 md:px-8 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detalhes do Lead</h1>
            <p className="text-sm text-muted-foreground">Gestão completa do prospect</p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full md:w-auto">
          <ExportButtons
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
          />
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
            {!lead.cliente_id && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                onClick={() => setShowConvertAlert(true)}
              >
                <UserCheck className="h-4 w-4 mr-2" /> Converter
              </Button>
            )}
            <Button
              variant="destructive"
              className="flex-1 md:flex-none"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Deletar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="shadow-sm border-muted">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">{lead.nome_lead}</h2>
                <p className="text-sm text-muted-foreground">
                  {lead.empresa_lead || 'Sem empresa'} • {lead.cargo || 'Sem cargo'}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {lead.email || '-'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {lead.telefone || '-'}
                </div>
              </div>
              <div className="pt-4 border-t border-border space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Produto/Serviço</p>
                  <p className="text-sm font-medium text-primary">
                    {lead.expand?.servico_produto_id?.nome || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Valor Estimado</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(lead.valor_estimado)}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Probabilidade de Fechamento
                    </p>
                    <div
                      className={`w-3 h-3 rounded-full ${getTempColor(probabilidade)} shadow-sm`}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[probabilidade]}
                      max={100}
                      step={5}
                      onValueChange={(v) => setProbabilidade(v[0])}
                      onValueCommit={(v) => handleProbabilityChange(v[0])}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold w-10 text-right">{probabilidade}%</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Etapa do Funil</p>
                  <div className="relative inline-block">
                    <Select
                      value={lead.etapa}
                      onValueChange={handleEtapaChange}
                      disabled={isUpdatingEtapa}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-8 text-xs w-[180px] capitalize',
                          isUpdatingEtapa && 'opacity-50',
                        )}
                      >
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_ETAPAS.map((e) => (
                          <SelectItem key={e} value={e} className="capitalize">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isUpdatingEtapa && (
                      <Loader2 className="absolute right-[-24px] top-2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documentos Partilhados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form
                onSubmit={handleUploadDoc}
                className="space-y-3 bg-muted/30 p-3 rounded-md border shadow-sm"
              >
                <p className="text-xs font-semibold">Novo Documento</p>
                <Select name="tipo_documento" required defaultValue="proposta">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="briefing">Briefing</SelectItem>
                    <SelectItem value="apresentacao">Apresentação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="nome_arquivo"
                  placeholder="Nome do documento"
                  required
                  className="h-8 text-xs"
                />
                <Input
                  name="arquivo"
                  type="file"
                  required
                  className="h-8 text-xs cursor-pointer"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                {isUploading && <Progress value={uploadProgress} className="h-1.5" />}
                <Button
                  size="sm"
                  type="submit"
                  disabled={isUploading}
                  className="w-full h-8 text-xs bg-primary hover:bg-primary/90"
                >
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Fazer Upload'}
                </Button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-2 p-2.5 border rounded-md text-sm bg-card hover:border-primary/40 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col overflow-hidden">
                        <span
                          className="font-semibold text-[13px] truncate"
                          title={doc.nome_arquivo}
                        >
                          {doc.nome_arquivo}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {doc.tipo_documento} • {format(new Date(doc.data_upload), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                          asChild
                        >
                          <a
                            href={doc.arquivo ? pb.files.getUrl(doc, doc.arquivo) : doc.url_arquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteDoc(doc.id)}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {docs.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    Nenhum documento anexado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex-1 shadow-sm border-muted">
            <CardHeader className="pb-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Histórico de Interações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <form
                onSubmit={handleInteractionSubmit}
                className="space-y-4 bg-muted/20 p-5 rounded-lg border shadow-sm"
              >
                <h3 className="text-sm font-semibold mb-2">Registrar Nova Interação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
                    <Select
                      name="tipo"
                      value={tipoInteracao}
                      onValueChange={setTipoInteracao}
                      required
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="documento">Documento / Anexo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Data e Hora *
                    </label>
                    <Input
                      name="data_interacao"
                      type="datetime-local"
                      required
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {tipoInteracao === 'ligacao' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Duração (minutos)
                      </label>
                      <Input name="duracao_minutos" type="number" min="0" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Notas Adicionais
                      </label>
                      <Input
                        name="notas"
                        placeholder="Ex: Retornar mais tarde"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {tipoInteracao === 'email' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Assunto</label>
                    <Input name="assunto" className="h-9 text-sm" />
                  </div>
                )}

                {tipoInteracao === 'reuniao' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Local / Link
                      </label>
                      <Input name="local" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Participantes
                      </label>
                      <Input
                        name="participantes"
                        placeholder="Nomes separados por vírgula"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {tipoInteracao === 'documento' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tipo de Documento
                      </label>
                      <Select name="tipo_documento_int" defaultValue="outro">
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proposta">Proposta</SelectItem>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="apresentacao">Apresentação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Arquivo (Opcional - Max 10MB)
                      </label>
                      <Input name="arquivo" type="file" className="h-9 text-sm cursor-pointer" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Resumo / Detalhes *
                  </label>
                  <Textarea
                    name="resumo"
                    required
                    placeholder="Descreva os detalhes desta interação..."
                    className="resize-none h-20 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingInteraction}
                  className="w-full bg-primary hover:bg-primary/90 h-10"
                >
                  {isSubmittingInteraction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Salvar Interação
                </Button>
              </form>

              <div className="relative border-l-2 border-border ml-[11px] pl-6 space-y-8 pb-4">
                {interactions.map((int) => (
                  <div key={int.id} className="relative group">
                    <div className="absolute -left-[32px] top-1 h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center ring-2 ring-primary/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <div className="bg-card border rounded-lg p-4 shadow-sm group-hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                          {getIntIcon(int.tipo)}
                          <span className="font-semibold text-sm capitalize text-foreground">
                            {int.tipo}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
                          {format(new Date(int.data_interacao), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="text-[13px] text-foreground/85 mt-2 whitespace-pre-wrap leading-relaxed">
                        {int.resumo}
                      </div>

                      {int.duracao_minutos > 0 && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-2 bg-muted/30 inline-block px-2 py-0.5 rounded">
                          Duração: {int.duracao_minutos} min
                        </p>
                      )}

                      {int.arquivo && (
                        <div className="mt-3">
                          <a
                            href={pb.files.getUrl(int, int.arquivo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md border border-primary/10"
                          >
                            <FileText className="h-3.5 w-3.5" /> Acessar Anexo
                          </a>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[8px] font-bold">
                            {(int.expand?.usuario_id?.name || 'U')[0]}
                          </div>{' '}
                          {int.expand?.usuario_id?.name || 'Usuário'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteInteraction(int.id)}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {interactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma interação registrada</p>
                    <p className="text-xs">Registre a primeira interação acima.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showConvertAlert} onOpenChange={setShowConvertAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter Lead em Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso criará um novo registro de cliente com os dados do lead e marcará a etapa do lead
              como "fechou". Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvert}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Converter em Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar este lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600 font-medium">
              Atenção: Todas as interações e documentos associados também serão perdidos. Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditOpen && (
        <LeadForm lead={lead} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={loadData} />
      )}
    </div>
  )
}
