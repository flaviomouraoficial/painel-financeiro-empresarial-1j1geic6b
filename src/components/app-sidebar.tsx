import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  ArrowRightLeft,
  PieChart,
  Settings,
  ShieldCheck,
  Building2,
  Wallet,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/' },
  {
    title: 'Cadastros',
    icon: Users,
    items: [
      { title: 'Clientes', url: '/cadastros/clientes' },
      { title: 'Fornecedores', url: '/cadastros/fornecedores' },
      { title: 'Produtos/Serviços', url: '/cadastros/produtos' },
      { title: 'Contas Bancárias', url: '/cadastros/contas-bancarias' },
    ],
  },
  { title: 'Lançamentos', icon: ArrowRightLeft, url: '/lancamentos' },
  {
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { title: 'Contas a Receber', url: '/contas/receber' },
      { title: 'Contas a Pagar', url: '/contas/pagar' },
    ],
  },
  { title: 'Relatórios', icon: PieChart, url: '/relatorios' },
  { title: 'Gestão de Usuários', icon: ShieldCheck, url: '/usuarios' },
  { title: 'Configurações', icon: Settings, url: '/configuracoes' },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 mb-4 mt-2 text-primary font-bold text-[14px]">
            <Building2 className="h-6 w-6" />
            <span className="truncate">Trend Consultoria</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton tooltip={item.title} asChild>
                        <span className="cursor-pointer font-medium">
                          <item.icon />
                          <span>{item.title}</span>
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                            >
                              <Link to={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
