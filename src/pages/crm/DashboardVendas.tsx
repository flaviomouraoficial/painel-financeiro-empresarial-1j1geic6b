import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeads, getEtapasFunil, createInteracao } from '@/services/crm'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { parseISO, differenceInDays, isAfter, subDays, startOfYear } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Phone,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function Card({ className, children }: any) {
  return (
    <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}>
      {children}
    </div>
  )
}
function CardHeader({ className, children }: any) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
}
function CardTitle({ className, children }: any) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)}>{children}</h3>
}
function CardContent({ className, children }: any) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>
}

function InteractionModal({ lead, isOpen, onClose, onSuccess }: any) {
  const [tipo, setTipo] = useState('ligacao')
  const [resumo, setResumo] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createInteracao({
        lead_id: lead.id,
        tipo,
        resumo,
        data_interacao: new Date().toISOString(),
        usuario_id: pb.authStore.record?.id,
      })
      toast({ title: 'Interação registrada com sucesso!' })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Interação - {lead?.nome_lead}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ligacao">Ligação</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Resumo</Label>
            <Textarea
              required
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={4}
              placeholder="Descreva como foi o contato..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#268C83] text-white hover:bg-[#268C83]/90"
            >
              Salvar Interação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardVendas() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<any[]>([])
  const [etapas, setEtapas] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [periodFilter, setPeriodFilter] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [consultantFilter, setConsultantFilter] = useState('all')
  const [tempFilter, setTempFilter] = useState('all')
  const [interactionLead, setInteractionLead] = useState<any>(null)

  const loadData = async () => {
    try {
      const [l, e, u] = await Promise.all([
        getLeads(),
        getEtapasFunil(),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])
      setLeads(l)

      const uniqueEtapasMap = new Map()
      e.forEach((et) => {
        const key = et.nome_etapa.toLowerCase().trim()
        if (!uniqueEtapasMap.has(key)) {
          uniqueEtapasMap.set(key, et.nome_etapa)
        }
      })
      setEtapas(
        Array.from(uniqueEtapasMap.values()).map((name, i) => ({ nome_etapa: name, ordem: i })),
      )
      setUsuarios(u)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useRealtime('leads', loadData)

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (consultantFilter !== 'all' && l.consultor_id !== consultantFilter) return false

      const prob = l.probabilidade_fechamento || 0
      const temp = prob >= 70 ? 'quente' : prob >= 30 ? 'morna' : 'fria'
      if (tempFilter !== 'all' && temp !== tempFilter) return false

      if (periodFilter !== 'all') {
        const date = parseISO(l.created)
        const now = new Date()
        if (periodFilter === '7' && !isAfter(date, subDays(now, 7))) return false
        if (periodFilter === '30' && !isAfter(date, subDays(now, 30))) return false
        if (periodFilter === '90' && !isAfter(date, subDays(now, 90))) return false
        if (periodFilter === 'year' && !isAfter(date, startOfYear(now))) return false
        if (periodFilter === 'custom') {
          if (startDate && isAfter(parseISO(startDate), date)) return false
          if (endDate && isAfter(date, parseISO(endDate))) return false
        }
      }
      return true
    })
  }, [leads, periodFilter, startDate, endDate, consultantFilter, tempFilter])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  const openLeads = filteredLeads.filter((l) => l.etapa !== 'fechou' && l.etapa !== 'não fechou')
  const closedWonLeads = filteredLeads.filter((l) => l.etapa === 'fechou')

  const totalPipeline = openLeads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)
  const hotLeadsCount = openLeads.filter((l) => (l.probabilidade_fechamento || 0) >= 70).length
  const predictedValue = openLeads.reduce(
    (acc, l) => acc + ((l.valor_estimado || 0) * (l.probabilidade_fechamento || 0)) / 100,
    0,
  )
  const conversionRate =
    filteredLeads.length > 0 ? (closedWonLeads.length / filteredLeads.length) * 100 : 0

  let healthScore = 0
  if (openLeads.length > 0 && hotLeadsCount / openLeads.length > 0.3) healthScore += 25
  if (conversionRate > 20) healthScore += 25
  if (totalPipeline > 200000) healthScore += 25
  const staleLeads = openLeads.filter(
    (l) => differenceInDays(new Date(), parseISO(l.updated)) > 30,
  ).length
  if (staleLeads === 0 && openLeads.length > 0) healthScore += 25

  const leadsPropostaApresAnalise = openLeads.filter((l) => {
    const e = (l.etapa || '').toLowerCase().trim()
    return ['proposta', 'apresentação', 'análise'].includes(e)
  })
  const next30Days = leadsPropostaApresAnalise.reduce(
    (acc, l) => acc + ((l.valor_estimado || 0) * (l.probabilidade_fechamento || 0)) / 100,
    0,
  )

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const closedThisMonth = leads
    .filter(
      (l) =>
        l.etapa === 'fechou' &&
        parseISO(l.updated).getMonth() === currentMonth &&
        parseISO(l.updated).getFullYear() === currentYear &&
        (consultantFilter === 'all' || l.consultor_id === consultantFilter),
    )
    .reduce((acc, l) => acc + (l.valor_estimado || 0), 0)

  const closedThisYear = leads
    .filter(
      (l) =>
        l.etapa === 'fechou' &&
        parseISO(l.updated).getFullYear() === currentYear &&
        (consultantFilter === 'all' || l.consultor_id === consultantFilter),
    )
    .reduce((acc, l) => acc + (l.valor_estimado || 0), 0)

  // Charts
  const stagesMap = new Map()
  etapas.forEach((e) => {
    stagesMap.set(e.nome_etapa.toLowerCase().trim(), { name: e.nome_etapa, count: 0, value: 0 })
  })
  openLeads.forEach((l) => {
    const key = (l.etapa || '').toLowerCase().trim()
    if (stagesMap.has(key)) {
      const stage = stagesMap.get(key)
      stage.count += 1
      stage.value += l.valor_estimado || 0
    }
  })
  const stagesData = Array.from(stagesMap.values())

  const funnelData = stagesData
    .map((stage, index) => {
      let percentage = 100
      if (index > 0) {
        const prevCount = stagesData[index - 1].count
        percentage = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0
      }
      return {
        name: stage.name,
        value: stage.count,
        fill: '#268C83',
        label: `${stage.count} (${percentage}%)`,
      }
    })
    .filter((s) => s.value > 0)

  const tempCounts = { quente: 0, morna: 0, fria: 0 }
  openLeads.forEach((l) => {
    const prob = l.probabilidade_fechamento || 0
    if (prob >= 70) tempCounts.quente++
    else if (prob >= 30) tempCounts.morna++
    else tempCounts.fria++
  })
  const temperatureData = [
    { name: 'Quente', value: tempCounts.quente, fill: '#22c55e' },
    { name: 'Morna', value: tempCounts.morna, fill: '#eab308' },
    { name: 'Fria', value: tempCounts.fria, fill: '#ef4444' },
  ].filter((d) => d.value > 0)

  // Tables
  const consultantStats = new Map()
  usuarios.forEach((u) => {
    consultantStats.set(u.id, {
      name: u.name || u.email,
      leadsCount: 0,
      hotLeads: 0,
      pipelineValue: 0,
      closedValue: 0,
      wonCount: 0,
    })
  })
  filteredLeads.forEach((l) => {
    if (!l.consultor_id) return
    const stats = consultantStats.get(l.consultor_id)
    if (!stats) return
    stats.leadsCount++
    if (l.etapa === 'fechou') {
      stats.closedValue += l.valor_estimado || 0
      stats.wonCount++
    } else if (l.etapa !== 'não fechou') {
      stats.pipelineValue += l.valor_estimado || 0
      if ((l.probabilidade_fechamento || 0) >= 70) stats.hotLeads++
    }
  })
  const consultantTableData = Array.from(consultantStats.values())
    .filter((s) => s.leadsCount > 0)
    .map((s) => ({
      ...s,
      conversionRate: s.leadsCount > 0 ? (s.wonCount / s.leadsCount) * 100 : 0,
    }))
    .sort((a, b) => b.closedValue - a.closedValue)

  const leadsToClose = leadsPropostaApresAnalise
    .map((l) => ({ ...l, daysInStage: differenceInDays(new Date(), parseISO(l.updated)) }))
    .sort((a, b) => b.daysInStage - a.daysInStage)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise de pipeline e previsão de receitas em tempo real
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 bg-card p-3 rounded-lg border shadow-sm w-full xl:w-auto">
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground">Período (Criação)</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2 mb-[2px] w-full sm:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[130px] h-9"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[130px] h-9"
              />
            </div>
          )}
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground">Consultor</Label>
            <Select value={consultantFilter} onValueChange={setConsultantFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9">
                <SelectValue />
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
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground">Temperatura</Label>
            <Select value={tempFilter} onValueChange={setTempFilter}>
              <SelectTrigger className="w-full sm:w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="quente">Quente</SelectItem>
                <SelectItem value="morna">Morna</SelectItem>
                <SelectItem value="fria">Fria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 py-20 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Nenhum dado encontrado</h3>
          <p className="text-sm mb-4">Ajuste os filtros ou adicione um novo lead no funil.</p>
          <Button
            onClick={() => navigate('/crm/funil-vendas')}
            className="bg-[#268C83] hover:bg-[#268C83]/90 text-white"
          >
            Ir para o Funil
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total em Pipeline
                </CardTitle>
                <DollarSign className="h-4 w-4 text-[#268C83]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {openLeads.length} leads em aberto
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Leads Quentes
                </CardTitle>
                <Target className="h-4 w-4 text-[#268C83]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hotLeadsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Probabilidade &ge; 70%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Previsto
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-[#268C83]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(predictedValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Ponderado pela probabilidade</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </CardTitle>
                <Activity className="h-4 w-4 text-[#268C83]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {closedWonLeads.length} de {filteredLeads.length} leads
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Saúde do Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6 pt-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * healthScore) / 100}
                      className={cn(
                        'transition-all duration-1000',
                        healthScore >= 70
                          ? 'text-green-500'
                          : healthScore >= 40
                            ? 'text-yellow-500'
                            : 'text-red-500',
                      )}
                    />
                  </svg>
                  <div
                    className={cn(
                      'text-4xl font-bold',
                      healthScore >= 70
                        ? 'text-green-500'
                        : healthScore >= 40
                          ? 'text-yellow-500'
                          : 'text-red-500',
                    )}
                  >
                    {healthScore}
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground px-4">
                  Score baseado em conversão, volume, qualidade e agilidade.
                </p>
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Previsão de Receita (Fechamentos)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Próximos 30 dias (Etapas Finais)
                      </p>
                      <p className="text-3xl font-bold text-[#268C83]">
                        {formatCurrency(next30Days)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Próximos 90 dias (Todo Pipeline)
                      </p>
                      <p className="text-3xl font-bold text-[#268C83]">
                        {formatCurrency(predictedValue)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 sm:border-l sm:pl-8 border-border">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Fechado este Mês
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(closedThisMonth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Fechado este Ano
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(closedThisYear)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ count: { label: 'Leads', color: '#268C83' } }}
                  className="h-[300px] w-full"
                >
                  <BarChart data={stagesData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'var(--muted)' }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="count"
                        position="right"
                        fill="currentColor"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Valor por Etapa (R$)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ value: { label: 'Valor', color: '#268C83' } }}
                  className="h-[300px] w-full"
                >
                  <BarChart data={stagesData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis
                      tickFormatter={(val) => `R$ ${val / 1000}k`}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'var(--muted)' }}
                      content={
                        <ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />
                      }
                    />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <FunnelChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent formatter={(val, name, item) => item.payload.label} />
                      }
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList
                        position="center"
                        fill="#fff"
                        stroke="none"
                        dataKey="label"
                        fontSize={14}
                      />
                    </Funnel>
                  </FunnelChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Temperatura dos Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    quente: { color: '#22c55e' },
                    morna: { color: '#eab308' },
                    fria: { color: '#ef4444' },
                  }}
                  className="h-[300px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={temperatureData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {temperatureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Consultor</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3 font-medium rounded-tl-md">Consultor</th>
                      <th className="p-3 font-medium">Leads (Total)</th>
                      <th className="p-3 font-medium">Leads Quentes</th>
                      <th className="p-3 font-medium">Valor em Pipeline</th>
                      <th className="p-3 font-medium">Taxa Conv.</th>
                      <th className="p-3 font-medium rounded-tr-md">Valor Fechado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultantTableData.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">{c.leadsCount}</td>
                        <td className="p-3">{c.hotLeads}</td>
                        <td className="p-3">{formatCurrency(c.pipelineValue)}</td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              c.conversionRate > 20 ? 'bg-green-100 text-green-800' : 'bg-muted',
                            )}
                          >
                            {c.conversionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 font-bold text-[#268C83]">
                          {formatCurrency(c.closedValue)}
                        </td>
                      </tr>
                    ))}
                    {consultantTableData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          Nenhum dado encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Leads por Fechar (Próximos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3 font-medium rounded-tl-md">Lead</th>
                      <th className="p-3 font-medium">Etapa</th>
                      <th className="p-3 font-medium">Valor Estimado</th>
                      <th className="p-3 font-medium">Prob.</th>
                      <th className="p-3 font-medium">Dias na Etapa</th>
                      <th className="p-3 font-medium rounded-tr-md text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsToClose.map((l, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td
                          className="p-3 font-medium cursor-pointer hover:underline text-[#268C83]"
                          onClick={() => navigate(`/crm/leads/${l.id}/detalhes`)}
                        >
                          {l.nome_lead}
                        </td>
                        <td className="p-3 uppercase text-xs">{l.etapa}</td>
                        <td className="p-3">{formatCurrency(l.valor_estimado)}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              (l.probabilidade_fechamento || 0) >= 70
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800',
                            )}
                          >
                            {l.probabilidade_fechamento}%
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              l.daysInStage >= 30
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : l.daysInStage >= 15
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-green-100 text-green-800 border-green-200',
                            )}
                          >
                            {l.daysInStage} dias
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInteractionLead(l)}
                            className="text-[#268C83]"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Acompanhar
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {leadsToClose.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          Nenhum lead nas etapas finais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {interactionLead && (
        <InteractionModal
          lead={interactionLead}
          isOpen={!!interactionLead}
          onClose={() => setInteractionLead(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
