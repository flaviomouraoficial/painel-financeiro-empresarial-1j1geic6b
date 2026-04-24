import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ContasReceberFilter({ filters, setFilters, clientes, onClear }: any) {
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilter = () => {
    setFilters(localFilters)
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border flex flex-wrap gap-4 items-end mb-6">
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
        <label className="text-xs font-medium text-gray-700">Status</label>
        <Select
          value={localFilters.status}
          onValueChange={(v) => setLocalFilters({ ...localFilters, status: v })}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
        <label className="text-xs font-medium text-gray-700">Cliente</label>
        <Select
          value={localFilters.cliente}
          onValueChange={(v) => setLocalFilters({ ...localFilters, cliente: v })}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            {clientes.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-700">Data Início</label>
        <Input
          type="date"
          value={localFilters.dataInicio}
          onChange={(e) => setLocalFilters({ ...localFilters, dataInicio: e.target.value })}
          className="bg-white w-[140px]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-700">Data Fim</label>
        <Input
          type="date"
          value={localFilters.dataFim}
          onChange={(e) => setLocalFilters({ ...localFilters, dataFim: e.target.value })}
          className="bg-white w-[140px]"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleFilter} className="bg-green-600 hover:bg-green-700 text-white">
          Filtrar
        </Button>
        <Button
          variant="secondary"
          onClick={onClear}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  )
}
