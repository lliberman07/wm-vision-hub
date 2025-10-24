import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Users, Home, UserCheck, FileText 
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// TIPOS
interface KPIData {
  total_inmobiliarias: number;
  total_administradores: number;
  total_propietarios_tenants: number;
  total_propietarios_individuales: number;
  total_properties: number;
  total_inquilinos: number;
  shared_properties: number;
  full_ownership_properties: number;
}

interface TenantRoleDistribution {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  max_users: string | null;
  inmobiliarias: number;
  administradores: number;
  propietarios: number;
  inquilinos: number;
  proveedores: number;
  total_users: number;
}

interface PropertyAnalysis {
  tenant_id: string;
  tenant_name: string;
  total_properties: number;
  full_ownership_properties: number;
  shared_properties: number;
  unique_owners: number;
  avg_ownership_percentage: number;
}

interface ContractActivity {
  tenant_id: string;
  tenant_name: string;
  active_contracts: number;
  expired_contracts: number;
  cancelled_contracts: number;
  renewal_contracts: number;
  active_tenants: number;
}

interface TenantGrowth {
  month: string;
  tenant_type: string;
  count: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function TenantsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<TenantRoleDistribution[]>([]);
  const [propertyAnalysis, setPropertyAnalysis] = useState<PropertyAnalysis[]>([]);
  const [contractActivity, setContractActivity] = useState<ContractActivity[]>([]);
  const [tenantGrowth, setTenantGrowth] = useState<TenantGrowth[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchRoleDistribution(),
        fetchPropertyAnalysis(),
        fetchContractActivity(),
        fetchTenantGrowth(),
      ]);
    } catch (error) {
      console.error('Error fetching tenants analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    const { data, error } = await supabase.rpc('get_tenants_kpis');
    if (!error && data && data.length > 0) setKpis(data[0]);
  };

  const fetchRoleDistribution = async () => {
    const { data, error } = await supabase.rpc('get_role_distribution_by_tenant');
    if (!error && data) setRoleDistribution(data);
  };

  const fetchPropertyAnalysis = async () => {
    const { data, error } = await supabase.rpc('get_property_analysis_by_tenant');
    if (!error && data) setPropertyAnalysis(data);
  };

  const fetchContractActivity = async () => {
    const { data, error } = await supabase.rpc('get_contract_activity_by_tenant');
    if (!error && data) setContractActivity(data);
  };

  const fetchTenantGrowth = async () => {
    const { data, error } = await supabase.rpc('get_tenant_growth_over_time');
    if (!error && data) setTenantGrowth(data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const usersByRoleData = [
    { role: 'Inmobiliarias', count: kpis?.total_inmobiliarias || 0 },
    { role: 'Administradores', count: kpis?.total_administradores || 0 },
    { role: 'Propietarios', count: kpis?.total_propietarios_individuales || 0 },
    { role: 'Inquilinos', count: kpis?.total_inquilinos || 0 },
  ];

  const tenantDistributionData = [
    { name: 'Inmobiliarias', value: kpis?.total_inmobiliarias || 0 },
    { name: 'Propietarios', value: kpis?.total_propietarios_tenants || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Visión General del Sistema</CardTitle>
          <CardDescription>
            Métricas principales del sistema de gestión de propiedades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Inmobiliarias</TableHead>
                <TableHead className="text-center">Administradores</TableHead>
                <TableHead className="text-center">Propietarios (Tenants)</TableHead>
                <TableHead className="text-center">Propietarios Individuales</TableHead>
                <TableHead className="text-center">Propiedades</TableHead>
                <TableHead className="text-center">Inquilinos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_inmobiliarias || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_administradores || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_propietarios_tenants || 0}</span>
                    <Badge variant="secondary" className="text-xs">Organizaciones</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_propietarios_individuales || 0}</span>
                    <Badge variant="secondary" className="text-xs">Individuales</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_properties || 0}</span>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {kpis?.full_ownership_properties || 0} únicas
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {kpis?.shared_properties || 0} compartidas
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{kpis?.total_inquilinos || 0}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECCIÓN 2: TABLAS DETALLADAS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Análisis Detallado por Tenant</h2>

        {/* Tabla 1: Distribución de Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Roles por Tenant</CardTitle>
            <CardDescription>
              Usuarios activos agrupados por tipo de rol en cada organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Inmobiliarias</TableHead>
                  <TableHead className="text-center">Admins</TableHead>
                  <TableHead className="text-center">Propietarios</TableHead>
                  <TableHead className="text-center">Inquilinos</TableHead>
                  <TableHead className="text-center">Proveedores</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Límite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleDistribution.map((tenant) => {
                  const maxUsers = tenant.max_users ? parseInt(tenant.max_users) : null;
                  const isAtLimit = maxUsers && tenant.total_users >= maxUsers;
                  
                  return (
                    <TableRow key={tenant.tenant_id}>
                      <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.tenant_type === 'inmobiliaria' ? 'default' : 'secondary'}>
                          {tenant.tenant_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{tenant.inmobiliarias}</TableCell>
                      <TableCell className="text-center">{tenant.administradores}</TableCell>
                      <TableCell className="text-center">{tenant.propietarios}</TableCell>
                      <TableCell className="text-center">{tenant.inquilinos}</TableCell>
                      <TableCell className="text-center">{tenant.proveedores}</TableCell>
                      <TableCell className="text-center font-bold">{tenant.total_users}</TableCell>
                      <TableCell className="text-center">
                        {maxUsers ? (
                          <Badge variant={isAtLimit ? 'destructive' : 'outline'}>
                            {maxUsers}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla 2: Análisis de Propiedades */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Propiedades por Tenant</CardTitle>
            <CardDescription>
              Distribución de propiedades y ownership por organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-center">Propiedades Totales</TableHead>
                  <TableHead className="text-center">Ownership 100%</TableHead>
                  <TableHead className="text-center">Compartidas</TableHead>
                  <TableHead className="text-center">Propietarios Únicos</TableHead>
                  <TableHead className="text-center">% Ownership Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertyAnalysis.map((tenant) => (
                  <TableRow key={tenant.tenant_id}>
                    <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                    <TableCell className="text-center font-bold">{tenant.total_properties}</TableCell>
                    <TableCell className="text-center">{tenant.full_ownership_properties}</TableCell>
                    <TableCell className="text-center">{tenant.shared_properties}</TableCell>
                    <TableCell className="text-center">{tenant.unique_owners}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {tenant.avg_ownership_percentage?.toFixed(1) || 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla 3: Actividad Contractual */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Contractual por Tenant</CardTitle>
            <CardDescription>
              Estado de contratos e inquilinos activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-center">Activos</TableHead>
                  <TableHead className="text-center">Vencidos</TableHead>
                  <TableHead className="text-center">Cancelados</TableHead>
                  <TableHead className="text-center">Renovaciones</TableHead>
                  <TableHead className="text-center">Inquilinos Activos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractActivity.map((tenant) => (
                  <TableRow key={tenant.tenant_id}>
                    <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">{tenant.active_contracts}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{tenant.expired_contracts}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{tenant.cancelled_contracts}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{tenant.renewal_contracts}</TableCell>
                    <TableCell className="text-center font-bold">{tenant.active_tenants}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: GRÁFICOS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Visualizaciones</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gráfico 1: Usuarios por Rol (Bar) */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios por Rol</CardTitle>
              <CardDescription>Distribución total en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: 'Usuarios', color: 'hsl(var(--chart-1))' },
                }}
                className="h-64"
              >
                <ResponsiveContainer>
                  <BarChart data={usersByRoleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico 2: Distribución de Tenants (Pie) */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Tenants</CardTitle>
              <CardDescription>Por tipo de organización</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  inmobiliaria: { label: 'Inmobiliarias', color: 'hsl(var(--chart-2))' },
                  propietario: { label: 'Propietarios', color: 'hsl(var(--chart-3))' },
                }}
                className="h-64"
              >
                <ResponsiveContainer>
                  <RechartsPie>
                    <Pie
                      data={tenantDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {tenantDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico 3: Crecimiento de Tenants (Line) */}
        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de Tenants en el Tiempo</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: 'Cantidad', color: 'hsl(var(--chart-1))' },
              }}
              className="h-80"
            >
              <ResponsiveContainer>
                <LineChart data={tenantGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--color-count)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
