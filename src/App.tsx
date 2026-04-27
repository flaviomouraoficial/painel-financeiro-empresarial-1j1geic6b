import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import DashboardAvancado from './pages/DashboardAvancado'
import NotificacoesPage from './pages/Notificacoes'
import Cadastros from './pages/Cadastros'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import ContasReceber from './pages/ContasReceber'
import ContasPagar from './pages/ContasPagar'
import Relatorios from './pages/Relatorios'
import RelatoriosDre from './pages/RelatoriosDre'
import RelatoriosEbitda from './pages/RelatoriosEbitda'
import RelatoriosFluxoCaixa from './pages/RelatoriosFluxoCaixa'
import RelatoriosPlanejadoRealizado from './pages/RelatoriosPlanejadoRealizado'
import RecibosDespesas from './pages/RecibosDespesas'
import Funil from './pages/crm/Funil'
import DashboardVendas from './pages/crm/DashboardVendas'
import Leads from './pages/crm/Leads'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'
import ConfiguracoesSaldoInicial from './pages/ConfiguracoesSaldoInicial'
import Diagnostico from './pages/Diagnostico'
import DiagnosticoRecibos from './pages/DiagnosticoRecibos'
import Biblioteca from './pages/Biblioteca'
import Auditoria from './pages/Auditoria'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import LeadDetalhes from './pages/crm/LeadDetalhes'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/dashboard-avancado" element={<DashboardAvancado />} />
            <Route path="/notificacoes" element={<NotificacoesPage />} />
            <Route path="/cadastros/:tipo" element={<Cadastros />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
            <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
            <Route path="/contas/:tipo" element={<Contas />} />
            <Route path="/recibos-despesas" element={<RecibosDespesas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/relatorios/dre" element={<RelatoriosDre />} />
            <Route path="/relatorios/ebitda" element={<RelatoriosEbitda />} />
            <Route path="/relatorios/fluxo-caixa" element={<RelatoriosFluxoCaixa />} />
            <Route
              path="/relatorios/planejado-realizado"
              element={<RelatoriosPlanejadoRealizado />}
            />
            <Route path="/crm/dashboard-vendas" element={<DashboardVendas />} />
            <Route path="/crm/funil-vendas" element={<Funil />} />
            <Route path="/crm/funil" element={<Navigate to="/crm/funil-vendas" replace />} />
            <Route path="/crm/leads" element={<Leads />} />
            <Route path="/crm/leads/:id/detalhes" element={<LeadDetalhes />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/configuracoes/saldo-inicial" element={<ConfiguracoesSaldoInicial />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/diagnostico-recibos" element={<DiagnosticoRecibos />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/auditoria" element={<Auditoria />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
