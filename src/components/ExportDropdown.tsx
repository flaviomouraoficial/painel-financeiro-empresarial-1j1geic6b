import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileBox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportDropdownProps {
  onExportPdf?: () => Promise<void>
  onExportExcel?: () => Promise<void>
  onExportCsv?: () => Promise<void>
  disabled?: boolean
}

export function ExportDropdown({
  onExportPdf,
  onExportExcel,
  onExportCsv,
  disabled,
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (action?: () => Promise<void>) => {
    if (!action) return
    setIsExporting(true)
    try {
      await action()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} className="h-[44px]">
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportPdf && (
          <DropdownMenuItem onClick={() => handleExport(onExportPdf)}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem onClick={() => handleExport(onExportExcel)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </DropdownMenuItem>
        )}
        {onExportCsv && (
          <DropdownMenuItem onClick={() => handleExport(onExportCsv)}>
            <FileBox className="mr-2 h-4 w-4" /> CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
