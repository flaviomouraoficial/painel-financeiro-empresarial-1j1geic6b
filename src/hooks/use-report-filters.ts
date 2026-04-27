import { useState, useEffect } from 'react'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function useReportFilters() {
  const getInitialDates = () => {
    const savedStart = sessionStorage.getItem('report_period_start')
    const savedEnd = sessionStorage.getItem('report_period_end')
    if (savedStart && savedEnd) {
      return {
        from: parseISO(savedStart),
        to: parseISO(savedEnd),
      }
    }
    return {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }
  }

  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(getInitialDates)
  const [preset, setPresetState] = useState<string>(
    () => sessionStorage.getItem('report_period_preset') || 'mes_atual',
  )

  const setDateRange = (range: DateRange | undefined) => {
    setDateRangeState(range)
    if (range?.from) sessionStorage.setItem('report_period_start', range.from.toISOString())
    else sessionStorage.removeItem('report_period_start')

    if (range?.to) sessionStorage.setItem('report_period_end', range.to.toISOString())
    else sessionStorage.removeItem('report_period_end')
  }

  const setPreset = (p: string) => {
    setPresetState(p)
    sessionStorage.setItem('report_period_preset', p)
  }

  return { dateRange, setDateRange, preset, setPreset }
}
