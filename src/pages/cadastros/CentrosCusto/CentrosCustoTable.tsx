import { useState } from 'react'
import { CentroCusto, deleteCentroCusto } from '@/services/centros_custo'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  items: CentroCusto[]
  onEdit: (item: CentroCusto) => void
  onAdd: () => void
}

export function CentrosCustoTable({ items, onEdit, onAdd }: Props) {
  const [deleteItem, setDeleteItem] = useState<CentroCusto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      await deleteCentroCusto(deleteItem.id)
      toast.success('Centro de custo deletado com sucesso')
    } catch (error) {
      toast.error('Erro ao deletar centro de custo')
    } finally {
      setIsDeleting(false)
      setDeleteItem(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Nenhum centro de custo cadastrado</p>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione o primeiro para começar a organizar.
        </p>
        <Button
          onClick={onAdd}
          className="h-11 rounded-lg bg-green-600 hover:bg-green-700 text-white"
        >
          Novo Centro de Custo
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Orçamento Anual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="even:bg-muted/20 hover:bg-muted/50">
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>{item.codigo || '-'}</TableCell>
                <TableCell>{item.departamento || '-'}</TableCell>
                <TableCell>{item.expand?.responsavel_id?.name || '-'}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.orcamento_anual || 0,
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.ativo ? 'default' : 'secondary'}
                    className={item.ativo ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                  >
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteItem(item)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Centro de Custo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este centro de custo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
