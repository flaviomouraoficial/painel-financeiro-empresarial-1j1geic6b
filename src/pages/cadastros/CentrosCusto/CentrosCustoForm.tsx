import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CentroCusto, createCentroCusto, updateCentroCusto } from '@/services/centros_custo'
import { getCompanyUsers, User } from '@/services/users'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const DEPARTAMENTOS = [
  'Vendas',
  'Marketing',
  'Operações',
  'Financeiro',
  'RH',
  'TI',
  'Administrativo',
  'Outros',
]

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().max(10, 'Máximo 10 caracteres').min(1, 'Código é obrigatório'),
  departamento: z.string().min(1, 'Departamento é obrigatório'),
  responsavel_id: z.string().min(1, 'Responsável é obrigatório'),
  orcamento_anual: z.coerce.number().min(0.01, 'O orçamento deve ser maior que zero'),
  descricao: z.string().optional(),
  email_contato: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

const maskPhone = (v: string) => {
  let r = v.replace(/\D/g, '')
  if (r.length > 11) r = r.slice(0, 11)
  if (r.length > 10) r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3')
  else if (r.length > 5) r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3')
  else if (r.length > 2) r = r.replace(/^(\d\d)(\d{0,5})/, '($1) $2')
  return r
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: CentroCusto
  onSuccess: () => void
}

export function CentrosCustoForm({ open, onOpenChange, item, onSuccess }: Props) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { ativo: true } })

  useEffect(() => {
    if (open) {
      getCompanyUsers()
        .then(setUsers)
        .catch(() => {})
      if (item) {
        form.reset({
          ...item,
          email_contato: item.email_contato || '',
          telefone: item.telefone || '',
        })
      } else {
        form.reset({
          nome: '',
          codigo: '',
          departamento: '',
          responsavel_id: '',
          orcamento_anual: 0,
          descricao: '',
          email_contato: '',
          telefone: '',
          ativo: true,
        })
      }
    }
  }, [open, item, form])

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      if (item) {
        await updateCentroCusto(item.id, data)
        toast.success('Centro de custo editado com sucesso')
      } else {
        await createCentroCusto({ ...data, empresa_id: user?.empresa_id })
        toast.success('Centro de custo criado com sucesso')
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (errors.codigo?.includes('unique'))
        form.setError('codigo', { message: 'Este código já está cadastrado' })
      else toast.error('Erro ao salvar centro de custo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar' : 'Novo'} Centro de Custo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTAMENTOS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
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
                    <FormLabel>Responsável *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
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
                name="orcamento_anual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento Anual (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email_contato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contato</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Centro Ativo</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-lg bg-primary hover:bg-primary/90"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
