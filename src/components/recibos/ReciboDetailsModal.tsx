import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { getReciboItens } from '@/services/recibos'
import { formatCurrency, formatDate } from '@/lib/format'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export default function ReciboDetailsModal({ open, onOpenChange, recibo }: any) {
  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    if (open && recibo) getReciboItens(recibo.id).then(setItens)
  }, [open, recibo])

  if (!recibo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center justify-between mt-4 pr-6">
            <DialogTitle>Recibo: {recibo.numero_recibo}</DialogTitle>
            <Badge
              variant={
                recibo.status === 'aprovado'
                  ? 'default'
                  : recibo.status === 'reembolsado'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {recibo.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{recibo.expand?.cliente_id?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {recibo.expand?.cliente_id?.cpf_cnpj}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Conta para Reembolso</p>
                <p className="font-medium">{recibo.expand?.conta_bancaria_id?.banco}</p>
                <p className="text-xs text-muted-foreground">
                  Ag: {recibo.expand?.conta_bancaria_id?.agencia} / CC:{' '}
                  {recibo.expand?.conta_bancaria_id?.numero_conta}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data NF</p>
                <p className="font-medium">{formatDate(recibo.data_nf)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Número NF</p>
                <p className="font-medium">{recibo.numero_nf}</p>
              </div>
            </div>

            {recibo.arquivo_nf && (
              <div className="pt-2">
                <a
                  href={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/recibos/${recibo.id}/${recibo.arquivo_nf}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                >
                  Ver Arquivo da Nota Fiscal Anexada
                </a>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Itens da Despesa</h4>
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Descrição</th>
                      <th className="p-2 text-center">Qtd</th>
                      <th className="p-2 text-right">V. Unit</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((i) => (
                      <tr key={i.id} className="border-t">
                        <td className="p-2">{i.descricao}</td>
                        <td className="p-2 text-center">{i.quantidade}</td>
                        <td className="p-2 text-right">{formatCurrency(i.valor_unitario)}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(i.valor_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end bg-muted/30 p-4 rounded-lg border">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Valor Total do Recibo</p>
                  <p className="text-2xl font-bold text-[#268C83]">
                    {formatCurrency(itens.reduce((a, b) => a + b.quantidade * b.valor_unitario, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
