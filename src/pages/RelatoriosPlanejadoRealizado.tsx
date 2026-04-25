import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Download, AlertCircle, FileX2, ArrowUp, ArrowDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { PeriodSelector } from '@/components/ui/period-selector'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export default function RelatoriosPlanejadoRealizado() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [periodoPreset, setPeriodoPreset] = useState('mes_atual')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [agrupamento, setAgrupamento] = useState('projeto')

  const fetchPlanejadoRealizado = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return
    }

    const dataInicio = format(dateRange.from, 'yyyy-MM-dd')
    const dataFim = format(dateRange.to, 'yyyy-MM-dd')

    if (dataFim < dataInicio) {
      toast.error('Período inválido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const user = pb.authStore.record
      if (!user) throw new Error('Não autenticado')

      const [contasReceber, contasPagar, lancamentos] = await Promise.all([
        pb.collection('contas_receber').getFullList({
          filter: `empresa_id = "${user.empresa_id}" && data_vencimento >= "${dataInicio} 00:00:00" && data_vencimento <= "${dataFim} 23:59:59"`,
          expand: 'projeto_id',
        }),
        pb.collection('contas_pagar').getFullList({
          filter: `empresa_id = "${user.empresa_id}" && data_vencimento >= "${dataInicio} 00:00:00" && data_vencimento <= "${dataFim} 23:59:59"`,
          expand: 'projeto_id,centro_custo_id',
        }),
        pb.collection('lancamentos').getFullList({
          filter: `empresa_id = "${user.empresa_id}" && status = "confirmado" && data_lancamento >= "${dataInicio} 00:00:00" && data_lancamento <= "${dataFim} 23:59:59"`,
          expand: 'projeto_id,centro_custo_id,categoria_id',
        }),
      ])

      if (contasReceber.length === 0 && contasPagar.length === 0 && lancamentos.length === 0) {
        setData({ empty: true })
        setLoading(false)
        return
      }

      const grouped: Record<string, any> = {}

      const getGroupKey = (item: any, type: 'receber' | 'pagar' | 'lancamento') => {
        if (agrupamento === 'projeto') return item.expand?.projeto_id?.nome || 'Sem Projeto'
        if (agrupamento === 'centro_custo') {
          if (type === 'receber') return 'Sem Centro de Custo'
          return item.expand?.centro_custo_id?.nome || 'Sem Centro de Custo'
        }
        if (agrupamento === 'categoria') {
          if (type === 'lancamento') return item.expand?.categoria_id?.nome || 'Sem Categoria'
          return 'Sem Categoria'
        }
        if (agrupamento === 'periodo') {
          const dateStr = type === 'lancamento' ? item.data_lancamento : item.data_vencimento
          return dateStr
            ? format(new Date(dateStr.substring(0, 10) + 'T00:00:00'), 'MM/yyyy')
            : 'Sem Data'
        }
        return 'Outros'
      }

      contasReceber.forEach((c) => {
        const key = getGroupKey(c, 'receber')
        if (!grouped[key])
          grouped[key] = {
            name: key,
            planejadoRec: 0,
            realizadoRec: 0,
            planejadoDes: 0,
            realizadoDes: 0,
            tipoCat: 'receita',
          }
        grouped[key].planejadoRec += c.valor_total || 0
      })

      contasPagar.forEach((c) => {
        const key = getGroupKey(c, 'pagar')
        if (!grouped[key])
          grouped[key] = {
            name: key,
            planejadoRec: 0,
            realizadoRec: 0,
            planejadoDes: 0,
            realizadoDes: 0,
            tipoCat: 'despesa',
          }
        grouped[key].planejadoDes += c.valor_total || 0
      })

      lancamentos.forEach((l) => {
        const key = getGroupKey(l, 'lancamento')
        if (!grouped[key])
          grouped[key] = {
            name: key,
            planejadoRec: 0,
            realizadoRec: 0,
            planejadoDes: 0,
            realizadoDes: 0,
            tipoCat: l.tipo,
          }
        if (l.tipo === 'receita') {
          grouped[key].realizadoRec += l.valor || 0
          grouped[key].tipoCat = 'receita'
        } else {
          grouped[key].realizadoDes += l.valor || 0
          if (grouped[key].tipoCat !== 'receita') grouped[key].tipoCat = 'despesa'
        }
      })

      const chartData: any[] = []
      let totalPlanejado = 0
      let totalRealizado = 0
      const isCategoria = agrupamento === 'categoria'

      const rows = Object.values(grouped).map((g) => {
        let planejado = g.planejadoRec - g.planejadoDes
        let realizado = g.realizadoRec - g.realizadoDes
        if (isCategoria) {
          planejado = g.tipoCat === 'receita' ? g.planejadoRec : g.planejadoDes
          realizado = g.tipoCat === 'receita' ? g.realizadoRec : g.realizadoDes
        }

        const diff = realizado - planejado
        const perc = planejado !== 0 ? (diff / Math.abs(planejado)) * 100 : 0

        if (isCategoria) {
          totalPlanejado += g.tipoCat === 'receita' ? planejado : -planejado
          totalRealizado += g.tipoCat === 'receita' ? realizado : -realizado
        } else {
          totalPlanejado += planejado
          totalRealizado += realizado
        }

        chartData.push({ name: g.name, Planejado: planejado, Realizado: realizado })
        return { ...g, planejado, realizado, diff, perc }
      })

      setData({
        empty: false,
        rows,
        chartData,
        totalDiff: totalRealizado - totalPlanejado,
        totalPerc:
          totalPlanejado !== 0
            ? ((totalRealizado - totalPlanejado) / Math.abs(totalPlanejado)) * 100
            : 0,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const exportarCsv = () => {
    if (!data || data.empty) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (agrupamento === 'categoria') {
      csvContent += 'Categoria,Tipo,Planejado,Realizado,Diferenca,Variacao\n'
      data.rows.forEach((r: any) => {
        csvContent += `${r.name},${r.tipoCat},${r.planejado},${r.realizado},${r.diff},${r.perc}\n`
      })
    } else {
      csvContent +=
        'Nome,Receitas Plan,Receitas Real,Receitas Diff,Despesas Plan,Despesas Real,Despesas Diff,Resultado Plan,Resultado Real,Resultado Diff\n'
      data.rows.forEach((r: any) => {
        csvContent += `${r.name},${r.planejadoRec},${r.realizadoRec},${r.realizadoRec - r.planejadoRec},${-r.planejadoDes},${-r.realizadoDes},${-(r.realizadoDes - r.planejadoDes)},${r.planejadoRec - r.planejadoDes},${r.realizadoRec - r.realizadoDes},${r.diff}\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `PlanejadoRealizado_${dataInicio}_a_${dataFim}.csv`)
    document.body.appendChild(link)
    link.click()
    const dataInicio = format(dateRange?.from || new Date(), 'yyyy-MM-dd')
    const dataFim = format(dateRange?.to || new Date(), 'yyyy-MM-dd')
    document.body.removeChild(link)
    toast.success('CSV gerado com sucesso')
  }

  useEffect(() => {
    fetchPlanejadoRealizado()
  }, [dateRange])
  const isCategoria = agrupamento === 'categoria'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planejado x Realizado</h1>
          <p className="text-muted-foreground text-sm">Comparativo de metas e orçamentos reais</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            date={dateRange}
            setDate={setDateRange}
            preset={periodoPreset}
            setPreset={setPeriodoPreset}
          />
          <Select value={agrupamento} onValueChange={setAgrupamento}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="projeto">Projeto</SelectItem>
              <SelectItem value="centro_custo">Centro de Custo</SelectItem>
              <SelectItem value="categoria">Categoria</SelectItem>
              <SelectItem value="periodo">Período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchPlanejadoRealizado}
            className="bg-[#268C83] hover:bg-teal-700 text-white"
          >
            Gerar Relatório
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loading || !data || data.empty}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarCsv}>Exportar CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px] w-full md:col-span-2" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full md:col-span-3" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <Button
            onClick={fetchPlanejadoRealizado}
            variant="outline"
            className="mt-4 border-red-200 hover:bg-red-100"
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {data?.empty && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <FileX2 className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum lançamento registrado neste período
          </p>
          <Button
            onClick={() => {
              setPeriodoPreset('mes_atual')
              setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
            }}
            variant="outline"
            className="mt-4"
          >
            Voltar
          </Button>
        </div>
      )}

      {data && !data.empty && !loading && !error && (
        <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Comparativo ({agrupamento.replace('_', ' ')})</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Planejado: { label: 'Planejado', color: '#268C83' },
                  Realizado: { label: 'Realizado', color: '#10B981' },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={data.chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <RechartsTooltip
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />
                    }
                  />
                  <Legend />
                  <Bar dataKey="Planejado" fill="var(--color-Planejado)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizado" fill="var(--color-Realizado)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#268C83] text-white border-none">
            <CardHeader>
              <CardTitle className="text-white/90">Variação de Resultado Global</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <div className="text-4xl font-bold flex items-center mb-2">
                {data.totalPerc > 0 ? (
                  <ArrowUp className="mr-2 h-8 w-8 text-green-300" />
                ) : data.totalPerc < 0 ? (
                  <ArrowDown className="mr-2 h-8 w-8 text-red-300" />
                ) : null}
                {Math.abs(data.totalPerc).toFixed(2)}%
              </div>
              <div className="text-teal-100 text-sm bg-white/10 px-3 py-1 rounded-full">
                {formatCurrency(data.totalDiff)}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Detalhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  {isCategoria ? (
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Categoria</th>
                        <th className="px-4 py-3 font-medium text-right">Planejado</th>
                        <th className="px-4 py-3 font-medium text-right">Realizado</th>
                        <th className="px-4 py-3 font-medium text-right">Diferença</th>
                        <th className="px-4 py-3 font-medium text-right">Variação</th>
                      </tr>
                    </thead>
                  ) : (
                    <thead className="bg-muted/50 border-b text-xs">
                      <tr>
                        <th rowSpan={2} className="px-4 py-2 border-r font-medium">
                          Nome
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center border-r font-medium">
                          Receitas
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center border-r font-medium">
                          Despesas
                        </th>
                        <th colSpan={3} className="px-4 py-2 text-center font-medium">
                          Resultado
                        </th>
                      </tr>
                      <tr className="border-t">
                        <th className="px-2 py-2 text-right">Plan</th>
                        <th className="px-2 py-2 text-right">Real</th>
                        <th className="px-2 py-2 text-right border-r">Diff</th>
                        <th className="px-2 py-2 text-right">Plan</th>
                        <th className="px-2 py-2 text-right">Real</th>
                        <th className="px-2 py-2 text-right border-r">Diff</th>
                        <th className="px-2 py-2 text-right">Plan</th>
                        <th className="px-2 py-2 text-right">Real</th>
                        <th className="px-2 py-2 text-right">Diff</th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y">
                    {data.rows.map((row: any, i: number) => {
                      if (isCategoria) {
                        const isGood = row.tipoCat === 'receita' ? row.diff >= 0 : row.diff <= 0
                        return (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-4 py-3">
                              {row.name}{' '}
                              <span className="text-xs text-muted-foreground">({row.tipoCat})</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(row.planejado)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(row.realizado)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right ${isGood ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(row.diff)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {row.perc.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      } else {
                        const recDiff = row.realizadoRec - row.planejadoRec
                        const desDiff = row.realizadoDes - row.planejadoDes
                        const resDiff = row.diff
                        return (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-4 py-3 border-r font-medium">{row.name}</td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.planejadoRec)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.realizadoRec)}
                            </td>
                            <td
                              className={`px-2 py-2 text-right border-r ${recDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(recDiff)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.planejadoDes)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.realizadoDes)}
                            </td>
                            <td
                              className={`px-2 py-2 text-right border-r ${desDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(desDiff)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.planejadoRec - row.planejadoDes)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(row.realizadoRec - row.realizadoDes)}
                            </td>
                            <td
                              className={`px-2 py-2 text-right font-bold ${resDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(resDiff)}
                            </td>
                          </tr>
                        )
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
