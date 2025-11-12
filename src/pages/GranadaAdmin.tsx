import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GranadaAdminLayout } from '@/components/granada/GranadaAdminLayout';
import { ClientsManagement } from '@/components/granada/ClientsManagement';
import { ClientUsersManagement } from '@/components/granada/ClientUsersManagement';
import { PlatformUsersManagement } from '@/components/granada/PlatformUsersManagement';
import { SubscriptionsManagement } from '@/components/granada/SubscriptionsManagement';
import { PaymentsManagement } from '@/components/granada/PaymentsManagement';
import { SubscriptionPlansManagement } from '@/components/granada/SubscriptionPlansManagement';
import {
  Building2,
  CreditCard,
  FileBarChart,
  Users,
  ArrowLeftRight,
} from 'lucide-react';

function GranadaDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Clientes Suscriptores',
      description: 'Gestionar inmobiliarias, administradores y propietarios',
      icon: Building2,
      path: '/granada-admin/clients',
    },
    {
      title: 'Usuarios de Clientes',
      description: 'Administrar usuarios CLIENT_ADMIN, PROPIETARIO e INQUILINO',
      icon: Users,
      path: '/granada-admin/client-users',
    },
    {
      title: 'Usuarios Granada',
      description: 'Administradores de la plataforma',
      icon: Users,
      path: '/granada-admin/platform-users',
    },
    {
      title: 'Planes',
      description: 'Gestionar planes de suscripción',
      icon: CreditCard,
      path: '/granada-admin/subscription-plans',
    },
    {
      title: 'Suscripciones',
      description: 'Administrar suscripciones de clientes',
      icon: CreditCard,
      path: '/granada-admin/subscriptions',
    },
    {
      title: 'Pagos',
      description: 'Historial de pagos',
      icon: CreditCard,
      path: '/granada-admin/payments',
    },
    {
      title: 'Reportes Globales',
      description: 'Estadísticas y métricas del sistema',
      icon: FileBarChart,
      path: '/granada-admin/reports',
    },
    {
      title: 'Transferencias',
      description: 'Gestionar transferencias de propiedades',
      icon: ArrowLeftRight,
      path: '/granada-admin/transfers',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Panel de control de Granada Platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.path} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(card.path)}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{card.title}</CardTitle>
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Ver
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function GranadaAdmin() {
  const navigate = useNavigate();
  const { user, isGranadaAdmin, loading } = useGranadaAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pms/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isGranadaAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos de administrador de Granada Platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pms')} className="w-full">
              Volver al PMS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <GranadaAdminLayout>
      <Routes>
        <Route path="/" element={<GranadaDashboard />} />
        <Route path="/clients" element={<ClientsManagement />} />
        <Route path="/client-users" element={<ClientUsersManagement />} />
        <Route path="/platform-users" element={<PlatformUsersManagement />} />
        <Route path="/subscription-plans" element={<SubscriptionPlansManagement />} />
        <Route path="/subscriptions" element={<SubscriptionsManagement />} />
        <Route path="/payments" element={<PaymentsManagement />} />
        <Route path="/reports" element={<div className="p-4">Reportes (próximamente)</div>} />
        <Route path="/transfers" element={<div className="p-4">Transferencias (próximamente)</div>} />
        <Route path="/settings" element={<div className="p-4">Configuración (próximamente)</div>} />
      </Routes>
    </GranadaAdminLayout>
  );
}
