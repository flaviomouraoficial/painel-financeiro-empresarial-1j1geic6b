import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/format'

export function CashTrendChart({ data }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data.contasBancarias) return []

    const currentBalance = data.contasBancarias.reduce(
      (acc: number, c: any) => acc + (c.saldo_atual || 0),
      0,
    )

    const months = []
    const now = new Date()
    for (let i = -6; i <= 3; i++) {
      const d = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i)
      months.push({
        date: d,
        label: format(d, 'MMM/yy', { locale: ptBR }),
        isFuture: i > 0,
        receitas: 0,
        despesas: 0,
        receber: 0,
        pagar: 0,
        saldoRealizado: null as number | null,
        saldoProjetado: null as number | null,
      })
    }

    data.lancamentos?.forEach((l: any) => {
      if (l.status !== 'confirmado') return
      const lDate = new Date(l.data_lancamento)
      const m = months.find(
        (m) =>
          m.date.getMonth() === lDate.getMonth() && m.date.getFullYear() === lDate.getFullYear(),
      )
      if (m && !m.isFuture) {
        if (l.tipo === 'receita') m.receitas += l.valor
        else m.despesas += l.valor
      }
    })

    data.contasReceber?.forEach((c: any) => {
      if (c.status === 'cancelada' || c.status === 'recebida') return
      const cDate = new Date(c.data_vencimento)
      const m = months.find(
        (m) =>
          m.date.getMonth() === cDate.getMonth() && m.date.getFullYear() === cDate.getFullYear(),
      )
      if (m && m.isFuture) {
        m.receber += c.valor_total || 0
      }
    })

    data.contasPagar?.forEach((c: any) => {
      if (c.status === 'cancelada' || c.status === 'paga') return
      const cDate = new Date(c.data_vencimento)
      const m = months.find(
        (m) =>
          m.date.getMonth() === cDate.getMonth() && m.date.getFullYear() === cDate.getFullYear(),
      )
      if (m && m.isFuture) {
        m.pagar += c.valor_total || 0
      }
    })

    let runningBalance = currentBalance
    months[6].saldoRealizado = runningBalance
    months[6].saldoProjetado = runningBalance

    for (let i = 5; i >= 0; i--) {
      const nextMonth = months[i + 1]
      runningBalance = runningBalance - nextMonth.receitas + nextMonth.despesas
      months[i].saldoRealizado = runningBalance
    }

    runningBalance = currentBalance
    for (let i = 7; i <= 9; i++) {
      const m = months[i]
      runningBalance = runningBalance + m.receber - m.pagar
      m.saldoProjetado = runningBalance
    }

    return months.map((m) => ({
      name: m.label,
      Realizado: m.saldoRealizado,
      Projetado: m.saldoProjetado,
    }))
  }, [data])

  const chartConfig = {
    Realizado: { label: 'Realizado (R$)', color: '#10B981' },
    Projetado: { label: 'Projetado (R$)', color: '#6366F1' },
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Tendência de Caixa (6 meses histórico e 3 meses projetado)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />}
            />
            <ChartLegend content={<ChartLegendContent />} />

            <Line
              type="monotone"
              dataKey="Realizado"
              stroke="var(--color-Realizado)"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Projetado"
              stroke="var(--color-Projetado)"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls
            />

            {chartData.length > 0 && (
              <ReferenceLine
                x={chartData[6]?.name}
                stroke="#888"
                strokeDasharray="3 3"
                label={{ position: 'insideTopLeft', value: 'Atual', fill: '#888', fontSize: 12 }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
