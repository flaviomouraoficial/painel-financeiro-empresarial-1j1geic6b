import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { criarLancamento, editarLancamento } from '@/services/lancamentos'

interface LancamentosFormProps {
  lancamento?: any
  categorias: any[]
  contas: any[]
  cartoes: any[]
  onSuccess: () => void
  onCancel: () => void
}

export function LancamentosForm({
  lancamento,
  categorias,
  contas,
  cartoes,
  onSuccess,
  onCancel,
}: LancamentosFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'despesa',
    categoria_id: '',
    descricao: '',
    valor: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    forma_pagamento: '',
    conta_bancaria_id: 'none',
    cartao_credito_id: 'none',
  })

  useEffect(() => {
    if (lancamento) {
      setFormData({
        tipo: lancamento.tipo || 'despesa',
        categoria_id: lancamento.categoria_id || '',
        descricao: lancamento.descricao || '',
        valor: lancamento.valor ? lancamento.valor.toString() : '',
        data_lancamento: lancamento.data_lancamento
          ? lancamento.data_lancamento.split(' ')[0]
          : new Date().toISOString().split('T')[0],
        forma_pagamento: lancamento.forma_pagamento || '',
        conta_bancaria_id: lancamento.conta_bancaria_id || 'none',
        cartao_credito_id: lancamento.cartao_credito_id || 'none',
      })
    }
  }, [lancamento])

  const showConta = ['dinheiro', 'pix', 'ted', 'boleto'].includes(formData.forma_pagamento)
  const showCartao = formData.forma_pagamento === 'cartao'

  const valorStr = formData.valor.toString().replace(',', '.')
  const valorNum = parseFloat(valorStr)
  const isValorInvalid = formData.valor !== '' && (isNaN(valorNum) || valorNum <= 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.tipo ||
      !formData.categoria_id ||
      !formData.descricao ||
      !formData.valor ||
      !formData.data_lancamento ||
      !formData.forma_pagamento
    ) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    if (isValorInvalid) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        valor: valorNum,
        data_lancamento: `${formData.data_lancamento} 12:00:00.000Z`,
        conta_bancaria_id:
          showConta && formData.conta_bancaria_id !== 'none' ? formData.conta_bancaria_id : null,
        cartao_credito_id:
          showCartao && formData.cartao_credito_id !== 'none' ? formData.cartao_credito_id : null,
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (lancamento?.id) {
        await editarLancamento(lancamento.id, payload)
        toast({
          title: 'Sucesso',
          description: 'Lançamento editado com sucesso',
          className: 'bg-[#268C83] text-white border-transparent',
          duration: 3000,
        })
      } else {
        await criarLancamento(payload)
        toast({
          title: 'Sucesso',
          description: 'Lançamento criado com sucesso',
          className: 'bg-[#268C83] text-white border-transparent',
          duration: 3000,
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[12px] font-medium leading-none text-slate-700 mb-2 block">
      {children}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        <div>
          <Label>Tipo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(v) => setFormData({ ...formData, tipo: v, categoria_id: '' })}
          >
            <SelectTrigger className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus:ring-[#268C83]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categoria *</Label>
          <Select
            value={formData.categoria_id}
            onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
          >
            <SelectTrigger className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus:ring-[#268C83]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categorias
                .filter((c) => c.tipo === formData.tipo || !c.tipo)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Descrição *</Label>
        <Input
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Venda de consultoria"
          className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus-visible:ring-[#268C83]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        <div>
          <Label>Valor *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0,00"
            className={`h-[40px] text-[14px] rounded-[8px] border-slate-200 focus-visible:ring-[#268C83] ${
              isValorInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''
            }`}
          />
          {isValorInvalid && (
            <p className="text-red-500 text-[12px] mt-1">O valor deve ser maior que zero</p>
          )}
        </div>
        <div>
          <Label>Data do lançamento *</Label>
          <Input
            type="date"
            value={formData.data_lancamento}
            onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
            className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus-visible:ring-[#268C83]"
          />
        </div>
      </div>

      <div>
        <Label>Forma de pagamento *</Label>
        <Select
          value={formData.forma_pagamento}
          onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
        >
          <SelectTrigger className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus:ring-[#268C83]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="ted">TED/DOC</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        {showConta && (
          <div className="animate-fade-in">
            <Label>Conta Bancária</Label>
            <Select
              value={formData.conta_bancaria_id}
              onValueChange={(v) => setFormData({ ...formData, conta_bancaria_id: v })}
            >
              <SelectTrigger className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus:ring-[#268C83]">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showCartao && (
          <div className="animate-fade-in">
            <Label>Cartão de Crédito</Label>
            <Select
              value={formData.cartao_credito_id}
              onValueChange={(v) => setFormData({ ...formData, cartao_credito_id: v })}
            >
              <SelectTrigger className="h-[40px] text-[14px] rounded-[8px] border-slate-200 focus:ring-[#268C83]">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {cartoes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-[12px] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="h-[44px] px-[20px] rounded-[8px] text-[14px] bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || isValorInvalid}
          className="h-[44px] px-[20px] rounded-[8px] text-[14px] bg-[#268C83] hover:bg-[#1e736c] text-white border-transparent"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
