import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export function NovoClienteModal({ open, onOpenChange, onSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (!nome) return toast({ title: 'Nome obrigatório', variant: 'destructive' })
    setLoading(true)
    try {
      const res = await pb.collection('clientes').create({
        nome,
        cpf_cnpj: cpf,
        empresa_id: user.empresa_id,
        tipo: cpf.length > 14 ? 'pj' : 'pf',
      })
      toast({ title: 'Cliente criado com sucesso' })
      onSuccess(res)
      onOpenChange(false)
      setNome('')
      setCpf('')
    } catch (e) {
      toast({ title: 'Erro ao criar cliente', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CPF / CNPJ</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
