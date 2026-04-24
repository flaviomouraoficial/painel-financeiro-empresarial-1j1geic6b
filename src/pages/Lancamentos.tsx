import { useState, useEffect, useCallback } from 'react'
import { Plus, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { listarLancamentos, deletarLancamento } from '@/services/lancamentos'
import { getOpcoes } from '@/services/opcoes'
import { LancamentosLista } from '@/components/lancamentos/LancamentosLista'
import { LancamentosForm } from '@/components/lancamentos/LancamentosForm'

export default function Lancamentos() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroMes, setFiltroMes] = useState<string>('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLancamento, setEditingLancamento] = useState<any>(null)

  const [opcoes, setOpcoes] = useState({ categorias: [], contas: [], cartoes: [] })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filtros: any = { tipo: filtroTipo }
      if (filtroMes) {
        const year = filtroMes.split('-')[0]
        const month = filtroMes.split('-')[1]
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
        filtros.data_inicio = `${filtroMes}-01`
        filtros.data_fim = `${filtroMes}-${lastDay}`
      }

      const data = await listarLancamentos(filtros)
      setLancamentos(data)
    } catch (err: any) {
      setError(err.message)
      toast({ title: 'Erro', description: err.message, variant: 'destructive', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, filtroMes, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('lancamentos', () => {
    loadData()
  })

  useEffect(() => {
    getOpcoes().then(setOpcoes)
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deletarLancamento(id)
      toast({
        title: 'Sucesso',
        description: 'Lançamento deletado com sucesso',
        className: 'bg-emerald-600 text-white',
        duration: 3000,
      })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive', duration: 5000 })
    }
  }

  const openForm = (lancamento: any = null) => {
    setEditingLancamento(lancamento)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Lançamentos Financeiros</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => setFiltroTipo(filtroTipo === 'receita' ? 'todos' : 'receita')}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Receitas
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setFiltroTipo(filtroTipo === 'despesa' ? 'todos' : 'despesa')}
          >
            <ArrowDownRight className="mr-2 h-4 w-4" />
            Despesas
          </Button>
          <Button onClick={() => openForm()} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-[200px]"
              />
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <LancamentosLista
            lancamentos={lancamentos}
            loading={loading}
            error={error}
            user={user}
            onEdit={openForm}
            onDelete={handleDelete}
            onRetry={loadData}
            onNew={() => openForm()}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-slate-900">
              {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>
          <LancamentosForm
            lancamento={editingLancamento}
            categorias={opcoes.categorias}
            contas={opcoes.contas}
            cartoes={opcoes.cartoes}
            onSuccess={() => {
              setIsFormOpen(false)
              loadData()
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
