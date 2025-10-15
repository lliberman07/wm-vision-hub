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
  pendingSubmissions: number;
  upcomingPayments: number;
}

export function PaymentsDashboard() {
  const { currentTenant } = usePMS();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    collectedThisMonth: 0,
    pendingThisMonth: 0,
    collectionRate: 0,
    pendingSubmissions: 0,
    upcomingPayments: 0,
  });

  useEffect(() => {
    if (currentTenant) {
      fetchMetrics();
    }
  }, [currentTenant]);

  const fetchMetrics = async () => {
    if (!currentTenant) return;

    try {
      setLoading(true);
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const today = now.toISOString().split('T')[0];
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Total cobrado este mes
      const { data: paidData } = await supabase
        .from('pms_payments')
        .select('paid_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'paid')
        .gte('paid_date', `${currentMonth}-01`)
        .lte('paid_date', `${currentMonth}-31`);

      const collectedThisMonth = paidData?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

      // Pendiente este mes (vencidos sin pagar)
      const { data: overdueData } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .lte('period_date', today)
        .neq('status', 'paid');

      const pendingThisMonth = overdueData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;

      // Tasa de Cobranza: Cuotas devengadas hasta hoy / Cuotas pagadas hasta hoy
      const { data: devengadoData } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .lte('period_date', today); // Todo lo que ya venció o está vigente

      const totalDevengado = devengadoData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;

      // Total pagado hasta hoy (de lo devengado)
      const { data: pagadoData } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'paid')
        .lte('period_date', today);

      const totalPagado = pagadoData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      const collectionRate = totalDevengado > 0 ? (totalPagado / totalDevengado) * 100 : 0;

      // Pagos informados pendientes
      const { data: submissionsData, count: submissionsCount } = await supabase
        .from('pms_payment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending');

      // Próximos vencimientos (7 días) - monto total
      const { data: upcomingData } = await supabase
        .from('pms_payment_schedule_items')
        .select('expected_amount')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')
        .gte('period_date', today)
        .lte('period_date', sevenDaysFromNow);
      
      const upcomingTotal = upcomingData?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;

      setMetrics({
        collectedThisMonth,
        pendingThisMonth,
        collectionRate,
        pendingSubmissions: submissionsCount || 0,
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
      value: `$${metrics.collectedThisMonth.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendiente de Cobro",
      value: `$${metrics.pendingThisMonth.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
      value: `$${metrics.pendingSubmissions.toLocaleString('es-AR')}`,
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Próximos Vencimientos (7 días)",
      value: `$${metrics.upcomingPayments.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
            <div className={`text-xl font-bold ${card.color} break-words`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
