import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, FileText, SearchX, AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportDropdown } from '@/components/ExportDropdown'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { listarLancamentos } from '@/services/lancamentos'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'

export default function RelatoriosDre() {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1),
  )
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) return
    setLoading(true)
    setError('')
    try {
      const res = await listarLancamentos({
        data_inicio: format(dataInicio, 'yyyy-MM-dd'),
        data_fim: format(dataFim, 'yyyy-MM-dd'),
      })
      setLancamentos(res)
      setHasFetched(true)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  let receitasBrutas = 0,
    deducoes = 0,
    custosDiretos = 0,
    despesasOperacionais = 0
  let despesasFinanceiras = 0,
    receitasFinanceiras = 0,
    impostos = 0

  lancamentos.forEach((l) => {
    const cat = l.expand?.categoria_id?.nome?.toLowerCase() || ''
    const tipo = l.tipo
    const valor = Number(l.valor) || 0

    if (tipo === 'receita') {
      if (cat.includes('juro') || cat.includes('rendimento') || cat.includes('financeir')) {
        receitasFinanceiras += valor
      } else {
        receitasBrutas += valor
      }
    } else if (tipo === 'despesa') {
      if (cat.includes('deduç') || cat.includes('devoluç') || cat.includes('desconto'))
        deducoes += valor
      else if (cat.includes('custo') || cat.includes('mercadoria') || cat.includes('matéria'))
        custosDiretos += valor
      else if (
        cat.includes('imposto') ||
        cat.includes('tributo') ||
        cat.includes('das') ||
        cat.includes('irpj')
      )
        impostos += valor
      else if (
        cat.includes('juro') ||
        cat.includes('taxa') ||
        cat.includes('tarifa') ||
        cat.includes('financeir')
      )
        despesasFinanceiras += valor
      else despesasOperacionais += valor
    }
  })

  const receitaLiquida = receitasBrutas - deducoes
  const lucroBruto = receitaLiquida - custosDiretos
  const lucroOperacional = lucroBruto - despesasOperacionais
  const lucroAntesImpostos = lucroOperacional - despesasFinanceiras + receitasFinanceiras
  const lucroLiquido = lucroAntesImpostos - impostos

  const exportarPdf = async () => {
    if (!dataInicio || !dataFim) return
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
            ${tableData
              .map(
                (row) => `
              <tr>
                <td style="${row.bold ? 'font-weight: bold;' : ''} ${row.isSubtotal ? 'color: #6b7280;' : ''}">${row.desc}</td>
                <td style="text-align: right; ${row.bold ? 'font-weight: bold;' : ''} ${row.isFinal ? (row.valor >= 0 ? 'color: #16a34a;' : 'color: #dc2626;') : ''}">
                  ${row.isNegative && row.valor > 0 ? `- ${formatCurrency(row.valor)}` : formatCurrency(row.valor)}
                </td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `

      const year = format(dataInicio, 'yyyy')
      const startMonth = format(dataInicio, 'MM')
      const endMonth = format(dataFim, 'MM')

      await exportToPdf({
        filename: `DRE_${year}_${startMonth}_a_${endMonth}.pdf`,
        title: 'DRE — Demonstração de Resultado do Exercício',
        period: `${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')}`,
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
    if (!dataInicio || !dataFim) return
    try {
      const { exportToExcel } = await import('@/lib/export-utils')
      const year = format(dataInicio, 'yyyy')
      const startMonth = format(dataInicio, 'MM')
      const endMonth = format(dataFim, 'MM')

      const rawData = tableData.map((r) => [
        r.desc,
        r.isNegative && r.valor > 0 ? -r.valor : r.valor,
      ])

      const sheets = [
        {
          name: 'DRE',
          data: [['Descrição', 'Valor'], ...rawData],
        },
        {
          name: 'Resumo',
          data: [
            ['Indicador', 'Valor'],
            ['Receita Líquida', receitaLiquida],
            ['Lucro Bruto', lucroBruto],
            ['Lucro Operacional', lucroOperacional],
            ['Lucro Líquido', lucroLiquido],
          ],
        },
        {
          name: 'Filtros',
          data: [
            ['Filtro', 'Valor'],
            ['Período', `${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')}`],
          ],
        },
      ]

      exportToExcel(`DRE_${year}_${startMonth}_a_${endMonth}.xls`, sheets)
      toast.success('Excel gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar Excel')
    }
  }

  const exportarCsv = async () => {
    if (!dataInicio || !dataFim) return
    try {
      const { exportToCsv } = await import('@/lib/export-utils')
      const year = format(dataInicio, 'yyyy')
      const startMonth = format(dataInicio, 'MM')
      const endMonth = format(dataFim, 'MM')

      const rawData = tableData.map((r) => [
        r.desc,
        r.isNegative && r.valor > 0 ? -r.valor : r.valor,
      ])

      exportToCsv(`DRE_${year}_${startMonth}_a_${endMonth}.csv`, [
        ['Descrição', 'Valor'],
        ...rawData,
      ])
      toast.success('CSV gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar CSV')
    }
  }

  const tableData = [
    { desc: 'RECEITAS BRUTAS', valor: receitasBrutas, bold: true },
    { desc: '(-) DEDUÇÕES', valor: deducoes, isNegative: true },
    { desc: '(=) RECEITA LÍQUIDA', valor: receitaLiquida, bold: true, isSubtotal: true },
    { desc: '(-) CUSTOS DIRETOS', valor: custosDiretos, isNegative: true },
    { desc: '(=) LUCRO BRUTO', valor: lucroBruto, bold: true, isSubtotal: true },
    { desc: '(-) DESPESAS OPERACIONAIS', valor: despesasOperacionais, isNegative: true },
    { desc: '(=) LUCRO OPERACIONAL', valor: lucroOperacional, bold: true, isSubtotal: true },
    { desc: '(-) DESPESAS FINANCEIRAS', valor: despesasFinanceiras, isNegative: true },
    { desc: '(+) RECEITAS FINANCEIRAS', valor: receitasFinanceiras },
    {
      desc: '(=) LUCRO ANTES DE IMPOSTOS',
      valor: lucroAntesImpostos,
      bold: true,
      isSubtotal: true,
    },
    { desc: '(-) IMPOSTOS', valor: impostos, isNegative: true },
    { desc: '(=) LUCRO LÍQUIDO', valor: lucroLiquido, bold: true, isFinal: true },
  ]

  const chartData = [
    { name: 'Receitas', value: receitasBrutas + receitasFinanceiras, fill: '#268C83' },
    { name: 'Custos', value: custosDiretos, fill: '#F59E0B' },
    { name: 'Despesas', value: despesasOperacionais + despesasFinanceiras, fill: '#E23636' },
    { name: 'Impostos', value: impostos, fill: '#64748b' },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-6 space-y-4 animate-fade-in-up">
      <div className="flex flex-col space-y-1">
        <h1 className="text-[24px] font-bold text-[#268C83]">
          DRE — Demonstração de Resultado do Exercício
        </h1>
        {hasFetched && dataInicio && dataFim && (
          <p className="text-sm text-muted-foreground">
            Período: {format(dataInicio, 'dd/MM/yyyy')} a {format(dataFim, 'dd/MM/yyyy')}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[12px] font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[200px] justify-start text-left font-normal',
                      !dataInicio && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[12px] font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[200px] justify-start text-left font-normal',
                      !dataFim && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, 'dd/MM/yyyy') : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <Button
              onClick={gerarRelatorio}
              disabled={loading || !dataInicio || !dataFim}
              className="w-full sm:w-auto bg-[#268C83] hover:bg-[#1e7069] text-white"
            >
              {loading && <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Relatório
            </Button>
            <ExportDropdown
              disabled={loading || !hasFetched || lancamentos.length === 0}
              onExportPdf={exportarPdf}
              onExportExcel={exportarExcel}
              onExportCsv={exportarCsv}
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-6">
            <Skeleton className="h-[400px] w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </Card>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border border-red-100">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800">Erro ao carregar relatório</h3>
          <p className="text-red-600 mb-4 text-center max-w-md">{error}</p>
          <Button variant="outline" onClick={gerarRelatorio}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!loading && !error && hasFetched && lancamentos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border border-dashed">
          <SearchX className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            Nenhum lançamento registrado neste período
          </h3>
          <p className="text-muted-foreground mb-4">
            Não foram encontrados dados financeiros para as datas selecionadas.
          </p>
        </div>
      )}

      {!loading && !error && hasFetched && lancamentos.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detalhamento DRE</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow
                      key={i}
                      className={cn(
                        'hover:bg-muted/50',
                        i % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                      )}
                    >
                      <TableCell
                        className={cn(
                          'text-[14px]',
                          row.bold && 'font-bold',
                          row.isSubtotal && 'text-muted-foreground',
                        )}
                      >
                        {row.desc}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right text-[14px]',
                          row.bold && 'font-bold',
                          row.isFinal && (row.valor >= 0 ? 'text-green-600' : 'text-red-600'),
                        )}
                      >
                        {row.isNegative && row.valor > 0
                          ? `- ${formatCurrency(row.valor)}`
                          : formatCurrency(row.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição</CardTitle>
              <CardDescription>Receitas vs Custos e Despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" ref={chartRef}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Dados insuficientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
