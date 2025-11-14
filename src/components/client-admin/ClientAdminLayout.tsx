import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  LogOut,
  UserCircle,
  LayoutDashboard,
  CreditCard,
  FileBarChart,
  Settings,
  Home,
  BarChart3,
  DollarSign,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ClientAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/client-admin',
  },
  {
    title: 'Analíticas',
    icon: BarChart3,
    path: '/client-admin/analytics',
  },
  {
    title: 'Usuarios',
    icon: Users,
    path: '/client-admin/users',
  },
  {
    title: 'Suscripción',
    icon: CreditCard,
    path: '/client-admin/subscription',
  },
  {
    title: 'Comisiones',
    icon: DollarSign,
    path: '/client-admin/commissions',
  },
  {
    title: 'Reportes',
    icon: FileBarChart,
    path: '/client-admin/reports',
  },
  {
    title: 'Configuración',
    icon: Settings,
    path: '/client-admin/settings',
  },
];

export function ClientAdminLayout({ children }: ClientAdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { clientData, subscription } = useClient();
  const { isGranadaAdmin } = useGranadaAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/pms/login');
  };

  const getStatusBadge = () => {
    if (!subscription) return null;
    
    const statusConfig: Record<string, { label: string; variant: any }> = {
      active: { label: 'Activa', variant: 'default' },
      trial: { label: 'Prueba', variant: 'secondary' },
      expired: { label: 'Vencida', variant: 'destructive' },
      suspended: { label: 'Suspendida', variant: 'destructive' },
    };

    const config = statusConfig[subscription.status] || { label: subscription.status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{clientData?.name || 'Mi Organización'}</h1>
              <p className="text-xs text-muted-foreground">Panel de Administración</p>
            </div>
          </div>
          
          {subscription && (
            <div className="mb-6 mt-2">
              {getStatusBadge()}
            </div>
          )}

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h2 className="text-2xl font-bold">Admin Panel</h2>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/pms')}>
                <Home className="h-4 w-4 mr-2" />
                Acceso al PMS
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.email}
                    <div className="text-xs text-muted-foreground font-normal">
                      CLIENT_ADMIN
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/pms')}>
                    <Home className="h-4 w-4 mr-2" />
                    Acceso al PMS
                  </DropdownMenuItem>
                  {isGranadaAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/granada-admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Granada Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
