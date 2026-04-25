import { useEffect, useState, useMemo } from 'react'
import { getLeads, getEtapasFunil, updateLead } from '@/services/crm'
import { useRealtime } from '@/hooks/use-realtime'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LeadDetails } from '@/components/crm/lead-details'
import { LeadForm } from '@/components/crm/lead-form'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'
import { Loader2, Plus, ArrowRight, FolderOpen, User2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase/client'
import { subDays, isAfter, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

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

export default function Funil() {
  const [leads, setLeads] = useState<any[]>([])
  const [etapas, setEtapas] = useState<string[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  const [tempFilter, setTempFilter] = useState('all')
  const [consultantFilter, setConsultantFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const loadData = async () => {
    try {
      const [l, e, u] = await Promise.all([
        getLeads(),
        getEtapasFunil(),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])
      setLeads(l)
      if (e.length > 0) setEtapas(e.map((et) => et.nome_etapa))
      else setEtapas(FALLBACK_ETAPAS)
      setUsuarios(u)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('leads', () => loadData())

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDrop = async (e: React.DragEvent, novaEtapa: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      const lead = leads.find((l) => l.id === id)
      if (lead && lead.etapa !== novaEtapa) {
        const originalEtapa = lead.etapa
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, etapa: novaEtapa } : l)))
        setMovingLeadId(id)
        try {
          await updateLead(id, { etapa: novaEtapa })
          toast({
            title: 'Sucesso',
            description: `Lead movido para ${novaEtapa}`,
            className: 'bg-green-600 text-white border-none',
          })
        } catch (err: any) {
          toast({ title: 'Erro ao mover', description: err.message, variant: 'destructive' })
          setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, etapa: originalEtapa } : l)))
        } finally {
          setMovingLeadId(null)
        }
      }
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (tempFilter !== 'all' && l.temperatura !== tempFilter) return false
      if (consultantFilter !== 'all' && l.consultor_id !== consultantFilter) return false

      if (periodFilter !== 'all') {
        const date = parseISO(l.created)
        const now = new Date()
        if (periodFilter === '7' && !isAfter(date, subDays(now, 7))) return false
        if (periodFilter === '30' && !isAfter(date, subDays(now, 30))) return false
        if (periodFilter === '90' && !isAfter(date, subDays(now, 90))) return false
      }
      return true
    })
  }, [leads, tempFilter, consultantFilter, periodFilter])

  const clearFilters = () => {
    setTempFilter('all')
    setConsultantFilter('all')
    setPeriodFilter('all')
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-[300px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
          <p className="text-muted-foreground text-sm">Gerencie o fluxo dos seus leads</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#268C83] hover:bg-[#268C83]/90 text-white h-11 px-6"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-wrap items-end gap-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Temperatura</label>
          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="quente">Quente (≥ 70%)</SelectItem>
              <SelectItem value="morna">Morna (30-69%)</SelectItem>
              <SelectItem value="fria">Fria (&lt; 30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Consultor</label>
          <Select value={consultantFilter} onValueChange={setConsultantFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Período</label>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={clearFilters} className="h-9">
            Limpar Filtros
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Nenhum lead no funil</h3>
          <p className="text-sm mb-4">
            Comece adicionando seu primeiro lead para acompanhar suas vendas.
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#268C83] hover:bg-[#268C83]/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Lead
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1 rounded-lg border bg-muted/10">
          <div className="flex gap-4 p-4 h-full min-w-max">
            {etapas.map((etapa) => {
              const colLeads = filteredLeads.filter(
                (l) => (l.etapa || '').toLowerCase() === etapa.toLowerCase(),
              )
              const totalValor = colLeads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)
              const mediaProb =
                colLeads.length > 0
                  ? colLeads.reduce((acc, l) => acc + (l.probabilidade_fechamento || 0), 0) /
                    colLeads.length
                  : 0

              return (
                <div
                  key={etapa}
                  className="w-[300px] flex flex-col bg-muted/30 rounded-xl border border-border/50 overflow-hidden shadow-sm"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, etapa)}
                >
                  <div className="p-3 bg-card border-b">
                    <div className="font-semibold text-sm uppercase tracking-wider flex items-center justify-between mb-2">
                      {etapa}
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {colLeads.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-primary">{formatCurrency(totalValor)}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            mediaProb >= 70
                              ? 'bg-green-500'
                              : mediaProb >= 30
                                ? 'bg-yellow-500'
                                : 'bg-red-500',
                          )}
                        />
                        {mediaProb.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[150px]">
                    {colLeads.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-8">
                        <FolderOpen className="h-8 w-8 mb-2" />
                        <span className="text-xs">Nenhum lead nesta etapa</span>
                      </div>
                    ) : (
                      colLeads.map((lead) => {
                        const prob = lead.probabilidade_fechamento || 0
                        const isHot = prob >= 70
                        const isWarm = prob >= 30 && prob < 70

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className="relative group bg-card border rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing p-3 min-h-[120px] flex flex-col"
                          >
                            {movingLeadId === lead.id && (
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}

                            <div className="flex justify-between items-start mb-1">
                              <h4
                                className="font-bold text-sm leading-tight text-foreground/90 truncate pr-4"
                                title={lead.nome_lead}
                              >
                                {lead.nome_lead}
                              </h4>
                              <div
                                className={cn(
                                  'absolute right-3 top-3 w-3 h-3 rounded-full border border-white/50 shadow-sm',
                                  isHot ? 'bg-green-500' : isWarm ? 'bg-yellow-500' : 'bg-red-500',
                                )}
                                title={`${prob}% probabilidade`}
                              />
                            </div>

                            <div className="text-xs text-muted-foreground mb-2 truncate">
                              {lead.empresa_lead || 'Sem empresa'}
                            </div>

                            {lead.expand?.servico_produto_id && (
                              <div className="text-[11px] bg-muted inline-flex px-1.5 py-0.5 rounded text-muted-foreground mb-2 w-fit max-w-full truncate">
                                {lead.expand.servico_produto_id.nome}
                              </div>
                            )}

                            <div className="mt-auto pt-2 border-t flex flex-col gap-1.5">
                              <div className="font-bold text-sm text-[#268C83]">
                                {formatCurrency(lead.valor_estimado)}
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1 truncate max-w-[120px]">
                                  <User2 className="h-3 w-3" />
                                  <span className="truncate">
                                    {lead.expand?.consultor_id?.name?.split(' ')[0] ||
                                      'Não atribuído'}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLead(lead)
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {selectedLead && (
        <LeadDetails
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(v: boolean) => {
            if (!v) setSelectedLead(null)
          }}
          onUpdated={loadData}
        />
      )}

      <LeadForm open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={loadData} />
    </div>
  )
}
