import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function ForcePasswordChangeModal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwords, setPasswords] = useState({ oldPassword: '', password: '', passwordConfirm: '' })

  useEffect(() => {
    if (user?.trocar_senha_proximo_acesso) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [user?.trocar_senha_proximo_acesso])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.password !== passwords.passwordConfirm) {
      return toast({ title: 'Erro', description: 'As senhas não conferem', variant: 'destructive' })
    }
    if (passwords.password.length < 8) {
      return toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 8 caracteres',
        variant: 'destructive',
      })
    }

    setIsLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: passwords.oldPassword,
        password: passwords.password,
        passwordConfirm: passwords.passwordConfirm,
        trocar_senha_proximo_acesso: false,
      })
      toast({
        description: 'Senha atualizada com sucesso',
        className: 'bg-emerald-600 text-white border-none',
      })

      const updatedUser = await pb.collection('users').getOne(user.id)
      pb.authStore.save(pb.authStore.token, updatedUser)
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a senha. Verifique sua senha atual.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && user?.trocar_senha_proximo_acesso) return
        setOpen(val)
      }}
    >
      <DialogContent
        className="sm:max-w-[425px] [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Primeiro Acesso - Alterar Senha</DialogTitle>
          <DialogDescription>
            Para sua segurança, você deve alterar sua senha provisória antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Senha Atual / Provisória</Label>
            <Input
              type="password"
              required
              value={passwords.oldPassword}
              onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={passwords.password}
              onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar Nova Senha</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={passwords.passwordConfirm}
              onChange={(e) => setPasswords({ ...passwords, passwordConfirm: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#268C83] hover:bg-[#1f736b] w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Senha
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
