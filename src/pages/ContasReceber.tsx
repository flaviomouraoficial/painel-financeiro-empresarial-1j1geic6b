import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  getContasReceber,
  createContaReceber,
  updateContaReceber,
  deleteContaReceber,
} from '@/services/contas_receber'
import { getClientes } from '@/services/clientes'
import { getProjetos } from '@/services/projetos'
import { createRecebimento } from '@/services/recebimentos'
import { createLancamento } from '@/services/lancamentos'
import { ContasReceberSummary } from '@/components/financeiro/ContasReceberSummary'
import { ContasReceberFilter } from '@/components/financeiro/ContasReceberFilter'
import { ContaReceberForm } from '@/components/financeiro/ContaReceberForm'
import { ReceberModal } from '@/components/financeiro/ReceberModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit, Trash2, CheckCircle, Receipt, RefreshCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export default function ContasReceber() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [filters, setFilters] = useState({
    status: 'Todas',
    cliente: 'Todos',
    dataInicio: '',
    dataFim: '',
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [receberOpen, setReceberOpen] = useState(false)
  const [receberItem, setReceberItem] = useState<any>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(false)
      const [resContas, resClientes, resProjetos] = await Promise.all([
        getContasReceber(),
        getClientes(),
        getProjetos(),
      ])
      setItems(resContas)
      setClientes(resClientes)
      setProjetos(resProjetos)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('contas_receber', loadData)

  const handleSave = async (data: any) => {
    setIsSubmitting(true)
    try {
      const payload = { ...data, empresa_id: user.empresa_id }
      if (editingItem) {
        await updateContaReceber(editingItem.id, payload)
        toast({ title: 'Conta atualizada com sucesso' })
      } else {
        payload.status = 'pendente'
        await createContaReceber(payload)
        toast({ title: 'Conta a receber criada com sucesso' })
      }
      setFormOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar. Tente novamente.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceber = async (data: any) => {
    setIsSubmitting(true)
    try {
      await updateContaReceber(receberItem.id, { status: 'recebida' })
      await createRecebimento({
        empresa_id: user.empresa_id,
        conta_receber_id: receberItem.id,
        valor_recebido: data.valor_recebido,
        data_recebimento: data.data_recebimento + ' 12:00:00.000Z',
        forma_pagamento: data.forma_pagamento,
        usuario_id: user.id,
      })
      await createLancamento({
        empresa_id: user.empresa_id,
        usuario_id: user.id,
        tipo: 'receita',
        descricao: `Recebimento: ${receberItem.descricao}`,
        valor: data.valor_recebido,
        data_lancamento: data.data_recebimento + ' 12:00:00.000Z',
        data_competencia: receberItem.data_vencimento,
        status: 'confirmado',
        forma_pagamento: data.forma_pagamento,
        cliente_id: receberItem.cliente_id,
        projeto_id: receberItem.projeto_id,
      })
      toast({ title: 'Recebimento registrado com sucesso' })
      setReceberOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao registrar recebimento.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await deleteContaReceber(deleteItem.id)
      toast({ title: 'Conta deletada com sucesso' })
      setDeleteOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao deletar conta.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const formatD = (d: string) => {
    try {
      return format(parseISO(d), 'dd/MM/yyyy')
    } catch {
      return d
    }
  }

  const filteredItems = items.filter((i) => {
    if (filters.status !== 'Todas' && i.status !== filters.status) return false
    if (filters.cliente !== 'Todos' && i.cliente_id !== filters.cliente) return false
    if (filters.dataInicio && i.data_vencimento < filters.dataInicio) return false
    if (filters.dataFim && i.data_vencimento > filters.dataFim + 'T23:59:59') return false
    return true
  })

  if (error)
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <p className="text-red-500 mb-4 font-medium text-lg">Erro ao carregar dados.</p>
        <Button onClick={loadData}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-500">Acompanhe seus recebimentos pendentes</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setFormOpen(true)
          }}
          className="bg-teal-600 hover:bg-teal-700 h-[44px]"
        >
          <Plus className="mr-2 h-5 w-5" /> Nova Conta a Receber
        </Button>
      </div>

      {!loading && <ContasReceberSummary items={items} />}

      <ContasReceberFilter
        filters={filters}
        setFilters={setFilters}
        clientes={clientes}
        onClear={() =>
          setFilters({ status: 'Todas', cliente: 'Todos', dataInicio: '', dataFim: '' })
        }
      />

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <Receipt className="mx-auto h-12 w-12 mb-3 opacity-20" />
                    <p className="mb-4">Nenhuma conta a receber encontrada</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setFormOpen(true)
                      }}
                    >
                      Nova Conta
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, i) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b hover:bg-gray-100 transition-colors',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                    )}
                  >
                    <td className="px-6 py-4 font-medium">
                      {item.expand?.cliente_id?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px]">{item.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatBRL(item.valor_total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatD(item.data_vencimento)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn('px-2.5 py-1 rounded-full text-xs font-medium', {
                          'bg-yellow-100 text-yellow-800': item.status === 'pendente',
                          'bg-red-100 text-red-800': item.status === 'vencida',
                          'bg-green-100 text-green-800': item.status === 'recebida',
                          'bg-gray-100 text-gray-800': item.status === 'cancelada',
                        })}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {item.status !== 'recebida' && item.status !== 'cancelada' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setReceberItem(item)
                            setReceberOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setEditingItem(item)
                          setFormOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeleteItem(item)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
            </DialogTitle>
          </DialogHeader>
          {formOpen && (
            <ContaReceberForm
              isNew={!editingItem}
              defaultValues={editingItem}
              onSubmit={handleSave}
              isSubmitting={isSubmitting}
              clientes={clientes}
              projetos={projetos}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={receberOpen} onOpenChange={setReceberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
            <DialogDescription>Confirme os dados do pagamento recebido.</DialogDescription>
          </DialogHeader>
          {receberOpen && (
            <ReceberModal
              conta={receberItem}
              onSubmit={handleReceber}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar esta conta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
