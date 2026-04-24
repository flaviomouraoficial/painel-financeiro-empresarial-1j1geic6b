import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Inbox } from 'lucide-react'

interface DataTableProps {
  columns: string[]
  data: any[]
  isLoading: boolean
  emptyMessage: string
  onNew: () => void
  renderRow: (item: any, index: number) => React.ReactNode
}

export function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage,
  onNew,
  renderRow,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border bg-white overflow-hidden shadow-sm border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c, i) => (
                <TableHead key={i}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-white shadow-sm border-slate-200">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-medium text-muted-foreground mb-4">{emptyMessage}</p>
        <Button onClick={onNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 hover:[&_tr]:bg-muted/50">
          {data.map((item, i) => renderRow(item, i))}
        </TableBody>
      </Table>
    </div>
  )
}
