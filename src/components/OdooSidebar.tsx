import { Users, Building2, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';

const menuItems = [
  {
    title: 'Contactos',
    url: '/odoo_pms/contactos',
    icon: Users,
  },
  {
    title: 'Propiedades',
    url: '/odoo_pms/propiedades',
    icon: Building2,
  },
  {
    title: 'Contratos de Alquiler',
    url: '/odoo_pms/contratos',
    icon: FileText,
  },
];

export function OdooSidebar() {
  const { state } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && <h2 className="font-semibold text-lg">Odoo PMS</h2>}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
