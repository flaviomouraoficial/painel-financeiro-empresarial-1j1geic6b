import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { InitialBalanceModal } from './InitialBalanceModal'
import { ForcePasswordChangeModal } from './ForcePasswordChangeModal'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-secondary dark:bg-background">
        <AppHeader />
        <InitialBalanceModal />
        <ForcePasswordChangeModal />
        <div className="hidden print:flex flex-col gap-1 mb-4 border-b-2 border-[#268C83] pb-4 px-4 mt-4 w-full max-w-[1200px] mx-auto">
          <h1 className="text-lg font-bold text-[#268C83] uppercase m-0">Trend Consultoria LTDA</h1>
          <p className="text-xs font-semibold text-gray-600 m-0">CNPJ: 09.465.223/0001-07</p>
        </div>
        <div className="flex flex-col items-center w-full">
          <main className="w-full max-w-[1200px] flex-1 p-[24px] print:p-0 print:pt-4 animate-fade-in duration-300">
            <Outlet />
          </main>
        </div>
        <footer className="border-t border-border py-4 px-[24px] mt-auto text-center md:text-left bg-card dark:bg-background w-full no-print">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Trend Consultoria - CNPJ: 09.465.223/0001-07. Todos os
            direitos reservados.
          </p>
        </footer>
        <div className="hidden print:block fixed bottom-0 left-0 w-full text-center text-[10px] text-gray-400 py-2 border-t bg-white">
          Gerado em {new Date().toLocaleString('pt-BR')} por Trend Consultoria - Relatório gerado
          automaticamente pelo sistema de gestão financeira.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
