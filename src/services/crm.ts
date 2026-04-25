import pb from '@/lib/pocketbase/client'

export const getLeads = () =>
  pb
    .collection('leads')
    .getFullList({ expand: 'consultor_id,cliente_id,servico_produto_id', sort: '-created' })

export const createLead = (data: any) => pb.collection('leads').create(data)

export const updateLead = (id: string, data: any) => pb.collection('leads').update(id, data)

export const deleteLead = (id: string) => pb.collection('leads').delete(id)

export const getEtapasFunil = () => pb.collection('etapas_funil').getFullList({ sort: 'ordem' })

export const getInteracoes = (leadId: string) =>
  pb
    .collection('interacoes_leads')
    .getFullList({ filter: `lead_id="${leadId}"`, sort: '-data_interacao', expand: 'usuario_id' })

export const createInteracao = (data: any) => pb.collection('interacoes_leads').create(data)

export const getDocumentos = (leadId: string) =>
  pb
    .collection('documentos_leads')
    .getFullList({ filter: `lead_id="${leadId}"`, sort: '-created', expand: 'usuario_id' })

export const createDocumento = (data: any) => pb.collection('documentos_leads').create(data)
