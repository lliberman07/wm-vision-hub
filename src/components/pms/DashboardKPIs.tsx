import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface KPIData {
  totalProperties: number;
  activeContracts: number;
  pendingPayments: number;
  monthlyRevenue: number;
}

export function DashboardKPIs() {
  const { currentTenant } = usePMS();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData>({
    totalProperties: 0,
    activeContracts: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!currentTenant?.id) return;

      try {
        const [properties, contracts, payments] = await Promise.all([
          supabase
            .from('pms_properties')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id),
          supabase
            .from('pms_contracts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'active'),
          supabase
            .from('pms_payments')
            .select('amount')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'pending'),
        ]);

        const revenue = await supabase
          .from('pms_payments')
          .select('paid_amount')
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'paid')
          .gte('paid_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        setData({
          totalProperties: properties.count || 0,
          activeContracts: contracts.count || 0,
          pendingPayments: payments.data?.length || 0,
          monthlyRevenue: revenue.data?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0,
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [currentTenant]);

  const kpis = [
    {
      title: 'Propiedades Activas',
      value: data.totalProperties,
      icon: Building2,
      gradient: 'from-primary/10 to-primary/20',
      iconColor: 'text-primary',
    },
    {
      title: 'Contratos Activos',
      value: data.activeContracts,
      icon: TrendingUp,
      gradient: 'from-success/10 to-success/20',
      iconColor: 'text-success',
    },
    {
      title: 'Pagos Pendientes',
      value: data.pendingPayments,
      icon: AlertCircle,
      gradient: 'from-warning/10 to-warning/20',
      iconColor: 'text-warning',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${data.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-accent/10 to-accent/20',
      iconColor: 'text-accent',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="card-elevated hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
