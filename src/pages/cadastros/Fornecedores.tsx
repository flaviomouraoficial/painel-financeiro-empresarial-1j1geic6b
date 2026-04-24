import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Search } from 'lucide-react'
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
import { TableRow, TableCell } from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { DataTable } from '@/components/DataTable'

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]
const BANCOS = ['BB', 'Itaú', 'Bradesco', 'Caixa', 'Santander', 'Nubank', 'Inter', 'Outros']

export default function FornecedoresList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ tipo: 'pj' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const records = await pb
        .collection('fornecedores')
        .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '+nome' })
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
  useRealtime('fornecedores', () => loadData())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { tipo: 'pj' })
    setOpen(true)
  }

  const validateForm = async () => {
    const cpfCnpj = (formData.cpf_cnpj || '').replace(/\D/g, '')
    if (formData.tipo === 'pf' && cpfCnpj.length !== 11) return 'CPF deve ter 11 dígitos.'
    if (formData.tipo === 'pj' && cpfCnpj.length !== 14) return 'CNPJ deve ter 14 dígitos.'
    if (formData.email) {
      const res = await pb
        .collection('fornecedores')
        .getFullList({ filter: `email = "${formData.email}" && empresa_id = "${user.empresa_id}"` })
      if (res.length > 0 && res[0].id !== editingId) return 'Este email já está cadastrado.'
    }
    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = await validateForm()
    if (error)
      return toast({ title: 'Erro', description: error, variant: 'destructive', duration: 5000 })
    try {
      const payload = { ...formData, empresa_id: user.empresa_id }
      if (editingId) await pb.collection('fornecedores').update(editingId, payload)
      else await pb.collection('fornecedores').create(payload)
      toast({
        title: 'Sucesso',
        description: 'Fornecedor salvo.',
        className: 'bg-green-600 text-white border-none',
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
      await pb.collection('fornecedores').delete(id)
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
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(search)),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Fornecedores</h1>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={['Nome', 'Tipo', 'CPF/CNPJ', 'Email', 'Telefone', 'Ações']}
            data={filtered}
            isLoading={loading}
            emptyMessage="Nenhum fornecedor cadastrado."
            onNew={() => handleOpen()}
            renderRow={(item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell className="uppercase">{item.tipo}</TableCell>
                <TableCell>{item.cpf_cnpj || '-'}</TableCell>
                <TableCell>{item.email || '-'}</TableCell>
                <TableCell>{item.telefone || '-'}</TableCell>
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
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ *</Label>
                <Input
                  required
                  value={formData.cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  placeholder={formData.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  required
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2">
                <hr className="my-2" />
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
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
                <Label>Tipo de Conta</Label>
                <Select
                  value={formData.tipo_conta || ''}
                  onValueChange={(v) => setFormData({ ...formData, tipo_conta: v })}
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
                <Label>Agência</Label>
                <Input
                  value={formData.agencia || ''}
                  onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input
                  value={formData.conta || ''}
                  onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
