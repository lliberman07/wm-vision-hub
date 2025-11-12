import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileBarChart, Building2, Users, DollarSign, Home } from 'lucide-react';

interface GlobalStats {
  totalClients: number;
  totalUsers: number;
  totalProperties: number;
  totalActiveContracts: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export function GlobalReports() {
  const [stats, setStats] = useState<GlobalStats>({
    totalClients: 0,
    totalUsers: 0,
    totalProperties: 0,
    totalActiveContracts: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch total clients
      const { count: clientsCount } = await supabase
        .from('pms_tenants')
        .select('*', { count: 'exact', head: true });

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('pms_client_users')
        .select('*', { count: 'exact', head: true });

      // Fetch total properties
      const { count: propertiesCount } = await supabase
        .from('pms_properties')
        .select('*', { count: 'exact', head: true });

      // Fetch active contracts
      const { count: contractsCount } = await supabase
        .from('pms_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch active subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('pms_tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trial']);

      // Fetch total revenue (last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data: paymentsData } = await supabase
        .from('pms_subscription_payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', oneYearAgo.toISOString());

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalClients: clientsCount || 0,
        totalUsers: usersCount || 0,
        totalProperties: propertiesCount || 0,
        totalActiveContracts: contractsCount || 0,
        totalRevenue,
        activeSubscriptions: subscriptionsCount || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las estadísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Reportes Globales del Sistema
          </CardTitle>
          <CardDescription>
            Métricas y estadísticas generales de Granada Platform
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Planes activos y en prueba
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Propiedades gestionadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveContracts}</div>
            <p className="text-xs text-muted-foreground">
              Contratos vigentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Anuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 12 meses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
