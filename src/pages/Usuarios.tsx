import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash, Users, ShieldAlert, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { UserFormDialog } from '@/components/users/user-form-dialog'
import { UserDeleteDialog } from '@/components/users/user-delete-dialog'

export default function Usuarios() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    if (!loading && user?.perfil !== 'admin') {
      toast({ description: 'Acesso negado', variant: 'destructive' })
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate, toast])

  const loadUsers = async () => {
    if (!user?.empresa_id) return
    setIsLoading(true)
    setError(false)
    try {
      const records = await pb.collection('users').getFullList({
        filter: `empresa_id = "${user.empresa_id}"`,
        sort: '-created',
      })
      setUsers(records)
    } catch (err) {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [user])

  useRealtime('users', () => loadUsers())

  const toggleStatus = async (u: any, checked: boolean) => {
    try {
      await pb.collection('users').update(u.id, { ativo: checked })
      toast({ description: 'Status atualizado com sucesso' })
    } catch {
      toast({ description: 'Erro ao atualizar status', variant: 'destructive' })
      loadUsers() // revert toggle
    }
  }

  const openForm = (u: any = null) => {
    setSelectedUser(u)
    setFormOpen(true)
  }

  const openDelete = (u: any) => {
    setSelectedUser(u)
    setDeleteOpen(true)
  }

  if (loading || user?.perfil !== 'admin') return null

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold tracking-tight text-foreground">
              Gestão de Usuários
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4 space-y-2">
                  <p>
                    <strong>Níveis de Acesso:</strong>
                  </p>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>
                      <strong>Admin:</strong> Acesso total ao sistema, gerencia usuários e
                      configurações.
                    </li>
                    <li>
                      <strong>Gerente:</strong> Acesso a lançamentos e biblioteca, não pode excluir
                      dados críticos ou usuários.
                    </li>
                    <li>
                      <strong>Usuário:</strong> Acesso restrito aos próprios registros e leitura de
                      dados gerais.
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground text-[16px]">
            Gerencie o acesso da sua equipe ao painel
          </p>
        </div>
        <Button onClick={() => openForm()} className="bg-[#268C83] hover:bg-[#1f736b] h-[44px]">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">Perfil</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-destructive">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-8 w-8" />
                    <span>Erro ao carregar usuários.</span>
                    <Button variant="outline" size="sm" onClick={loadUsers}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-12 w-12 text-muted" />
                    <span className="text-lg font-medium text-foreground">
                      Nenhum usuário cadastrado
                    </span>
                    <span className="text-sm">Comece adicionando membros à sua equipe.</span>
                    <Button
                      onClick={() => openForm()}
                      variant="outline"
                      className="mt-2 text-[#268C83] border-[#268C83] hover:bg-[#268C83]/10"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="even:bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            u.avatar
                              ? pb.files.getUrl(u, u.avatar, { thumb: '100x100' })
                              : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                          }
                        />
                        <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-[14px]">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[14px]">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.perfil === 'admin' ? 'default' : 'secondary'}
                      className={`capitalize text-xs ${u.perfil === 'admin' ? 'bg-[#268C83] hover:bg-[#1f736b]' : ''}`}
                    >
                      {u.perfil}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.ativo}
                      onCheckedChange={(c) => toggleStatus(u, c)}
                      disabled={u.id === user.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openForm(u)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(u)}
                        disabled={u.id === user.id}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        companyId={user?.empresa_id}
        onSuccess={loadUsers}
      />
      <UserDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={selectedUser}
        onSuccess={loadUsers}
      />
    </div>
  )
}
