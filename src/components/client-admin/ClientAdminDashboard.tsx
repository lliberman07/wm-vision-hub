import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, FileText, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  total_propietarios: number;
  total_inquilinos: number;
  total_properties: number;
  total_active_contracts: number;
  pending_payments: number;
  monthly_revenue: number;
}

export function ClientAdminDashboard() {
  const { clientData, subscription } = useClient();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [clientData]);

  const loadStats = async () => {
    if (!clientData) return;

    try {
      const { data, error } = await supabase.rpc('get_client_statistics' as any, {
        p_tenant_id: clientData.id
      });

      if (error) throw error;
      setStats(data as Stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.is_trial || !subscription?.trial_end_date) return null;
    const daysLeft = Math.ceil((new Date(subscription.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const trialDays = getTrialDaysRemaining();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Warning */}
      {trialDays !== null && trialDays <= 7 && (
        <Alert variant={trialDays <= 3 ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu período de prueba vence en {trialDays} días. 
            <Button variant="link" onClick={() => navigate('/client-admin/subscription')} className="ml-2">
              Ver planes
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Resumen de tu organización</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_propietarios || 0}</div>
            <p className="text-xs text-muted-foreground">Usuarios PROPIETARIO activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquilinos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_inquilinos || 0}</div>
            <p className="text-xs text-muted-foreground">Usuarios INQUILINO activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_properties || 0}</div>
            <p className="text-xs text-muted-foreground">Total gestionadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_active_contracts || 0}</div>
            <p className="text-xs text-muted-foreground">Vigentes actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_payments || 0}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.monthly_revenue || 0).toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-muted-foreground">Pagos recibidos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Acciones frecuentes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button onClick={() => navigate('/client-admin/users')} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Gestionar Usuarios
          </Button>
          <Button onClick={() => navigate('/client-admin/subscription')} variant="outline" className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Ver Suscripción
          </Button>
          <Button onClick={() => navigate('/client-admin/reports')} variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Descargar Reportes
          </Button>
          <Button onClick={() => navigate('/client-admin/settings')} variant="outline" className="w-full">
            <Building2 className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
