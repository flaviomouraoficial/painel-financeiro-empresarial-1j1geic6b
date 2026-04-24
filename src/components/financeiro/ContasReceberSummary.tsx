import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ContasReceberSummary({ items }: { items: any[] }) {
  const totalAReceber = items
    .filter((i) => i.status === 'pendente' || i.status === 'vencida')
    .reduce((acc, curr) => acc + curr.valor_total, 0)
  const contasVencidas = items.filter((i) => i.status === 'vencida').length
  const jaRecebido = items
    .filter((i) => i.status === 'recebida')
    .reduce((acc, curr) => acc + curr.valor_total, 0)
  const totalContas = items.length
  const taxaRecebimento =
    totalContas > 0 ? (items.filter((i) => i.status === 'recebida').length / totalContas) * 100 : 0

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-teal-600 text-white shadow-md border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBRL(totalAReceber)}</div>
        </CardContent>
      </Card>
      <Card className="bg-teal-600 text-white shadow-md border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Contas Vencidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{contasVencidas}</div>
        </CardContent>
      </Card>
      <Card className="bg-teal-600 text-white shadow-md border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Já Recebido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBRL(jaRecebido)}</div>
        </CardContent>
      </Card>
      <Card className="bg-teal-600 text-white shadow-md border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Taxa de Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{taxaRecebimento.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
