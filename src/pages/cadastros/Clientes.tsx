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

export default function ClientesList() {
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
        .collection('clientes')
        .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '+nome' })
      setData(records)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar clientes.',
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
  useRealtime('clientes', () => loadData())

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
        .collection('clientes')
        .getFullList({ filter: `email = "${formData.email}" && empresa_id = "${user.empresa_id}"` })
      if (res.length > 0 && res[0].id !== editingId) return 'Este email já está cadastrado.'
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
      const payload = { ...formData, empresa_id: user.empresa_id }
      if (editingId) await pb.collection('clientes').update(editingId, payload)
      else await pb.collection('clientes').create(payload)
      toast({
        title: 'Sucesso',
        description: 'Cliente salvo com sucesso.',
        className: 'bg-green-600 text-white border-none',
        duration: 3000,
      })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar cliente.',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cliente?')) return
    try {
      await pb.collection('clientes').delete(id)
      toast({
        title: 'Sucesso',
        description: 'Cliente excluído.',
        className: 'bg-green-600 text-white border-none',
        duration: 3000,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir.',
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
        <h1 className="text-2xl font-bold tracking-tight text-primary">Clientes</h1>
        <Button
          onClick={() => handleOpen()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cliente..."
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
            emptyMessage="Nenhum cliente cadastrado."
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
        <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 shadow-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>
                  Tipo <span className="text-red-500">*</span>
                </Label>
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
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>
                  CPF/CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.cpf_cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  placeholder={formData.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade || ''}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div className="col-span-1 sm:col-span-1 grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.estado || ''}
                    onValueChange={(v) => setFormData({ ...formData, estado: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep || ''}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
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
