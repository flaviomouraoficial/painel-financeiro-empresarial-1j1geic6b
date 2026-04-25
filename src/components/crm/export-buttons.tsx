import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, FileSpreadsheet, File } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonsProps {
  onExportPdf: () => Promise<void>
  onExportExcel: () => Promise<void>
  onExportCsv: () => Promise<void>
}

export function ExportButtons({ onExportPdf, onExportExcel, onExportCsv }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'pdf' | 'excel' | 'csv' | null>(null)
  const { toast } = useToast()

  const handleExport = async (type: 'pdf' | 'excel' | 'csv', action: () => Promise<void>) => {
    setLoading(type)
    try {
      await action()
      toast({
        title: `${type.toUpperCase()} gerado com sucesso`,
        className: 'bg-green-600 text-white border-none',
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: `Erro ao gerar ${type.toUpperCase()}. Tente novamente`,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button
        variant="outline"
        className="h-10 bg-muted/30 hover:bg-muted text-muted-foreground w-full sm:w-auto"
        onClick={() => handleExport('pdf', onExportPdf)}
        disabled={!!loading}
      >
        {loading === 'pdf' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Exportar PDF
      </Button>
      <Button
        variant="outline"
        className="h-10 bg-muted/30 hover:bg-muted text-muted-foreground w-full sm:w-auto"
        onClick={() => handleExport('excel', onExportExcel)}
        disabled={!!loading}
      >
        {loading === 'excel' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Exportar Excel
      </Button>
      <Button
        variant="outline"
        className="h-10 bg-muted/30 hover:bg-muted text-muted-foreground w-full sm:w-auto"
        onClick={() => handleExport('csv', onExportCsv)}
        disabled={!!loading}
      >
        {loading === 'csv' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <File className="mr-2 h-4 w-4" />
        )}
        Exportar CSV
      </Button>
    </div>
  )
}
