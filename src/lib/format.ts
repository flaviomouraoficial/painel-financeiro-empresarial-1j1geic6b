import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy',
): string {
  if (!date) return '-'
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date
    return format(parsedDate, formatStr, { locale: ptBR })
  } catch (e) {
    return String(date)
  }
}
