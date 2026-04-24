import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
        <footer className="border-t py-4 px-6 mt-auto text-center md:text-left bg-white dark:bg-background">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Trend Consultoria - CNPJ: 09.465.223/0001-07. Todos os
            direitos reservados.
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
