export const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value) || 0,
  )
}

export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split(' ')[0].split('-')
  return `${day}/${month}/${year}`
}
