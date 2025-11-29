import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, TrendingUp, Bell, Calendar } from "lucide-react";
import { usePMS } from "@/contexts/PMSContext";

interface CurrencyAmount {
  ARS: number;
  USD: number;
}

interface DashboardMetrics {
  collectedThisMonth: CurrencyAmount;
  pendingThisMonth: CurrencyAmount;
  totalToAccrue: CurrencyAmount;
  pendingSubmissionsCount: number;
  pendingSubmissionsAmount: CurrencyAmount;
  upcomingPayments: CurrencyAmount;
}

export function PaymentsDashboard() {
  const { currentTenant, userRole } = usePMS();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    collectedThisMonth: { ARS: 0, USD: 0 },
    pendingThisMonth: { ARS: 0, USD: 0 },
    totalToAccrue: { ARS: 0, USD: 0 },
    pendingSubmissionsCount: 0,
    pendingSubmissionsAmount: { ARS: 0, USD: 0 },
    upcomingPayments: { ARS: 0, USD: 0 },
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

      const isSuperAdmin = userRole === 'SUPERADMIN';

      // Total cobrado este mes - usando schedule items como fuente única
      let paidQuery = supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount, currency')
        .eq('status', 'paid')
        .gte('period_date', `${currentMonth}-01`)
        .lt('period_date', `${nextMonth}-01`);
      
      if (!isSuperAdmin && currentTenant?.id) {
        paidQuery = paidQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: paidData, error: paidError } = await paidQuery;

      if (paidError) {
        console.error('Error fetching paid data:', paidError);
      }

      const collectedThisMonth = paidData?.reduce((acc, p) => {
        const currency = p.currency || 'ARS';
        acc[currency] = (acc[currency] || 0) + (p.expected_amount || 0);
        return acc;
      }, { ARS: 0, USD: 0 } as CurrencyAmount) || { ARS: 0, USD: 0 };
      console.log('Total cobrado este mes:', collectedThisMonth, 'Records:', paidData?.length);

      // Pendiente de cobro (vencidos sin pagar)
      let overdueQuery = supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount, currency')
        .in('status', ['pending', 'partial', 'overdue'])
        .lte('period_date', today);
      
      if (!isSuperAdmin && currentTenant?.id) {
        overdueQuery = overdueQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: overdueData, error: overdueError } = await overdueQuery;

      if (overdueError) {
        console.error('Error fetching overdue data:', overdueError);
      }

      const pendingThisMonth = overdueData?.reduce((acc, p) => {
        const currency = p.currency || 'ARS';
        acc[currency] = (acc[currency] || 0) + (p.expected_amount || 0);
        return acc;
      }, { ARS: 0, USD: 0 } as CurrencyAmount) || { ARS: 0, USD: 0 };
      console.log('Pendiente de cobro:', pendingThisMonth, 'Records:', overdueData?.length);

      // Total por Devengar: Suma de cuotas futuras (desde próximo mes)
      const firstDayNextMonth = `${nextMonth}-01`;

      let toAccrueQuery = supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount, currency')
        .gte('period_date', firstDayNextMonth);
      
      if (!isSuperAdmin && currentTenant?.id) {
        toAccrueQuery = toAccrueQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: toAccrueData, error: toAccrueError } = await toAccrueQuery;

      if (toAccrueError) {
        console.error('Error fetching to accrue data:', toAccrueError);
      }

      const totalToAccrue = toAccrueData?.reduce((acc, p) => {
        const currency = p.currency || 'ARS';
        acc[currency] = (acc[currency] || 0) + (p.expected_amount || 0);
        return acc;
      }, { ARS: 0, USD: 0 } as CurrencyAmount) || { ARS: 0, USD: 0 };
      console.log('Total por devengar:', totalToAccrue, 'Records:', toAccrueData?.length);

      // Pagos informados pendientes - COUNT y MONTO
      let submissionsQuery = supabase
        .from('pms_payment_submissions')
        .select(`
          paid_amount,
          pms_payment_schedule_items!inner(currency)
        `)
        .eq('status', 'pending');
      
      if (!isSuperAdmin && currentTenant?.id) {
        submissionsQuery = submissionsQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: submissionsData, error: submissionsError } = await submissionsQuery;

      if (submissionsError) {
        console.error('Error fetching submissions data:', submissionsError);
      }

      const pendingSubmissionsCount = submissionsData?.length || 0;
      const pendingSubmissionsAmount = submissionsData?.reduce((acc, s: any) => {
        const currency = s.pms_payment_schedule_items?.currency || 'ARS';
        acc[currency] = (acc[currency] || 0) + (s.paid_amount || 0);
        return acc;
      }, { ARS: 0, USD: 0 } as CurrencyAmount) || { ARS: 0, USD: 0 };
      console.log('Pagos informados pendientes:', pendingSubmissionsCount, 'Total:', pendingSubmissionsAmount);

      // Próximos vencimientos (30 días)
      let upcomingQuery = supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount, currency')
        .eq('status', 'pending')
        .gt('period_date', today)
        .lte('period_date', thirtyDaysFromNow);
      
      if (!isSuperAdmin && currentTenant?.id) {
        upcomingQuery = upcomingQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: upcomingData, error: upcomingError } = await upcomingQuery;

      if (upcomingError) {
        console.error('Error fetching upcoming data:', upcomingError);
      }
      
      const upcomingPayments = upcomingData?.reduce((acc, p) => {
        const currency = p.currency || 'ARS';
        acc[currency] = (acc[currency] || 0) + (p.expected_amount || 0);
        return acc;
      }, { ARS: 0, USD: 0 } as CurrencyAmount) || { ARS: 0, USD: 0 };
      console.log('Próximos vencimientos:', upcomingPayments, 'Records:', upcomingData?.length);

      setMetrics({
        collectedThisMonth,
        pendingThisMonth,
        totalToAccrue,
        pendingSubmissionsCount,
        pendingSubmissionsAmount,
        upcomingPayments,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyValue = (amounts: CurrencyAmount): JSX.Element => {
    return (
      <div className="space-y-1">
        <div>${amounts.ARS.toLocaleString('es-AR')}</div>
        <div>USD {amounts.USD.toLocaleString('es-AR')}</div>
      </div>
    );
  };

  const cards = [
    {
      title: "Total Cobrado (Mes Actual)",
      value: formatCurrencyValue(metrics.collectedThisMonth),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendiente de Cobro",
      value: formatCurrencyValue(metrics.pendingThisMonth),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Total por Devengar",
      value: formatCurrencyValue(metrics.totalToAccrue),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pagos Informados",
      value: metrics.pendingSubmissionsCount > 0 
        ? (
          <div className="space-y-1">
            <div>{metrics.pendingSubmissionsCount} pagos</div>
            <div className="text-xs">
              <div>${metrics.pendingSubmissionsAmount.ARS.toLocaleString('es-AR')}</div>
              <div>USD {metrics.pendingSubmissionsAmount.USD.toLocaleString('es-AR')}</div>
            </div>
          </div>
        )
        : formatCurrencyValue(metrics.pendingSubmissionsAmount),
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Próximos Vencimientos (30 días)",
      value: formatCurrencyValue(metrics.upcomingPayments),
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
            <div className={`text-base font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
