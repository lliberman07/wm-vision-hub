import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, TrendingUp, Bell, Calendar } from "lucide-react";
import { usePMS } from "@/contexts/PMSContext";

interface DashboardMetrics {
  collectedThisMonth: number;
  pendingThisMonth: number;
  collectionRate: number;
  pendingSubmissionsCount: number;
  pendingSubmissionsAmount: number;
  upcomingPayments: number;
}

export function PaymentsDashboard() {
  const { currentTenant } = usePMS();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    collectedThisMonth: 0,
    pendingThisMonth: 0,
    collectionRate: 0,
    pendingSubmissionsCount: 0,
    pendingSubmissionsAmount: 0,
    upcomingPayments: 0,
  });

  useEffect(() => {
    if (currentTenant) {
      fetchMetrics();
    }
  }, [currentTenant]);

  const fetchMetrics = async () => {
    if (!currentTenant) {
      console.warn('PaymentsDashboard: No currentTenant available');
      return;
    }

    try {
      setLoading(true);
      console.log('PaymentsDashboard: Fetching metrics for tenant:', currentTenant.id, currentTenant.name);
      
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7); // YYYY-MM
      const today = now.toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Total cobrado este mes - usando schedule items como fuente única
      const { data: paidData, error: paidError } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'paid')
        .gte('period_date', `${currentMonth}-01`)
        .lt('period_date', `${nextMonth}-01`);

      if (paidError) {
        console.error('Error fetching paid data:', paidError);
      }

      const collectedThisMonth = paidData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      console.log('Total cobrado este mes:', collectedThisMonth, 'Records:', paidData?.length);

      // Pendiente de cobro (vencidos sin pagar)
      const { data: overdueData, error: overdueError } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .in('status', ['pending', 'partial'])
        .lte('period_date', today);

      if (overdueError) {
        console.error('Error fetching overdue data:', overdueError);
      }

      const pendingThisMonth = overdueData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      console.log('Pendiente de cobro:', pendingThisMonth, 'Records:', overdueData?.length);

      // Tasa de Cobranza: Total pagado / Total devengado hasta hoy
      const { data: devengadoData, error: devengadoError } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .lte('period_date', today);

      if (devengadoError) {
        console.error('Error fetching devengado data:', devengadoError);
      }

      const totalDevengado = devengadoData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;

      const { data: pagadoData, error: pagadoError } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'paid')
        .lte('period_date', today);

      if (pagadoError) {
        console.error('Error fetching pagado data:', pagadoError);
      }

      const totalPagado = pagadoData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      const collectionRate = totalDevengado > 0 ? (totalPagado / totalDevengado) * 100 : 0;
      console.log('Tasa de cobranza:', collectionRate.toFixed(1), '%', `(${totalPagado}/${totalDevengado})`);

      // Pagos informados pendientes - COUNT y MONTO
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('pms_payment_submissions')
        .select('paid_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending');

      if (submissionsError) {
        console.error('Error fetching submissions data:', submissionsError);
      }

      const pendingSubmissionsCount = submissionsData?.length || 0;
      const pendingSubmissionsAmount = submissionsData?.reduce((sum, s) => sum + (s.paid_amount || 0), 0) || 0;
      console.log('Pagos informados pendientes:', pendingSubmissionsCount, 'Total:', pendingSubmissionsAmount);

      // Próximos vencimientos (30 días)
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')
        .gt('period_date', today)
        .lte('period_date', thirtyDaysFromNow);

      if (upcomingError) {
        console.error('Error fetching upcoming data:', upcomingError);
      }
      
      const upcomingTotal = upcomingData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      console.log('Próximos vencimientos:', upcomingTotal, 'Records:', upcomingData?.length);

      setMetrics({
        collectedThisMonth,
        pendingThisMonth,
        collectionRate,
        pendingSubmissionsCount,
        pendingSubmissionsAmount,
        upcomingPayments: upcomingTotal,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Cobrado (Mes Actual)",
      value: `$${metrics.collectedThisMonth.toLocaleString('es-AR')}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendiente de Cobro",
      value: `$${metrics.pendingThisMonth.toLocaleString('es-AR')}`,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Tasa de Cobranza",
      value: `${metrics.collectionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pagos Informados",
      value: metrics.pendingSubmissionsCount > 0 
        ? `${metrics.pendingSubmissionsCount} ($${metrics.pendingSubmissionsAmount.toLocaleString('es-AR')})`
        : '0',
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Próximos Vencimientos (30 días)",
      value: `$${metrics.upcomingPayments.toLocaleString('es-AR')}`,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-base font-bold ${card.color} break-words`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
