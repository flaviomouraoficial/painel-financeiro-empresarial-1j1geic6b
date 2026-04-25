import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '@/hooks/use-auth'
import { createLead, updateLead } from '@/services/crm'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Loader2 } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

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
  const [clientes, setClientes] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { isValid },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const probabilidade = watch('probabilidade_fechamento')

  useEffect(() => {
    if (probabilidade !== undefined) {
      const prob = Number(probabilidade)
      if (prob >= 70) setValue('temperatura', 'quente')
      else if (prob >= 30) setValue('temperatura', 'morna')
      else setValue('temperatura', 'fria')
    }
  }, [probabilidade, setValue])

  useEffect(() => {
    if (open) {
      setEmailError('')
      Promise.all([
        pb.collection('users').getFullList({ sort: 'name' }),
        pb.collection('produtos_servicos').getFullList({ sort: 'nome' }),
        pb.collection('clientes').getFullList({ sort: 'nome' }),
      ])
        .then(([u, p, c]) => {
          setUsuarios(u)
          setProdutos(p)
          setClientes(c)
        })
        .catch(console.error)

      reset(lead || { ...DEFAULT_VALUES, consultor_id: user?.id })
    }
  }, [lead, open, reset, user?.id])

  const onSubmit = async (data: any) => {
    setEmailError('')
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        empresa_id: user.empresa_id,
        usuario_id: lead?.usuario_id || user.id,
        valor_estimado: Number(data.valor_estimado),
        probabilidade_fechamento: Number(data.probabilidade_fechamento),
        data_ultimo_contato: lead?.data_ultimo_contato || new Date().toISOString().split('T')[0],
      }

      if (!payload.servico_produto_id) delete payload.servico_produto_id
      if (!payload.consultor_id) delete payload.consultor_id
      if (!payload.cliente_id) delete payload.cliente_id

      if (lead) {
        await updateLead(lead.id, payload)
      } else {
        await createLead(payload)
      }

      toast({
        title: 'Sucesso',
        description: 'Lead salvo com sucesso.',
        className: 'bg-green-600 text-white border-none',
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (e: any) {
      const fieldErrs = extractFieldErrors(e)
      if (fieldErrs.email) {
        setEmailError('Este email já está cadastrado')
        toast({
          title: 'Erro de Validação',
          description: 'Este email já está sendo utilizado por outro lead.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="px-6 py-4 border-b bg-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl">{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do lead para acompanhamento no funil de vendas.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <Tabs defaultValue="dados_basicos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="negociacao">Negociação e Relacionamentos</TabsTrigger>
            </TabsList>

            <TabsContent
              value="dados_basicos"
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
            >
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Nome do Lead *</label>
                <Input
                  {...register('nome_lead', { required: true })}
                  placeholder="Nome completo do contato"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Empresa</label>
                <Input {...register('empresa_lead')} placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Cargo</label>
                <Input {...register('cargo')} placeholder="Ex: Diretor, Gerente" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">E-mail</label>
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Telefone</label>
                <Input {...register('telefone')} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Descrição / Necessidade</label>
                <Textarea
                  {...register('descricao')}
                  placeholder="Descreva as necessidades, dores e o contexto do lead..."
                  className="h-24"
                />
              </div>
            </TabsContent>

            <TabsContent
              value="negociacao"
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium">Etapa do Funil</label>
                <select
                  {...register('etapa')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Valor Estimado (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_estimado', { required: true })}
                />
              </div>

              <div className="space-y-4 md:col-span-2 bg-muted/30 p-4 rounded-lg border my-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Probabilidade de Fechamento</label>
                  <span className="font-bold text-primary">{probabilidade || 0}%</span>
                </div>
                <Controller
                  name="probabilidade_fechamento"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Slider
                      value={[value || 0]}
                      onValueChange={(vals) => onChange(vals[0])}
                      max={100}
                      step={5}
                      className="py-2"
                    />
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Fria (&lt;30%)</span>
                  <span>Morna (30-69%)</span>
                  <span>Quente (≥70%)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Consultor Responsável *</label>
                <select
                  {...register('consultor_id', { required: true })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Produto / Serviço</label>
                <select
                  {...register('servico_produto_id')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhum específico</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Cliente Vinculado (Opcional)</label>
                <select
                  {...register('cliente_id')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Sem vínculo</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Vincule a um cliente existente se este lead for um upsell ou cross-sell.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[#268C83] hover:bg-[#268C83]/90 text-white min-w-[120px]"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {lead ? 'Atualizar Lead' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
