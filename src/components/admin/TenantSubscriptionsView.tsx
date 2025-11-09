import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  Home, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TenantSubscription {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  plan_name: string;
  plan_slug: string;
  subscription_status: string;
  billing_cycle: string;
  current_period_end: string;
  days_remaining: number;
  cancel_at_period_end: boolean;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  user_count: number;
  property_count: number;
  contract_count: number;
  branch_count: number;
  pending_invoice_amount?: number;
  pending_invoice_days_overdue?: number;
}

interface Stats {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  suspended_subscriptions: number;
  total_mrr: number;
}

export function TenantSubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_subscriptions: 0,
    active_subscriptions: 0,
    trial_subscriptions: 0,
    suspended_subscriptions: 0,
    total_mrr: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch all tenants with their subscription info
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('pms_tenants')
        .select(`
          id,
          name,
          slug,
          current_subscription_id,
          tenant_subscriptions!pms_tenants_current_subscription_id_fkey (
            id,
            status,
            billing_cycle,
            current_period_end,
            cancel_at_period_end,
            subscription_plans (
              name,
              slug,
              max_users,
              max_properties,
              max_contracts,
              max_branches,
              price_monthly
            )
          )
        `)
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;

      // Fetch usage counts for each tenant
      const subscriptionsList: TenantSubscription[] = [];
      let activeCount = 0;
      let trialCount = 0;
      let suspendedCount = 0;
      let totalMRR = 0;

      for (const tenant of tenantsData || []) {
        const subscription = tenant.tenant_subscriptions;
        const plan = subscription?.subscription_plans;

        // Get usage counts
        const { count: userCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('module', 'PMS')
          .eq('status', 'approved');

        const { count: propertyCount } = await supabase
          .from('pms_properties')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        const { count: contractCount } = await supabase
          .from('pms_contracts')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active');

        const { count: branchCount } = await supabase
          .from('pms_tenants')
          .select('*', { count: 'exact', head: true })
          .eq('parent_tenant_id', tenant.id);

        // Check for pending invoices
        const { data: invoiceData } = await supabase
          .from('subscription_invoices')
          .select('amount, due_date')
          .eq('subscription_id', subscription?.id)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(1)
          .single();

        const daysRemaining = subscription?.current_period_end
          ? Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        subscriptionsList.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          plan_name: plan?.name || 'Sin plan',
          plan_slug: plan?.slug || '',
          subscription_status: subscription?.status || 'none',
          billing_cycle: subscription?.billing_cycle || '',
          current_period_end: subscription?.current_period_end || '',
          days_remaining: daysRemaining,
          cancel_at_period_end: subscription?.cancel_at_period_end || false,
          max_users: plan?.max_users || 0,
          max_properties: plan?.max_properties,
          max_contracts: plan?.max_contracts,
          max_branches: plan?.max_branches || 0,
          user_count: userCount || 0,
          property_count: propertyCount || 0,
          contract_count: contractCount || 0,
          branch_count: branchCount || 0,
          pending_invoice_amount: invoiceData?.amount,
          pending_invoice_days_overdue: invoiceData?.due_date 
            ? Math.ceil((new Date().getTime() - new Date(invoiceData.due_date).getTime()) / (1000 * 60 * 60 * 24))
            : undefined
        });

        // Update stats
        if (subscription?.status === 'active') {
          activeCount++;
          totalMRR += plan?.price_monthly || 0;
        } else if (subscription?.status === 'trial') {
          trialCount++;
        } else if (subscription?.status === 'suspended') {
          suspendedCount++;
        }
      }

      setSubscriptions(subscriptionsList);
      setStats({
        total_subscriptions: subscriptionsList.length,
        active_subscriptions: activeCount,
        trial_subscriptions: trialCount,
        suspended_subscriptions: suspendedCount,
        total_mrr: totalMRR
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las suscripciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Activa</Badge>;
      case 'trial':
        return <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Prueba</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Suspendida</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Cancelada</Badge>;
      default:
        return <Badge variant="outline">Sin suscripción</Badge>;
    }
  };

  const getUsageStatus = (current: number, limit: number | null) => {
    if (limit === null || limit === 999999) return 'ok';
    const percentage = (current / limit) * 100;
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'ok';
  };

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (limit === null || limit === 999999) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suscripciones de Tenants</h2>
        <p className="text-muted-foreground">
          Monitor de uso y estado de suscripciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Suscripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_subscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_subscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.trial_subscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              MRR Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_mrr)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Tenant</CardTitle>
          <CardDescription>
            Uso de recursos y estado de cada tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const userStatus = getUsageStatus(sub.user_count, sub.max_users);
                const propertyStatus = getUsageStatus(sub.property_count, sub.max_properties);

                return (
                  <TableRow key={sub.tenant_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sub.tenant_name}</div>
                        <div className="text-sm text-muted-foreground">{sub.tenant_slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sub.subscription_status)}
                      {sub.pending_invoice_amount && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Factura pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3" />
                          <span className="text-muted-foreground">Usuarios:</span>
                          <span className={userStatus === 'critical' ? 'text-destructive font-medium' : ''}>
                            {sub.user_count} / {sub.max_users === 999999 ? '∞' : sub.max_users}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(sub.user_count, sub.max_users)} 
                          className="h-1"
                        />
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-3 w-3" />
                          <span className="text-muted-foreground">Propiedades:</span>
                          <span className={propertyStatus === 'critical' ? 'text-destructive font-medium' : ''}>
                            {sub.property_count} / {sub.max_properties === null || sub.max_properties === 999999 ? '∞' : sub.max_properties}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(sub.property_count, sub.max_properties)} 
                          className="h-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.current_period_end && (
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(sub.current_period_end), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="text-muted-foreground">
                            {sub.days_remaining > 0 ? `${sub.days_remaining} días` : 'Vencido'}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
