import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Wallet,
  PieChart,
  Settings,
  ShieldCheck,
  Building2,
  Activity,
  ChevronRight,
  Target,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

const navGroups = [
  {
    title: 'DASHBOARD',
    icon: LayoutDashboard,
    items: [
      { title: 'Visão Geral', url: '/dashboard' },
      { title: 'Dashboard Executivo', url: '/dashboard-avancado' },
    ],
  },
  {
    title: 'CRM',
    icon: Target,
    items: [
      { title: 'Funil de Vendas', url: '/crm/funil-vendas' },
      { title: 'Leads', url: '/crm/leads' },
    ],
  },
  {
    title: 'CADASTRO',
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
  {
    title: 'FINANCEIRO',
    icon: Wallet,
    items: [
      { title: 'Lançamentos', url: '/lancamentos' },
      { title: 'Contas a Receber', url: '/financeiro/contas-receber' },
      { title: 'Contas a Pagar', url: '/financeiro/contas-pagar' },
      { title: 'Recibos de Despesas', url: '/recibos-despesas' },
      { title: 'Contas Bancárias', url: '/cadastros/contas-bancarias' },
      { title: 'Cartões de Crédito', url: '/cadastros/cartoes-credito' },
    ],
  },
  {
    title: 'RELATÓRIOS',
    icon: PieChart,
    items: [
      { title: 'Visão Geral', url: '/relatorios' },
      { title: 'DRE', url: '/relatorios/dre' },
      { title: 'EBITDA', url: '/relatorios/ebitda' },
      { title: 'Fluxo de Caixa', url: '/relatorios/fluxo-caixa' },
      { title: 'Planejado x Realizado', url: '/relatorios/planejado-realizado' },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebarExpandedGroups')
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    localStorage.setItem('sidebarExpandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

  useEffect(() => {
    navGroups.forEach((group) => {
      if (group.items.some((item) => location.pathname === item.url)) {
        setExpandedGroups((prev) => ({ ...prev, [group.title]: true }))
      }
    })
  }, [location.pathname])

  const toggleGroup = (title: string) =>
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }))

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 mb-4 mt-2 text-primary font-bold text-[14px]">
            <Building2 className="h-6 w-6" />
            <span className="truncate">Gestão Financeira</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navGroups.map((group) => (
                <Collapsible
                  key={group.title}
                  open={expandedGroups[group.title]}
                  onOpenChange={() => toggleGroup(group.title)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={group.title} className="font-medium text-sm">
                        <group.icon />
                        <span>{group.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden transition-all duration-200 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === item.url}
                              className={cn(
                                location.pathname === item.url &&
                                  'bg-[#268C83] text-white hover:bg-[#268C83]/90 hover:text-white',
                              )}
                            >
                              <Link to={item.url}>{item.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}

              {user?.perfil === 'admin' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/usuarios'}
                      tooltip="Gestão de Usuários"
                    >
                      <Link to="/usuarios">
                        <ShieldCheck />
                        <span>Gestão de Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/diagnostico'}
                      tooltip="Diagnóstico"
                    >
                      <Link to="/diagnostico">
                        <Activity />
                        <span>Diagnóstico</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/configuracoes'}
                  tooltip="Configurações"
                >
                  <Link to="/configuracoes">
                    <Settings />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
