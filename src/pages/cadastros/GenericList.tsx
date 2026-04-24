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
import { Checkbox } from '@/components/ui/checkbox'
import { TableRow, TableCell } from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { CRUD_CONFIGS } from '@/lib/crud-configs'
import { DataTable } from '@/components/DataTable'
import { formatCurrency } from '@/lib/format'

export default function GenericList({ tipo }: { tipo: string }) {
  const config = CRUD_CONFIGS[tipo]
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!config || !user?.empresa_id) return
    try {
      const records = await pb.collection(config.collection).getFullList({
        filter: `empresa_id = "${user.empresa_id}"`,
        sort: '-created',
      })
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
  }, [tipo, user])
  useRealtime(config?.collection || '', () => loadData(), !!config)

  if (!config)
    return <div className="p-8 text-center text-muted-foreground">Configuração não encontrada.</div>

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { ativo: true })
    setOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, empresa_id: user.empresa_id }
      if (editingId) await pb.collection(config.collection).update(editingId, payload)
      else await pb.collection(config.collection).create(payload)
      toast({
        title: 'Sucesso',
        description: 'Registro salvo com sucesso.',
        className: 'bg-green-600 text-white border-none',
        duration: 3000,
      })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    try {
      await pb.collection(config.collection).delete(id)
      toast({
        title: 'Sucesso',
        description: 'Registro excluído.',
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

  const filteredData = data.filter((item) =>
    Object.values(item).some((v) => String(v).toLowerCase().includes(search.toLowerCase())),
  )
  const cols = [...config.columns.map((c: any) => c.label), 'Ações']

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Cadastro de {config.title}
        </h1>
        <Button
          onClick={() => handleOpen()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
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
            columns={cols}
            data={filteredData}
            isLoading={loading}
            emptyMessage={`Nenhum ${config.title.toLowerCase()} cadastrado.`}
            onNew={() => handleOpen()}
            renderRow={(item: any) => (
              <TableRow key={item.id}>
                {config.columns.map((col: any) => (
                  <TableCell key={col.key}>
                    {col.format === 'currency'
                      ? formatCurrency(item[col.key])
                      : col.format === 'boolean'
                        ? item[col.key]
                          ? 'Sim'
                          : 'Não'
                        : item[col.key]}
                  </TableCell>
                ))}
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
        <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 shadow-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingId ? 'Editar' : 'Novo'} {config.title}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              {config.fields.map((field: any) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                      required={field.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'checkbox' ? (
                    <Checkbox
                      checked={formData[field.name]}
                      onCheckedChange={(val) => setFormData({ ...formData, [field.name]: val })}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.name]:
                            field.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      required={field.required}
                      step={field.type === 'number' ? '0.01' : undefined}
                    />
                  )}
                </div>
              ))}
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
