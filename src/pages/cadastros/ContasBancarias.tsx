import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Search, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TableRow, TableCell } from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { DataTable } from '@/components/DataTable'
import { formatCurrency } from '@/lib/format'

const BANCOS = [
  'BB',
  'Itaú',
  'Bradesco',
  'Caixa',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'BTG',
  'Outros',
]

export default function ContasBancariasList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ ativo: true, saldo_inicial: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const records = await pb
        .collection('contas_bancarias')
        .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '-created' })
      setData(records)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar.',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('contas_bancarias', () => loadData())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { ativo: true, saldo_inicial: 0, tipo: 'corrente' })
    setOpen(true)
  }

  const validateForm = async () => {
    if (Number(formData.saldo_inicial) < 0) return 'O saldo inicial não pode ser negativo.'
    const filterStr = `banco = "${formData.banco}" && agencia = "${formData.agencia}" && numero_conta = "${formData.numero_conta}" && empresa_id = "${user.empresa_id}"`
    const res = await pb.collection('contas_bancarias').getFullList({ filter: filterStr })
    if (res.length > 0 && res[0].id !== editingId)
      return 'Esta conta bancária já existe no sistema.'
    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = await validateForm()
    if (error)
      return toast({
        title: 'Erro de Validação',
        description: error,
        variant: 'destructive',
        duration: 5000,
      })
    try {
      const payload = {
        ...formData,
        saldo_inicial: Number(formData.saldo_inicial),
        limite_credito: Number(formData.limite_credito || 0),
        empresa_id: user.empresa_id,
        usuario_id: user.id,
      }
      if (!editingId) payload.saldo_atual = payload.saldo_inicial // Initialize current balance

      if (editingId) await pb.collection('contas_bancarias').update(editingId, payload)
      else await pb.collection('contas_bancarias').create(payload)
      toast({
        title: 'Sucesso',
        description: 'Conta salva.',
        className: 'bg-green-600 text-white',
        duration: 3000,
      })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar.',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir?')) return
    try {
      await pb.collection('contas_bancarias').delete(id)
      toast({
        title: 'Sucesso',
        description: 'Excluído.',
        className: 'bg-green-600 text-white',
        duration: 3000,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir.',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  const filtered = data.filter(
    (c) =>
      (c.banco && c.banco.toLowerCase().includes(search.toLowerCase())) ||
      (c.titular && c.titular.toLowerCase().includes(search.toLowerCase())),
  )
  const saldoTotal = data
    .filter((c) => c.ativo)
    .reduce((acc, curr) => acc + (curr.saldo_atual || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Contas Bancárias</h1>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total (Contas Ativas)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              {formatCurrency(saldoTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por banco ou titular..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={['Banco', 'Agência', 'Conta', 'Tipo', 'Saldo Atual', 'Ativo', 'Ações']}
            data={filtered}
            isLoading={loading}
            emptyMessage="Nenhuma conta cadastrada."
            onNew={() => handleOpen()}
            renderRow={(item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.banco}</TableCell>
                <TableCell>{item.agencia || '-'}</TableCell>
                <TableCell>{item.numero_conta || '-'}</TableCell>
                <TableCell className="capitalize">{item.tipo}</TableCell>
                <TableCell className={item.saldo_atual >= 0 ? 'text-green-600' : 'text-red-500'}>
                  {formatCurrency(item.saldo_atual || 0)}
                </TableCell>
                <TableCell>
                  {item.ativo ? (
                    <span className="text-green-600">Sim</span>
                  ) : (
                    <span className="text-red-500">Não</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 shadow-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingId ? 'Editar' : 'Nova'} Conta Bancária
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select
                  required
                  value={formData.banco || ''}
                  onValueChange={(v) => setFormData({ ...formData, banco: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta *</Label>
                <Select
                  required
                  value={formData.tipo || ''}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agência *</Label>
                <Input
                  required
                  value={formData.agencia || ''}
                  onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Número da Conta *</Label>
                <Input
                  required
                  value={formData.numero_conta || ''}
                  onChange={(e) => setFormData({ ...formData, numero_conta: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Titular *</Label>
                <Input
                  required
                  value={formData.titular || ''}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ do Titular *</Label>
                <Input
                  required
                  value={formData.cpf_cnpj_titular || ''}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj_titular: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Abertura</Label>
                <Input
                  type="date"
                  value={formData.data_abertura ? formData.data_abertura.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial ?? 0}
                  onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de Crédito</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.limite_credito || ''}
                  onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(c) => setFormData({ ...formData, ativo: c })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
