import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet } from 'lucide-react'

export function KpiCards({ data, periodo }: { data: any; periodo: number }) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - periodo)
  const isRecent = (dStr: string) => new Date(dStr) >= cutoffDate

  const lancamentosPeriodo = data.lancamentos.filter(
    (l: any) => isRecent(l.data_lancamento) && l.status === 'confirmado',
  )

  const receita = lancamentosPeriodo
    .filter((l: any) => l.tipo === 'receita')
    .reduce((a: number, b: any) => a + b.valor, 0)
  const despesa = lancamentosPeriodo
    .filter((l: any) => l.tipo === 'despesa')
    .reduce((a: number, b: any) => a + b.valor, 0)
  const lucro = receita - despesa
  const fluxoCaixa = data.contasBancarias.reduce((a: number, b: any) => a + (b.saldo_atual || 0), 0)

  const contasVencidas = [...data.contasReceber, ...data.contasPagar].filter(
    (c: any) =>
      (c.status === 'vencida' || c.status === 'pendente') &&
      new Date(c.data_vencimento) < new Date(),
  ).length

  const margem = receita > 0 ? lucro / receita : 0
  const receitasTotais = data.contasReceber.length
  const receitasRecebidas = data.contasReceber.filter((c: any) => c.status === 'recebida').length
  const taxaRecebimento = receitasTotais > 0 ? receitasRecebidas / receitasTotais : 0

  let score = 0
  if (fluxoCaixa > 0) score += 30
  if (taxaRecebimento > 0.8) score += 20
  if (margem > 0.3) score += 25
  if (contasVencidas === 0) score += 25

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">R$ {receita.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">R$ {despesa.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          <DollarSign className={`h-4 w-4 ${lucro >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {lucro.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
          <Wallet className="h-4 w-4 text-[#268C83]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#268C83]">R$ {fluxoCaixa.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${score > 70 ? 'text-green-500' : score >= 40 ? 'text-orange-500' : 'text-red-500'}`}
          >
            {score}/100
          </div>
          <Progress value={score} className="h-2 mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
