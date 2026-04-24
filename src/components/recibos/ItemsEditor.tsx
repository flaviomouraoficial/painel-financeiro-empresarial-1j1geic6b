import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface Item {
  id: string
  descricao: string
  quantidade: number
  valor_unitario: number
}

export function ItemsEditor({ itens, setItens }: { itens: Item[]; setItens: (i: Item[]) => void }) {
  const add = () =>
    setItens([
      ...itens,
      { id: Date.now().toString(), descricao: '', quantidade: 1, valor_unitario: 0 },
    ])
  const remove = (id: string) => setItens(itens.filter((i) => i.id !== id))
  const update = (id: string, field: keyof Item, val: string | number) => {
    setItens(itens.map((i) => (i.id === id ? { ...i, [field]: val } : i)))
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Itens de Despesa</h3>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-8">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Item
        </Button>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-center w-20">Qtd</th>
              <th className="p-2 text-right w-32">Valor Unitário</th>
              <th className="p-2 text-right w-32">Total</th>
              <th className="p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="p-2">
                  <Input
                    value={i.descricao}
                    onChange={(e) => update(i.id, 'descricao', e.target.value)}
                    placeholder="Ex: Táxi, Alimentação"
                    className="h-8"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={i.quantidade}
                    onChange={(e) => update(i.id, 'quantidade', Number(e.target.value))}
                    className="h-8 text-center"
                    min="1"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={i.valor_unitario}
                    onChange={(e) => update(i.id, 'valor_unitario', Number(e.target.value))}
                    className="h-8 text-right"
                    step="0.01"
                  />
                </td>
                <td className="p-2 text-right font-medium">
                  {formatCurrency(i.quantidade * i.valor_unitario)}
                </td>
                <td className="p-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(i.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  Nenhum item adicionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
