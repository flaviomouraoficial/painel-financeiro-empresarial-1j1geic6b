import { Pencil, Trash2, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/format'
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
import { useState } from 'react'

interface LancamentosListaProps {
  lancamentos: any[]
  loading: boolean
  error: string | null
  user: any
  onEdit: (l: any) => void
  onDelete: (id: string) => void
  onRetry: () => void
  onNew: () => void
}

export function LancamentosLista({
  lancamentos,
  loading,
  error,
  user,
  onEdit,
  onDelete,
  onRetry,
  onNew,
}: LancamentosListaProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-red-600">{error}</p>
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (lancamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-slate-50 border-dashed">
        <FileText className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum lançamento registrado</h3>
        <p className="text-sm text-slate-500 mb-4">
          Você ainda não possui lançamentos financeiros para os filtros aplicados.
        </p>
        <Button onClick={onNew}>Novo Lançamento</Button>
      </div>
    )
  }

  const canEdit = (l: any) => {
    if (!user) return false
    if (user.perfil === 'admin' || user.perfil === 'gerente') return true
    return user.id === l.usuario_id
  }

  const canDelete = () => {
    return user?.perfil === 'admin'
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lancamentos.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-muted-foreground">
                {formatDate(t.data_lancamento)}
              </TableCell>
              <TableCell className="font-medium">{t.descricao}</TableCell>
              <TableCell>{t.expand?.categoria_id?.nome || '-'}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    t.status === 'efetivado' || t.status === 'confirmado'
                      ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                      : t.status === 'cancelado'
                        ? 'text-slate-600 border-slate-200 bg-slate-50'
                        : 'text-orange-600 border-orange-200 bg-orange-50'
                  }
                >
                  {t.status || 'Pendente'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    t.tipo === 'receita'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }
                >
                  {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </Badge>
              </TableCell>
              <TableCell
                className={`text-right font-bold ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {t.tipo === 'receita' ? '+' : '-'}
                {formatCurrency(t.valor)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {canEdit(t) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(t)}
                      className="h-8 w-8 text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(t.id)}
                      className="h-8 w-8 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId)
                setDeleteId(null)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
