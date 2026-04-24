import { useState, useEffect } from 'react'
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LancamentosForm } from '@/components/lancamentos/LancamentosForm'
import { getOpcoes } from '@/services/opcoes'
import { useToast } from '@/hooks/use-toast'
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [opcoes, setOpcoes] = useState({ categorias: [], contas: [], cartoes: [] })
  const { toast } = useToast()

  useEffect(() => {
    getOpcoes()
      .then(setOpcoes)
      .catch((err) => {
        toast({
          title: 'Erro',
          description: err.message,
          variant: 'destructive',
          duration: 5000,
        })
      })
  }, [toast])

  return (
    <div className="space-y-[16px] animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px]">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
        <div className="flex gap-[16px]">
          <Button variant="outline">Exportar Relatório</Button>
          <Button onClick={() => setIsFormOpen(true)}>Novo Lançamento</Button>
        </div>
      </div>

      <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[14px] font-medium">Saldo Total</CardTitle>
            <Wallet className="h-5 w-5 text-primary" aria-label="Ícone de carteira" />
          </CardHeader>
          <CardContent>
            <div className="text-[24px] font-bold text-primary">{formatCurrency(45320.5)}</div>
            <p className="text-[12px] text-muted-foreground mt-1">
              +2.5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[14px] font-medium">Receitas (Mês)</CardTitle>
            <ArrowUpRight
              className="h-5 w-5 text-[hsl(142,71%,45%)]"
              aria-label="Ícone de receita"
            />
          </CardHeader>
          <CardContent>
            <div className="text-[24px] font-bold text-[hsl(142,71%,45%)]">
              {formatCurrency(28500.0)}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[14px] font-medium">Despesas (Mês)</CardTitle>
            <ArrowDownRight
              className="h-5 w-5 text-[hsl(0,84%,60%)]"
              aria-label="Ícone de despesa"
            />
          </CardHeader>
          <CardContent>
            <div className="text-[24px] font-bold text-[hsl(0,84%,60%)]">
              {formatCurrency(18200.0)}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">-4% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[14px] font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" aria-label="Ícone de lucro" />
          </CardHeader>
          <CardContent>
            <div className="text-[24px] font-bold text-primary">{formatCurrency(10300.0)}</div>
            <p className="text-[12px] text-muted-foreground mt-1">+8% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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

        <div className="col-span-3 space-y-[16px]">
          <Card className="border-[#ffeacc] dark:border-[#7a4810] bg-[#fffbf5] dark:bg-[#2e1a06]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[16px] font-semibold text-[hsl(38,92%,40%)] dark:text-[hsl(38,92%,60%)]">
                Contas a Receber Vencidas
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-[hsl(38,92%,50%)]" aria-label="Aviso" />
            </CardHeader>
            <CardContent>
              <div className="text-[24px] font-bold text-[hsl(38,92%,40%)] dark:text-[hsl(38,92%,60%)]">
                2 pendências
              </div>
              <p className="text-[14px] text-[hsl(38,92%,40%)]/80 mb-4">
                Total de {formatCurrency(3200)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#ffeacc] text-[hsl(38,92%,40%)] hover:bg-[#ffeacc]"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#ffcccc] dark:border-[#7a1a1a] bg-[#fff5f5] dark:bg-[#2e0a0a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[16px] font-semibold text-[hsl(0,84%,40%)] dark:text-[hsl(0,84%,60%)]">
                Contas a Pagar Vencidas
              </CardTitle>
              <Clock className="h-5 w-5 text-[hsl(0,84%,60%)]" aria-label="Relógio" />
            </CardHeader>
            <CardContent>
              <div className="text-[24px] font-bold text-[hsl(0,84%,40%)] dark:text-[hsl(0,84%,60%)]">
                1 pendência
              </div>
              <p className="text-[14px] text-[hsl(0,84%,40%)]/80 mb-4">
                Total de {formatCurrency(850)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#ffcccc] text-[hsl(0,84%,40%)] hover:bg-[#ffcccc]"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
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
                          ? 'bg-[#e6f4ea] text-[hsl(142,71%,35%)] hover:bg-[#cce8d5] border-none'
                          : 'bg-[#ffe6e6] text-[hsl(0,84%,40%)] hover:bg-[#ffcccc] border-none'
                      }
                    >
                      {t.type === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${t.type === 'receita' ? 'text-[hsl(142,71%,40%)]' : 'text-[hsl(0,84%,50%)]'}`}
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-slate-900">
              Novo Lançamento
            </DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <LancamentosForm
              categorias={opcoes.categorias as any}
              contas={opcoes.contas as any}
              cartoes={opcoes.cartoes as any}
              onSuccess={() => {
                setIsFormOpen(false)
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
