import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, differenceInDays } from 'date-fns'

export function AlertsTable({ data }: { data: any }) {
  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  const allAccounts = [
    ...data.contasReceber.map((c: any) => ({ ...c, type: 'receber' })),
    ...data.contasPagar.map((c: any) => ({ ...c, type: 'pagar' })),
  ]

  const vencidas = allAccounts
    .filter(
      (c) =>
        (c.status === 'vencida' || c.status === 'pendente') && new Date(c.data_vencimento) < today,
    )
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
    .slice(0, 5)

  const aVencer = allAccounts
    .filter(
      (c) =>
        c.status === 'pendente' &&
        new Date(c.data_vencimento) >= today &&
        new Date(c.data_vencimento) <= nextWeek,
    )
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Contas Vencidas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vencidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma conta vencida
                  </TableCell>
                </TableRow>
              ) : (
                vencidas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao || 'N/A'}</TableCell>
                    <TableCell>R$ {c.valor_total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {differenceInDays(today, new Date(c.data_vencimento))} dias
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-500">Próximos Vencimentos (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aVencer.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhum vencimento próximo
                  </TableCell>
                </TableRow>
              ) : (
                aVencer.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao || 'N/A'}</TableCell>
                    <TableCell>R$ {c.valor_total.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(c.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
