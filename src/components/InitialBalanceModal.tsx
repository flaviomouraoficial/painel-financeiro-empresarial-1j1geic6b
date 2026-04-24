import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { Loader2 } from 'lucide-react'

export function InitialBalanceModal() {
  const [open, setOpen] = useState(false)
  const [contas, setContas] = useState<any[]>([])
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchContas = async () => {
      try {
        const records = await pb.collection('contas_bancarias').getFullList({
          filter: 'saldo_inicial_definido = false && ativo = true',
        })
        if (records.length > 0) {
          setContas(records)
          setOpen(true)
        }
      } catch (err) {
        console.error('Error fetching contas', err)
      } finally {
        setLoading(false)
      }
    }

    if (pb.authStore.isValid) {
      fetchContas()
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const conta of contas) {
        const saldo = parseFloat(balances[conta.id] || '0')
        await pb.collection('contas_bancarias').update(conta.id, {
          saldo_inicial: saldo,
          saldo_atual: saldo,
          saldo_inicial_definido: true,
        })
      }
      setOpen(false)
    } catch (err) {
      console.error('Failed to update accounts', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !open) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Saldo Inicial das Contas</DialogTitle>
          <DialogDescription>
            Identificamos contas sem saldo inicial definido. Por favor, informe o saldo para
            continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {contas.map((conta) => (
            <div key={conta.id} className="space-y-2">
              <Label htmlFor={`conta-${conta.id}`}>
                {conta.banco} {conta.agencia ? `- Ag: ${conta.agencia}` : ''}{' '}
                {conta.numero_conta ? `- Cc: ${conta.numero_conta}` : ''}
              </Label>
              <Input
                id={`conta-${conta.id}`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balances[conta.id] || ''}
                onChange={(e) => setBalances({ ...balances, [conta.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#268C83] hover:bg-[#1a665f] w-full sm:w-auto"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
