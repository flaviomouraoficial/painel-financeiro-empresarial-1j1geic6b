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
    const now = new Date()
    const year = now.getFullYear() === 2026 ? 2026 : 2026
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31, 23, 59, 59),
    }
  }

  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(getInitialDates)
  const [preset, setPresetState] = useState<string>(
    () => sessionStorage.getItem('report_period_preset') || 'ano_atual',
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
