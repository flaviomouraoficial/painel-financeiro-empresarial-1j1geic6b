import { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { RefreshCcw } from 'lucide-react'
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
  const [isExporting, setIsExporting] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

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

  const exportarPdf = async () => {
    if (!dataInicio || !dataFim || !data || data.empty) return
    try {
      const { exportToPdf, captureChart } = await import('@/lib/pdf-export')
      const chartImg = captureChart(chartRef)

      const tableHtml = `
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Descrição</th>
              ${tipoRelatorio !== 'realizado' ? '<th style="text-align: right">Projetado</th>' : ''}
              ${tipoRelatorio !== 'projetado' ? '<th style="text-align: right">Realizado</th>' : ''}
              ${tipoRelatorio === 'ambos' ? '<th style="text-align: right">Diferença</th>' : ''}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Saldo Inicial</td>
              ${tipoRelatorio !== 'realizado' ? `<td style="text-align: right">${formatCurrency(data.saldoInicial)}</td>` : ''}
              ${tipoRelatorio !== 'projetado' ? `<td style="text-align: right">${formatCurrency(data.saldoInicial)}</td>` : ''}
              ${tipoRelatorio === 'ambos' ? '<td style="text-align: right">-</td>' : ''}
            </tr>
            <tr>
              <td style="color: #16a34a;">(+) Entradas</td>
              ${tipoRelatorio !== 'realizado' ? `<td style="text-align: right; color: #16a34a;">${formatCurrency(data.projetadoEntradas)}</td>` : ''}
              ${tipoRelatorio !== 'projetado' ? `<td style="text-align: right; color: #16a34a;">${formatCurrency(data.realizadoEntradas)}</td>` : ''}
              ${tipoRelatorio === 'ambos' ? `<td style="text-align: right">${formatCurrency(data.realizadoEntradas - data.projetadoEntradas)}</td>` : ''}
            </tr>
            <tr>
              <td style="color: #dc2626;">(-) Saídas</td>
              ${tipoRelatorio !== 'realizado' ? `<td style="text-align: right; color: #dc2626;">${formatCurrency(data.projetadoSaidas)}</td>` : ''}
              ${tipoRelatorio !== 'projetado' ? `<td style="text-align: right; color: #dc2626;">${formatCurrency(data.realizadoSaidas)}</td>` : ''}
              ${tipoRelatorio === 'ambos' ? `<td style="text-align: right">${formatCurrency(data.realizadoSaidas - data.projetadoSaidas)}</td>` : ''}
            </tr>
            <tr>
              <td style="font-weight: bold;">Saldo Final</td>
              ${tipoRelatorio !== 'realizado' ? `<td style="text-align: right; font-weight: bold; ${data.saldoFinalProjetado >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(data.saldoFinalProjetado)}</td>` : ''}
              ${tipoRelatorio !== 'projetado' ? `<td style="text-align: right; font-weight: bold; ${data.saldoFinalRealizado >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(data.saldoFinalRealizado)}</td>` : ''}
              ${tipoRelatorio === 'ambos' ? `<td style="text-align: right; font-weight: bold;">${formatCurrency(data.saldoFinalRealizado - data.saldoFinalProjetado)}</td>` : ''}
            </tr>
          </tbody>
        </table>
      `

      const startDate = new Date(dataInicio + 'T00:00:00')
      const endDate = new Date(dataFim + 'T00:00:00')
      const year = format(startDate, 'yyyy')
      const startMonth = format(startDate, 'MM')
      const endMonth = format(endDate, 'MM')

      await exportToPdf({
        filename: `FluxoCaixa_${year}_${startMonth}_a_${endMonth}.pdf`,
        title: 'Fluxo de Caixa',
        period: `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`,
        tableHtml,
        chartImages: chartImg ? [chartImg] : [],
        orientation: 'portrait',
      })

      toast.success('PDF gerado com sucesso', {
        style: { backgroundColor: '#22c55e', color: 'white', border: 'none' },
        duration: 3000,
      })
    } catch (err) {
      toast.error('Erro ao gerar PDF. Tente novamente.', {
        style: { backgroundColor: '#ef4444', color: 'white', border: 'none' },
        duration: 5000,
      })
    }
  }

  const exportarExcel = async () => {
    if (!dataInicio || !dataFim || !data || data.empty) return
    try {
      const { exportToExcel } = await import('@/lib/export-utils')
      const year = format(new Date(dataInicio), 'yyyy')
      const startMonth = format(new Date(dataInicio), 'MM')
      const endMonth = format(new Date(dataFim), 'MM')

      const sheets = [
        {
          name: 'FluxoCaixa',
          data: [
            ['Descrição', 'Projetado', 'Realizado', 'Diferença'],
            ['Saldo Inicial', data.saldoInicial, data.saldoInicial, 0],
            [
              'Entradas',
              data.projetadoEntradas,
              data.realizadoEntradas,
              data.realizadoEntradas - data.projetadoEntradas,
            ],
            [
              'Saídas',
              -data.projetadoSaidas,
              -data.realizadoSaidas,
              -(data.realizadoSaidas - data.projetadoSaidas),
            ],
            [
              'Saldo Final',
              data.saldoFinalProjetado,
              data.saldoFinalRealizado,
              data.saldoFinalRealizado - data.saldoFinalProjetado,
            ],
          ],
        },
        {
          name: 'Diário',
          data: [
            [
              'Data',
              'Entradas Proj',
              'Saídas Proj',
              'Entradas Real',
              'Saídas Real',
              'Saldo Proj',
              'Saldo Real',
            ],
            ...data.chartData.map((d: any) => {
              const day = Object.values(data.chartData).find((x: any) => x.date === d.date) as any
              return [
                d.date,
                day?.inProjetado || 0,
                -(day?.outProjetado || 0),
                day?.inRealizado || 0,
                -(day?.outRealizado || 0),
                d.projetado,
                d.realizado,
              ]
            }),
          ],
        },
      ]

      exportToExcel(`FluxoCaixa_${year}_${startMonth}_a_${endMonth}.xls`, sheets)
      toast.success('Excel gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar Excel')
    }
  }

  const exportarCsv = async () => {
    if (!dataInicio || !dataFim || !data || data.empty) return
    try {
      const { exportToCsv } = await import('@/lib/export-utils')
      const year = format(new Date(dataInicio), 'yyyy')
      const startMonth = format(new Date(dataInicio), 'MM')
      const endMonth = format(new Date(dataFim), 'MM')

      exportToCsv(`FluxoCaixa_${year}_${startMonth}_a_${endMonth}.csv`, [
        ['Descrição', 'Projetado', 'Realizado', 'Diferença'],
        ['Saldo Inicial', data.saldoInicial, data.saldoInicial, 0],
        [
          'Entradas',
          data.projetadoEntradas,
          data.realizadoEntradas,
          data.realizadoEntradas - data.projetadoEntradas,
        ],
        [
          'Saídas',
          -data.projetadoSaidas,
          -data.realizadoSaidas,
          -(data.realizadoSaidas - data.projetadoSaidas),
        ],
        [
          'Saldo Final',
          data.saldoFinalProjetado,
          data.saldoFinalRealizado,
          data.saldoFinalRealizado - data.saldoFinalProjetado,
        ],
      ])
      toast.success('CSV gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar CSV')
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
          <ExportDropdown
            disabled={loading || !data || data.empty}
            onExportPdf={exportarPdf}
            onExportExcel={exportarExcel}
            onExportCsv={exportarCsv}
          />
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
              <div ref={chartRef} className="w-full">
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
              </div>
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
