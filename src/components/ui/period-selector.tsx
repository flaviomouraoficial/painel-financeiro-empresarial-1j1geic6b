import * as React from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function PeriodSelector({
  date,
  setDate,
  preset,
  setPreset,
  className,
}: {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  preset: string
  setPreset: (preset: string) => void
  className?: string
}) {
  const handlePresetChange = (value: string) => {
    setPreset(value)
    const today = new Date()
    if (value === 'hoje') {
      setDate({ from: today, to: today })
    } else if (value === '7_dias') {
      setDate({ from: subDays(today, 6), to: today })
    } else if (value === 'mes_atual') {
      setDate({ from: startOfMonth(today), to: endOfMonth(today) })
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="7_dias">Últimos 7 dias</SelectItem>
          <SelectItem value="mes_atual">Mês Atual</SelectItem>
          <SelectItem value="personalizado">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'personalizado' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[240px] h-9 justify-start text-left font-normal',
                !date && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'dd/MM/yyyy')} - {format(date.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(date.from, 'dd/MM/yyyy')
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
