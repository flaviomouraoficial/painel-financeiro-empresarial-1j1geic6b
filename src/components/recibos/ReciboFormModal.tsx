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
import { formatCurrency, formatDate } from '@/lib/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReciboFormModal({ open, onOpenChange, recibo, onSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [cartoes, setCartoes] = useState<any[]>([])
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [openClientCombo, setOpenClientCombo] = useState(false)

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
    arquivo_nf: null,
  })
  const [itens, setItens] = useState<any[]>([
    { id: '1', descricao: '', quantidade: 1, valor_unitario: 0 },
  ])

  const loadData = async () => {
    try {
      const [cliRes, contRes, cartRes] = await Promise.all([
        pb.collection('clientes').getFullList({ sort: 'nome' }),
        pb.collection('contas_bancarias').getFullList(),
        pb.collection('cartoes_credito').getFullList(),
      ])
      setClientes(cliRes)
      setContas(contRes)
      setCartoes(cartRes)

      if (recibo) {
        setForm({
          ...recibo,
          data_criacao: recibo.data_criacao.split(' ')[0],
          data_nf: recibo.data_nf.split(' ')[0],
          arquivo_nf: null, // Don't try to load existing file into input
        })
        setItens(await getReciboItens(recibo.id))
      } else {
        const num = await generateNumeroRecibo(user.empresa_id)
        setForm((f: any) => ({
          ...f,
          numero_recibo: num,
          status: 'pendente',
          valor_nf: 0,
          cliente_id: '',
          numero_nf: '',
          descricao_nf: '',
          conta_bancaria_id: '',
          cartao_credito_id: '',
          arquivo_nf: null,
          data_criacao: new Date().toISOString().split('T')[0],
          data_nf: new Date().toISOString().split('T')[0],
        }))
        setItens([{ id: '1', descricao: '', quantidade: 1, valor_unitario: 0 }])
      }
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive', duration: 5000 })
    }
  }
  useEffect(() => {
    if (open) loadData()
  }, [open, recibo])

  const subtotal = itens.reduce((a, b) => a + b.quantidade * b.valor_unitario, 0)
  const diff = form.valor_nf - subtotal
  const c = clientes.find((x) => x.id === form.cliente_id)
  const selectedConta = contas.find((x) => x.id === form.conta_bancaria_id)

  const handleSave = async () => {
    if (!form.cliente_id)
      return toast({ title: 'Selecione um cliente', variant: 'destructive', duration: 5000 })
    if (!form.numero_nf)
      return toast({ title: 'Informe o número da NF', variant: 'destructive', duration: 5000 })
    if (form.valor_nf <= 0)
      return toast({
        title: 'Informe um valor válido para a NF',
        variant: 'destructive',
        duration: 5000,
      })
    if (itens.length === 0)
      return toast({ title: 'Adicione pelo menos um item', variant: 'destructive', duration: 5000 })
    if (itens.some((i) => !i.descricao || i.valor_unitario <= 0))
      return toast({
        title: 'Preencha corretamente a descrição e valor unitário dos itens',
        variant: 'destructive',
        duration: 5000,
      })
    if (!form.conta_bancaria_id)
      return toast({
        title: 'Selecione uma conta bancária',
        variant: 'destructive',
        duration: 5000,
      })

    setLoading(true)
    try {
      const payload = {
        ...form,
        empresa_id: user.empresa_id,
        cartao_credito_id: form.cartao_credito_id || '',
      }
      if (recibo) await updateRecibo(recibo.id, payload, itens)
      else await createRecibo(payload, itens)
      toast({ title: 'Recibo salvo com sucesso', duration: 3000 })
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast({
        title: 'Erro ao salvar recibo. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      })
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
              {/* Section 1: Dados do Cliente */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">1. Dados do Cliente</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Cliente *</Label>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => setShowNovoCliente(true)}
                      >
                        Criar novo cliente
                      </Button>
                    </div>
                    <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClientCombo}
                          className="w-full justify-between font-normal"
                        >
                          {form.cliente_id
                            ? clientes.find((cli) => cli.id === form.cliente_id)?.nome
                            : 'Selecione um cliente...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {clientes.map((cli) => (
                                <CommandItem
                                  key={cli.id}
                                  value={cli.nome}
                                  onSelect={() => {
                                    setForm({ ...form, cliente_id: cli.id })
                                    setOpenClientCombo(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      form.cliente_id === cli.id ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {cli.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {c && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nome/Razão Social</Label>
                        <p className="text-sm font-medium">{c.nome}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                        <p className="text-sm font-medium">{c.cpf_cnpj || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                        <p className="text-sm font-medium">{c.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Telefone</Label>
                        <p className="text-sm font-medium">{c.telefone || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 2: Dados da Nota Fiscal */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">2. Dados da Nota Fiscal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número da Nota Fiscal *</Label>
                    <Input
                      value={form.numero_nf}
                      onChange={(e) => setForm({ ...form, numero_nf: e.target.value })}
                      placeholder="Ex: 12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data da Nota Fiscal *</Label>
                    <Input
                      type="date"
                      value={form.data_nf}
                      onChange={(e) => setForm({ ...form, data_nf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição (Opcional)</Label>
                    <Input
                      value={form.descricao_nf || ''}
                      onChange={(e) => setForm({ ...form, descricao_nf: e.target.value })}
                      placeholder="Descrição do serviço/produto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Total da NF (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.valor_nf}
                      onChange={(e) => setForm({ ...form, valor_nf: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Arquivo da NF (Opcional)</Label>
                    <Input
                      type="file"
                      onChange={(e) =>
                        setForm({ ...form, arquivo_nf: e.target.files?.[0] || null })
                      }
                      accept="image/*,.pdf"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Itens de Despesa */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">3. Itens de Despesa</h3>
                <ItemsEditor itens={itens} setItens={setItens} />
              </section>

              {/* Section 4: Dados Bancários */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  4. Dados Bancários para Reembolso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Conta Bancária (Destino) *</Label>
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
                        {cartoes.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.banco} - {car.numero_ultimos_digitos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Section 5: Resumo do Recibo */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">5. Resumo do Recibo</h3>
                <div className="bg-muted/50 p-4 rounded-xl border space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Número Gerado</span>
                      <span className="font-semibold">{form.numero_recibo}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Data Atual</span>
                      <span className="font-medium">{formatDate(form.data_criacao)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">
                        Cliente Selecionado
                      </span>
                      <span className="font-medium truncate block">{c?.nome || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Total NF</span>
                      <span className="font-medium">{formatCurrency(form.valor_nf)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Subtotal Itens</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">Conta Destino</span>
                      <span className="font-medium truncate block">
                        {selectedConta
                          ? `${selectedConta.banco} - ${selectedConta.agencia}/${selectedConta.numero_conta}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className="bg-orange-50 text-orange-600 p-2 rounded text-xs font-medium border border-orange-200">
                      Atenção: o valor total de itens ({formatCurrency(subtotal)}) é diferente do
                      valor da nota fiscal ({formatCurrency(form.valor_nf)})
                    </div>
                  )}
                </div>
              </section>
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
        onSuccess={(cli: any) => {
          setClientes([...clientes, cli])
          setForm({ ...form, cliente_id: cli.id })
        }}
      />
    </>
  )
}
