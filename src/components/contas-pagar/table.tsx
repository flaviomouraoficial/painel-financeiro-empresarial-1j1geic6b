import { Edit2, Trash2, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui-helpers'

export function ContasPagarTable({
  contas,
  onEdit,
  onPagar,
  onDelete,
}: {
  contas: any[]
  onEdit: (c: any) => void
  onPagar: (c: any) => void
  onDelete: (c: any) => void
}) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

  const badgeColors: any = {
    pendente: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    vencida: 'bg-red-500 hover:bg-red-600 text-white',
    paga: 'bg-green-500 hover:bg-green-600 text-white',
    cancelada: 'bg-gray-500 hover:bg-gray-600 text-white',
  }

  if (contas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">Nenhuma conta a pagar encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="h-10 px-4 font-medium text-muted-foreground">Fornecedor</th>
            <th className="h-10 px-4 font-medium text-muted-foreground">Descrição</th>
            <th className="h-10 px-4 font-medium text-muted-foreground">Valor</th>
            <th className="h-10 px-4 font-medium text-muted-foreground">Vencimento</th>
            <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
            <th className="h-10 px-4 font-medium text-muted-foreground text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="[&_tr:nth-child(even)]:bg-muted/30">
          {contas.map((c) => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="p-4 align-middle">{c.expand?.fornecedor_id?.nome || '-'}</td>
              <td className="p-4 align-middle">{c.descricao || c.numero_nf || '-'}</td>
              <td className="p-4 align-middle">{formatCurrency(c.valor_total)}</td>
              <td className="p-4 align-middle">{formatDate(c.data_vencimento)}</td>
              <td className="p-4 align-middle">
                <Badge className={badgeColors[c.status]}>{c.status.toUpperCase()}</Badge>
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                  {c.status !== 'paga' && c.status !== 'cancelada' && (
                    <Button variant="outline" size="sm" onClick={() => onPagar(c)}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Pagar
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(c)}>
                    <Edit2 className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(c)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
