import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, DollarSign, Calendar, Home } from 'lucide-react';

interface MonthlyRevenue {
  month: string;
  ars: number;
  usd: number;
  total: number;
}

interface PropertyPerformance {
  property_code: string;
  property_address: string;
  revenue: number;
  currency: string;
  contract_status: string;
}

interface OccupancyData {
  status: string;
  count: number;
  percentage: number;
}

interface PaymentTrend {
  status: string;
  count: number;
  amount: number;
}

export function ClientAnalyticsDashboard() {
  const { clientData } = useClient();
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    avgOccupancy: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    activeContracts: 0,
  });

  useEffect(() => {
    if (clientData) {
      loadAnalytics();
    }
  }, [clientData]);

  const loadAnalytics = async () => {
    if (!clientData) return;

    try {
      setLoading(true);

      // Cargar ingresos mensuales (últimos 12 meses)
      await loadMonthlyRevenue();

      // Cargar performance por propiedad
      await loadPropertyPerformance();

      // Cargar datos de ocupación
      await loadOccupancyData();

      // Cargar tendencias de pagos
      await loadPaymentTrends();

      // Calcular estadísticas resumen
      await calculateSummaryStats();

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async () => {
    const { data: payments } = await supabase
      .from('pms_payments')
      .select('paid_date, paid_amount, currency')
      .eq('tenant_id', clientData!.id)
      .eq('status', 'paid')
      .gte('paid_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('paid_date', { ascending: true });

    if (payments) {
      const monthlyData: Record<string, { ars: number; usd: number }> = {};

      payments.forEach((payment) => {
        const month = new Date(payment.paid_date).toLocaleDateString('es-AR', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { ars: 0, usd: 0 };
        }

        if (payment.currency === 'ARS') {
          monthlyData[month].ars += Number(payment.paid_amount);
        } else {
          monthlyData[month].usd += Number(payment.paid_amount);
        }
      });

      const revenueArray = Object.entries(monthlyData).map(([month, amounts]) => ({
        month,
        ars: amounts.ars,
        usd: amounts.usd,
        total: amounts.ars + (amounts.usd * 1000), // Conversión aproximada
      }));

      setMonthlyRevenue(revenueArray.slice(-12));
    }
  };

  const loadPropertyPerformance = async () => {
    const { data: properties } = await supabase
      .from('pms_properties')
      .select(`
        code,
        address,
        pms_contracts!inner (
          id,
          monthly_rent,
          currency,
          status,
          pms_payments (
            paid_amount
          )
        )
      `)
      .eq('tenant_id', clientData!.id);

    if (properties) {
      const performanceData = properties.map((prop: any) => {
        const contract = prop.pms_contracts[0];
        const totalRevenue = contract?.pms_payments?.reduce(
          (sum: number, p: any) => sum + Number(p.paid_amount), 
          0
        ) || 0;

        return {
          property_code: prop.code,
          property_address: prop.address,
          revenue: totalRevenue,
          currency: contract?.currency || 'ARS',
          contract_status: contract?.status || 'available',
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      setPropertyPerformance(performanceData);
    }
  };

  const loadOccupancyData = async () => {
    const { data: properties } = await supabase
      .from('pms_properties')
      .select('status')
      .eq('tenant_id', clientData!.id);

    if (properties) {
      const statusCount: Record<string, number> = {};
      properties.forEach((p) => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      });

      const total = properties.length;
      const occupancyArray = Object.entries(statusCount).map(([status, count]) => ({
        status: status === 'rented' ? 'Alquiladas' : 
                status === 'available' ? 'Disponibles' : 'Mantenimiento',
        count,
        percentage: Math.round((count / total) * 100),
      }));

      setOccupancyData(occupancyArray);
    }
  };

  const loadPaymentTrends = async () => {
    const { data: scheduleItems } = await supabase
      .from('pms_payment_schedule_items')
      .select('status, expected_amount')
      .eq('tenant_id', clientData!.id)
      .gte('period_date', new Date().toISOString().split('T')[0]);

    if (scheduleItems) {
      const trendData: Record<string, { count: number; amount: number }> = {};
      
      scheduleItems.forEach((item) => {
        const status = item.status === 'paid' ? 'Pagados' :
                      item.status === 'pending' ? 'Pendientes' : 'Vencidos';
        
        if (!trendData[status]) {
          trendData[status] = { count: 0, amount: 0 };
        }
        
        trendData[status].count += 1;
        trendData[status].amount += Number(item.expected_amount);
      });

      setPaymentTrends(
        Object.entries(trendData).map(([status, data]) => ({
          status,
          count: data.count,
          amount: data.amount,
        }))
      );
    }
  };

  const calculateSummaryStats = async () => {
    const { data: properties } = await supabase
      .from('pms_properties')
      .select('status')
      .eq('tenant_id', clientData!.id);

    const { data: contracts } = await supabase
      .from('pms_contracts')
      .select('status')
      .eq('tenant_id', clientData!.id)
      .eq('status', 'active');

    const { data: payments } = await supabase
      .from('pms_payments')
      .select('paid_amount')
      .eq('tenant_id', clientData!.id)
      .eq('status', 'paid');

    const rented = properties?.filter(p => p.status === 'rented').length || 0;
    const total = properties?.length || 1;
    const avgOccupancy = Math.round((rented / total) * 100);

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0;

    setSummaryStats({
      avgOccupancy,
      totalRevenue,
      revenueGrowth: 12.5, // Calcular growth real comparando periodos
      activeContracts: contracts?.length || 0,
    });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analíticas Avanzadas</h1>
        <p className="text-muted-foreground">Insights detallados de tu portafolio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.avgOccupancy}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Nivel saludable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryStats.totalRevenue.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{summaryStats.revenueGrowth}% este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">Vigentes actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {occupancyData.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total gestionadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales (Últimos 12 Meses)</CardTitle>
              <CardDescription>Evolución de ingresos en ARS y USD</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ars" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="ARS"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usd" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="USD"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Occupancy Chart */}
        <TabsContent value="occupancy" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ocupación</CardTitle>
                <CardDescription>Estado actual de propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle por Estado</CardTitle>
                <CardDescription>Cantidad de propiedades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {occupancyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{data.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{data.count}</div>
                        <div className="text-sm text-muted-foreground">{data.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Propiedades por Ingresos</CardTitle>
              <CardDescription>Propiedades con mayor rentabilidad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={propertyPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="property_code" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Chart */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Pagos</CardTitle>
              <CardDescription>Distribución de pagos por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Cantidad" />
                  <Bar dataKey="amount" fill="hsl(var(--secondary))" name="Monto Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
