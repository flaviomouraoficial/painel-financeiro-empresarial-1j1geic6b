import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, AlertCircle, PlusCircle, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getContasBancarias, updateContaBancaria } from '@/services/contas_bancarias'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function ConfiguracoesSaldoInicial() {
  const { user, loading: loadingAuth } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saldos, setSaldos] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loadingAuth && user?.perfil !== 'admin') {
      toast({ title: 'Acesso negado', variant: 'destructive' })
      navigate('/dashboard', { replace: true })
    }
  }, [user, loadingAuth, navigate, toast])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await getContasBancarias()
      setContas(data)
      const initialSaldos: Record<string, string> = {}
      data.forEach((c) => {
        initialSaldos[c.id] =
          c.saldo_inicial !== undefined && c.saldo_inicial !== null ? String(c.saldo_inicial) : ''
      })
      setSaldos(initialSaldos)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loadingAuth && user?.perfil === 'admin') {
      loadData()
    }
  }, [user, loadingAuth])

  const handleSaldoChange = (id: string, value: string) => {
    setSaldos((prev) => ({ ...prev, [id]: value }))
  }

  const checkValidation = () => {
    for (const c of contas) {
      const val = saldos[c.id]
      if (val === undefined || val === '') return 'empty'
      if (parseFloat(val) < 0) return 'negative'
    }
    return 'valid'
  }

  const validationStatus = checkValidation()
  const isValid = validationStatus === 'valid'

  const handleSave = async () => {
    if (validationStatus === 'empty') {
      return toast({
        title: 'Atenção',
        description: 'Preencha o saldo inicial de todas as contas',
        variant: 'destructive',
      })
    }
    if (validationStatus === 'negative') {
      return toast({
        title: 'Atenção',
        description: 'O saldo não pode ser negativo',
        variant: 'destructive',
      })
    }

    try {
      setSaving(true)
      await Promise.all(
        contas.map((conta) => {
          const val = parseFloat(saldos[conta.id])
          return updateContaBancaria(conta.id, {
            saldo_inicial: val,
            saldo_atual: val,
            saldo_inicial_definido: true,
          })
        }),
      )
      toast({
        title: 'Sucesso',
        description: 'Saldo inicial atualizado com sucesso',
        className: 'bg-green-600 text-white border-none',
        duration: 3000,
      })
      navigate('/dashboard')
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar saldo. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingAuth) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[180px] rounded-[12px]" />
          <Skeleton className="h-[180px] rounded-[12px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white border border-gray-200 rounded-[12px] shadow-sm">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <p className="text-[14px] font-medium">Erro ao carregar contas bancárias</p>
          <Button onClick={loadData} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (contas.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white border border-gray-200 rounded-[12px] shadow-sm">
          <Landmark className="h-16 w-16 text-muted-foreground" />
          <p className="text-[14px] font-medium">Nenhuma conta bancária cadastrada</p>
          <Button
            onClick={() => navigate('/cadastros/contas-bancarias')}
            className="bg-[#268C83] hover:bg-[#1e7069] text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Conta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">Saldo Inicial de Contas Bancárias</h1>
        <p className="text-[16px] text-muted-foreground mt-1">
          Configure o saldo inicial de cada conta para começar a acompanhar seu fluxo de caixa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contas.map((conta) => (
          <Card
            key={conta.id}
            className="rounded-[12px] border border-gray-200 shadow-sm bg-white overflow-hidden p-6 space-y-4"
          >
            <div className="flex flex-col space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                <Landmark className="h-5 w-5 text-muted-foreground" />
                {conta.banco}
              </h3>
              <p className="text-[14px] text-muted-foreground">
                Agência: {conta.agencia || 'N/A'} | Conta: {conta.numero_conta || 'N/A'}
              </p>
              <p className="text-[14px] text-muted-foreground capitalize">
                Tipo: {conta.tipo || 'N/A'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor={`saldo-${conta.id}`} className="text-[14px] font-medium">
                Saldo Inicial (R$)
              </Label>
              <Input
                id={`saldo-${conta.id}`}
                type="number"
                step="0.01"
                min="0"
                className="h-[40px] focus-visible:ring-[#268C83]"
                placeholder="0.00"
                value={saldos[conta.id] ?? ''}
                onChange={(e) => handleSaldoChange(conta.id, e.target.value)}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4">
        <Button
          variant="secondary"
          className="h-[44px] w-full md:w-auto px-8 bg-gray-200 hover:bg-gray-300 text-gray-800"
          onClick={() => navigate('/dashboard')}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          className="h-[44px] w-full md:w-auto px-8 bg-[#268C83] hover:bg-[#1e7069] text-white"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Saldos
        </Button>
      </div>
    </div>
  )
}
