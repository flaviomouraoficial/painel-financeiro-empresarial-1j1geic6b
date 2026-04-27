import { useState, useEffect } from 'react'
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  ReceiptText,
  CheckCircle,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getRecibos, deleteRecibo, getReciboItens, updateReciboStatus } from '@/services/recibos'
import { generateReciboPDF } from '@/components/recibos/pdf'
import { formatCurrency, formatDate } from '@/lib/format'
import useRealtime from '@/hooks/use-realtime'
import ReciboFormModal from '@/components/recibos/ReciboFormModal'
import ReciboDetailsModal from '@/components/recibos/ReciboDetailsModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function RecibosDespesas() {
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setData(await getRecibos())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('recibos', load)

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateReciboStatus(id, status)
      toast({ title: `Status atualizado para ${status}`, duration: 3000 })
      load()
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive', duration: 5000 })
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      await deleteRecibo(selected.id)
      toast({ title: 'Recibo deletado com sucesso', duration: 3000 })
      load()
    } catch (e) {
      toast({ title: 'Erro ao deletar', variant: 'destructive', duration: 5000 })
    }
    setDeleteOpen(false)
  }

  const handlePdf = async (recibo: any) => {
    try {
      toast({ title: 'Gerando PDF...', duration: 3000 })
      const itens = await getReciboItens(recibo.id)
      const { default: pb } = await import('@/lib/pocketbase/client')
      const empresa = await pb.collection('empresas').getOne(recibo.empresa_id)
      await generateReciboPDF(recibo, itens, empresa)
    } catch (e) {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive', duration: 5000 })
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Recibos de Despesas de Viagem
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie recibos numerados para reembolso de despesas
          </p>
        </div>
        <Button
          onClick={() => {
            setSelected(null)
            setFormOpen(true)
          }}
          className="bg-[#268C83] hover:bg-[#1a665f] h-[44px] rounded-lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Novo Recibo
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <h3 className="text-lg font-semibold text-destructive">Erro ao carregar recibos</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Não foi possível carregar a lista de recibos.
            </p>
            <Button onClick={load} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <ReceiptText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Nenhum recibo cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Comece criando o primeiro recibo para reembolso.
            </p>
            <Button
              onClick={() => {
                setSelected(null)
                setFormOpen(true)
              }}
              className="bg-[#268C83] hover:bg-[#1a665f] h-[44px] rounded-lg"
            >
              Novo Recibo
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Número</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium text-right">Valor Total</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/50 transition-colors odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="p-4 font-medium text-primary">{r.numero_recibo}</td>
                    <td className="p-4 truncate max-w-[200px]">{r.expand?.cliente_id?.nome}</td>
                    <td className="p-4">{formatDate(r.data_criacao)}</td>
                    <td className="p-4 text-right font-bold text-[#268C83]">
                      {formatCurrency(r.valor_nf)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          r.status === 'aprovado'
                            ? 'default'
                            : r.status === 'reembolsado'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {r.status === 'pendente' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Aprovar Recibo"
                            onClick={() => handleStatusChange(r.id, 'aprovado')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {r.status === 'aprovado' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Marcar como Reembolsado"
                            onClick={() => handleStatusChange(r.id, 'reembolsado')}
                          >
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Detalhes"
                          onClick={() => {
                            setSelected(r)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Gerar PDF"
                          onClick={() => handlePdf(r)}
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                        {r.status === 'pendente' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => {
                              setSelected(r)
                              setFormOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelected(r)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReciboFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        recibo={selected}
        onSuccess={load}
      />
      <ReciboDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} recibo={selected} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Recibo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este recibo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
