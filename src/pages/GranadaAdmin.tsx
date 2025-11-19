import { useEffect } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GranadaAdminLayout } from '@/components/granada/GranadaAdminLayout';
import { ClientsManagement } from '@/components/granada/ClientsManagement';
import { ClientUsersManagement } from '@/components/granada/ClientUsersManagement';
import { PlatformUsersManagement } from '@/components/granada/PlatformUsersManagement';
import { UnifiedSubscriptionsManagement } from '@/components/granada/UnifiedSubscriptionsManagement';
import { PaymentsManagement } from '@/components/granada/PaymentsManagement';
import { PaymentReceiptsVerification } from '@/components/granada/PaymentReceiptsVerification';
import { SubscriptionPlansManagement } from '@/components/granada/SubscriptionPlansManagement';
import { GranadaSubscriptionAnalyticsDashboard } from '@/components/granada/GranadaSubscriptionAnalyticsDashboard';
import { GranadaContactsManagement } from '@/components/granada/GranadaContactsManagement';
import { SubscriptionRequestsManagement } from '@/components/granada/SubscriptionRequestsManagement';
import {
  Building2,
  CreditCard,
  FileBarChart,
  Users,
  ArrowLeftRight,
  MessageSquare,
  FileCheck,
  Receipt,
} from 'lucide-react';

function GranadaDashboard() {
  const navigate = useNavigate();

  // Colores del logo de Granada
  const granadaColors = [
    'text-[#B91C1C]', // Rojo
    'text-[#1E3A8A]', // Azul marino
    'text-[#B8860B]', // Dorado
    'text-[#64748B]', // Gris azulado
  ];

  const cards = [
    {
      title: 'Analítica de Suscripciones',
      description: 'MRR, ARR, churn rate y proyecciones anuales',
      icon: FileBarChart,
      path: '/granada-admin/analytics',
      iconColor: granadaColors[0],
    },
    {
      title: 'Contactos',
      description: 'Gestionar consultas y leads de Granada Platform',
      icon: MessageSquare,
      path: '/granada-admin/contacts',
      iconColor: granadaColors[1],
    },
    {
      title: 'Solicitudes de Suscripción',
      description: 'Aprobar y gestionar nuevas solicitudes de suscripción',
      icon: FileCheck,
      path: '/granada-admin/subscription-requests',
      iconColor: granadaColors[2],
    },
    {
      title: 'Clientes Suscriptores',
      description: 'Gestionar inmobiliarias, administradores y propietarios',
      icon: Building2,
      path: '/granada-admin/clients',
      iconColor: granadaColors[3],
    },
    {
      title: 'Usuarios de Clientes',
      description: 'Administrar usuarios CLIENT_ADMIN, PROPIETARIO e INQUILINO',
      icon: Users,
      path: '/granada-admin/client-users',
      iconColor: granadaColors[0],
    },
    {
      title: 'Usuarios Granada',
      description: 'Administradores de la plataforma',
      icon: Users,
      path: '/granada-admin/platform-users',
      iconColor: granadaColors[1],
    },
    {
      title: 'Planes',
      description: 'Gestionar planes de suscripción',
      icon: CreditCard,
      path: '/granada-admin/subscription-plans',
      iconColor: granadaColors[2],
    },
    {
      title: 'Suscripciones',
      description: 'Gestión integral de suscripciones, trials y cambios',
      icon: CreditCard,
      path: '/granada-admin/subscriptions',
      iconColor: granadaColors[3],
    },
    {
      title: 'Pagos',
      description: 'Historial de pagos',
      icon: CreditCard,
      path: '/granada-admin/payments',
      iconColor: granadaColors[0],
    },
    {
      title: 'Verificar Comprobantes',
      description: 'Revisar y verificar comprobantes de pago',
      icon: Receipt,
      path: '/granada-admin/payment-receipts',
      iconColor: granadaColors[1],
    },
    {
      title: 'Reportes Globales',
      description: 'Estadísticas y métricas del sistema',
      icon: FileBarChart,
      path: '/granada-admin/reports',
      iconColor: granadaColors[1],
    },
    {
      title: 'Transferencias',
      description: 'Gestionar transferencias de propiedades',
      icon: ArrowLeftRight,
      path: '/granada-admin/transfers',
      iconColor: granadaColors[2],
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
            <Card key={card.path} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => navigate(card.path)}
                  className="bg-destructive hover:bg-destructive/90 px-3 w-auto"
                  size="sm"
                >
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/granada-platform');
  };

  if (loading) {
    return (
      <div className="granada-theme flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="granada-theme flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Requerido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para acceder al panel de administración de Granada Platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/granada-admin/login">Iniciar Sesión Admin</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/granada-platform">Volver a Granada Platform</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isGranadaAdmin) {
    return (
      <div className="granada-theme flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de administración de Granada Platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este panel es exclusivo para administradores de la plataforma. Si necesitas acceso como cliente, 
              dirígete al panel PMS.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/granada-platform">Granada Platform</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/pms/login">Acceso PMS Clientes</Link>
              </Button>
              <Button className="w-full" onClick={handleSignOut}>
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="granada-theme">
      <GranadaAdminLayout>
      <Routes>
        <Route path="/" element={<GranadaDashboard />} />
        <Route path="/analytics" element={<GranadaSubscriptionAnalyticsDashboard />} />
        <Route path="/subscription-requests" element={<SubscriptionRequestsManagement />} />
        <Route path="/contacts" element={<GranadaContactsManagement />} />
        <Route path="/clients" element={<ClientsManagement />} />
        <Route path="/client-users" element={<ClientUsersManagement />} />
        <Route path="/platform-users" element={<PlatformUsersManagement />} />
        <Route path="/subscription-plans" element={<SubscriptionPlansManagement />} />
        <Route path="/subscriptions" element={<UnifiedSubscriptionsManagement />} />
        <Route path="/payments" element={<PaymentsManagement />} />
        <Route path="/payment-receipts" element={<PaymentReceiptsVerification />} />
        <Route path="/reports" element={<div className="p-4">Reportes (próximamente)</div>} />
        <Route path="/transfers" element={<div className="p-4">Transferencias (próximamente)</div>} />
        <Route path="/settings" element={<div className="p-4">Configuración (próximamente)</div>} />
      </Routes>
    </GranadaAdminLayout>
    </div>
  );
}
