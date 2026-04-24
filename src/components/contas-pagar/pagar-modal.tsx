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
import { pagarConta } from '@/services/contas-pagar'
import { useToast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const schema = z.object({
  data_pagamento: z.string().min(1, 'Data é obrigatória'),
  valor_pago: z.coerce.number().positive('O valor deve ser maior que zero'),
  forma_pagamento: z.string().min(1, 'Obrigatória'),
  conta_bancaria_id: z.string().min(1, 'Obrigatória'),
})

export function PagarModal({ open, onOpenChange, conta, cadastros, onSuccess }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      data_pagamento: '',
      valor_pago: 0,
      forma_pagamento: '',
      conta_bancaria_id: '',
    },
  })

  useEffect(() => {
    if (open && conta) {
      form.reset({
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago: conta.valor_total,
        forma_pagamento: conta.forma_pagamento || '',
        conta_bancaria_id: '',
      })
    }
  }, [open, conta, form])

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      await pagarConta(conta.id, values)
      toast({ title: 'Pagamento registrado com sucesso', className: 'bg-green-500 text-white' })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro ao registrar pagamento',
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

  const formas = [
    { value: 'Boleto', label: 'Boleto' },
    { value: 'Pix', label: 'Pix' },
    { value: 'Transferência', label: 'Transferência' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como Paga</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field name="data_pagamento" label="Data de Pagamento" type="date" />
            <Field name="valor_pago" label="Valor Pago" type="number" />
            <Field name="forma_pagamento" label="Forma de Pagamento Utilizada" options={formas} />
            <Field
              name="conta_bancaria_id"
              label="Conta Bancária Utilizada"
              options={cadastros.bancos.map((b: any) => ({ value: b.id, label: b.banco }))}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
