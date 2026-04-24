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
import { Switch } from '@/components/ui/switch'
import { TableRow, TableCell } from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { DataTable } from '@/components/DataTable'
import { formatCurrency } from '@/lib/format'

const CATEGORIAS = [
  'Alimentação',
  'Eletrônicos',
  'Serviços Gerais',
  'Manutenção',
  'Materiais de Escritório',
  'Outros',
]

export default function ProdutosList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ tipo: 'produto', ativo: true, estoque: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const [records, forns] = await Promise.all([
        pb
          .collection('produtos_servicos')
          .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '+nome' }),
        pb
          .collection('fornecedores')
          .getFullList({ filter: `empresa_id = "${user.empresa_id}"`, sort: '+nome' }),
      ])
      setData(records)
      setFornecedores(forns)
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
  useRealtime('produtos_servicos', () => loadData())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { tipo: 'produto', ativo: true, estoque: 0 })
    setOpen(true)
  }

  const validateForm = async () => {
    if (Number(formData.preco_unitario) <= 0) return 'O preço unitário deve ser maior que zero.'
    if (formData.sku) {
      const res = await pb
        .collection('produtos_servicos')
        .getFullList({ filter: `sku = "${formData.sku}" && empresa_id = "${user.empresa_id}"` })
      if (res.length > 0 && res[0].id !== editingId) return 'Este SKU já está em uso.'
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
        preco_unitario: Number(formData.preco_unitario),
        estoque: Number(formData.estoque || 0),
        empresa_id: user.empresa_id,
      }
      if (editingId) await pb.collection('produtos_servicos').update(editingId, payload)
      else await pb.collection('produtos_servicos').create(payload)
      toast({
        title: 'Sucesso',
        description: 'Registro salvo.',
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
      await pb.collection('produtos_servicos').delete(id)
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
      (c.sku && c.sku.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Produtos e Serviços</h1>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou SKU..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={['Nome', 'Tipo', 'Categoria', 'Preço Unitário', 'Ativo', 'Ações']}
            data={filtered}
            isLoading={loading}
            emptyMessage="Nenhum registro encontrado."
            onNew={() => handleOpen()}
            renderRow={(item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell className="capitalize">{item.tipo}</TableCell>
                <TableCell>{item.categoria || '-'}</TableCell>
                <TableCell>{formatCurrency(item.preco_unitario)}</TableCell>
                <TableCell>
                  {item.ativo ? (
                    <span className="text-green-600 font-medium">Sim</span>
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
        <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 shadow-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingId ? 'Editar' : 'Novo'} Registro
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  required
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  required
                  value={formData.categoria || ''}
                  onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Preço Unitário *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={formData.preco_unitario || ''}
                  onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código único"
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Inicial</Label>
                <Input
                  type="number"
                  value={formData.estoque ?? 0}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  disabled={formData.tipo === 'servico'}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input
                  value={formData.unidade_medida || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                  placeholder="Ex: Un, Kg, Hora"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Fornecedor Associado</Label>
                <Select
                  value={formData.fornecedor_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, fornecedor_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
