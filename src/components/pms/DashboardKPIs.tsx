import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, AlertCircle, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface KPIData {
  totalProperties: number;
  activeContracts: number;
  overduePayments: { ARS: number; USD: number };
  pendingPayments: { ARS: number; USD: number };
  monthlyRevenue: { ARS: number; USD: number };
}

export function DashboardKPIs() {
  const { currentTenant, userRole } = usePMS();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData>({
    totalProperties: 0,
    activeContracts: 0,
    overduePayments: { ARS: 0, USD: 0 },
    pendingPayments: { ARS: 0, USD: 0 },
    monthlyRevenue: { ARS: 0, USD: 0 },
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!currentTenant?.id) return;

      try {
        // SUPERADMIN ve todas las propiedades del sistema
        const isSuperAdmin = userRole === 'SUPERADMIN';
        
        // Construir queries condicionalmente
        let propertiesQuery = supabase
          .from('pms_properties')
          .select('*', { count: 'exact', head: true });
        
        let contractsQuery = supabase
          .from('pms_contracts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        let overdueQuery = supabase
          .from('pms_payment_schedule_items')
          .select('expected_amount, contract_id')
          .eq('status', 'overdue');
        
        let pendingQuery = supabase
          .from('pms_payment_schedule_items')
          .select('expected_amount, contract_id')
          .eq('status', 'pending');
        
        // Filtrar por tenant solo si NO es SUPERADMIN
        if (!isSuperAdmin) {
          propertiesQuery = propertiesQuery.eq('tenant_id', currentTenant.id);
          contractsQuery = contractsQuery.eq('tenant_id', currentTenant.id);
          overdueQuery = overdueQuery.eq('tenant_id', currentTenant.id);
          pendingQuery = pendingQuery.eq('tenant_id', currentTenant.id);
        }
        
        const [properties, contracts, overdueScheduleItems, pendingScheduleItems] = await Promise.all([
          propertiesQuery,
          contractsQuery,
          overdueQuery,
          pendingQuery,
        ]);

        // Obtener contratos para conocer las monedas
        let contractsCurrencyQuery = supabase
          .from('pms_contracts')
          .select('id, currency');
        
        if (!isSuperAdmin) {
          contractsCurrencyQuery = contractsCurrencyQuery.eq('tenant_id', currentTenant.id);
        }
        
        const { data: contractsData } = await contractsCurrencyQuery;

        const contractCurrencyMap = new Map(contractsData?.map(c => [c.id, c.currency]) || []);

        // Calcular totales por moneda para pagos vencidos
        const overdueByurrency = { ARS: 0, USD: 0 };
        overdueScheduleItems.data?.forEach(item => {
          const currency = contractCurrencyMap.get(item.contract_id) || 'ARS';
          overdueByurrency[currency as 'ARS' | 'USD'] += item.expected_amount || 0;
        });

        // Calcular totales por moneda para pagos pendientes
        const pendingByCurrency = { ARS: 0, USD: 0 };
        pendingScheduleItems.data?.forEach(item => {
          const currency = contractCurrencyMap.get(item.contract_id) || 'ARS';
          pendingByCurrency[currency as 'ARS' | 'USD'] += item.expected_amount || 0;
        });

        // Ingresos del mes por moneda
        let revenueQuery = supabase
          .from('pms_payments')
          .select('paid_amount, contract_id')
          .eq('status', 'paid')
          .gte('paid_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        if (!isSuperAdmin) {
          revenueQuery = revenueQuery.eq('tenant_id', currentTenant.id);
        }
        
        const revenue = await revenueQuery;

        const revenueByCurrency = { ARS: 0, USD: 0 };
        revenue.data?.forEach(p => {
          const currency = contractCurrencyMap.get(p.contract_id) || 'ARS';
          revenueByCurrency[currency as 'ARS' | 'USD'] += p.paid_amount || 0;
        });

        setData({
          totalProperties: properties.count || 0,
          activeContracts: contracts.count || 0,
          overduePayments: overdueByurrency,
          pendingPayments: pendingByCurrency,
          monthlyRevenue: revenueByCurrency,
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [currentTenant, userRole]);

  const kpis = [
    {
      title: 'Total de Propiedades',
      value: data.totalProperties,
      icon: Building2,
      gradient: 'from-primary/10 to-primary/20',
      iconColor: 'text-primary',
      type: 'number' as const,
    },
    {
      title: 'Contratos Activos',
      value: data.activeContracts,
      icon: TrendingUp,
      gradient: 'from-success/10 to-success/20',
      iconColor: 'text-success',
      type: 'number' as const,
    },
    {
      title: 'Pagos Vencidos',
      value: data.overduePayments,
      icon: AlertTriangle,
      gradient: 'from-destructive/10 to-destructive/20',
      iconColor: 'text-destructive',
      type: 'currency' as const,
    },
    {
      title: 'Pagos Pendientes',
      value: data.pendingPayments,
      icon: Clock,
      gradient: 'from-warning/10 to-warning/20',
      iconColor: 'text-warning',
      type: 'currency' as const,
    },
    {
      title: 'Ingresos del Mes',
      value: data.monthlyRevenue,
      icon: DollarSign,
      gradient: 'from-accent/10 to-accent/20',
      iconColor: 'text-accent',
      type: 'currency' as const,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <CardContent className="space-y-2">
              {kpi.type === 'currency' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-bold">
                      ${(kpi.value as { ARS: number; USD: number }).ARS.toLocaleString()}
                    </div>
                    <div className="text-base font-bold">
                      USD {(kpi.value as { ARS: number; USD: number }).USD.toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold">{kpi.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
