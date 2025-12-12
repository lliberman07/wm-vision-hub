import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  BarChart3,
  Shield,
  Wallet,
  FileBarChart,
  FileCheck,
  MessageSquare,
  Home,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GranadaAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/granada-admin',
  },
  {
    title: 'Analítica',
    icon: FileBarChart,
    path: '/granada-admin/analytics',
  },
  {
    title: 'Solicitudes',
    icon: FileCheck,
    path: '/granada-admin/subscription-requests',
  },
  {
    title: 'Contactos',
    icon: MessageSquare,
    path: '/granada-admin/contacts',
  },
  {
    title: 'Clientes',
    icon: Building2,
    path: '/granada-admin/subscriptions',
  },
  {
    title: 'Usuarios Clientes',
    icon: Users,
    path: '/granada-admin/client-users',
  },
  {
    title: 'Usuarios Granada',
    icon: Shield,
    path: '/granada-admin/platform-users',
  },
  {
    title: 'Planes',
    icon: CreditCard,
    path: '/granada-admin/subscription-plans',
  },
  {
    title: 'Pagos',
    icon: Wallet,
    path: '/granada-admin/payments',
  },
];

export function GranadaAdminLayout({ children }: GranadaAdminLayoutProps) {
  const navigate = useNavigate();
  const { user, granadaRole } = useGranadaAuth();
  const { isClientAdmin } = useClient();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error al cerrar sesión en servidor:', error.message);
      }
    } catch (error) {
      console.warn('Error inesperado al cerrar sesión:', error);
    } finally {
      // Limpiar tokens locales de Supabase por si el servidor devuelve session_not_found
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.removeItem('supabase.auth.token');
      } catch (storageError) {
        console.warn('Error limpiando storage de Supabase:', storageError);
      }

      // Redirigir y forzar recarga
      navigate('/granada-platform', { replace: true });
      setTimeout(() => {
        window.location.href = '/granada-platform';
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Granada Platform</h1>
              <p className="text-xs text-muted-foreground">Panel de Administración</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path;
              
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
              <h2 className="text-2xl font-bold">Granada Admin</h2>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden lg:inline">
                      {user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs font-semibold text-destructive uppercase">
                        {granadaRole}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/pms')}>
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard PMS
                  </DropdownMenuItem>
                  {isClientAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/client-admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Panel de Cliente
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/granada-admin/change-password')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </DropdownMenuItem>
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
