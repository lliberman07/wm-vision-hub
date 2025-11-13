import { NavLink, useLocation } from "react-router-dom";
import { MessageSquare, TrendingUp, FileText, Building, Users, Shield, ExternalLink } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  userRole?: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const wmFrontItems = [
    { title: "Contact Submissions", path: "/admin/contacts", icon: MessageSquare },
    { title: "Simulaciones", path: "/admin/simulations", icon: TrendingUp },
    { title: "Financing Applications", path: "/admin/applications", icon: FileText },
    { title: "AI Chatbot", path: "/admin/chatbot", icon: MessageSquare },
  ];

  // WM PMS items moved to Granada Admin

  const wmUsersItems = [
    { title: "User Approvals", path: "/admin/approvals", icon: Users },
    { title: "Admin Users", path: "/admin/admin-users", icon: Shield },
  ];

  const granadaItems = [
    { title: "Subscription Plans (Granada)", path: "/granada-admin/subscription-plans", icon: Building, external: true },
  ];

  const getNavClassName = (isActive: boolean) => 
    isActive 
      ? "bg-muted text-primary font-medium" 
      : "hover:bg-muted/50";

  const isItemActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        {/* WM Front Section */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>WM Front</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {wmFrontItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.path} 
                        className={({ isActive }) => getNavClassName(isActive)}
                      >
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


        {/* WM Users Admin Section - Only for superadmin */}
        {userRole === 'superadmin' && (
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>WM Users Admin</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {wmUsersItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.path} 
                          className={({ isActive }) => getNavClassName(isActive)}
                        >
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
        )}

        {/* Granada Platform Links */}
        {userRole === 'superadmin' && (
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>Granada Platform</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {granadaItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.path} 
                          className="hover:bg-muted/50"
                        >
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && (
                            <span className="flex items-center gap-1">
                              {item.title}
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
