import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { createLead, updateLead } from '@/services/crm'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const DEFAULT_VALUES = {
  nome_lead: '',
  email: '',
  telefone: '',
  empresa_lead: '',
  cargo: '',
  etapa: 'prospecção',
  temperatura: 'morna',
  valor_estimado: 0,
  probabilidade_fechamento: 50,
  descricao: '',
  observacoes: '',
  ativo: true,
  servico_produto_id: '',
  consultor_id: '',
  cliente_id: '',
}

export function LeadForm({ lead, open, onOpenChange, onSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: DEFAULT_VALUES,
  })

  const probabilidade = watch('probabilidade_fechamento')

  useEffect(() => {
    if (probabilidade !== undefined && probabilidade !== '') {
      const prob = Number(probabilidade)
      if (prob > 70) setValue('temperatura', 'quente')
      else if (prob >= 30) setValue('temperatura', 'morna')
      else setValue('temperatura', 'fria')
    }
  }, [probabilidade, setValue])

  useEffect(() => {
    if (open) {
      pb.collection('users').getFullList().then(setUsuarios)
      pb.collection('produtos_servicos').getFullList().then(setProdutos)
      reset(lead || DEFAULT_VALUES)
    }
  }, [lead, open, reset])

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        empresa_id: user.empresa_id,
        usuario_id: lead?.usuario_id || user.id,
        valor_estimado: Number(data.valor_estimado),
        probabilidade_fechamento: Number(data.probabilidade_fechamento),
        data_ultimo_contato: lead?.data_ultimo_contato || new Date().toISOString().split('T')[0],
      }

      // Clean up empty relations to avoid pocketbase errors
      if (!payload.servico_produto_id) delete payload.servico_produto_id
      if (!payload.consultor_id) delete payload.consultor_id
      if (!payload.cliente_id) delete payload.cliente_id

      if (lead) await updateLead(lead.id, payload)
      else await createLead(payload)

      toast({ title: 'Sucesso', description: 'Lead salvo com sucesso.' })
      onSuccess?.()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="dados_basicos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="negociacao">Negociação</TabsTrigger>
            </TabsList>

            <TabsContent value="dados_basicos" className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Nome do Lead *</label>
                <Input {...register('nome_lead')} required />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Empresa</label>
                <Input {...register('empresa_lead')} />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">E-mail</label>
                <Input type="email" {...register('email')} />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Telefone</label>
                <Input {...register('telefone')} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium">Descrição / Necessidade</label>
                <Textarea {...register('descricao')} />
              </div>
            </TabsContent>

            <TabsContent value="negociacao" className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Etapa</label>
                <select
                  {...register('etapa')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {[
                    'prospecção',
                    'contato',
                    'briefing',
                    'proposta',
                    'apresentação',
                    'análise',
                    'fechou',
                    'não fechou',
                  ].map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Temperatura</label>
                <select
                  {...register('temperatura')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="fria">Fria</option>
                  <option value="morna">Morna</option>
                  <option value="quente">Quente</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Valor Estimado (R$)</label>
                <Input type="number" step="0.01" {...register('valor_estimado')} />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Probabilidade (%)</label>
                <Input type="number" min="0" max="100" {...register('probabilidade_fechamento')} />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Consultor Responsável</label>
                <select
                  {...register('consultor_id')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Selecione...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-medium">Produto / Serviço</label>
                <select
                  {...register('servico_produto_id')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
