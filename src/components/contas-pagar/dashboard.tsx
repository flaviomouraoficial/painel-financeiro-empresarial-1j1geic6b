import { Wallet, AlertTriangle, CheckCircle, Percent } from 'lucide-react'

export function ContasPagarDashboard({ contas }: { contas: any[] }) {
  const totalPagar = contas
    .filter((c) => c.status === 'pendente' || c.status === 'vencida')
    .reduce((acc, c) => acc + c.valor_total, 0)

  const qtdVencidas = contas.filter((c) => c.status === 'vencida').length

  const totalPago = contas
    .filter((c) => c.status === 'paga')
    .reduce((acc, c) => acc + c.valor_total, 0)

  const taxaPagamento =
    contas.length > 0 ? (contas.filter((c) => c.status === 'paga').length / contas.length) * 100 : 0

  const cards = [
    {
      title: 'Total a Pagar',
      value: totalPagar,
      format: 'currency',
      icon: Wallet,
      color: 'text-primary',
    },
    {
      title: 'Contas Vencidas',
      value: qtdVencidas,
      format: 'number',
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      title: 'Já Pago',
      value: totalPago,
      format: 'currency',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Taxa de Pagamento',
      value: taxaPagamento,
      format: 'percent',
      icon: Percent,
      color: 'text-gray-500',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{c.title}</h3>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {c.format === 'currency'
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    c.value,
                  )
                : c.format === 'percent'
                  ? `${c.value.toFixed(1)}%`
                  : c.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
