import { useState, useEffect } from 'react'
import { getCentrosCusto, CentroCusto } from '@/services/centros_custo'
import { useRealtime } from '@/hooks/use-realtime'
import { Building2, DollarSign, Activity, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CentrosCustoTable } from './CentrosCustoTable'
import { CentrosCustoForm } from './CentrosCustoForm'

export default function CentrosCustoList() {
  const [items, setItems] = useState<CentroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CentroCusto | undefined>()

  const loadData = async () => {
    try {
      const data = await getCentrosCusto()
      setItems(data)
      setError('')
    } catch (err: any) {
      setError('Erro ao carregar centros de custo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('centros_custo', loadData)

  const totalOrcamento = items.reduce((acc, item) => acc + (item.orcamento_anual || 0), 0)
  const ativos = items.filter((item) => item.ativo).length

  const handleAdd = () => {
    setEditingItem(undefined)
    setFormOpen(true)
  }
  const handleEdit = (item: CentroCusto) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={loadData} className="h-11 rounded-lg">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Centros de Custo</h1>
        <Button
          onClick={handleAdd}
          className="h-11 rounded-lg bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Centro de Custo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Centros</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : items.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalOrcamento,
                )
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Centros Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : ativos}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <CentrosCustoTable items={items} onEdit={handleEdit} onAdd={handleAdd} />
        )}
      </div>

      <CentrosCustoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSuccess={loadData}
      />
    </div>
  )
}
