import { useState, useEffect } from 'react'
import { Shield, Plus, Edit, Trash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'

export default function Usuarios() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({ ativo: true, perfil: 'usuario' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadUsers = async () => {
    if (!user?.empresa_id) return
    try {
      const records = await pb.collection('users').getFullList({
        filter: `empresa_id = "${user.empresa_id}"`,
        sort: 'name',
      })
      setUsers(records)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao carregar usuários.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [user])
  useRealtime('users', () => loadUsers())

  const handleOpen = (item?: any) => {
    setEditingId(item?.id || null)
    setFormData(item || { ativo: true, perfil: 'usuario' })
    setOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, empresa_id: user.empresa_id }
      if (!editingId && payload.password) {
        payload.passwordConfirm = payload.password
      }
      if (editingId) {
        await pb.collection('users').update(editingId, payload)
      } else {
        await pb.collection('users').create(payload)
      }
      toast({ title: 'Sucesso', description: 'Usuário salvo.' })
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Verifique os campos obrigatórios (senha mín. 8 caracteres).',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (id === user.id)
      return toast({
        title: 'Atenção',
        description: 'Você não pode excluir a si mesmo.',
        variant: 'destructive',
      })
    if (!confirm('Deseja excluir este usuário?')) return
    try {
      await pb.collection('users').delete(id)
      toast({ title: 'Sucesso', description: 'Usuário excluído.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' })
    }
  }

  if (user?.perfil !== 'admin') {
    return (
      <div className="p-8 text-center mt-10">
        Acesso Negado. Apenas administradores podem ver esta página.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie o acesso da sua equipe ao painel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}>
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Novo'} Usuário</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    E-mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingId}
                  />
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <Label>
                      Senha <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={formData.perfil || 'usuario'}
                    onValueChange={(v) => setFormData({ ...formData, perfil: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="usuario">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={formData.ativo}
                    onCheckedChange={(v) => setFormData({ ...formData, ativo: v })}
                  />
                  <Label>Usuário Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Membros da Equipe
          </CardTitle>
          <CardDescription>Usuários com acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
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
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{u.name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.perfil === 'admin' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {u.perfil}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className={`h-2 w-2 rounded-full ${u.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}
                        ></span>
                        {u.ativo ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(u)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {u.id !== user.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
