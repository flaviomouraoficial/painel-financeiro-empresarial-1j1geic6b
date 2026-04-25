import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/format'

export function DashboardCharts({ data, periodo }: { data: any; periodo: number }) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - periodo)

  const chartData = []
  for (let i = periodo - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const receita = data.lancamentos
      .filter((l: any) => l.tipo === 'receita' && l.data_lancamento.startsWith(dateStr))
      .reduce((a: number, b: any) => a + b.valor, 0)
    const despesa = data.lancamentos
      .filter((l: any) => l.tipo === 'despesa' && l.data_lancamento.startsWith(dateStr))
      .reduce((a: number, b: any) => a + b.valor, 0)
    chartData.push({ date: format(d, 'dd/MM'), receita, despesa })
  }

  const chartConfig = {
    receita: { label: 'Receita', color: '#22c55e' },
    despesa: { label: 'Despesa', color: '#ef4444' },
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Receitas vs Despesas (Últimos {periodo} dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="receita" stroke="var(--color-receita)" strokeWidth={2} />
            <Line type="monotone" dataKey="despesa" stroke="var(--color-despesa)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
