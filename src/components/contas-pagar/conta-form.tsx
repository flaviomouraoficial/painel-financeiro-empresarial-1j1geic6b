import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input, Button } from '@/components/ui-helpers'
import { createContaPagar, updateContaPagar } from '@/services/contas-pagar'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const schema = z
  .object({
    id: z.string().optional(),
    fornecedor_id: z.string().optional(),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    valor_total: z.coerce.number().positive('O valor deve ser maior que zero'),
    data_vencimento: z.string().min(1, 'Vencimento é obrigatório'),
    forma_pagamento: z.string().min(1, 'Forma de pagamento é obrigatória'),
    numero_documento: z.string().optional(),
    numero_nf: z.string().optional(),
    projeto_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    observacoes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.id) {
      const today = new Date().toISOString().split('T')[0]
      if (data.data_vencimento < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A data de vencimento deve ser no futuro',
          path: ['data_vencimento'],
        })
      }
    }
  })

export function ContaForm({ open, onOpenChange, conta, cadastros, onSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: '',
      fornecedor_id: 'none',
      descricao: '',
      valor_total: 0,
      data_vencimento: '',
      forma_pagamento: '',
      numero_documento: '',
      numero_nf: '',
      projeto_id: '',
      centro_custo_id: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (conta) {
        form.reset({ ...conta, data_vencimento: conta.data_vencimento?.split(' ')[0] })
      } else {
        form.reset({
          id: '',
          fornecedor_id: 'none',
          descricao: '',
          valor_total: 0,
          data_vencimento: '',
          forma_pagamento: '',
          numero_documento: '',
          numero_nf: '',
          projeto_id: '',
          centro_custo_id: '',
          observacoes: '',
        })
      }
    }
  }, [open, conta, form])

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      const payload = { ...values }

      if (payload.fornecedor_id === 'none' || !payload.fornecedor_id) payload.fornecedor_id = null
      if (payload.projeto_id === 'none' || !payload.projeto_id) payload.projeto_id = null
      if (payload.centro_custo_id === 'none' || !payload.centro_custo_id)
        payload.centro_custo_id = null

      if (
        payload.data_vencimento &&
        !payload.data_vencimento.includes('T') &&
        !payload.data_vencimento.includes(' ')
      ) {
        payload.data_vencimento = payload.data_vencimento + ' 12:00:00.000Z'
      }

      if (payload.id) {
        await updateContaPagar(payload.id, payload)
        toast({ title: 'Conta atualizada com sucesso', className: 'bg-green-500 text-white' })
      } else {
        delete payload.id
        payload.data_emissao = new Date().toISOString()
        await createContaPagar({
          ...payload,
          status: 'pendente',
          empresa_id: user.empresa_id,
          usuario_id: user.id,
        })
        toast({ title: 'Conta a pagar criada com sucesso', className: 'bg-green-500 text-white' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ name, label, type = 'text', options }: any) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {options ? (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o: any) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input type={type} {...field} value={field.value ?? ''} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const formasPgto = [
    { value: 'Boleto', label: 'Boleto' },
    { value: 'Pix', label: 'Pix' },
    { value: 'Transferência', label: 'Transferência' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="fornecedor_id"
                label="Fornecedor (Opcional)"
                options={[
                  { value: 'none', label: 'Nenhum' },
                  ...cadastros.fornecedores.map((f: any) => ({ value: f.id, label: f.nome })),
                ]}
              />
              <Field name="descricao" label="Descrição" />
              <Field name="valor_total" label="Valor" type="number" />
              <Field name="data_vencimento" label="Data de Vencimento" type="date" />
              <Field name="forma_pagamento" label="Forma de Pagamento" options={formasPgto} />
              <Field name="numero_nf" label="Número NF" />
              <Field
                name="projeto_id"
                label="Projeto (Opcional)"
                options={[
                  { value: 'none', label: 'Nenhum' },
                  ...cadastros.projetos.map((p: any) => ({ value: p.id, label: p.nome })),
                ]}
              />
              <Field
                name="centro_custo_id"
                label="Centro de Custo (Opcional)"
                options={[
                  { value: 'none', label: 'Nenhum' },
                  ...cadastros.centros.map((c: any) => ({ value: c.id, label: c.nome })),
                ]}
              />
            </div>
            <Field name="observacoes" label="Observações" />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
