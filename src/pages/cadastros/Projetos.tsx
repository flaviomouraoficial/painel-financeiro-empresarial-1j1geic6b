import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Pencil, Trash2, Plus, Briefcase, Activity, DollarSign } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const projectSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cliente_id: z.string().min(1, 'Cliente é obrigatório'),
    data_inicio: z.string().min(1, 'Data inicial é obrigatória'),
    data_fim: z.string().min(1, 'Data final é obrigatória'),
    orcamento: z.coerce.number().min(0.01, 'Orçamento deve ser maior que zero'),
    status: z.enum(['planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'], {
      required_error: 'Status é obrigatório',
    }),
    descricao: z.string().optional(),
    responsavel_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (!data.data_inicio || !data.data_fim) return true
      return new Date(data.data_fim) >= new Date(data.data_inicio)
    },
    {
      message: 'Data final deve ser após ou igual à data inicial',
      path: ['data_fim'],
    },
  )

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  planejamento: { label: 'Planejamento', class: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em Andamento', class: 'bg-yellow-100 text-yellow-800' },
  pausado: { label: 'Pausado', class: 'bg-gray-100 text-gray-800' },
  concluido: { label: 'Concluído', class: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
}

export default function ProjetosList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const [clientes, setClientes] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [centrosCusto, setCentrosCusto] = useState<any[]>([])

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nome: '',
      cliente_id: '',
      data_inicio: '',
      data_fim: '',
      orcamento: 0,
      status: 'planejamento',
      descricao: '',
      responsavel_id: '',
      centro_custo_id: '',
      ativo: true,
    },
  })

  const loadData = async () => {
    try {
      const records = await pb.collection('projetos').getFullList({
        sort: '-data_inicio',
        expand: 'cliente_id,responsavel_id,centro_custo_id',
      })
      setItems(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadDependencies = async () => {
    try {
      const [cli, usr, cc] = await Promise.all([
        pb.collection('clientes').getFullList({ sort: 'nome' }),
        pb.collection('users').getFullList({ sort: 'name' }),
        pb.collection('centros_custo').getFullList({ sort: 'nome' }),
      ])
      setClientes(cli)
      setUsuarios(usr)
      setCentrosCusto(cc)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (user?.empresa_id) {
      loadData()
      loadDependencies()
    }
  }, [user?.empresa_id])

  useRealtime('projetos', () => loadData())

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    try {
      const existing = items.find(
        (i) => i.nome.toLowerCase() === values.nome.toLowerCase() && i.id !== selectedItem?.id,
      )
      if (existing) {
        form.setError('nome', { type: 'manual', message: 'Já existe um projeto com este nome' })
        return
      }

      const data: any = { ...values, empresa_id: user?.empresa_id }
      if (!data.responsavel_id) data.responsavel_id = null
      if (!data.centro_custo_id) data.centro_custo_id = null

      if (selectedItem) {
        await pb.collection('projetos').update(selectedItem.id, data)
        toast({
          title: 'Projeto atualizado com sucesso',
          className: 'bg-green-500 text-white border-none',
          duration: 3000,
        })
      } else {
        await pb.collection('projetos').create(data)
        toast({
          title: 'Projeto criado com sucesso',
          className: 'bg-green-500 text-white border-none',
          duration: 3000,
        })
      }
      setModalOpen(false)
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        Object.entries(fieldErrs).forEach(([k, v]) => form.setError(k as any, { message: v }))
      } else {
        toast({
          title: 'Erro ao salvar',
          description: err.message,
          variant: 'destructive',
          duration: 5000,
        })
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    try {
      await pb.collection('projetos').delete(selectedItem.id)
      toast({
        title: 'Projeto deletado com sucesso',
        className: 'bg-green-500 text-white border-none',
        duration: 3000,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao deletar',
        description: err.message,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setDeleteModalOpen(false)
      setSelectedItem(null)
    }
  }

  const openModal = (item?: any) => {
    setSelectedItem(item || null)
    if (item) {
      form.reset({
        nome: item.nome,
        cliente_id: item.cliente_id,
        data_inicio: item.data_inicio ? new Date(item.data_inicio).toISOString().split('T')[0] : '',
        data_fim: item.data_fim ? new Date(item.data_fim).toISOString().split('T')[0] : '',
        orcamento: item.orcamento,
        status: item.status,
        descricao: item.descricao || '',
        responsavel_id: item.responsavel_id || '',
        centro_custo_id: item.centro_custo_id || '',
        ativo: item.ativo,
      })
    } else {
      form.reset({
        nome: '',
        cliente_id: '',
        data_inicio: '',
        data_fim: '',
        orcamento: 0,
        status: 'planejamento',
        descricao: '',
        responsavel_id: '',
        centro_custo_id: '',
        ativo: true,
      })
    }
    setModalOpen(true)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'

  const totalProjetos = items.length
  const projetosAtivos = items.filter((i) => i.status === 'em_andamento').length
  const orcamentoTotal = items.reduce((acc, curr) => acc + (curr.orcamento || 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projetos</h1>
          <p className="text-gray-500 mt-1">Gerencie os projetos e acompanhe os orçamentos</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="h-11 rounded-lg bg-[#268C83] hover:bg-[#1e6f68]"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Projetos</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : totalProjetos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Projetos Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : projetosAtivos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Orçamento Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '-' : formatCurrency(orcamentoTotal)}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Período</th>
                <th className="px-6 py-4 font-medium">Orçamento</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const statusMeta = STATUS_MAP[item.status] || {
                  label: item.status,
                  class: 'bg-gray-100',
                }
                return (
                  <tr
                    key={item.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white'
                        : 'bg-gray-50/50 hover:bg-gray-50 transition-colors'
                    }
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.expand?.cliente_id?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatDate(item.data_inicio)} - {formatDate(item.data_fim)}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(item.orcamento)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.class}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(item)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item)
                          setDeleteModalOpen(true)
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedItem ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do projeto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orcamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usuarios.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centrosCusto.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes do projeto"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Projeto Ativo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#268C83] hover:bg-[#1e6f68] h-11 px-8">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
