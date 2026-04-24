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
import {
  Pencil,
  Trash2,
  Plus,
  CircleDollarSign,
  Briefcase,
  ShoppingCart,
  Home,
  Zap,
  Droplets,
  Wifi,
  Car,
  Utensils,
  Heart,
  Book,
  Smile,
  MoreHorizontal,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const categorySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['receita', 'despesa'], { required_error: 'Tipo é obrigatório' }),
  descricao: z.string().optional(),
  cor: z.string().optional(),
  icone: z.string().optional(),
  ativo: z.boolean().default(true),
})

const ICONS: Record<string, React.ElementType> = {
  moeda: CircleDollarSign,
  salário: Briefcase,
  venda: ShoppingCart,
  aluguel: Home,
  energia: Zap,
  água: Droplets,
  internet: Wifi,
  transporte: Car,
  alimentação: Utensils,
  saúde: Heart,
  educação: Book,
  lazer: Smile,
  outros: MoreHorizontal,
}

export default function CategoriasList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: '',
      tipo: 'despesa',
      descricao: '',
      cor: '#268C83',
      icone: 'outros',
      ativo: true,
    },
  })

  const loadData = async () => {
    try {
      const records = await pb.collection('categorias').getFullList({
        sort: 'tipo,nome',
      })
      setItems(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.empresa_id) {
      loadData()
    }
  }, [user?.empresa_id])

  useRealtime('categorias', () => {
    loadData()
  })

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      const existing = items.find(
        (i) =>
          i.nome.toLowerCase() === values.nome.toLowerCase() &&
          i.tipo === values.tipo &&
          i.id !== selectedItem?.id,
      )
      if (existing) {
        form.setError('nome', {
          type: 'manual',
          message: 'Já existe uma categoria com este nome para este tipo',
        })
        return
      }

      const data = { ...values, empresa_id: user?.empresa_id }

      if (selectedItem) {
        await pb.collection('categorias').update(selectedItem.id, data)
        toast({
          title: 'Categoria atualizada com sucesso',
          className: 'bg-green-500 text-white border-none',
          duration: 3000,
        })
      } else {
        await pb.collection('categorias').create(data)
        toast({
          title: 'Categoria criada com sucesso',
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
      await pb.collection('categorias').delete(selectedItem.id)
      toast({
        title: 'Categoria deletada com sucesso',
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
        tipo: item.tipo,
        descricao: item.descricao || '',
        cor: item.cor || '#268C83',
        icone: item.icone || 'outros',
        ativo: item.ativo,
      })
    } else {
      form.reset({
        nome: '',
        tipo: 'despesa',
        descricao: '',
        cor: '#268C83',
        icone: 'outros',
        ativo: true,
      })
    }
    setModalOpen(true)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
          <p className="text-gray-500 mt-1">Gerencie as categorias de receitas e despesas</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="h-11 rounded-lg bg-[#268C83] hover:bg-[#1e6f68]"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500">Nenhuma categoria encontrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const Icon = ICONS[item.icone as string] || MoreHorizontal
                return (
                  <tr
                    key={item.id}
                    className={
                      index % 2 === 0
                        ? 'bg-white'
                        : 'bg-gray-50/50 hover:bg-gray-50 transition-colors'
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: item.cor || '#268C83' }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900">{item.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.tipo === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">
                      {item.descricao || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
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
        <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedItem ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Alimentação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descrição da categoria"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'outros'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(ICONS).map((k) => (
                            <SelectItem key={k} value={k} className="capitalize">
                              {k}
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
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="p-1 h-10 w-14 cursor-pointer" {...field} />
                        <Input type="text" className="uppercase font-mono flex-1" {...field} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <p className="text-sm text-gray-500">Categoria ativa ou inativa</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
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
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.
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
