import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
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
    title: 'Clientes',
    icon: Building2,
    path: '/granada-admin/clients',
  },
  {
    title: 'Usuarios Clientes',
    icon: Users,
    path: '/granada-admin/client-users',
  },
  {
    title: 'Usuarios Granada',
    icon: Users,
    path: '/granada-admin/platform-users',
  },
  {
    title: 'Planes',
    icon: Users,
    path: '/granada-admin/subscription-plans',
  },
  {
    title: 'Suscripciones',
    icon: Users,
    path: '/granada-admin/subscriptions',
  },
  {
    title: 'Pagos',
    icon: Users,
    path: '/granada-admin/payments',
  },
];

export function GranadaAdminLayout({ children }: GranadaAdminLayoutProps) {
  const navigate = useNavigate();
  const { user, granadaRole } = useGranadaAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/pms/login');
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
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.email}
                    <div className="text-xs text-muted-foreground font-normal">
                      {granadaRole}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/pms')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Ir al PMS
                  </DropdownMenuItem>
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
