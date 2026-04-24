import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Search, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  'Outros',
]
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Outra']

export default function CartoesCreditoList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ ativo: true })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const [records, ctas] = await Promise.all([
        pb
          .collection('cartoes_credito')
          .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '-created' }),
        pb.collection('contas_bancarias').getFullList({
          filter: `empresa_id = "${user.empresa_id}" && ativo = true`,
          sort: '+banco',
        }),
      ])
      setData(records)
      setContas(ctas)
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
  useRealtime('cartoes_credito', () => loadData())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { ativo: true })
    setOpen(true)
  }

  const validateForm = async () => {
    if (formData.numero_completo && formData.numero_completo.length < 15)
      return 'Número do cartão inválido.'
    if (formData.data_validade) {
      const [mm, yy] = formData.data_validade.split('/')
      if (
        !mm ||
        !yy ||
        Number(mm) < 1 ||
        Number(mm) > 12 ||
        Number(yy) < new Date().getFullYear()
      ) {
        return 'Data de validade inválida ou vencida.'
      }
    }

    if (formData.numero_completo) {
      const ultimos = formData.numero_completo.slice(-4)
      const res = await pb.collection('cartoes_credito').getFullList({
        filter: `numero_ultimos_digitos = "${ultimos}" && banco = "${formData.banco}" && empresa_id = "${user.empresa_id}"`,
      })
      if (res.length > 0 && res[0].id !== editingId)
        return 'Parece que este cartão já está cadastrado (mesmos 4 últimos dígitos no mesmo banco).'
    }
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
        limite: Number(formData.limite || 0),
        empresa_id: user.empresa_id,
        usuario_id: user.id,
      }
      if (editingId) await pb.collection('cartoes_credito').update(editingId, payload)
      else await pb.collection('cartoes_credito').create(payload)
      toast({
        title: 'Sucesso',
        description: 'Cartão salvo.',
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
      await pb.collection('cartoes_credito').delete(id)
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
      (c.titular && c.titular.toLowerCase().includes(search.toLowerCase())) ||
      (c.numero_ultimos_digitos && c.numero_ultimos_digitos.includes(search)),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Cartões de Crédito</h1>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Cartão
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por banco, titular ou finais..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              'Banco',
              'Bandeira',
              'Finais',
              'Titular',
              'Limite',
              'Dia Venc.',
              'Ativo',
              'Ações',
            ]}
            data={filtered}
            isLoading={loading}
            emptyMessage="Nenhum cartão cadastrado."
            onNew={() => handleOpen()}
            renderRow={(item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" /> {item.banco}
                </TableCell>
                <TableCell>{item.bandeira || '-'}</TableCell>
                <TableCell>**** {item.numero_ultimos_digitos || '----'}</TableCell>
                <TableCell>{item.titular || '-'}</TableCell>
                <TableCell>{formatCurrency(item.limite || 0)}</TableCell>
                <TableCell>
                  {item.vencimento ? new Date(item.vencimento).getDate() + 1 : '-'}
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
                {editingId ? 'Editar' : 'Novo'} Cartão
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
                <Label>Bandeira *</Label>
                <Select
                  required
                  value={formData.bandeira || ''}
                  onValueChange={(v) => setFormData({ ...formData, bandeira: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANDEIRAS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Número do Cartão {editingId ? '(Opcional)' : '*'}</Label>
                <Input
                  required={!editingId}
                  type="password"
                  value={formData.numero_completo || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_completo: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder={editingId ? 'Deixe em branco para não alterar' : 'Apenas números'}
                  maxLength={16}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Titular *</Label>
                <Input
                  required
                  value={formData.titular || ''}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                  placeholder="Como impresso no cartão"
                />
              </div>
              <div className="space-y-2">
                <Label>Validade (MM/YYYY) *</Label>
                <Input
                  required
                  value={formData.data_validade || ''}
                  onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                  placeholder="MM/YYYY"
                  maxLength={7}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV {editingId ? '(Opcional)' : '*'}</Label>
                <Input
                  required={!editingId}
                  type="password"
                  value={formData.cvv || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="Código de segurança"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Dia do Vencimento da Fatura *</Label>
                <Input
                  required
                  type="date"
                  value={formData.vencimento ? formData.vencimento.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de Crédito *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={formData.limite || ''}
                  onChange={(e) => setFormData({ ...formData, limite: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Conta Bancária Associada</Label>
                <Select
                  value={formData.conta_bancaria_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, conta_bancaria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.banco} - {c.agencia}/{c.numero_conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Ativo</Label>
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
