import { useState } from 'react'
import { Search, Plus, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const allTransactions = [
  {
    id: '1',
    date: '2023-10-28',
    desc: 'Consultoria Financeira ABC',
    cat: 'Serviços',
    value: 4500,
    type: 'receita',
    status: 'Efetivado',
  },
  {
    id: '2',
    date: '2023-10-27',
    desc: 'Licença Software CRM',
    cat: 'Tecnologia',
    value: 350,
    type: 'despesa',
    status: 'Efetivado',
  },
  {
    id: '3',
    date: '2023-10-25',
    desc: 'Auditoria Empresa XYZ',
    cat: 'Serviços',
    value: 8200,
    type: 'receita',
    status: 'Pendente',
  },
  {
    id: '4',
    date: '2023-10-24',
    desc: 'Aluguel Escritório',
    cat: 'Infraestrutura',
    value: 2500,
    type: 'despesa',
    status: 'Efetivado',
  },
  {
    id: '5',
    date: '2023-10-23',
    desc: 'Material de Escritório',
    cat: 'Suprimentos',
    value: 120,
    type: 'despesa',
    status: 'Efetivado',
  },
  {
    id: '6',
    date: '2023-10-20',
    desc: 'Impostos',
    cat: 'Impostos',
    value: 1850,
    type: 'despesa',
    status: 'Efetivado',
  },
  {
    id: '7',
    date: '2023-10-15',
    desc: 'Mentoria Startup',
    cat: 'Serviços',
    value: 3000,
    type: 'receita',
    status: 'Efetivado',
  },
]

export default function Lancamentos() {
  const [filterType, setFilterType] = useState<string>('todos')

  const filtered =
    filterType === 'todos' ? allTransactions : allTransactions.filter((t) => t.type === filterType)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Lançamentos Financeiros</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Receita
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <ArrowDownRight className="mr-2 h-4 w-4" />
            Despesa
          </Button>
          <Button>Novo Lançamento</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar lançamentos..." className="pl-8" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros Avançados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell className="font-medium">{t.desc}</TableCell>
                  <TableCell>{t.cat}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        t.status === 'Efetivado'
                          ? 'text-emerald-600 border-emerald-200'
                          : 'text-orange-600 border-orange-200'
                      }
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        t.type === 'receita'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }
                    >
                      {t.type === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${t.type === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {t.type === 'receita' ? '+' : '-'}
                    {formatCurrency(t.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
