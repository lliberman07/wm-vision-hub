import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Calendar, FileDown, CreditCard, Activity, Target } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

interface MainMetrics {
  active_subscriptions: number;
  trial_subscriptions: number;
  suspended_subscriptions: number;
  cancelled_subscriptions: number;
  mrr_total: number;
  arr_total: number;
  mrr_last_month: number;
  growth_rate: number;
  churn_rate: number;
  new_subs_month: number;
  cancelled_subs_month: number;
}

interface TemporalEvolution {
  month: string;
  mrr: number;
  new_subs: number;
  cancelled_subs: number;
  active_subs_total: number;
}

interface BillingDistribution {
  type: string;
  count: number;
  mrr: number;
}

interface PlanDistribution {
  plan_name: string;
  plan_id: string;
  count: number;
  status: string;
  mrr: number;
}

interface AnalyticsData {
  main_metrics: MainMetrics;
  temporal_evolution: TemporalEvolution[];
  billing_distribution: BillingDistribution[];
  plan_distribution: PlanDistribution[];
}

interface PaymentMethodData {
  payment_method: string;
  transaction_count: number;
  total_ars: number;
  total_usd: number;
  percentage: number;
}

interface PlanChange {
  id: string;
  subscription_id: string;
  tenant_name: string;
  change_type: string;
  old_plan_name: string;
  new_plan_name: string;
  old_billing_cycle: string;
  new_billing_cycle: string;
  old_price: number;
  new_price: number;
  changed_at: string;
  reason: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function GranadaSubscriptionAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [monthsBack, setMonthsBack] = useState<string>('12');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);
  const [planChanges, setPlanChanges] = useState<PlanChange[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [monthsBack]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Cargar analítica general
      const { data: analytics, error: analyticsError } = await supabase.rpc(
        'get_granada_subscription_analytics',
        { p_months_back: parseInt(monthsBack) }
      );

      if (analyticsError) throw analyticsError;
      setAnalyticsData(analytics as unknown as AnalyticsData);

      // Cargar ingresos por método de pago
      const { data: paymentData, error: paymentError } = await supabase.rpc(
        'get_revenue_by_payment_method',
        { 
          p_start_date: new Date(new Date().setMonth(new Date().getMonth() - parseInt(monthsBack))).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }
      );

      if (paymentError) throw paymentError;
      setPaymentMethodData(paymentData || []);

      // Cargar cambios de plan
      const { data: changes, error: changesError } = await supabase.rpc(
        'get_subscription_plan_changes',
        { 
          p_start_date: new Date(new Date().setMonth(new Date().getMonth() - parseInt(monthsBack))).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }
      );

      if (changesError) throw changesError;
      setPlanChanges(changes || []);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar analítica de suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!analyticsData) return;

    const wb = XLSX.utils.book_new();

    // Hoja 1: Métricas principales
    const metricsSheet = XLSX.utils.json_to_sheet([analyticsData.main_metrics]);
    XLSX.utils.book_append_sheet(wb, metricsSheet, 'Métricas Principales');

    // Hoja 2: Evolución temporal
    const evolutionSheet = XLSX.utils.json_to_sheet(analyticsData.temporal_evolution);
    XLSX.utils.book_append_sheet(wb, evolutionSheet, 'Evolución Temporal');

    // Hoja 3: Ingresos por método de pago
    const paymentSheet = XLSX.utils.json_to_sheet(paymentMethodData);
    XLSX.utils.book_append_sheet(wb, paymentSheet, 'Métodos de Pago');

    // Hoja 4: Cambios de plan
    const changesSheet = XLSX.utils.json_to_sheet(planChanges);
    XLSX.utils.book_append_sheet(wb, changesSheet, 'Cambios de Plan');

    XLSX.writeFile(wb, `Granada_Subscription_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Analítica exportada exitosamente');
  };

  const formatCurrency = (value: number, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      upgrade: 'Mejora',
      downgrade: 'Reducción',
      billing_cycle_change: 'Cambio Ciclo',
      cancellation: 'Cancelación',
      activation: 'Activación',
      suspension: 'Suspensión'
    };
    return labels[type] || type;
  };

  const getChangeTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      upgrade: 'default',
      downgrade: 'secondary',
      billing_cycle_change: 'outline',
      cancellation: 'destructive',
      activation: 'default',
      suspension: 'secondary'
    };
    return variants[type] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center p-8">No hay datos disponibles</div>;
  }

  const { main_metrics, temporal_evolution, billing_distribution, plan_distribution } = analyticsData;

  // Calcular proyección anual conservadora
  const conservativeARR = main_metrics.mrr_total * 12 * (1 - main_metrics.churn_rate / 100);
  const optimisticARR = main_metrics.mrr_total * 12 * 1.1;
  const pessimisticARR = main_metrics.mrr_total * 12 * (1 - main_metrics.churn_rate / 100 * 1.5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Analítica de Suscripciones</h2>
          <p className="text-muted-foreground">Dashboard de ingresos y métricas de suscripción</p>
        </div>
        <div className="flex gap-3">
          <Select value={monthsBack} onValueChange={setMonthsBack}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{main_metrics.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +{main_metrics.trial_subscriptions} en prueba
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(main_metrics.mrr_total)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {main_metrics.growth_rate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {main_metrics.growth_rate.toFixed(2)}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR Proyectado</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(main_metrics.arr_total)}</div>
            <p className="text-xs text-muted-foreground">
              Ingreso recurrente anual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{main_metrics.churn_rate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {main_metrics.cancelled_subs_month} cancelaciones este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos del Mes */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevas Suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{main_metrics.new_subs_month}</div>
            <p className="text-sm text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cancelaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{main_metrics.cancelled_subs_month}</div>
            <p className="text-sm text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crecimiento Neto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {main_metrics.new_subs_month - main_metrics.cancelled_subs_month}
            </div>
            <p className="text-sm text-muted-foreground">Balance mensual</p>
          </CardContent>
        </Card>
      </div>

      {/* Evolución Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución Temporal</CardTitle>
          <CardDescription>MRR y movimientos de suscripciones en los últimos {monthsBack} meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={temporal_evolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="mrr" stroke="hsl(var(--chart-1))" name="MRR" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="new_subs" stroke="hsl(var(--chart-2))" name="Nuevas" />
              <Line yAxisId="right" type="monotone" dataKey="cancelled_subs" stroke="hsl(var(--chart-3))" name="Canceladas" />
              <Line yAxisId="right" type="monotone" dataKey="active_subs_total" stroke="hsl(var(--chart-4))" name="Activas Total" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribución por Tipo y Plan */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Ciclo de Facturación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={billing_distribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {billing_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Planes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={plan_distribution?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Suscripciones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ingresos por Método de Pago */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Método de Pago</CardTitle>
          <CardDescription>Últimos {monthsBack} meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethodData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="payment_method" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_ars" fill="hsl(var(--chart-2))" name="Total ARS" />
              <Bar dataKey="total_usd" fill="hsl(var(--chart-3))" name="Total USD" />
            </BarChart>
          </ResponsiveContainer>

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Método de Pago</TableHead>
                <TableHead className="text-right">Transacciones</TableHead>
                <TableHead className="text-right">Total ARS</TableHead>
                <TableHead className="text-right">Total USD</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethodData.map((method, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{method.payment_method}</TableCell>
                  <TableCell className="text-right">{method.transaction_count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(method.total_ars)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(method.total_usd, 'USD')}</TableCell>
                  <TableCell className="text-right">{method.percentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cambios de Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Suscripciones</CardTitle>
          <CardDescription>Altas, bajas y modificaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="upgrade">Mejoras</TabsTrigger>
              <TabsTrigger value="downgrade">Reducciones</TabsTrigger>
              <TabsTrigger value="cancellation">Cancelaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plan Anterior</TableHead>
                    <TableHead>Plan Nuevo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planChanges.slice(0, 10).map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="font-medium">{change.tenant_name}</TableCell>
                      <TableCell>
                        <Badge variant={getChangeTypeBadge(change.change_type)}>
                          {getChangeTypeLabel(change.change_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{change.old_plan_name || '-'}</TableCell>
                      <TableCell>{change.new_plan_name || '-'}</TableCell>
                      <TableCell>{new Date(change.changed_at).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{change.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            {['upgrade', 'downgrade', 'cancellation'].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plan Anterior</TableHead>
                      <TableHead>Plan Nuevo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planChanges
                      .filter(c => c.change_type === type)
                      .slice(0, 10)
                      .map((change) => (
                        <TableRow key={change.id}>
                          <TableCell className="font-medium">{change.tenant_name}</TableCell>
                          <TableCell>{change.old_plan_name || '-'}</TableCell>
                          <TableCell>{change.new_plan_name || '-'}</TableCell>
                          <TableCell>{new Date(change.changed_at).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{change.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Proyección Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección Anual de Ingresos (ARR)</CardTitle>
          <CardDescription>Escenarios basados en MRR actual y churn rate histórico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Optimista (+10%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(optimisticARR)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Asumiendo crecimiento del 10% en MRR
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conservador (Actual)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(conservativeARR)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  MRR actual × 12 - churn rate actual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-600">Pesimista</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(pessimisticARR)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Asumiendo churn rate 1.5x actual
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Las proyecciones son estimaciones basadas en datos históricos. 
              El escenario conservador considera la tasa de cancelación actual ({main_metrics.churn_rate.toFixed(2)}%) 
              aplicada al MRR mensual proyectado anualmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
