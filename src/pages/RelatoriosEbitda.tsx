import { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ExportDropdown } from '@/components/ExportDropdown'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PeriodSelector } from '@/components/ui/period-selector'
import { useReportFilters } from '@/hooks/use-report-filters'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency } from '@/lib/format'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Download, AlertCircle, FileX2 } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export default function RelatoriosEbitda() {
  const { dateRange, setDateRange, preset, setPreset } = useReportFilters()
  const dataInicioStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
  const dataFimStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const fetchEbitda = async () => {
    if (!dataInicioStr || !dataFimStr) return
    setLoading(true)
    setError(null)
    try {
      const user = pb.authStore.record
      if (!user) throw new Error('Não autenticado')

      const start12MonthsAgo = format(subMonths(new Date(dataInicioStr), 11), 'yyyy-MM-dd')

      const lancamentos = await pb.collection('lancamentos').getFullList({
        filter: `empresa_id = "${user.empresa_id}" && data_lancamento >= "${start12MonthsAgo} 00:00:00" && data_lancamento <= "${dataFimStr} 23:59:59"`,
        expand: 'categoria_id',
      })

      const periodLancamentos = lancamentos.filter(
        (l) => l.data_lancamento >= dataInicioStr && l.data_lancamento <= dataFimStr,
      )

      if (periodLancamentos.length === 0) {
        setData({ empty: true })
        setLoading(false)
        return
      }

      let receitaBruta = 0
      let custosDiretos = 0
      let despesasOperacionais = 0

      periodLancamentos.forEach((l) => {
        if (l.status !== 'confirmado') return
        if (l.tipo === 'receita') {
          receitaBruta += l.valor
        } else if (l.tipo === 'despesa') {
          const catName = l.expand?.categoria_id?.nome?.toLowerCase() || ''
          if (
            catName.includes('custo') ||
            catName.includes('fornecedor') ||
            catName.includes('mercadoria') ||
            catName.includes('produção') ||
            catName.includes('serviço')
          ) {
            custosDiretos += l.valor
          } else if (
            !catName.includes('imposto') &&
            !catName.includes('juro') &&
            !catName.includes('taxa') &&
            !catName.includes('deprecia') &&
            !catName.includes('amortiza') &&
            !catName.includes('tributo') &&
            !catName.includes('das') &&
            !catName.includes('irpj')
          ) {
            despesasOperacionais += l.valor
          }
        }
      })

      const lucroBruto = receitaBruta - custosDiretos
      const ebitda = lucroBruto - despesasOperacionais
      const margem = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0

      const chartMap: Record<
        string,
        { month: string; ebitda: number; receita: number; despesa: number }
      > = {}
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(dataFimStr), i)
        const m = format(d, 'MM/yyyy')
        chartMap[m] = { month: m, ebitda: 0, receita: 0, despesa: 0 }
      }

      lancamentos.forEach((l) => {
        if (l.status !== 'confirmado') return
        const m = format(new Date(l.data_lancamento), 'MM/yyyy')
        if (chartMap[m]) {
          if (l.tipo === 'receita') {
            chartMap[m].receita += l.valor
          } else if (l.tipo === 'despesa') {
            const catName = l.expand?.categoria_id?.nome?.toLowerCase() || ''
            if (
              !catName.includes('imposto') &&
              !catName.includes('juro') &&
              !catName.includes('taxa') &&
              !catName.includes('deprecia') &&
              !catName.includes('amortiza') &&
              !catName.includes('tributo') &&
              !catName.includes('das') &&
              !catName.includes('irpj')
            ) {
              chartMap[m].despesa += l.valor
            }
          }
          chartMap[m].ebitda = chartMap[m].receita - chartMap[m].despesa
        }
      })

      setData({
        empty: false,
        receitaBruta,
        custosDiretos,
        lucroBruto,
        despesasOperacionais,
        ebitda,
        margem,
        chartData: Object.values(chartMap),
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const exportarPdf = async () => {
    if (!dataInicioStr || !dataFimStr || !data || data.empty) return
    try {
      const { exportToPdf, captureChart } = await import('@/lib/pdf-export')
      const chartImg = captureChart(chartRef)

      const tableHtml = `
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align: right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Receita Bruta</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(data.receitaBruta)}</td>
            </tr>
            <tr>
              <td>(-) Custos Diretos</td>
              <td style="text-align: right; color: #dc2626;">${formatCurrency(data.custosDiretos)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">(=) Lucro Bruto</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(data.lucroBruto)}</td>
            </tr>
            <tr>
              <td>(-) Despesas Operacionais</td>
              <td style="text-align: right; color: #dc2626;">${formatCurrency(data.despesasOperacionais)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; font-size: 14px;">EBITDA</td>
              <td style="text-align: right; font-weight: bold; font-size: 14px; ${data.ebitda >= 0 ? 'color: #16a34a;' : 'color: #dc2626;'}">
                ${formatCurrency(data.ebitda)}
              </td>
            </tr>
          </tbody>
        </table>
      `

      const startDate = new Date(dataInicioStr + 'T00:00:00')
      const endDate = new Date(dataFimStr + 'T00:00:00')
      const year = format(startDate, 'yyyy')
      const startMonth = format(startDate, 'MM')
      const endMonth = format(endDate, 'MM')

      await exportToPdf({
        filename: `EBITDA_${year}_${startMonth}_a_${endMonth}.pdf`,
        title: 'Relatório de EBITDA',
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
    if (!dataInicioStr || !dataFimStr || !data || data.empty) return
    try {
      const { exportToExcel } = await import('@/lib/export-utils')
      const year = format(new Date(dataInicioStr), 'yyyy')
      const startMonth = format(new Date(dataInicioStr), 'MM')
      const endMonth = format(new Date(dataFimStr), 'MM')

      const sheets = [
        {
          name: 'EBITDA',
          data: [
            ['Descrição', 'Valor'],
            ['Receita Bruta', data.receitaBruta],
            ['Custos Diretos', -data.custosDiretos],
            ['Lucro Bruto', data.lucroBruto],
            ['Despesas Operacionais', -data.despesasOperacionais],
            ['EBITDA', data.ebitda],
            ['Margem EBITDA', `${data.margem.toFixed(2)}%`],
          ],
        },
        {
          name: 'Mensal',
          data: [
            ['Mês', 'Receita', 'Despesa', 'EBITDA'],
            ...data.chartData.map((d: any) => [d.month, d.receita, d.despesa, d.ebitda]),
          ],
        },
      ]

      exportToExcel(`EBITDA_${year}_${startMonth}_a_${endMonth}.xls`, sheets)
      toast.success('Excel gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar Excel')
    }
  }

  const exportarCsv = async () => {
    if (!dataInicioStr || !dataFimStr || !data || data.empty) return
    try {
      const { exportToCsv } = await import('@/lib/export-utils')
      const year = format(new Date(dataInicioStr), 'yyyy')
      const startMonth = format(new Date(dataInicioStr), 'MM')
      const endMonth = format(new Date(dataFimStr), 'MM')

      exportToCsv(`EBITDA_${year}_${startMonth}_a_${endMonth}.csv`, [
        ['Descrição', 'Valor'],
        ['Receita Bruta', data.receitaBruta],
        ['Custos Diretos', -data.custosDiretos],
        ['Lucro Bruto', data.lucroBruto],
        ['Despesas Operacionais', -data.despesasOperacionais],
        ['EBITDA', data.ebitda],
      ])
      toast.success('CSV gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar CSV')
    }
  }

  useEffect(() => {
    fetchEbitda()
  }, [dataInicioStr, dataFimStr])

  useRealtime(
    'lancamentos',
    () => {
      fetchEbitda()
    },
    !loading,
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatório de EBITDA</h1>
          <p className="text-muted-foreground text-sm">
            Lucro antes de juros, impostos, depreciação e amortização
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            date={dateRange}
            setDate={setDateRange}
            preset={preset}
            setPreset={setPreset}
          />
          <Button
            onClick={fetchEbitda}
            disabled={loading || !dataInicioStr || !dataFimStr}
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <Button
            onClick={fetchEbitda}
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
              setPreset('ano_atual')
              setDateRange({ from: new Date(2026, 0, 1), to: new Date(2026, 11, 31, 23, 59, 59) })
            }}
            variant="outline"
            className="mt-4"
          >
            Voltar
          </Button>
        </div>
      )}

      {data && !data.empty && !loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          <div className="space-y-6">
            <Card className="bg-[#268C83] text-white border-none shadow-elevation">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/90 text-lg">Margem EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.margem.toFixed(2)}%</div>
                <p className="text-teal-100 mt-1">Mede a lucratividade operacional da empresa.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demonstrativo</CardTitle>
                <CardDescription>Resumo do período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between p-2 border-b">
                    <span className="font-medium text-muted-foreground">Receita Bruta</span>
                    <span className="font-bold">{formatCurrency(data.receitaBruta)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b bg-muted/30">
                    <span className="font-medium text-muted-foreground">(-) Custos Diretos</span>
                    <span className="text-red-500">{formatCurrency(data.custosDiretos)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="font-bold">(=) Lucro Bruto</span>
                    <span className="font-bold">{formatCurrency(data.lucroBruto)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b bg-muted/30">
                    <span className="font-medium text-muted-foreground">
                      (-) Despesas Operacionais
                    </span>
                    <span className="text-red-500">
                      {formatCurrency(data.despesasOperacionais)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 text-lg mt-4">
                    <span className="font-bold">EBITDA</span>
                    <span
                      className={`font-bold ${data.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(data.ebitda)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>EBITDA Mensal (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef} className="w-full">
                <ChartContainer
                  config={{ ebitda: { label: 'EBITDA', color: '#268C83' } }}
                  className="h-[350px] w-full"
                >
                  <BarChart
                    data={data.chartData}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="ebitda" fill="var(--color-ebitda)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
