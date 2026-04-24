import { useState, useEffect } from 'react'
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
    data_lancamento: '',
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
        data_lancamento: lancamento.data_lancamento ? lancamento.data_lancamento.split(' ')[0] : '',
        forma_pagamento: lancamento.forma_pagamento || '',
        conta_bancaria_id: lancamento.conta_bancaria_id || 'none',
        cartao_credito_id: lancamento.cartao_credito_id || 'none',
      })
    }
  }, [lancamento])

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
        description: 'Campos obrigatórios não preenchidos.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    const valorStr = formData.valor.toString().replace(',', '.')
    const valorNum = parseFloat(valorStr)

    if (isNaN(valorNum) || valorNum <= 0) {
      toast({
        title: 'Erro',
        description: 'Valor deve ser maior que zero.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        valor: valorNum,
        data_lancamento: `${formData.data_lancamento} 12:00:00.000Z`,
        conta_bancaria_id:
          formData.conta_bancaria_id === 'none' ? null : formData.conta_bancaria_id,
        cartao_credito_id:
          formData.cartao_credito_id === 'none' ? null : formData.cartao_credito_id,
      }

      if (lancamento?.id) {
        await editarLancamento(lancamento.id, payload)
        toast({
          title: 'Sucesso',
          description: 'Lançamento editado com sucesso',
          className: 'bg-emerald-600 text-white',
          duration: 3000,
        })
      } else {
        await criarLancamento(payload)
        toast({
          title: 'Sucesso',
          description: 'Lançamento criado com sucesso',
          className: 'bg-emerald-600 text-white',
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
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(v) => setFormData({ ...formData, tipo: v, categoria_id: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select
            value={formData.categoria_id}
            onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
          >
            <SelectTrigger>
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

      <div className="space-y-2">
        <Label>Descrição *</Label>
        <Input
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Aluguel"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor *</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Data do lançamento *</Label>
          <Input
            type="date"
            value={formData.data_lancamento}
            onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Forma de pagamento *</Label>
        <Select
          value={formData.forma_pagamento}
          onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
        >
          <SelectTrigger>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Conta Bancária</Label>
          <Select
            value={formData.conta_bancaria_id}
            onValueChange={(v) => setFormData({ ...formData, conta_bancaria_id: v })}
          >
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Cartão de Crédito</Label>
          <Select
            value={formData.cartao_credito_id}
            onValueChange={(v) => setFormData({ ...formData, cartao_credito_id: v })}
          >
            <SelectTrigger>
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
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
