import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import {
  createRecibo,
  updateRecibo,
  generateNumeroRecibo,
  getReciboItens,
} from '@/services/recibos'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ItemsEditor } from './ItemsEditor'
import { NovoClienteModal } from './NovoClienteModal'
import { formatCurrency } from '@/lib/format'

export default function ReciboFormModal({ open, onOpenChange, recibo, onSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [cartoes, setCartoes] = useState<any[]>([])
  const [showNovoCliente, setShowNovoCliente] = useState(false)

  const [form, setForm] = useState<any>({
    numero_recibo: '',
    cliente_id: '',
    data_criacao: new Date().toISOString().split('T')[0],
    data_nf: new Date().toISOString().split('T')[0],
    numero_nf: '',
    descricao_nf: '',
    valor_nf: 0,
    conta_bancaria_id: '',
    cartao_credito_id: '',
    status: 'pendente',
  })
  const [itens, setItens] = useState<any[]>([
    { id: '1', descricao: '', quantidade: 1, valor_unitario: 0 },
  ])

  const loadData = async () => {
    setClientes(await pb.collection('clientes').getFullList({ sort: 'nome' }))
    setContas(await pb.collection('contas_bancarias').getFullList())
    setCartoes(await pb.collection('cartoes_credito').getFullList())
    if (recibo) {
      setForm({
        ...recibo,
        data_criacao: recibo.data_criacao.split(' ')[0],
        data_nf: recibo.data_nf.split(' ')[0],
      })
      setItens(await getReciboItens(recibo.id))
    } else {
      const num = await generateNumeroRecibo(user.empresa_id)
      setForm((f) => ({
        ...f,
        numero_recibo: num,
        status: 'pendente',
        valor_nf: 0,
        cliente_id: '',
      }))
      setItens([{ id: '1', descricao: '', quantidade: 1, valor_unitario: 0 }])
    }
  }
  useEffect(() => {
    if (open) loadData()
  }, [open, recibo])

  const subtotal = itens.reduce((a, b) => a + b.quantidade * b.valor_unitario, 0)
  const diff = form.valor_nf - subtotal
  const c = clientes.find((x) => x.id === form.cliente_id)

  const handleSave = async () => {
    if (!form.cliente_id) return toast({ title: 'Selecione um cliente', variant: 'destructive' })
    if (!form.conta_bancaria_id)
      return toast({ title: 'Selecione uma conta bancária', variant: 'destructive' })
    if (itens.length === 0)
      return toast({ title: 'Adicione pelo menos um item', variant: 'destructive' })
    setLoading(true)
    try {
      const payload = {
        ...form,
        empresa_id: user.empresa_id,
        cartao_credito_id: form.cartao_credito_id || '',
      }
      if (recibo) await updateRecibo(recibo.id, payload, itens)
      else await createRecibo(payload, itens)
      toast({ title: 'Recibo salvo com sucesso' })
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar recibo. Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>{recibo ? 'Editar Recibo' : 'Novo Recibo'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] px-6 py-4">
            <div className="space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <Label>Cliente</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => setShowNovoCliente(true)}
                    >
                      Criar novo cliente
                    </Button>
                  </div>
                  <Select
                    value={form.cliente_id}
                    onValueChange={(v) => setForm({ ...form, cliente_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Criação</Label>
                  <Input
                    type="date"
                    value={form.data_criacao}
                    onChange={(e) => setForm({ ...form, data_criacao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número NF</Label>
                  <Input
                    value={form.numero_nf}
                    onChange={(e) => setForm({ ...form, numero_nf: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data NF</Label>
                  <Input
                    type="date"
                    value={form.data_nf}
                    onChange={(e) => setForm({ ...form, data_nf: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor NF</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valor_nf}
                    onChange={(e) => setForm({ ...form, valor_nf: Number(e.target.value) })}
                  />
                </div>
              </section>

              <ItemsEditor itens={itens} setItens={setItens} />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select
                    value={form.conta_bancaria_id}
                    onValueChange={(v) => setForm({ ...form, conta_bancaria_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.banco} - {b.agencia}/{b.numero_conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cartão de Crédito (Opcional)</Label>
                  <Select
                    value={form.cartao_credito_id}
                    onValueChange={(v) => setForm({ ...form, cartao_credito_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {cartoes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.banco} - {c.numero_ultimos_digitos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <div className="bg-muted/50 p-4 rounded-xl border space-y-2">
                <h4 className="font-semibold text-sm">Resumo</h4>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Número:</span>{' '}
                  <span className="font-medium">{form.numero_recibo}</span>
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <span className="font-medium">{c?.nome || '-'}</span>
                  <span className="text-muted-foreground">Total NF:</span>{' '}
                  <span className="font-medium">{formatCurrency(form.valor_nf)}</span>
                  <span className="text-muted-foreground">Subtotal Itens:</span>{' '}
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {diff !== 0 && (
                  <p className="text-xs text-orange-500 mt-2 font-medium">
                    Aviso: A diferença entre o total da NF e os itens é de {formatCurrency(diff)}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Recibo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NovoClienteModal
        open={showNovoCliente}
        onOpenChange={setShowNovoCliente}
        onSuccess={(c: any) => {
          setClientes([...clientes, c])
          setForm({ ...form, cliente_id: c.id })
        }}
      />
    </>
  )
}
