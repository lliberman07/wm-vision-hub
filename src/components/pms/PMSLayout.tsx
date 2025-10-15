import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PMSSidebar } from './PMSSidebar';
import { PMSBreadcrumbs } from './PMSBreadcrumbs';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePMS } from '@/contexts/PMSContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useContractMaintenanceCheck } from '@/hooks/useContractMaintenanceCheck';

interface PMSLayoutProps {
  children: ReactNode;
}

export function PMSLayout({ children }: PMSLayoutProps) {
  const { user } = useAuth();
  const { currentTenant, pmsRoles } = usePMS();
  const navigate = useNavigate();
  
  // Run automatic contract maintenance checks
  useContractMaintenanceCheck();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada correctamente');
    navigate('/pms-login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SidebarProvider defaultOpen>
        <div className="flex flex-1 w-full">
          <PMSSidebar />
          
          <main className="flex-1 flex flex-col">
            {/* PMS Header */}
            <header className="sticky top-0 z-50 bg-background border-b">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  
                  {/* Tenant Info */}
                  <div className="hidden md:block">
                    <h2 className="text-lg font-semibold leading-tight">
                      {currentTenant?.name || 'WM Admin Prop'}
                    </h2>
                    <p className="text-xs text-muted-foreground">Sistema PMS</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Breadcrumbs - middle section */}
                  <PMSBreadcrumbs />
                  
                  <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                        3
                      </span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2">
                          <User className="h-4 w-4" />
                          <span className="hidden lg:inline">
                            {user?.email?.split('@')[0] || 'Usuario'}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">{currentTenant?.name}</p>
                            <div className="flex gap-1 mt-1">
                              {pmsRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/pms')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar Sesión
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Content */}
            <div className="flex-1">
              {children}
            </div>

            {/* PMS Footer */}
            <footer className="border-t bg-background py-4 mt-auto">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                  <p>© 2025 WM Admin Prop - Sistema de Gestión Inmobiliaria</p>
                  <div className="flex gap-4">
                    <button className="hover:text-foreground transition-colors">
                      Soporte
                    </button>
                    <button className="hover:text-foreground transition-colors">
                      Documentación
                    </button>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
