import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Users, FileText, Wrench, DollarSign, BarChart3, UserSquare2, Receipt } from 'lucide-react';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { DashboardKPIs } from '@/components/pms/DashboardKPIs';
import { ModuleCard } from '@/components/pms/ModuleCard';

const PMS = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPMSAccess, pmsRoles, currentTenant, loading: pmsLoading, allRoleContexts, activeRoleContext } = usePMS();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/pms/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || pmsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPMSAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso al PMS Requerido</CardTitle>
            <CardDescription>
              No tienes acceso al sistema de gestión de propiedades. 
              Solicita acceso a un administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pms/request-access')} className="w-full">
              Solicitar Acceso
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modules = [
    {
      title: 'Propiedades',
      description: 'Administra el portafolio de propiedades',
      icon: Building2,
      route: '/pms/properties',
      gradient: 'from-primary/10 to-primary/20',
    },
    {
      title: 'Propietarios',
      description: 'Administra información de propietarios',
      icon: UserSquare2,
      route: '/pms/owners',
      gradient: 'from-success/10 to-success/20',
    },
    {
      title: 'Inquilinos',
      description: 'Administra información de inquilinos',
      icon: Users,
      route: '/pms/tenants',
      gradient: 'from-accent/10 to-accent/20',
    },
    {
      title: 'Contratos',
      description: 'Crea y administra contratos de alquiler',
      icon: FileText,
      route: '/pms/contracts',
      gradient: 'from-warning/10 to-warning/20',
    },
    {
      title: 'Pagos',
      description: 'Controla pagos y vencimientos',
      icon: DollarSign,
      route: '/pms/payments',
      gradient: 'from-primary/10 to-accent/20',
    },
    {
      title: 'Gastos',
      description: 'Gestiona gastos de propiedades',
      icon: Receipt,
      route: '/pms/expenses',
      gradient: 'from-destructive/10 to-destructive/20',
    },
    {
      title: 'Mantenimiento',
      description: 'Gestiona solicitudes de mantenimiento',
      icon: Wrench,
      route: '/pms/maintenance',
      gradient: 'from-success/10 to-primary/20',
    },
    {
      title: 'Reportes',
      description: 'Visualiza métricas del negocio',
      icon: BarChart3,
      route: '/pms/reports',
      gradient: 'from-accent/10 to-success/20',
    },
  ];

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs */}
        <DashboardKPIs />

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Módulos del Sistema</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.title}
                title={module.title}
                description={module.description}
                icon={module.icon}
                onClick={() => navigate(module.route)}
                gradient={module.gradient}
              />
            ))}
          </div>
        </div>
      </div>
    </PMSLayout>
  );
};

export default PMS;
