import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Trash,
  Check,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingDown,
  Bell,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const IconMap: Record<string, any> = { AlertTriangle, CheckCircle, Activity, TrendingDown, Bell }
const ColorMap: Record<string, string> = {
  red: 'text-red-500',
  green: 'text-green-500',
  teal: 'text-[#268C83]',
  blue: 'text-blue-500',
  orange: 'text-orange-500',
}

const TypeLabels: Record<string, string> = {
  alerta_financeiro: 'Alerta Financeiro',
  alerta_fluxo_caixa: 'Alerta de Fluxo de Caixa',
  recebimento: 'Recebimento',
  pagamento: 'Pagamento',
  lancamento: 'Lançamento',
}

export default function NotificacoesPage() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('todas')

  const fetchNotificacoes = async () => {
    if (!user?.empresa_id) return
    const res = await pb.collection('notificacoes').getFullList({
      filter: `empresa_id = "${user.empresa_id}" && usuario_id = "${user.id}"`,
      sort: '-created',
    })
    setNotificacoes(res)
    setLoading(false)
  }

  useEffect(() => {
    fetchNotificacoes()
  }, [user?.empresa_id])

  useRealtime('notificacoes', (e) => {
    if (e.record.usuario_id === user?.id) {
      fetchNotificacoes()
    }
  })

  const markAllAsRead = async () => {
    const unread = notificacoes.filter((n) => !n.lida)
    await Promise.all(unread.map((n) => pb.collection('notificacoes').update(n.id, { lida: true })))
    fetchNotificacoes()
  }

  const deleteAll = async () => {
    await Promise.all(notificacoes.map((n) => pb.collection('notificacoes').delete(n.id)))
    fetchNotificacoes()
  }

  const filteredNotificacoes = notificacoes.filter((n) => {
    if (filterType !== 'todas' && n.tipo !== filterType) return false
    return true
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Central de Notificações</h1>
          <p className="text-muted-foreground text-sm">Gerencie todos os seus alertas e avisos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alerta_financeiro">Alerta Financeiro</SelectItem>
              <SelectItem value="alerta_fluxo_caixa">Alerta de Caixa</SelectItem>
              <SelectItem value="recebimento">Recebimentos</SelectItem>
              <SelectItem value="pagamento">Pagamentos</SelectItem>
              <SelectItem value="lancamento">Lançamentos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={markAllAsRead}
          >
            <Check className="mr-2 h-4 w-4" /> Marcar todas lidas
          </Button>
          <Button
            variant="outline"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            onClick={deleteAll}
          >
            <Trash className="mr-2 h-4 w-4" /> Limpar todas
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Tipo</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead className="w-[160px]">Data / Hora</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredNotificacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-20" />
                    <p>Nenhuma notificação encontrada.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotificacoes.map((n) => {
                const Icon = IconMap[n.icone] || Bell
                return (
                  <TableRow
                    key={n.id}
                    className={cn(
                      !n.lida ? 'bg-muted/30 font-medium' : 'opacity-70',
                      'transition-colors',
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', ColorMap[n.cor] || 'text-primary')} />
                        <span>{TypeLabels[n.tipo] || n.tipo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className={cn('block', !n.lida && 'text-foreground')}>
                          {n.titulo}
                        </span>
                        <span className="text-sm text-muted-foreground block mt-0.5">
                          {n.mensagem}
                        </span>
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                          >
                            Acessar link
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(n.created), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          n.lida ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {n.lida ? 'Lida' : 'Não lida'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {!n.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Marcar como lida"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={async () => {
                            await pb.collection('notificacoes').update(n.id, { lida: true })
                            fetchNotificacoes()
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Deletar"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          await pb.collection('notificacoes').delete(n.id)
                          fetchNotificacoes()
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
