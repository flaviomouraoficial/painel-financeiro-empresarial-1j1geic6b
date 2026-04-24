import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const chartData = [
  { month: 'Mai', receitas: 22000, despesas: 15000 },
  { month: 'Jun', receitas: 25000, despesas: 16500 },
  { month: 'Jul', receitas: 24500, despesas: 17000 },
  { month: 'Ago', receitas: 27000, despesas: 18000 },
  { month: 'Set', receitas: 26000, despesas: 17500 },
  { month: 'Out', receitas: 28500, despesas: 18200 },
]

const chartConfig = {
  receitas: { label: 'Receitas', color: 'hsl(var(--chart-2))' }, // Green-ish
  despesas: { label: 'Despesas', color: 'hsl(var(--chart-4))' }, // Red-ish
} satisfies ChartConfig

const recentTransactions = [
  {
    id: '1',
    date: '2023-10-28',
    desc: 'Consultoria Financeira ABC',
    cat: 'Serviços',
    value: 4500,
    type: 'receita',
  },
  {
    id: '2',
    date: '2023-10-27',
    desc: 'Licença Software CRM',
    cat: 'Tecnologia',
    value: 350,
    type: 'despesa',
  },
  {
    id: '3',
    date: '2023-10-25',
    desc: 'Auditoria Empresa XYZ',
    cat: 'Serviços',
    value: 8200,
    type: 'receita',
  },
  {
    id: '4',
    date: '2023-10-24',
    desc: 'Aluguel Escritório',
    cat: 'Infraestrutura',
    value: 2500,
    type: 'despesa',
  },
  {
    id: '5',
    date: '2023-10-23',
    desc: 'Material de Escritório',
    cat: 'Suprimentos',
    value: 120,
    type: 'despesa',
  },
]

export default function Index() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline">Exportar Relatório</Button>
          <Button>Novo Lançamento</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(45320.5)}</div>
            <p className="text-xs text-muted-foreground">+2.5% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(28500.0)}</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(18200.0)}</div>
            <p className="text-xs text-muted-foreground">-4% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(10300.0)}</div>
            <p className="text-xs text-muted-foreground">+8% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <RechartsTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="receitas"
                  fill="var(--color-receitas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="despesas"
                  fill="var(--color-despesas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card className="shadow-sm border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-semibold text-orange-800 dark:text-orange-400">
                Contas a Receber Vencidas
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-500">
                2 pendências
              </div>
              <p className="text-sm text-orange-600/80 mb-4">Total de {formatCurrency(3200)}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-semibold text-red-800 dark:text-red-400">
                Contas a Pagar Vencidas
              </CardTitle>
              <Clock className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-500">1 pendência</div>
              <p className="text-sm text-red-600/80 mb-4">Total de {formatCurrency(850)}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-700 hover:bg-red-100"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Últimos Lançamentos</CardTitle>
          <CardDescription>Suas movimentações mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{formatDate(t.date)}</TableCell>
                  <TableCell>{t.desc}</TableCell>
                  <TableCell>{t.cat}</TableCell>
                  <TableCell>
                    <Badge
                      variant={t.type === 'receita' ? 'default' : 'destructive'}
                      className={
                        t.type === 'receita'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none'
                          : 'bg-red-100 text-red-800 hover:bg-red-200 border-none'
                      }
                    >
                      {t.type === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${t.type === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {t.type === 'receita' ? '+' : '-'}
                    {formatCurrency(t.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
