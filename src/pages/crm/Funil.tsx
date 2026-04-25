import { useEffect, useState } from 'react'
import { getLeads, getEtapasFunil, updateLead } from '@/services/crm'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { LeadDetails } from '@/components/crm/lead-details'
import { useToast } from '@/hooks/use-toast'

const FALLBACK_ETAPAS = [
  'prospecção',
  'contato',
  'briefing',
  'proposta',
  'apresentação',
  'análise',
  'fechou',
  'não fechou',
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Funil() {
  const [leads, setLeads] = useState<any[]>([])
  const [etapas, setEtapas] = useState<string[]>(FALLBACK_ETAPAS)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const { toast } = useToast()

  const loadData = async () => {
    const [l, e] = await Promise.all([getLeads(), getEtapasFunil()])
    setLeads(l)
    if (e.length > 0) setEtapas(e.map((et) => et.nome_etapa))
  }

  const leadsAtivos = leads.filter((l) => l.etapa !== 'fechou' && l.etapa !== 'não fechou')
  const totalNegociacao = leadsAtivos.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)
  const leadsFechados = leads.filter((l) => l.etapa === 'fechou')
  const taxaConversao = leads.length > 0 ? (leadsFechados.length / leads.length) * 100 : 0
  const leadsProposta = leads.filter((l) => l.etapa === 'proposta')
  const valorProposta = leadsProposta.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', () => loadData())

  const handleDragStart = (e: React.DragEvent, id: string) =>
    e.dataTransfer.setData('text/plain', id)

  const handleDrop = async (e: React.DragEvent, novaEtapa: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      const lead = leads.find((l) => l.id === id)
      if (lead && lead.etapa !== novaEtapa) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, etapa: novaEtapa } : l)))
        try {
          await updateLead(id, { etapa: novaEtapa })
        } catch (err: any) {
          toast({ title: 'Erro ao mover', description: err.message, variant: 'destructive' })
          loadData() // rollback
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie o fluxo dos seus leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Negociação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNegociacao)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor em Proposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorProposta)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {etapas.map((etapa) => {
          const colLeads = leads.filter(
            (l) => (l.etapa || '').toLowerCase() === etapa.toLowerCase(),
          )
          const totalValor = colLeads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)

          return (
            <div
              key={etapa}
              className="min-w-[300px] w-[300px] bg-muted/40 rounded-lg p-3 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-sm uppercase tracking-wider flex items-center justify-between">
                  {etapa}
                  <Badge variant="secondary">{colLeads.length}</Badge>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {formatCurrency(totalValor)}
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div
                  className="flex flex-col gap-2 min-h-[200px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, etapa)}
                >
                  {colLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors bg-card"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">{lead.nome_lead}</CardTitle>
                        <CardDescription className="text-xs">{lead.empresa_lead}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 flex justify-between items-center mt-2">
                        <span className="font-medium text-primary text-xs">
                          {formatCurrency(lead.valor_estimado)}
                        </span>
                        <Badge
                          className="text-[10px] px-1.5 py-0 border-none"
                          style={{
                            backgroundColor:
                              lead.temperatura === 'quente'
                                ? '#ef4444'
                                : lead.temperatura === 'morna'
                                  ? '#f97316'
                                  : '#3b82f6',
                            color: '#fff',
                          }}
                        >
                          {lead.temperatura || 'N/A'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
      <LeadDetails
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(v: boolean) => !v && setSelectedLead(null)}
      />
    </div>
  )
}
