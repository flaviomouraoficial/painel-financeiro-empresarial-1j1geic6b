import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, CalendarX2, Edit, Trash } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency, formatDate } from '@/lib/format'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'

export default function Contas() {
  const { tipo } = useParams<{ tipo: string }>()
  const isReceber = tipo === 'receber'
  const collection = isReceber ? 'contas_receber' : 'contas_pagar'
  const entityField = isReceber ? 'cliente_id' : 'fornecedor_id'

  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<any[]>([])
  const [entities, setEntities] = useState<any[]>([])
  const [projetos, setProjetos] = useState<any[]>([])

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ status: 'aberta' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab, setTab] = useState('todos')
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.empresa_id) return
    try {
      const records = await pb.collection(collection).getFullList({
        filter: `empresa_id = "${user.empresa_id}"`,
        sort: 'data_vencimento',
        expand: `${entityField},projeto_id`,
      })
      setData(records)

      const entityCol = isReceber ? 'clientes' : 'fornecedores'
      const [ents, projs] = await Promise.all([
        pb.collection(entityCol).getFullList({ filter: `empresa_id = "${user.empresa_id}"` }),
        pb.collection('projetos').getFullList({ filter: `empresa_id = "${user.empresa_id}"` }),
      ])
      setEntities(ents)
      setProjetos(projs)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao carregar contas.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [tipo, user])
  useRealtime(collection, () => loadData())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { status: 'aberta' })
    setOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        empresa_id: user?.empresa_id,
        data_emissao: formData.data_emissao ? new Date(formData.data_emissao).toISOString() : null,
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento).toISOString()
          : null,
      }
      if (editingId) await pb.collection(collection).update(editingId, payload)
      else await pb.collection(collection).create(payload)
      toast({ title: 'Sucesso', description: 'Conta salva.' })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Verifique os campos obrigatórios.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta conta?')) return
    try {
      await pb.collection(collection).delete(id)
      toast({ title: 'Sucesso', description: 'Conta excluída.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' })
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((c) => {
      const matchSearch = String(c.expand?.[entityField]?.nome || '')
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchTab = tab === 'todos' || c.status === tab
      return matchSearch && matchTab
    })
  }, [data, search, tab, entityField])

  const total = useMemo(
    () =>
      data.reduce(
        (acc, c) =>
          acc +
          (c.status !== 'vencida' && c.status !== (isReceber ? 'recebida' : 'paga')
            ? c.valor_total
            : 0),
        0,
      ),
    [data, isReceber],
  )
  const vencido = useMemo(
    () => data.reduce((acc, c) => acc + (c.status === 'vencida' ? c.valor_total : 0), 0),
    [data],
  )
  const pago = useMemo(
    () =>
      data.reduce(
        (acc, c) => acc + (c.status === (isReceber ? 'recebida' : 'paga') ? c.valor_total : 0),
        0,
      ),
    [data, isReceber],
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Contas a {isReceber ? 'Receber' : 'Pagar'}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpen()}
              className={
                isReceber ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Conta a {isReceber ? 'Receber' : 'Pagar'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Nova'} Conta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{isReceber ? 'Cliente' : 'Fornecedor'}</Label>
                  <Select
                    value={formData[entityField] || ''}
                    onValueChange={(v) => setFormData({ ...formData, [entityField]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº NF</Label>
                    <Input
                      value={formData.numero_nf || ''}
                      onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Valor Total <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={formData.valor_total || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_total: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Emissão</Label>
                    <Input
                      type="date"
                      value={formData.data_emissao?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Vencimento <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      required
                      value={formData.data_vencimento?.split('T')[0] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, data_vencimento: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status || 'aberta'}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                      <SelectItem value={isReceber ? 'recebida' : 'paga'}>
                        {isReceber ? 'Recebida' : 'Paga'}
                      </SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              A {isReceber ? 'Receber' : 'Pagar'}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(total)}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              <CalendarX2 className="h-4 w-4" />
              Vencido
            </div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(vencido)}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-emerald-800 mb-2">
              Já {isReceber ? 'Recebido' : 'Pago'}
            </div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(pago)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="aberta">Abertas</TabsTrigger>
                <TabsTrigger value="vencida">Vencidas</TabsTrigger>
                <TabsTrigger value={isReceber ? 'recebida' : 'paga'}>
                  {isReceber ? 'Recebidas' : 'Pagas'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-medium">
                    {formatDate(c.data_vencimento)}
                  </TableCell>
                  <TableCell>{c.expand?.[entityField]?.nome || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.status === (isReceber ? 'recebida' : 'paga')
                          ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                          : c.status === 'vencida'
                            ? 'text-red-600 border-red-200 bg-red-50'
                            : 'text-orange-600 border-orange-200 bg-orange-50'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(c.valor_total)}
                  </TableCell>
                  <TableCell className="text-right pr-6 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(c)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
