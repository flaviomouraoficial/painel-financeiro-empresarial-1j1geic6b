import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-secondary dark:bg-background">
        <AppHeader />
        <div className="flex flex-col items-center w-full">
          <main className="w-full max-w-[1200px] flex-1 p-[24px] animate-fade-in duration-300">
            <Outlet />
          </main>
        </div>
        <footer className="border-t border-border py-4 px-[24px] mt-auto text-center md:text-left bg-card dark:bg-background w-full">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Trend Consultoria - CNPJ: 09.465.223/0001-07. Todos os
            direitos reservados.
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
