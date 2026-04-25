import { useEffect, useState } from 'react'
import { getLeads } from '@/services/crm'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeadForm } from '@/components/crm/lead-form'
import { LeadDetails } from '@/components/crm/lead-details'
import { Plus } from 'lucide-react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)

  const loadData = async () => setLeads(await getLeads())

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', () => loadData())

  const openEdit = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLead(lead)
    setFormOpen(true)
  }

  const openDetails = (lead: any) => {
    setSelectedLead(lead)
    setDetailsOpen(true)
  }

  const handleNew = () => {
    setSelectedLead(null)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Gerencie seus contatos e prospecções</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Lead
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Etapa</th>
              <th className="px-4 py-3 font-medium">Temperatura</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => openDetails(lead)}
              >
                <td className="px-4 py-3 font-medium">{lead.nome_lead}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.empresa_lead || '-'}</td>
                <td className="px-4 py-3 capitalize">{lead.etapa}</td>
                <td className="px-4 py-3">
                  <Badge
                    className="border-none"
                    style={{
                      backgroundColor:
                        lead.temperatura === 'quente'
                          ? '#ef4444'
                          : lead.temperatura === 'morna'
                            ? '#f97316'
                            : '#3b82f6',
                      color: '#fff',
                    }}
                  >
                    {lead.temperatura || 'N/A'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(lead.valor_estimado)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={(e) => openEdit(lead, e)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum lead encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LeadForm
        lead={selectedLead}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadData}
      />
      <LeadDetails lead={selectedLead} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  )
}
