import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Shield, Eye, Loader2, RefreshCw } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'

export default function Auditoria() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTabela, setFilterTabela] = useState<string>('todas')
  const [filterAcao, setFilterAcao] = useState<string>('todas')
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const loadLogs = useCallback(async () => {
    if (!user?.empresa_id) return
    setLoading(true)
    try {
      let filterStr = `empresa_id = "${user.empresa_id}"`
      if (filterTabela !== 'todas') filterStr += ` && tabela = "${filterTabela}"`
      if (filterAcao !== 'todas') filterStr += ` && acao = "${filterAcao}"`

      const result = await pb.collection('auditoria_logs').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
        expand: 'usuario_id',
      })
      setLogs(result.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.empresa_id, filterTabela, filterAcao])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useRealtime('auditoria_logs', () => {
    loadLogs()
  })

  if (user && user.perfil !== 'admin' && user.perfil !== 'gerente') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Auditoria do Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore as atividades e alterações no sistema.
          </p>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterTabela} onValueChange={setFilterTabela}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as tabelas</SelectItem>
                <SelectItem value="lancamentos">Lançamentos</SelectItem>
                <SelectItem value="livros">Biblioteca</SelectItem>
                <SelectItem value="users">Usuários</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAcao} onValueChange={setFilterAcao}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right pr-6">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-6 font-medium">
                        {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {log.expand?.usuario_id?.name || log.expand?.usuario_id?.email || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.acao === 'create'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : log.acao === 'update'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {log.acao.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{log.tabela}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4 mr-2" /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              {selectedLog?.acao.toUpperCase()} na tabela {selectedLog?.tabela}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Data:</span>
                  <span className="font-medium">
                    {format(new Date(selectedLog.created), 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Usuário:</span>
                  <span className="font-medium">
                    {selectedLog.expand?.usuario_id?.name ||
                      selectedLog.expand?.usuario_id?.email ||
                      'Sistema'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">ID do Registro:</span>
                  <span className="font-mono text-xs bg-muted p-1 rounded">
                    {selectedLog.registro_id}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm mb-2">Dados Alterados:</span>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedLog.detalhes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
