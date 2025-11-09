import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Users, AlertTriangle, TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TenantLicense {
  id: string;
  name: string;
  tenant_type: string;
  current_users: number;
  max_users: number;
  usage_percentage: number;
  status: 'ok' | 'warning' | 'critical';
}

interface LicenseStats {
  total_tenants: number;
  total_licenses_used: number;
  total_licenses_available: number;
  tenants_at_limit: number;
  tenants_near_limit: number;
}

const COLORS = {
  ok: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
};

export function LicenseDashboardView() {
  const [tenantLicenses, setTenantLicenses] = useState<TenantLicense[]>([]);
  const [stats, setStats] = useState<LicenseStats>({
    total_tenants: 0,
    total_licenses_used: 0,
    total_licenses_available: 0,
    tenants_at_limit: 0,
    tenants_near_limit: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicenseData();
  }, []);

  const fetchLicenseData = async () => {
    try {
      setLoading(true);

      // Obtener todos los tenants activos
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('pms_tenants')
        .select('id, name, tenant_type, settings')
        .eq('is_active', true)
        .order('name');

      if (tenantsError) throw tenantsError;

      if (!tenantsData) {
        setTenantLicenses([]);
        return;
      }

      // Para cada tenant, obtener conteo de usuarios que consumen licencia
      const enrichedTenants = await Promise.all(
        tenantsData.map(async (tenant) => {
          // Obtener límite de usuarios
          const { data: maxUsers } = await supabase
            .rpc('get_tenant_user_limit', { tenant_id_param: tenant.id });

          // Obtener usuarios que consumen licencia
          const { data: currentUsers } = await supabase
            .rpc('get_tenant_consuming_users_count', { p_tenant_id: tenant.id });

          const current = currentUsers || 0;
          const max = maxUsers || 2;
          const usagePercentage = max > 0 ? (current / max) * 100 : 0;

          let status: 'ok' | 'warning' | 'critical' = 'ok';
          if (usagePercentage >= 100) {
            status = 'critical';
          } else if (usagePercentage >= 80) {
            status = 'warning';
          }

          return {
            id: tenant.id,
            name: tenant.name,
            tenant_type: tenant.tenant_type,
            current_users: current,
            max_users: max,
            usage_percentage: usagePercentage,
            status,
          };
        })
      );

      setTenantLicenses(enrichedTenants);

      // Calcular estadísticas globales
      const totalLicensesUsed = enrichedTenants.reduce((sum, t) => sum + t.current_users, 0);
      const totalLicensesAvailable = enrichedTenants.reduce((sum, t) => sum + t.max_users, 0);
      const tenantsAtLimit = enrichedTenants.filter(t => t.status === 'critical').length;
      const tenantsNearLimit = enrichedTenants.filter(t => t.status === 'warning').length;

      setStats({
        total_tenants: enrichedTenants.length,
        total_licenses_used: totalLicensesUsed,
        total_licenses_available: totalLicensesAvailable,
        tenants_at_limit: tenantsAtLimit,
        tenants_near_limit: tenantsNearLimit,
      });
    } catch (error: any) {
      console.error('Error fetching license data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de licencias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'ok' | 'warning' | 'critical') => {
    const config = {
      ok: { label: 'Normal', variant: 'default' as const, icon: CheckCircle2 },
      warning: { label: 'Advertencia', variant: 'outline' as const, icon: AlertTriangle },
      critical: { label: 'Límite', variant: 'destructive' as const, icon: AlertTriangle },
    };

    const { label, variant, icon: Icon } = config[status];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Datos para gráfico de barras
  const chartData = tenantLicenses.map(t => ({
    name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
    Usados: t.current_users,
    Disponibles: t.max_users - t.current_users,
    fullName: t.name,
  }));

  // Datos para gráfico de torta (distribución de estados)
  const pieData = [
    { name: 'Normal', value: tenantLicenses.filter(t => t.status === 'ok').length, color: COLORS.ok },
    { name: 'Advertencia', value: tenantLicenses.filter(t => t.status === 'warning').length, color: COLORS.warning },
    { name: 'Límite', value: tenantLicenses.filter(t => t.status === 'critical').length, color: COLORS.critical },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Licencias</h2>
        <p className="text-muted-foreground">
          Monitoreo del consumo de licencias por tenant
        </p>
      </div>

      {/* Alertas críticas */}
      {(stats.tenants_at_limit > 0 || stats.tenants_near_limit > 0) && (
        <Alert variant={stats.tenants_at_limit > 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.tenants_at_limit > 0 && (
              <span className="font-semibold">
                {stats.tenants_at_limit} tenant{stats.tenants_at_limit > 1 ? 's han' : ' ha'} alcanzado el límite de usuarios.
              </span>
            )}
            {stats.tenants_at_limit > 0 && stats.tenants_near_limit > 0 && ' '}
            {stats.tenants_near_limit > 0 && (
              <span>
                {stats.tenants_near_limit} tenant{stats.tenants_near_limit > 1 ? 's están' : ' está'} cerca del límite (≥80%).
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tenants}</div>
            <p className="text-xs text-muted-foreground">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias Usadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_licenses_used}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.total_licenses_available} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Límite</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.tenants_at_limit}</div>
            <p className="text-xs text-muted-foreground">
              Tenants al 100%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.tenants_near_limit}</div>
            <p className="text-xs text-muted-foreground">
              Tenants ≥80%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <Card>
          <CardHeader>
            <CardTitle>Uso de Licencias por Tenant</CardTitle>
            <CardDescription>
              Usuarios usados vs disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-primary">Usados: {payload[0].value}</p>
                          <p className="text-sm text-muted-foreground">Disponibles: {payload[1].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="Usados" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="Disponibles" stackId="a" fill="hsl(var(--muted))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de torta */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Tenants</CardTitle>
            <CardDescription>
              Distribución por nivel de uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Tenant</CardTitle>
          <CardDescription>
            Estado de consumo de licencias de cada tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantLicenses
              .sort((a, b) => b.usage_percentage - a.usage_percentage)
              .map((tenant) => (
                <div key={tenant.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.current_users} / {tenant.max_users} usuarios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {tenant.usage_percentage.toFixed(0)}%
                      </span>
                      {getStatusBadge(tenant.status)}
                    </div>
                  </div>
                  <Progress 
                    value={tenant.usage_percentage} 
                    className={`h-2 ${
                      tenant.status === 'critical' ? '[&>div]:bg-destructive' :
                      tenant.status === 'warning' ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-primary'
                    }`}
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
