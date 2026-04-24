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
  Activity,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

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
      { title: 'Categorias', url: '/cadastros/categorias' },
      { title: 'Centros de Custo', url: '/cadastros/centros-custo' },
      { title: 'Projetos', url: '/cadastros/projetos' },
    ],
  },
  { title: 'Lançamentos', icon: ArrowRightLeft, url: '/lancamentos' },
  {
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { title: 'Contas a Receber', url: '/contas/receber' },
      { title: 'Contas a Pagar', url: '/contas/pagar' },
      { title: 'Recibos de Despesas', url: '/recibos-despesas' },
      { title: 'Contas Bancárias', url: '/cadastros/contas-bancarias' },
      { title: 'Cartões de Crédito', url: '/cadastros/cartoes-credito' },
    ],
  },
  {
    title: 'Relatórios',
    icon: PieChart,
    items: [
      { title: 'Visão Geral', url: '/relatorios' },
      { title: 'DRE', url: '/relatorios/dre' },
      { title: 'EBITDA', url: '/relatorios/ebitda' },
      { title: 'Fluxo de Caixa', url: '/relatorios/fluxo-caixa' },
      { title: 'Planejado x Realizado', url: '/relatorios/planejado-realizado' },
    ],
  },
  { title: 'Gestão de Usuários', icon: ShieldCheck, url: '/usuarios' },
  { title: 'Configurações', icon: Settings, url: '/configuracoes' },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const itemsToRender = navItems.filter((item) => {
    if (item.title === 'Gestão de Usuários' && user?.perfil !== 'admin') return false
    return true
  })

  if (user?.perfil === 'admin') {
    itemsToRender.push({
      title: 'Diagnóstico',
      icon: Activity,
      url: '/diagnostico',
    })
  }

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
              {itemsToRender.map((item) => (
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
