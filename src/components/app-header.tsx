import {
  Bell,
  LogOut,
  Search,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingDown,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Link, useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

const IconMap: Record<string, any> = {
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingDown,
  Bell,
}

const ColorMap: Record<string, string> = {
  red: 'text-red-500',
  green: 'text-green-500',
  teal: 'text-[#268C83]',
  blue: 'text-blue-500',
  orange: 'text-orange-500',
}

export function AppHeader() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotificacoes = async () => {
    if (!user?.empresa_id) return
    const res = await pb.collection('notificacoes').getList(1, 10, {
      filter: `empresa_id = "${user.empresa_id}" && usuario_id = "${user.id}"`,
      sort: '-created',
    })
    setNotificacoes(res.items)

    const unread = await pb.collection('notificacoes').getList(1, 1, {
      filter: `empresa_id = "${user.empresa_id}" && usuario_id = "${user.id}" && lida = false`,
      $autoCancel: false,
    })
    setUnreadCount(unread.totalItems)
  }

  useEffect(() => {
    fetchNotificacoes()
    pb.send('/backend/v1/alertas/verificar', { method: 'POST' }).catch(() => {})
  }, [user?.id, user?.empresa_id])

  useRealtime('notificacoes', (e) => {
    if (e.record.usuario_id === user?.id) {
      fetchNotificacoes()
      if (e.action === 'create' && !e.record.lida) {
        toast({
          title: e.record.titulo,
          description: e.record.mensagem,
        })
      }
    }
  })

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'
  const profileLabel = user?.perfil
    ? user.perfil.charAt(0).toUpperCase() + user.perfil.slice(1)
    : 'Usuário'

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="-ml-2" />
      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <form className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-muted/50 pl-8 rounded-full border-none"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border border-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notificações</span>
                <Link
                  to="/notificacoes"
                  className="text-xs text-primary hover:underline font-normal"
                >
                  Ver todas
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notificacoes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.map((n) => {
                    const Icon = IconMap[n.icone] || Bell
                    return (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => n.link && navigate(n.link)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className={`h-4 w-4 ${ColorMap[n.cor] || 'text-primary'}`} />
                          <span
                            className={`font-medium text-sm ${!n.lida ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {n.titulo}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(n.created), 'HH:mm')}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-1 line-clamp-2 ${!n.lida ? 'text-foreground/80' : 'text-muted-foreground'}`}
                        >
                          {n.mensagem}
                        </p>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/thumbnail?seed=${user?.id || 'admin'}`}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'Usuário'} - {profileLabel}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
