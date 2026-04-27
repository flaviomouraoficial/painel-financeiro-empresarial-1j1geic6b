import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const getSchema = (isNew: boolean) =>
  z
    .object({
      cliente_id: z.string().optional(),
      descricao: z.string().min(1, 'Descrição é obrigatória'),
      valor_total: z.coerce.number().positive('Valor deve ser maior que 0'),
      data_vencimento: z.string().min(1, 'Data de Vencimento é obrigatória'),
      forma_pagamento: z.string().min(1, 'Forma de Pagamento é obrigatória'),
      numero_documento: z.string().optional(),
      projeto_id: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (isNew) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const vDate = new Date(data.data_vencimento + 'T00:00:00')
        if (vDate < today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['data_vencimento'],
            message: 'A data deve ser no futuro',
          })
        }
      }
    })

type ContaReceberFormProps = {
  defaultValues?: any
  onSubmit: (data: any) => void
  isSubmitting: boolean
  clientes: any[]
  projetos: any[]
  isNew?: boolean
}

export function ContaReceberForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  clientes,
  projetos,
  isNew = false,
}: ContaReceberFormProps) {
  const form = useForm({
    resolver: zodResolver(getSchema(isNew)),
    defaultValues: defaultValues || {
      cliente_id: 'none',
      descricao: '',
      valor_total: '',
      data_vencimento: '',
      forma_pagamento: '',
      numero_documento: '',
      projeto_id: 'none',
      observacoes: '',
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: any) => {
    const payload = { ...data }
    if (payload.projeto_id === 'none' || !payload.projeto_id) payload.projeto_id = ''
    if (payload.cliente_id === 'none' || !payload.cliente_id) payload.cliente_id = ''
    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cliente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
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
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? field.value.split(' ')[0].split('T')[0] : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="forma_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projeto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projetos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
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
          name="numero_documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Documento (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  )
}
