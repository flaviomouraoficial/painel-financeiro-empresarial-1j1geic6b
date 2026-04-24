import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

const IconMap: Record<string, any> = { AlertTriangle, CheckCircle, Activity, TrendingDown, Bell }
const ColorMap: Record<string, string> = {
  red: 'text-red-500',
  green: 'text-green-500',
  teal: 'text-[#268C83]',
  blue: 'text-blue-500',
  orange: 'text-orange-500',
}

export default function NotificacoesPage() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const markAllAsRead = async () => {
    const unread = notificacoes.filter((n) => !n.lida)
    await Promise.all(unread.map((n) => pb.collection('notificacoes').update(n.id, { lida: true })))
    fetchNotificacoes()
  }

  const deleteAll = async () => {
    await Promise.all(notificacoes.map((n) => pb.collection('notificacoes').delete(n.id)))
    fetchNotificacoes()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">Central de Notificações</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Marcar lidas
          </Button>
          <Button variant="destructive" onClick={deleteAll}>
            <Trash className="mr-2 h-4 w-4" /> Limpar todas
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {notificacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma notificação encontrada.
            </p>
          ) : (
            notificacoes.map((n) => {
              const Icon = IconMap[n.icone] || Bell
              return (
                <Card
                  key={n.id}
                  className={`transition-all ${n.lida ? 'opacity-60 bg-muted/50' : 'border-l-4 border-l-primary shadow-sm'}`}
                >
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className={`mt-1 ${ColorMap[n.cor] || 'text-primary'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className={`font-semibold ${!n.lida && 'text-foreground'}`}>
                          {n.titulo}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(n.created), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.mensagem}</p>
                      {n.link && (
                        <a
                          href={n.link}
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                          Visualizar detalhes
                        </a>
                      )}
                    </div>
                    {!n.lida && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Marcar como lida"
                        onClick={async () => {
                          await pb.collection('notificacoes').update(n.id, { lida: true })
                          fetchNotificacoes()
                        }}
                      >
                        <Check className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
