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
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Download, AlertCircle, FileX2, ArrowUp, ArrowDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function RelatoriosPlanejadoRealizado() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [agrupamento, setAgrupamento] = useState('categoria')
  const [isExporting, setIsExporting] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const fetchPlanejadoRealizado = async () => {
    setLoading(true)
    setError(null)
    try {
      const user = pb.authStore.record
      if (!user) throw new Error('Não autenticado')

      const lancamentos = await pb.collection('lancamentos').getFullList({
        filter: `empresa_id = "${user.empresa_id}" && data_lancamento >= "${dataInicio} 00:00:00" && data_lancamento <= "${dataFim} 23:59:59"`,
        expand: 'projeto_id,centro_custo_id,categoria_id',
      })

      if (lancamentos.length === 0) {
        setData({ empty: true })
        setLoading(false)
        return
      }

      const grouped: Record<string, any> = {}

      lancamentos.forEach((l) => {
        let key = 'Outros'
        if (agrupamento === 'projeto') key = l.expand?.projeto_id?.nome || 'Sem Projeto'
        else if (agrupamento === 'centro_custo')
          key = l.expand?.centro_custo_id?.nome || 'Sem Centro de Custo'
        else if (agrupamento === 'categoria') key = l.expand?.categoria_id?.nome || 'Sem Categoria'
        else if (agrupamento === 'periodo') key = format(new Date(l.data_lancamento), 'MM/yyyy')

        if (!grouped[key]) {
          grouped[key] = {
            name: key,
            planejadoRec: 0,
            realizadoRec: 0,
            planejadoDes: 0,
            realizadoDes: 0,
            tipoCat: '',
          }
        }

        if (agrupamento === 'categoria') {
          grouped[key].tipoCat =
            l.expand?.categoria_id?.tipo || (l.tipo === 'receita' ? 'receita' : 'despesa')
        }

        const isConfirmado = l.status === 'confirmado'
        const isPendente = l.status === 'pendente'

        if (l.tipo === 'receita') {
          if (isConfirmado || isPendente) grouped[key].planejadoRec += l.valor
          if (isConfirmado) grouped[key].realizadoRec += l.valor
        } else {
          if (isConfirmado || isPendente) grouped[key].planejadoDes += l.valor
          if (isConfirmado) grouped[key].realizadoDes += l.valor
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

        const diff = isCategoria ? realizado - planejado : realizado - planejado
        const perc = planejado !== 0 ? (diff / Math.abs(planejado)) * 100 : 0

        if (isCategoria) {
          totalPlanejado += g.tipoCat === 'receita' ? planejado : -planejado
          totalRealizado += g.tipoCat === 'receita' ? realizado : -realizado
        } else {
          totalPlanejado += planejado
          totalRealizado += realizado
        }

        chartData.push({
          name: g.name,
          Planejado: planejado,
          Realizado: realizado,
        })

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

  const exportarPdf = async () => {
    if (!dataInicio || !dataFim || !data || data.empty) return
    try {
      const { exportToPdf, captureChart } = await import('@/lib/pdf-export')
      const chartImg = captureChart(chartRef)

      let thead = ''
      let tbody = ''

      if (agrupamento === 'categoria') {
        thead = `
          <tr>
            <th>Categoria</th>
            <th style="text-align: right">Planejado</th>
            <th style="text-align: right">Realizado</th>
            <th style="text-align: right">Diferença</th>
            <th style="text-align: right">Variação</th>
          </tr>
        `
        tbody = data.rows
          .map((row: any) => {
            const isGood = row.tipoCat === 'receita' ? row.diff >= 0 : row.diff <= 0
            return `
            <tr>
              <td>${row.name} <span style="font-size: 10px; color: #6b7280;">(${row.tipoCat})</span></td>
              <td style="text-align: right">${formatCurrency(row.planejado)}</td>
              <td style="text-align: right">${formatCurrency(row.realizado)}</td>
              <td style="text-align: right; ${isGood ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(row.diff)}</td>
              <td style="text-align: right; font-weight: bold; ${isGood ? 'color: #16a34a;' : 'color: #dc2626;'}">${row.perc.toFixed(1)}%</td>
            </tr>
          `
          })
          .join('')
      } else {
        thead = `
          <tr>
            <th rowspan="2" style="border-right: 1px solid #e5e7eb;">Nome</th>
            <th colspan="3" style="text-align: center; border-right: 1px solid #e5e7eb;">Receitas</th>
            <th colspan="3" style="text-align: center; border-right: 1px solid #e5e7eb;">Despesas</th>
            <th colspan="3" style="text-align: center;">Resultado</th>
          </tr>
          <tr>
            <th style="text-align: right">Plan</th>
            <th style="text-align: right">Real</th>
            <th style="text-align: right; border-right: 1px solid #e5e7eb;">Diff</th>
            <th style="text-align: right">Plan</th>
            <th style="text-align: right">Real</th>
            <th style="text-align: right; border-right: 1px solid #e5e7eb;">Diff</th>
            <th style="text-align: right">Plan</th>
            <th style="text-align: right">Real</th>
            <th style="text-align: right">Diff</th>
          </tr>
        `
        tbody = data.rows
          .map((row: any) => {
            const recDiff = row.realizadoRec - row.planejadoRec
            const desDiff = row.realizadoDes - row.planejadoDes
            const resDiff = row.diff
            return `
            <tr>
              <td style="border-right: 1px solid #e5e7eb; font-weight: bold;">${row.name}</td>
              <td style="text-align: right">${formatCurrency(row.planejadoRec)}</td>
              <td style="text-align: right">${formatCurrency(row.realizadoRec)}</td>
              <td style="text-align: right; border-right: 1px solid #e5e7eb; ${recDiff >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(recDiff)}</td>
              <td style="text-align: right">${formatCurrency(row.planejadoDes)}</td>
              <td style="text-align: right">${formatCurrency(row.realizadoDes)}</td>
              <td style="text-align: right; border-right: 1px solid #e5e7eb; ${desDiff <= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(desDiff)}</td>
              <td style="text-align: right">${formatCurrency(row.planejadoRec - row.planejadoDes)}</td>
              <td style="text-align: right">${formatCurrency(row.realizadoRec - row.realizadoDes)}</td>
              <td style="text-align: right; font-weight: bold; ${resDiff >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">${formatCurrency(resDiff)}</td>
            </tr>
          `
          })
          .join('')
      }

      const tableHtml = `
        <table class="pdf-table">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      `

      const startDate = new Date(dataInicio + 'T00:00:00')
      const endDate = new Date(dataFim + 'T00:00:00')
      const year = format(startDate, 'yyyy')
      const startMonth = format(startDate, 'MM')
      const endMonth = format(endDate, 'MM')

      await exportToPdf({
        filename: `PlanejadoRealizado_${year}_${startMonth}_a_${endMonth}.pdf`,
        title: 'Planejado x Realizado',
        period: `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`,
        tableHtml,
        chartImages: chartImg ? [chartImg] : [],
        orientation: agrupamento === 'categoria' ? 'portrait' : 'landscape',
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

      let rowsData = []
      if (agrupamento === 'categoria') {
        rowsData = [
          ['Categoria', 'Tipo', 'Planejado', 'Realizado', 'Diferença', 'Variação %'],
          ...data.rows.map((row: any) => [
            row.name,
            row.tipoCat,
            row.planejado,
            row.realizado,
            row.diff,
            row.perc,
          ]),
        ]
      } else {
        rowsData = [
          [
            'Nome',
            'Receitas Plan',
            'Receitas Real',
            'Receitas Diff',
            'Despesas Plan',
            'Despesas Real',
            'Despesas Diff',
            'Resultado Plan',
            'Resultado Real',
            'Resultado Diff',
          ],
          ...data.rows.map((row: any) => [
            row.name,
            row.planejadoRec,
            row.realizadoRec,
            row.realizadoRec - row.planejadoRec,
            -row.planejadoDes,
            -row.realizadoDes,
            -(row.realizadoDes - row.planejadoDes),
            row.planejadoRec - row.planejadoDes,
            row.realizadoRec - row.realizadoDes,
            row.diff,
          ]),
        ]
      }

      const sheets = [
        {
          name: 'PlanejadoRealizado',
          data: rowsData,
        },
      ]

      exportToExcel(`PlanejadoRealizado_${year}_${startMonth}_a_${endMonth}.xls`, sheets)
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

      let rowsData = []
      if (agrupamento === 'categoria') {
        rowsData = [
          ['Categoria', 'Tipo', 'Planejado', 'Realizado', 'Diferença', 'Variação %'],
          ...data.rows.map((row: any) => [
            row.name,
            row.tipoCat,
            row.planejado,
            row.realizado,
            row.diff,
            row.perc,
          ]),
        ]
      } else {
        rowsData = [
          [
            'Nome',
            'Receitas Plan',
            'Receitas Real',
            'Receitas Diff',
            'Despesas Plan',
            'Despesas Real',
            'Despesas Diff',
            'Resultado Plan',
            'Resultado Real',
            'Resultado Diff',
          ],
          ...data.rows.map((row: any) => [
            row.name,
            row.planejadoRec,
            row.realizadoRec,
            row.realizadoRec - row.planejadoRec,
            -row.planejadoDes,
            -row.realizadoDes,
            -(row.realizadoDes - row.planejadoDes),
            row.planejadoRec - row.planejadoDes,
            row.realizadoRec - row.realizadoDes,
            row.diff,
          ]),
        ]
      }

      exportToCsv(`PlanejadoRealizado_${year}_${startMonth}_a_${endMonth}.csv`, rowsData)
      toast.success('CSV gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar CSV')
    }
  }

  useEffect(() => {
    fetchPlanejadoRealizado()
  }, [])

  const isCategoria = agrupamento === 'categoria'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planejado x Realizado</h1>
          <p className="text-muted-foreground text-sm">Comparativo de metas e orçamentos reais</p>
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
          <Select value={agrupamento} onValueChange={setAgrupamento}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categoria">Categoria</SelectItem>
              <SelectItem value="projeto">Projeto</SelectItem>
              <SelectItem value="centro_custo">Centro de Custo</SelectItem>
              <SelectItem value="periodo">Período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchPlanejadoRealizado}
            className="bg-[#268C83] hover:bg-teal-700 text-white"
          >
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
              setDataInicio(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
              fetchPlanejadoRealizado()
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
              <div ref={chartRef} className="w-full">
                <ChartContainer
                  config={{
                    Planejado: { label: 'Planejado', color: '#268C83' },
                    Realizado: { label: 'Realizado', color: '#10B981' },
                  }}
                  className="h-[300px] w-full"
                >
                  <BarChart
                    data={data.chartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="Planejado" fill="var(--color-Planejado)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Realizado" fill="var(--color-Realizado)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
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
