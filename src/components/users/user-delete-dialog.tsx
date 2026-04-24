import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function UserDeleteDialog({ user, open, onOpenChange, onSuccess }: any) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const confirmDelete = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      await pb.collection('users').delete(user.id)
      toast({
        description: 'Usuário deletado com sucesso',
        className: 'bg-emerald-600 text-white border-none',
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast({ description: 'Erro ao deletar usuário', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deletar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
