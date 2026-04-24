import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const formSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    perfil: z.enum(['admin', 'gerente', 'usuario']),
    ativo: z.boolean().default(true),
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.id) {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A senha deve ter no mínimo 8 caracteres',
          path: ['password'],
        })
      }
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'As senhas não conferem',
          path: ['passwordConfirm'],
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

export function UserFormDialog({ user, open, onOpenChange, onSuccess, companyId }: any) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      name: '',
      email: '',
      perfil: 'usuario',
      ativo: true,
      password: '',
      passwordConfirm: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        id: user?.id || '',
        name: user?.name || '',
        email: user?.email || '',
        perfil: user?.perfil || 'usuario',
        ativo: user?.ativo ?? true,
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, open, form])

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const payload: any = {
        name: values.name,
        email: values.email,
        perfil: values.perfil,
        ativo: values.ativo,
        empresa_id: companyId,
      }

      if (!values.id) {
        payload.password = values.password
        payload.passwordConfirm = values.passwordConfirm
        await pb.collection('users').create(payload)
        toast({
          description: 'Usuário criado com sucesso',
          className: 'bg-emerald-600 text-white border-none',
        })
      } else {
        await pb.collection('users').update(values.id, payload)
        toast({
          description: 'Usuário editado com sucesso',
          className: 'bg-emerald-600 text-white border-none',
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (errors.email) {
        form.setError('email', { message: 'Este email já está cadastrado' })
      } else {
        toast({ description: 'Erro ao salvar usuário. Tente novamente.', variant: 'destructive' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!form.watch('id') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="usuario">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                    <FormLabel>Ativo</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="bg-[#268C83] hover:bg-[#1f736b]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
