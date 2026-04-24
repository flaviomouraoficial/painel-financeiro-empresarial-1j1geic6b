import { useParams } from 'react-router-dom'
import { Search, Plus, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const mockData = {
  clientes: [
    { id: 1, nome: 'Tech Solutions S.A.', documento: '12.345.678/0001-90', status: 'Ativo' },
    { id: 2, nome: 'Comercial Silva Ltda', documento: '98.765.432/0001-10', status: 'Ativo' },
    { id: 3, nome: 'João Pereira', documento: '123.456.789-00', status: 'Inativo' },
  ],
  fornecedores: [
    { id: 1, nome: 'Distribuidora Nacional', documento: '11.222.333/0001-44', status: 'Ativo' },
    { id: 2, nome: 'Serviços de Limpeza', documento: '55.666.777/0001-88', status: 'Ativo' },
  ],
}

export default function Cadastros() {
  const { tipo } = useParams<{ tipo: string }>()
  const title = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('-', ' ') : 'Cadastros'
  const data = mockData[tipo as keyof typeof mockData] || []

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Cadastro de {title}</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Buscar ${title.toLowerCase()}...`}
                className="pl-8"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Razão Social</TableHead>
                  <TableHead>Documento (CPF/CNPJ)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.documento}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.status === 'Ativo'
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                            : 'text-slate-600'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum registro encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Comece adicionando seu primeiro registro.
              </p>
              <Button variant="outline">Adicionar {title}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
