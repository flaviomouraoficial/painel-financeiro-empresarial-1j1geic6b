import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import { PeriodSelector } from '@/components/ui/period-selector'
import { useReportFilters } from '@/hooks/use-report-filters'
import { formatCurrency } from '@/lib/format'

const fluxoCaixaData = [
  { month: 'Mai', saldoInicial: 10000, entradas: 22000, saidas: 15000, saldoFinal: 17000 },
  { month: 'Jun', saldoInicial: 17000, entradas: 25000, saidas: 16500, saldoFinal: 25500 },
  { month: 'Jul', saldoInicial: 25500, entradas: 24500, saidas: 17000, saldoFinal: 33000 },
]

const chartConfig = {
  entradas: { label: 'Entradas', color: 'hsl(var(--chart-2))' },
  saidas: { label: 'Saídas', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig

export default function Relatorios() {
  const { dateRange, setDateRange, preset, setPreset } = useReportFilters()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground text-sm">
            Visualize a saúde financeira do seu negócio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector
            date={dateRange}
            setDate={setDateRange}
            preset={preset}
            setPreset={setPreset}
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Visão consolidada de entradas e saídas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={fluxoCaixaData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="text-primary-foreground">DRE Simplificado</CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Demonstração do Resultado do Exercício (Ano atual)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="font-medium text-primary-foreground/80">Receita Bruta</span>
                <span className="font-bold">{formatCurrency(150000)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="font-medium text-primary-foreground/80">
                  (-) Impostos e Deduções
                </span>
                <span className="font-bold text-red-300">{formatCurrency(22500)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="font-medium text-primary-foreground/80">(=) Receita Líquida</span>
                <span className="font-bold">{formatCurrency(127500)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="font-medium text-primary-foreground/80">
                  (-) Custos e Despesas
                </span>
                <span className="font-bold text-red-300">{formatCurrency(85000)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-lg">
                <span className="font-bold">(=) Lucro Líquido</span>
                <span className="font-bold text-emerald-300">{formatCurrency(42500)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
