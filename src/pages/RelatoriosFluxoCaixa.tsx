import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
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
import { LineChart, Line, XAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Download, AlertCircle, FileX2, TrendingUp, TrendingDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns'

export default function RelatoriosFluxoCaixa() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tipoRelatorio, setTipoRelatorio] = useState('ambos')

  const fetchFluxoCaixa = async () => {
    setLoading(true)
    setError(null)
    try {
      const user = pb.authStore.record
      if (!user) throw new Error('Não autenticado')

      const contas = await pb
        .collection('contas_bancarias')
        .getFullList({ filter: `empresa_id = "${user.empresa_id}"` })
      const saldoInicialContas = contas.reduce((acc, c) => acc + (c.saldo_inicial || 0), 0)

      const lancamentos = await pb.collection('lancamentos').getFullList({
        filter: `empresa_id = "${user.empresa_id}" && data_lancamento <= "${dataFim} 23:59:59"`,
        sort: 'data_lancamento',
      })

      const pastLancamentos = lancamentos.filter(
        (l) => l.data_lancamento < dataInicio && l.status === 'confirmado',
      )
      const pastReceitas = pastLancamentos
        .filter((l) => l.tipo === 'receita')
        .reduce((a, b) => a + b.valor, 0)
      const pastDespesas = pastLancamentos
        .filter((l) => l.tipo === 'despesa')
        .reduce((a, b) => a + b.valor, 0)

      const saldoInicialPeriodo = saldoInicialContas + pastReceitas - pastDespesas

      const periodLancamentos = lancamentos.filter(
        (l) => l.data_lancamento >= dataInicio && l.data_lancamento <= dataFim,
      )

      if (periodLancamentos.length === 0) {
        setData({ empty: true })
        setLoading(false)
        return
      }

      let projetadoEntradas = 0
      let projetadoSaidas = 0
      let realizadoEntradas = 0
      let realizadoSaidas = 0

      const dailyData: Record<string, any> = {}
      let d = new Date(dataInicio)
      const end = new Date(dataFim)

      let runningProjetado = saldoInicialPeriodo
      let runningRealizado = saldoInicialPeriodo

      while (d <= end) {
        const dateStr = format(d, 'yyyy-MM-dd')
        dailyData[dateStr] = {
          date: format(d, 'dd/MM'),
          projetado: 0,
          realizado: 0,
          inRealizado: 0,
          outRealizado: 0,
          inProjetado: 0,
          outProjetado: 0,
        }
        d = addDays(d, 1)
      }

      periodLancamentos.forEach((l) => {
        const dateStr = l.data_lancamento.substring(0, 10)
        if (!dailyData[dateStr]) return

        const isConfirmado = l.status === 'confirmado'
        const isPendente = l.status === 'pendente'

        if (l.tipo === 'receita') {
          if (isConfirmado || isPendente) {
            projetadoEntradas += l.valor
            dailyData[dateStr].inProjetado += l.valor
          }
          if (isConfirmado) {
            realizadoEntradas += l.valor
            dailyData[dateStr].inRealizado += l.valor
          }
        } else {
          if (isConfirmado || isPendente) {
            projetadoSaidas += l.valor
            dailyData[dateStr].outProjetado += l.valor
          }
          if (isConfirmado) {
            realizadoSaidas += l.valor
            dailyData[dateStr].outRealizado += l.valor
          }
        }
      })

      const chartData = Object.keys(dailyData)
        .sort()
        .map((k) => {
          const day = dailyData[k]
          runningProjetado += day.inProjetado - day.outProjetado
          runningRealizado += day.inRealizado - day.outRealizado

          return {
            date: day.date,
            projetado: runningProjetado,
            realizado: runningRealizado,
          }
        })

      const saldoFinalProjetado = saldoInicialPeriodo + projetadoEntradas - projetadoSaidas
      const saldoFinalRealizado = saldoInicialPeriodo + realizadoEntradas - realizadoSaidas

      setData({
        empty: false,
        saldoInicial: saldoInicialPeriodo,
        projetadoEntradas,
        projetadoSaidas,
        realizadoEntradas,
        realizadoSaidas,
        saldoFinalProjetado,
        saldoFinalRealizado,
        chartData,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFluxoCaixa()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-sm">
            Projetado x Realizado das movimentações financeiras
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-[130px]"
          />
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-[130px]"
          />
          <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambos">Ambos</SelectItem>
              <SelectItem value="projetado">Projetado</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchFluxoCaixa} className="bg-[#268C83] hover:bg-teal-700 text-white">
            Gerar Relatório
          </Button>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[400px] w-full md:col-span-3" />
          <Skeleton className="h-[300px] w-full md:col-span-2" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <Button
            onClick={fetchFluxoCaixa}
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
              setDataInicio(format(startOfMonth(addDays(new Date(), -30)), 'yyyy-MM-dd'))
              fetchFluxoCaixa()
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
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Evolução do Saldo Diário</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  projetado: { label: 'Projetado', color: '#268C83' },
                  realizado: { label: 'Realizado', color: '#10B981' },
                }}
                className="h-[300px] w-full"
              >
                <LineChart
                  data={data.chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {tipoRelatorio !== 'realizado' && (
                    <Line
                      type="monotone"
                      dataKey="projetado"
                      stroke="var(--color-projetado)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {tipoRelatorio !== 'projetado' && (
                    <Line
                      type="monotone"
                      dataKey="realizado"
                      stroke="var(--color-realizado)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Descrição</th>
                      {tipoRelatorio !== 'realizado' && (
                        <th className="px-4 py-3 font-medium text-right">Projetado</th>
                      )}
                      {tipoRelatorio !== 'projetado' && (
                        <th className="px-4 py-3 font-medium text-right">Realizado</th>
                      )}
                      {tipoRelatorio === 'ambos' && (
                        <th className="px-4 py-3 font-medium text-right">Diferença</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">Saldo Inicial</td>
                      {tipoRelatorio !== 'realizado' && (
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(data.saldoInicial)}
                        </td>
                      )}
                      {tipoRelatorio !== 'projetado' && (
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(data.saldoInicial)}
                        </td>
                      )}
                      {tipoRelatorio === 'ambos' && (
                        <td className="px-4 py-3 text-right text-muted-foreground">-</td>
                      )}
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-green-600">(+) Entradas</td>
                      {tipoRelatorio !== 'realizado' && (
                        <td className="px-4 py-3 text-right text-green-600">
                          {formatCurrency(data.projetadoEntradas)}
                        </td>
                      )}
                      {tipoRelatorio !== 'projetado' && (
                        <td className="px-4 py-3 text-right text-green-600">
                          {formatCurrency(data.realizadoEntradas)}
                        </td>
                      )}
                      {tipoRelatorio === 'ambos' && (
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(data.realizadoEntradas - data.projetadoEntradas)}
                        </td>
                      )}
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-red-600">(-) Saídas</td>
                      {tipoRelatorio !== 'realizado' && (
                        <td className="px-4 py-3 text-right text-red-600">
                          {formatCurrency(data.projetadoSaidas)}
                        </td>
                      )}
                      {tipoRelatorio !== 'projetado' && (
                        <td className="px-4 py-3 text-right text-red-600">
                          {formatCurrency(data.realizadoSaidas)}
                        </td>
                      )}
                      {tipoRelatorio === 'ambos' && (
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(data.realizadoSaidas - data.projetadoSaidas)}
                        </td>
                      )}
                    </tr>
                    <tr className="font-bold hover:bg-muted/30 bg-muted/10">
                      <td className="px-4 py-3">Saldo Final</td>
                      {tipoRelatorio !== 'realizado' && (
                        <td
                          className={`px-4 py-3 text-right ${data.saldoFinalProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {formatCurrency(data.saldoFinalProjetado)}
                        </td>
                      )}
                      {tipoRelatorio !== 'projetado' && (
                        <td
                          className={`px-4 py-3 text-right ${data.saldoFinalRealizado >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {formatCurrency(data.saldoFinalRealizado)}
                        </td>
                      )}
                      {tipoRelatorio === 'ambos' && (
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(data.saldoFinalRealizado - data.saldoFinalProjetado)}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#268C83] text-white border-none">
            <CardHeader>
              <CardTitle className="text-white/90">Diferença Final</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(data.saldoFinalRealizado - data.saldoFinalProjetado)}
              </div>
              <div className="flex items-center text-teal-100 bg-white/10 px-3 py-1 rounded-full text-sm">
                {data.saldoFinalRealizado >= data.saldoFinalProjetado ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                Variação do Previsto
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
