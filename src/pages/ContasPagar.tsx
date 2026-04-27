import { useEffect, useState } from 'react'
import { Plus, FilterX } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getContasPagar, deleteContaPagar } from '@/services/contas-pagar'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useCadastros } from '@/hooks/use-cadastros'
import { useToast } from '@/components/ui/use-toast'
import { Button, Input } from '@/components/ui-helpers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ContasPagarDashboard } from '@/components/contas-pagar/dashboard'
import { ContasPagarTable } from '@/components/contas-pagar/table'
import { ContaForm } from '@/components/contas-pagar/conta-form'
import { PagarModal } from '@/components/contas-pagar/pagar-modal'
import { ExportDropdown } from '@/components/ExportDropdown'
import { format, parseISO } from 'date-fns'

export default function ContasPagar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const cadastros = useCadastros()

  const [contas, setContas] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: 'todas',
    data_inicio: '',
    data_fim: '',
    fornecedor_id: 'todos',
  })

  const [formOpen, setFormOpen] = useState(false)
  const [pagarOpen, setPagarOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<any>(null)

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const data = await getContasPagar(user.empresa_id)
      setContas(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.empresa_id])
  useRealtime('contas_pagar', loadData)

  const filteredContas = contas.filter((c) => {
    if (filters.status !== 'todas' && c.status !== filters.status) return false
    if (filters.fornecedor_id !== 'todos' && c.fornecedor_id !== filters.fornecedor_id) return false
    if (filters.data_inicio && c.data_vencimento < filters.data_inicio) return false
    if (filters.data_fim && c.data_vencimento > filters.data_fim) return false
    return true
  })

  const handleDelete = async () => {
    if (!selectedConta) return
    try {
      await deleteContaPagar(selectedConta.id)
      toast({ title: 'Conta deletada com sucesso', className: 'bg-green-500 text-white' })
      setDeleteOpen(false)
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
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

  const exportarPdf = async () => {
    if (filteredContas.length === 0) return
    const { exportToPdf } = await import('@/lib/pdf-export')

    const tableHtml = `
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Descrição</th>
            <th style="text-align: right">Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredContas
            .map(
              (item) => `
            <tr>
              <td>${item.expand?.fornecedor_id?.nome || '-'}</td>
              <td>${item.descricao || '-'}</td>
              <td style="text-align: right">${formatBRL(item.valor_total)}</td>
              <td>${formatD(item.data_vencimento)}</td>
              <td>${item.status.toUpperCase()}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `

    await exportToPdf({
      filename: `Contas_Pagar_${format(new Date(), 'yyyy_MM_dd')}.pdf`,
      title: 'Relatório de Contas a Pagar',
      period: `${filters.data_inicio ? formatD(filters.data_inicio) : 'Início'} a ${filters.data_fim ? formatD(filters.data_fim) : 'Fim'}`,
      filters: `Status: ${filters.status} | Fornecedor: ${filters.fornecedor_id}`,
      tableHtml,
      orientation: 'landscape',
    })
  }

  const exportarExcel = async () => {
    if (filteredContas.length === 0) return
    const { exportToExcel } = await import('@/lib/export-utils')

    const data = [
      ['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status'],
      ...filteredContas.map((item) => [
        item.expand?.fornecedor_id?.nome || '-',
        item.descricao || '-',
        item.valor_total,
        formatD(item.data_vencimento),
        item.status.toUpperCase(),
      ]),
    ]

    exportToExcel(`Contas_Pagar_${format(new Date(), 'yyyy_MM_dd')}.xls`, [
      { name: 'Contas a Pagar', data },
    ])
  }

  const exportarCsv = async () => {
    if (filteredContas.length === 0) return
    const { exportToCsv } = await import('@/lib/export-utils')

    const data = [
      ['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status'],
      ...filteredContas.map((item) => [
        item.expand?.fornecedor_id?.nome || '-',
        item.descricao || '-',
        item.valor_total,
        formatD(item.data_vencimento),
        item.status.toUpperCase(),
      ]),
    ]

    exportToCsv(`Contas_Pagar_${format(new Date(), 'yyyy_MM_dd')}.csv`, data)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Contas a Pagar</h2>
          <p className="text-muted-foreground">Acompanhe seus pagamentos pendentes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportDropdown
            disabled={filteredContas.length === 0}
            onExportPdf={exportarPdf}
            onExportExcel={exportarExcel}
            onExportCsv={exportarCsv}
          />
          <Button
            onClick={() => {
              setSelectedConta(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Conta
          </Button>
        </div>
      </div>

      <ContasPagarDashboard contas={contas} />

      <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
        <div className="w-48">
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-64">
          <Select
            value={filters.fornecedor_id}
            onValueChange={(v) => setFilters({ ...filters, fornecedor_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Fornecedores</SelectItem>
              {cadastros.fornecedores.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="date"
          className="w-40"
          value={filters.data_inicio}
          onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value })}
        />
        <span className="text-muted-foreground">até</span>
        <Input
          type="date"
          className="w-40"
          value={filters.data_fim}
          onChange={(e) => setFilters({ ...filters, data_fim: e.target.value })}
        />
        <Button
          variant="ghost"
          onClick={() =>
            setFilters({ status: 'todas', data_inicio: '', data_fim: '', fornecedor_id: 'todos' })
          }
        >
          <FilterX className="mr-2 h-4 w-4" /> Limpar Filtros
        </Button>
      </div>

      {filteredContas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
          <h3 className="mt-4 text-lg font-semibold">Nenhuma conta a pagar</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Você não possui registros que correspondam aos filtros.
          </p>
          <Button
            onClick={() => {
              setSelectedConta(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Conta
          </Button>
        </div>
      ) : (
        <ContasPagarTable
          contas={filteredContas}
          onEdit={(c) => {
            setSelectedConta(c)
            setFormOpen(true)
          }}
          onPagar={(c) => {
            setSelectedConta(c)
            setPagarOpen(true)
          }}
          onDelete={(c) => {
            setSelectedConta(c)
            setDeleteOpen(true)
          }}
        />
      )}

      <ContaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        conta={selectedConta}
        cadastros={cadastros}
        onSuccess={loadData}
      />
      <PagarModal
        open={pagarOpen}
        onOpenChange={setPagarOpen}
        conta={selectedConta}
        cadastros={cadastros}
        onSuccess={loadData}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
