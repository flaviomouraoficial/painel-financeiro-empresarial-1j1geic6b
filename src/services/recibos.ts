import pb from '@/lib/pocketbase/client'

export const getRecibos = () =>
  pb
    .collection('recibos')
    .getFullList({ expand: 'cliente_id,conta_bancaria_id,cartao_credito_id', sort: '-created' })

export const getReciboItens = (id: string) =>
  pb.collection('itens_recibos').getFullList({ filter: `recibo_id = '${id}'`, sort: 'created' })

export const generateNumeroRecibo = async (empresaId: string) => {
  const year = new Date().getFullYear()
  const start = `${year}-01-01 00:00:00.000Z`
  const end = `${year}-12-31 23:59:59.999Z`
  const result = await pb.collection('recibos').getList(1, 1, {
    filter: `empresa_id = '${empresaId}' && created >= '${start}' && created <= '${end}'`,
  })
  return `REC-${year}-${String(result.totalItems + 1).padStart(5, '0')}`
}

export const createRecibo = async (data: any, itens: any[]) => {
  const recibo = await pb.collection('recibos').create(data)
  for (const item of itens) {
    await pb.collection('itens_recibos').create({
      ...item,
      recibo_id: recibo.id,
      empresa_id: data.empresa_id,
      valor_total: item.quantidade * item.valor_unitario,
    })
  }
  return recibo
}

export const updateRecibo = async (id: string, data: any, itens: any[]) => {
  const recibo = await pb.collection('recibos').update(id, data)
  const oldItens = await getReciboItens(id)
  for (const old of oldItens) await pb.collection('itens_recibos').delete(old.id)
  for (const item of itens) {
    await pb.collection('itens_recibos').create({
      ...item,
      recibo_id: id,
      empresa_id: data.empresa_id,
      valor_total: item.quantidade * item.valor_unitario,
    })
  }
  return recibo
}

export const deleteRecibo = (id: string) => pb.collection('recibos').delete(id)
