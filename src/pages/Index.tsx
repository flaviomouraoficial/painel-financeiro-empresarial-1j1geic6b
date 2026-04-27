import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  PlusCircle,
  RefreshCcw,
  Wallet,
  Activity,
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Link } from 'react-router-dom'

import pb from '@/lib/pocketbase/client'
import useRealtime from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend as RechartsLegend,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

type DashboardData = {
  saldoTotal: number
  receitas: number
  despesas: number
  lucro: number
  lancamentos: any[]
  contasReceberVencidas: { count: number; total: number }
  contasPagarVencidas: { count: number; total: number }
}

const COLORS = ['#268C83', '#2A9D8F', '#48B5A3', '#66CCB8', '#85E3CD']

export default function Index() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const user = pb.authStore.record
      if (!user) return

      const empresaFilter = `empresa_id = "${user.empresa_id}"`

      const from = dateRange?.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const to = dateRange?.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd')

      const [bancarias, lancamentos, receber, pagar] = await Promise.all([
        pb.collection('contas_bancarias').getFullList({
          filter: empresaFilter,
        }),
        pb.collection('lancamentos').getFullList({
          filter: `${empresaFilter} && data_lancamento >= '${from} 00:00:00' && data_lancamento <= '${to} 23:59:59'`,
          expand: 'categoria_id',
          sort: '-data_lancamento',
        }),
        pb.collection('contas_receber').getFullList({
          filter: `${empresaFilter} && status = 'vencida'`,
        }),
        pb.collection('contas_pagar').getFullList({
          filter: `${empresaFilter} && status = 'vencida'`,
        }),
      ])

      const saldoTotal = bancarias.reduce((acc, curr) => acc + (curr.saldo_atual || 0), 0)
      const receitas = lancamentos
        .filter((l) => l.tipo === 'receita')
        .reduce((acc, curr) => acc + (curr.valor || 0), 0)
      const despesas = lancamentos
        .filter((l) => l.tipo === 'despesa')
        .reduce((acc, curr) => acc + (curr.valor || 0), 0)
      const lucro = receitas - despesas

      setData({
        saldoTotal,
        receitas,
        despesas,
        lucro,
        lancamentos,
        contasReceberVencidas: {
          count: receber.length,
          total: receber.reduce((acc, curr) => acc + (curr.valor_total || 0), 0),
        },
        contasPagarVencidas: {
          count: pagar.length,
          total: pagar.reduce((acc, curr) => acc + (curr.valor_total || 0), 0),
        },
      })
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError('Ocorreu um erro ao carregar os dados do dashboard.')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    setLoading(true)
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  useRealtime(
    'lancamentos',
    () => {
      loadData()
    },
    !loading,
  )
  useRealtime(
    'contas_bancarias',
    () => {
      loadData()
    },
    !loading,
  )
  useRealtime(
    'contas_receber',
    () => {
      loadData()
    },
    !loading,
  )
  useRealtime(
    'contas_pagar',
    () => {
      loadData()
    },
    !loading,
  )

  const dailyData = useMemo(() => {
    if (!data) return []
    const daysMap: Record<string, { day: string; receitas: number; despesas: number }> = {}

    if (dateRange?.from && dateRange?.to) {
      let current = new Date(dateRange.from)
      const end = new Date(dateRange.to)
      while (current <= end) {
        const dayStr = format(current, 'dd/MM')
        daysMap[dayStr] = { day: dayStr, receitas: 0, despesas: 0 }
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    data.lancamentos.forEach((l) => {
      if (!l.data_lancamento) return
      const dateObj = parseISO(l.data_lancamento)
      const dayStr = format(dateObj, 'dd/MM')
      if (daysMap[dayStr]) {
        if (l.tipo === 'receita') daysMap[dayStr].receitas += l.valor
        if (l.tipo === 'despesa') daysMap[dayStr].despesas += l.valor
      }
    })

    return Object.values(daysMap)
  }, [data, dateRange])

  const expenseDistribution = useMemo(() => {
    if (!data) return []
    const catMap: Record<string, number> = {}
    let total = 0

    data.lancamentos.forEach((l) => {
      if (l.tipo === 'despesa') {
        const catName = l.expand?.categoria_id?.nome || 'Sem Categoria'
        catMap[catName] = (catMap[catName] || 0) + l.valor
        total += l.valor
      }
    })

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [data])

  const recentTransactions = data?.lancamentos.slice(0, 10) || []

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-fade-in-up">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-[24px] font-semibold text-gray-900">{error}</h2>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold tracking-tight text-gray-900">
              Visão Geral Financeira
            </h1>
            {loading && <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-[16px] text-muted-foreground">
            Monitore a saúde financeira da sua empresa em tempo real.
            {lastUpdated && (
              <span className="ml-2 text-[12px] text-gray-400">
                (Atualizado às {format(lastUpdated, 'HH:mm:ss')})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[260px] justify-start text-left font-normal border-gray-200 shadow-sm',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd 'de' MMM, yyyy", { locale: ptBR })} -{' '}
                      {format(dateRange.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd 'de' MMM, yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[16px] font-medium text-gray-600">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 text-[#268C83]" />
            </CardHeader>
            <CardContent>
              <div className="text-[24px] font-bold text-gray-900">
                {formatCurrency(data!.saldoTotal)}
              </div>
              <p className="text-[14px] text-muted-foreground mt-1">Em todas as contas bancárias</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[16px] font-medium text-gray-600">Receitas</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-[24px] font-bold text-gray-900">
                {formatCurrency(data!.receitas)}
              </div>
              <p className="text-[14px] text-muted-foreground mt-1">No período selecionado</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[16px] font-medium text-gray-600">Despesas</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-[24px] font-bold text-gray-900">
                {formatCurrency(data!.despesas)}
              </div>
              <p className="text-[14px] text-muted-foreground mt-1">No período selecionado</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[16px] font-medium text-gray-600">Lucro</CardTitle>
              <DollarSign
                className={cn('h-4 w-4', data!.lucro >= 0 ? 'text-green-500' : 'text-red-500')}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-[24px] font-bold',
                  data!.lucro >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatCurrency(data!.lucro)}
              </div>
              <p className="text-[14px] text-muted-foreground mt-1">Receitas - Despesas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading &&
        data &&
        (data.contasReceberVencidas.count > 0 || data.contasPagarVencidas.count > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.contasReceberVencidas.count > 0 && (
              <Card className="bg-red-50 border border-red-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-800 text-[16px] font-medium flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> Contas a Receber Vencidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[24px] font-bold text-red-900">
                    {formatCurrency(data.contasReceberVencidas.total)}
                  </div>
                  <p className="text-[14px] text-red-700">
                    {data.contasReceberVencidas.count} título(s) atrasado(s)
                  </p>
                </CardContent>
              </Card>
            )}
            {data.contasPagarVencidas.count > 0 && (
              <Card className="bg-red-50 border border-red-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-800 text-[16px] font-medium flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> Contas a Pagar Vencidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[24px] font-bold text-red-900">
                    {formatCurrency(data.contasPagarVencidas.total)}
                  </div>
                  <p className="text-[14px] text-red-700">
                    {data.contasPagarVencidas.count} título(s) atrasado(s)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[350px] w-full rounded-xl bg-gray-200" />
          <Skeleton className="h-[350px] w-full rounded-xl bg-gray-200" />
        </div>
      ) : data?.lancamentos.length === 0 ? (
        <Card className="bg-white border border-gray-200 border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center h-[300px] gap-4">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <p className="text-[16px] font-medium text-gray-900">
              Nenhum lançamento nos últimos 30 dias
            </p>
            <Button asChild className="bg-[#268C83] hover:bg-[#207A72]">
              <Link to="/lancamentos">
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Lançamento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[16px] text-gray-900 font-semibold">
                Receitas vs Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer
                  config={{
                    receitas: { label: 'Receitas', color: '#3b82f6' },
                    despesas: { label: 'Despesas', color: '#ef4444' },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(val) => `R$ ${val / 1000}k`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <RechartsLegend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar
                        dataKey="receitas"
                        name="Receitas"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="despesas"
                        name="Despesas"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[16px] text-gray-900 font-semibold">
                Distribuição de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseDistribution.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {expenseDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <RechartsLegend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          formatter={(value, entry: any) => (
                            <span className="text-[14px] text-gray-700">
                              {value} ({entry.payload.percentage})
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[14px] text-muted-foreground">
                  Sem dados de despesas no período.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-[400px] w-full rounded-xl bg-gray-200" />
      ) : (
        data &&
        data.lancamentos.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-[16px] text-gray-900 font-semibold">
                Últimos Lançamentos
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentTransactions.map((l, idx) => (
                    <tr
                      key={l.id}
                      className={cn(
                        'hover:bg-gray-100 transition-colors',
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {l.data_lancamento
                          ? format(parseISO(l.data_lancamento), 'dd/MM/yyyy')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{l.descricao || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {l.expand?.categoria_id?.nome || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium',
                            l.tipo === 'receita'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800',
                          )}
                        >
                          {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'px-6 py-4 whitespace-nowrap text-right font-medium',
                          l.tipo === 'receita' ? 'text-blue-600' : 'text-red-600',
                        )}
                      >
                        {l.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
