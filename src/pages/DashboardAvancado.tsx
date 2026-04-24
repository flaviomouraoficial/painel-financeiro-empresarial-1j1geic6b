import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { AlertsTable } from '@/components/dashboard/alerts-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardAvancado() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState('30')
  const [data, setData] = useState<any>({
    lancamentos: [],
    contasBancarias: [],
    contasReceber: [],
    contasPagar: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user?.empresa_id) return
    setLoading(true)
    const filter = `empresa_id = "${user.empresa_id}"`
    const [lanc, banc, rec, pag] = await Promise.all([
      pb.collection('lancamentos').getFullList({ filter }),
      pb.collection('contas_bancarias').getFullList({ filter }),
      pb.collection('contas_receber').getFullList({ filter }),
      pb.collection('contas_pagar').getFullList({ filter }),
    ])
    setData({ lancamentos: lanc, contasBancarias: banc, contasReceber: rec, contasPagar: pag })
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.empresa_id])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Dashboard Executivo</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <KpiCards data={data} periodo={Number(periodo)} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCharts data={data} periodo={Number(periodo)} />
            <div className="col-span-1">
              <AlertsTable data={data} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
