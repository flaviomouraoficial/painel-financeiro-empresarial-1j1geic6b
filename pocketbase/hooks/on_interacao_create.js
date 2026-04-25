onRecordAfterCreateSuccess((e) => {
  const leadId = e.record.getString('lead_id')
  const dataInteracao = e.record.getString('data_interacao')

  if (!leadId || !dataInteracao) return e.next()

  try {
    const lead = $app.findRecordById('leads', leadId)
    lead.set('data_ultimo_contato', dataInteracao)
    $app.save(lead)
  } catch (err) {
    $app
      .logger()
      .error(
        'Erro ao atualizar data_ultimo_contato do lead',
        'lead_id',
        leadId,
        'error',
        err.message,
      )
  }

  return e.next()
}, 'interacoes_leads')
