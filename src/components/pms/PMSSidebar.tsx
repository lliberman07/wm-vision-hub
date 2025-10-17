import { Building2, Users, FileText, Wrench, DollarSign, BarChart3, UserSquare2, Receipt, TrendingUp } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePMS } from '@/contexts/PMSContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import wmLogo from '@/assets/wm-logo.svg';

const menuItems = [
  {
    group: 'Gestión',
    items: [
      { title: 'Propiedades', url: '/pms/properties', icon: Building2 },
      { title: 'Propietarios', url: '/pms/owners', icon: UserSquare2 },
      { title: 'Inquilinos', url: '/pms/tenants', icon: Users },
    ]
  },
  {
    group: 'Operaciones',
    items: [
      { title: 'Contratos', url: '/pms/contracts', icon: FileText },
      { title: 'Pagos', url: '/pms/payments', icon: DollarSign },
      { title: 'Gastos', url: '/pms/expenses', icon: Receipt },
    ]
  },
  {
    group: 'Mantenimiento',
    items: [
      { title: 'Solicitudes', url: '/pms/maintenance', icon: Wrench },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { title: 'Reportes', url: '/pms/reports', icon: BarChart3 },
      { title: 'Índices', url: '/pms/indices', icon: TrendingUp },
    ]
  }
];

export function PMSSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { currentTenant, pmsRoles, activeRoleContext } = usePMS();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';
  const activeRole = activeRoleContext?.role;

  const isActive = (path: string) => currentPath === path;

  // Define which modules each role can see
  const modulesByRole: Record<string, string[]> = {
    SUPERADMIN: ['all'],
    INMOBILIARIA: ['properties', 'owners', 'tenants', 'contracts', 'payments', 'expenses', 'maintenance', 'reports', 'indices'],
    ADMINISTRADOR: ['properties', 'owners', 'tenants', 'contracts', 'payments', 'expenses', 'maintenance', 'reports'],
    PROPIETARIO: ['properties', 'contracts', 'payments', 'expenses', 'reports'],
    INQUILINO: ['contracts', 'payments', 'expenses', 'maintenance'],
    PROVEEDOR: ['maintenance']
  };

  const visibleModules = activeRole ? (modulesByRole[activeRole] || []) : [];

  // Filter menu items based on active role
  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (visibleModules.includes('all')) return true;
      const moduleKey = item.url.split('/').pop() || '';
      return visibleModules.includes(moduleKey);
    })
  })).filter(section => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 border-b">
        {/* Header sin logo */}
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {!isCollapsed && <SidebarGroupLabel>{section.group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={item.url}>
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {!isCollapsed && activeRoleContext && (
          <Badge variant="secondary" className="text-xs font-mono">
            {activeRoleContext.role}
          </Badge>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
