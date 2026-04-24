import { useParams } from 'react-router-dom'
import { Search, Plus, Filter, CalendarX2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export default function Contas() {
  const { tipo } = useParams<{ tipo: string }>() // "receber" or "pagar"
  const isReceber = tipo === 'receber'

  const mockContas = [
    {
      id: 1,
      vencimento: '2023-11-05',
      descricao: isReceber ? 'Fatura Cliente A' : 'Fornecedor Energia',
      valor: 1500,
      status: 'A Vencer',
    },
    {
      id: 2,
      vencimento: '2023-10-20',
      descricao: isReceber ? 'Fatura Cliente B' : 'Fornecedor Internet',
      valor: 350,
      status: 'Vencido',
    },
    {
      id: 3,
      vencimento: '2023-10-15',
      descricao: isReceber ? 'Fatura Cliente C' : 'Aluguel',
      valor: 2500,
      status: 'Pago',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Contas a {isReceber ? 'Receber' : 'Pagar'}
        </h1>
        <Button
          className={
            isReceber ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta a {isReceber ? 'Receber' : 'Pagar'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Total a {isReceber ? 'Receber' : 'Pagar'}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(1850)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              <CalendarX2 className="h-4 w-4" />
              Vencido
            </div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(350)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-emerald-800 mb-2">Já Pago (Mês)</div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(2500)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <Tabs defaultValue="todos" className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-medium">{formatDate(c.vencimento)}</TableCell>
                  <TableCell>{c.descricao}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.status === 'Pago'
                          ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                          : c.status === 'Vencido'
                            ? 'text-red-600 border-red-200 bg-red-50'
                            : 'text-orange-600 border-orange-200 bg-orange-50'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 font-bold">
                    {formatCurrency(c.valor)}
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
