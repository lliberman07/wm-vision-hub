import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  AlertCircle,
  Loader2,
  Ban,
  Play,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_end_date: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  tenant: {
    name: string;
    client_type: string;
  };
  plan: {
    name: string;
    price_monthly: number;
    price_yearly: number;
  };
}

interface ChangeRequest {
  id: string;
  tenant_id: string;
  current_plan_id: string | null;
  requested_plan_id: string | null;
  change_type: 'replacement' | 'addon' | 'remove_addon';
  addon_subscription_id: string | null;
  reason: string;
  status: string;
  requested_by: string;
  created_at: string;
  reviewed_at: string | null;
  tenant: {
    name: string;
  };
  current_plan: {
    name: string;
    price_monthly: number;
  } | null;
  requested_plan: {
    name: string;
    price_monthly: number;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
}

interface Tenant {
  id: string;
  name: string;
  tenant_type: string;
  is_active: boolean;
  created_at: string;
}

interface ClientWithSubscription {
  id: string;
  name: string;
  tenant_type: string;
  is_active: boolean;
  created_at: string;
  subscription: {
    id: string;
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    trial_end_date: string | null;
    plan: {
      id: string;
      name: string;
      price_monthly: number;
      price_yearly: number;
    };
  } | null;
}

export function UnifiedSubscriptionsManagement() {
  const { user } = useGranadaAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [clients, setClients] = useState<ClientWithSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // KPI states
  const [activeCount, setActiveCount] = useState(0);
  const [trialsCount, setTrialsCount] = useState(0);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [noSubscriptionCount, setNoSubscriptionCount] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState<{
    tenant_id: string;
    plan_id: string;
    billing_cycle: 'monthly' | 'yearly';
    start_date: string;
    trial_days: number;
    auto_renew: boolean;
  }>({
    tenant_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    trial_days: 0,
    auto_renew: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClientsWithSubscriptions(),
        fetchSubscriptions(),
        fetchChangeRequests(),
        fetchPlans(),
        fetchTenants(),
        fetchKPIs(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsWithSubscriptions = async () => {
    // Fetch all tenants
    const { data: tenantsData, error: tenantsError } = await supabase
      .from('pms_tenants')
      .select('id, name, tenant_type, is_active, created_at')
      .order('name');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      toast.error('Error al cargar clientes');
      return;
    }

    // Fetch all subscriptions with plan info
    const { data: subsData, error: subsError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        id,
        tenant_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_end_date,
        plan:subscription_plans!tenant_subscriptions_plan_id_fkey(id, name, price_monthly, price_yearly)
      `)
      .in('status', ['active', 'trial', 'suspended', 'past_due']);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
    }

    // Create a map of tenant_id to subscription
    const subscriptionMap = new Map<string, typeof subsData[0]>();
    (subsData || []).forEach(sub => {
      // Only keep the most recent/active subscription per tenant
      const existing = subscriptionMap.get(sub.tenant_id);
      if (!existing || (sub.status === 'active' && existing.status !== 'active')) {
        subscriptionMap.set(sub.tenant_id, sub);
      }
    });

    // Combine tenants with their subscriptions
    const clientsWithSubs: ClientWithSubscription[] = (tenantsData || []).map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      tenant_type: tenant.tenant_type,
      is_active: tenant.is_active,
      created_at: tenant.created_at,
      subscription: subscriptionMap.has(tenant.id) 
        ? {
            id: subscriptionMap.get(tenant.id)!.id,
            status: subscriptionMap.get(tenant.id)!.status,
            billing_cycle: subscriptionMap.get(tenant.id)!.billing_cycle,
            current_period_start: subscriptionMap.get(tenant.id)!.current_period_start,
            current_period_end: subscriptionMap.get(tenant.id)!.current_period_end,
            trial_end_date: subscriptionMap.get(tenant.id)!.trial_end_date,
            plan: subscriptionMap.get(tenant.id)!.plan as { id: string; name: string; price_monthly: number; price_yearly: number; },
          }
        : null,
    }));

    setClients(clientsWithSubs);
    setTotalClientsCount(clientsWithSubs.length);
    setNoSubscriptionCount(clientsWithSubs.filter(c => !c.subscription).length);
  };

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .select(`
        *,
        tenant:pms_tenants!tenant_subscriptions_tenant_id_fkey(name, client_type),
        plan:subscription_plans!tenant_subscriptions_plan_id_fkey(name, price_monthly, price_yearly)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar suscripciones');
      return;
    }

    setSubscriptions(data || []);
  };

  const fetchChangeRequests = async () => {
    const { data, error } = await supabase
      .from('subscription_change_requests')
      .select(`
        *,
        tenant:pms_tenants!subscription_change_requests_tenant_id_fkey(name),
        current_plan:subscription_plans!subscription_change_requests_current_plan_id_fkey(name, price_monthly),
        requested_plan:subscription_plans!subscription_change_requests_requested_plan_id_fkey(name, price_monthly)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching change requests:', error);
      toast.error('Error al cargar solicitudes de cambio');
      return;
    }

    setChangeRequests((data || []) as unknown as ChangeRequest[]);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }

    setPlans(data || []);
  };

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('pms_tenants')
      .select('id, name, tenant_type, is_active, created_at')
      .order('name');

    if (error) {
      console.error('Error fetching tenants:', error);
      return;
    }

    setTenants(data || []);
  };

  const fetchKPIs = async () => {
    const [activeRes, trialsRes, changesRes] = await Promise.all([
      supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trial']),
      supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'trial'),
      supabase
        .from('subscription_change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    setActiveCount(activeRes.count || 0);
    setTrialsCount(trialsRes.count || 0);
    setPendingChangesCount(changesRes.count || 0);
  };

  const handleCreateSubscription = async () => {
    if (!newSubscription.tenant_id || !newSubscription.plan_id) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === newSubscription.plan_id);
    if (!selectedPlan) return;

    const startDate = new Date(newSubscription.start_date);
    const trialEndDate = newSubscription.trial_days > 0
      ? new Date(startDate.getTime() + newSubscription.trial_days * 24 * 60 * 60 * 1000)
      : null;

    const periodEndDate = new Date(startDate);
    if (newSubscription.billing_cycle === 'monthly') {
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    } else {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
    }

    try {
      const { error } = await supabase.from('tenant_subscriptions').insert([{
        tenant_id: newSubscription.tenant_id,
        plan_id: newSubscription.plan_id,
        status: trialEndDate ? 'trial' : 'active',
        billing_cycle: newSubscription.billing_cycle,
        current_period_start: startDate.toISOString(),
        current_period_end: periodEndDate.toISOString(),
        trial_end_date: trialEndDate?.toISOString() || null,
        cancel_at_period_end: !newSubscription.auto_renew,
      }]);

      if (error) throw error;

      toast.success('Suscripción creada exitosamente');
      setCreateDialogOpen(false);
      setNewSubscription({
        tenant_id: '',
        plan_id: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        trial_days: 0,
        auto_renew: true,
      });
      fetchAllData();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Error al crear la suscripción');
    }
  };

  const handleToggleStatus = async (subscriptionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success(`Suscripción ${newStatus === 'active' ? 'activada' : 'suspendida'}`);
      fetchAllData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Suscripción cancelada');
      fetchAllData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Error al cancelar la suscripción');
    }
  };

  const handleExtendTrial = async (subscriptionId: string, currentEndDate: string, days: number) => {
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({ trial_end_date: newEndDate.toISOString() })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success(`Trial extendido por ${days} días`);
      fetchAllData();
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('Error al extender el trial');
    }
  };

  const handleActivateTrial = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'active',
          trial_end_date: null,
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Trial convertido a suscripción activa');
      fetchAllData();
    } catch (error) {
      console.error('Error activating trial:', error);
      toast.error('Error al activar el trial');
    }
  };

  const handleApproveChange = async (request: ChangeRequest) => {
    if (!user) return;

    try {
      // Handle different change types
      if (request.change_type === 'addon') {
        // Get base subscription to inherit billing cycle
        const { data: baseSub } = await supabase
          .from('tenant_subscriptions')
          .select('id, billing_cycle, current_period_end')
          .eq('tenant_id', request.tenant_id)
          .eq('is_addon', false)
          .in('status', ['active', 'trial'])
          .limit(1)
          .single();

        // INSERT new subscription with is_addon = true
        const startDate = new Date();
        const endDate = new Date(baseSub?.current_period_end || startDate);
        
        const { error: insertError } = await supabase
          .from('tenant_subscriptions')
          .insert({
            tenant_id: request.tenant_id,
            plan_id: request.requested_plan_id,
            is_addon: true,
            parent_subscription_id: baseSub?.id,
            status: 'active',
            billing_cycle: baseSub?.billing_cycle || 'monthly',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
          });

        if (insertError) throw insertError;
      } else if (request.change_type === 'remove_addon') {
        // CANCEL the addon subscription
        const { error: cancelError } = await supabase
          .from('tenant_subscriptions')
          .update({ 
            status: 'cancelled', 
            cancelled_at: new Date().toISOString() 
          })
          .eq('id', request.addon_subscription_id);

        if (cancelError) throw cancelError;
      } else {
        // REPLACEMENT: UPDATE plan_id of existing base subscription
        const { error: updateError } = await supabase
          .from('tenant_subscriptions')
          .update({
            plan_id: request.requested_plan_id,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', request.tenant_id)
          .eq('is_addon', false);

        if (updateError) throw updateError;
      }

      // 2. Update request status
      const { error: requestError } = await supabase
        .from('subscription_change_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 3. Send notification
      const { error: notifError } = await supabase.functions.invoke(
        'send-subscription-change-notification',
        {
          body: {
            request_id: request.id,
            action: 'approved',
          },
        }
      );

      if (notifError) {
        console.error('Error sending notification:', notifError);
      }

      const successMsg = request.change_type === 'addon' 
        ? 'Pack adicional agregado exitosamente'
        : request.change_type === 'remove_addon'
        ? 'Pack eliminado exitosamente'
        : 'Cambio de plan aprobado exitosamente';
      
      toast.success(successMsg);
      fetchAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aprobar el cambio');
    }
  };

  const handleRejectChange = async (request: ChangeRequest) => {
    if (!user) return;

    try {
      // 1. Actualizar el estado de la solicitud
      const { error: requestError } = await supabase
        .from('subscription_change_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 2. Enviar notificación al cliente
      const { error: notifError } = await supabase.functions.invoke(
        'send-subscription-change-notification',
        {
          body: {
            request_id: request.id,
            action: 'rejected',
          },
        }
      );

      if (notifError) {
        console.error('Error sending notification:', notifError);
      }

      toast.success('Cambio de plan rechazado');
      fetchAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al rechazar el cambio');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Activa', variant: 'default' },
      trial: { label: 'Trial', variant: 'secondary' },
      suspended: { label: 'Suspendida', variant: 'destructive' },
      cancelled: { label: 'Cancelada', variant: 'outline' },
      past_due: { label: 'Vencida', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrialDaysRemaining = (trialEndDate: string) => {
    const days = differenceInDays(new Date(trialEndDate), new Date());
    if (days < 0) return { days: 0, color: 'text-destructive' };
    if (days <= 7) return { days, color: 'text-destructive' };
    if (days <= 14) return { days, color: 'text-yellow-600' };
    return { days, color: 'text-green-600' };
  };

  const getChangeBadge = (currentPrice: number | null, requestedPrice: number | null) => {
    if (currentPrice === null || requestedPrice === null) return null;
    if (requestedPrice > currentPrice) {
      return (
        <Badge variant="default" className="bg-green-600">
          <ArrowUpCircle className="h-3 w-3 mr-1" />
          Upgrade
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <ArrowDownCircle className="h-3 w-3 mr-1" />
        Downgrade
      </Badge>
    );
  };

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'addon':
        return <Badge variant="default" className="bg-blue-600">➕ Agregar pack</Badge>;
      case 'remove_addon':
        return <Badge variant="destructive">➖ Eliminar pack</Badge>;
      default:
        return <Badge variant="outline">🔄 Cambiar plan</Badge>;
    }
  };

  const activeSubscriptions = subscriptions.filter((s) => ['active', 'trial'].includes(s.status));
  const trialSubscriptions = subscriptions.filter(
    (s) => s.status === 'trial' && s.trial_end_date && new Date(s.trial_end_date) >= new Date()
  );
  const pendingChanges = changeRequests.filter((r) => r.status === 'pending');
  const historicalItems = [
    ...subscriptions.filter((s) => s.status === 'cancelled'),
    ...changeRequests.filter((r) => r.status !== 'pending'),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filtros por ciclo de facturación
  const monthlySubscriptions = subscriptions.filter(
    (s) => s.billing_cycle === 'monthly' && ['active', 'trial'].includes(s.status)
  );
  const yearlySubscriptions = subscriptions.filter(
    (s) => s.billing_cycle === 'yearly' && ['active', 'trial'].includes(s.status)
  );

  // Helper para calcular días hasta vencimiento
  const getDaysUntilEnd = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return { days: 0, color: 'text-destructive', label: 'Vencida' };
    if (days === 0) return { days: 0, color: 'text-destructive', label: 'Vence hoy' };
    if (days <= 7) return { days, color: 'text-destructive', label: `${days} días` };
    if (days <= 15) return { days, color: 'text-yellow-600', label: `${days} días` };
    return { days, color: 'text-green-600', label: `${days} días` };
  };

  // Extender período de suscripción al verificar pago
  const handleExtendPeriod = async (subscriptionId: string, billingCycle: string) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;

      const newPeriodStart = new Date();
      const newPeriodEnd = new Date();
      if (billingCycle === 'monthly') {
        newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
      } else {
        newPeriodEnd.setDate(newPeriodEnd.getDate() + 365);
      }

      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'active',
          current_period_start: newPeriodStart.toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success(`Suscripción renovada por ${billingCycle === 'monthly' ? '30 días' : '1 año'}`);
      fetchAllData();
    } catch (error) {
      console.error('Error extending period:', error);
      toast.error('Error al renovar la suscripción');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Vista unificada de clientes, suscripciones y planes
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Suscripción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Suscripción</DialogTitle>
              <DialogDescription>
                Asigna un plan de suscripción a un cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={newSubscription.tenant_id}
                  onValueChange={(value) =>
                    setNewSubscription({ ...newSubscription, tenant_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={newSubscription.plan_id}
                  onValueChange={(value) =>
                    setNewSubscription({ ...newSubscription, plan_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price_monthly}/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ciclo de facturación</Label>
                <Select
                  value={newSubscription.billing_cycle}
                  onValueChange={(value: 'monthly' | 'yearly') =>
                    setNewSubscription({ ...newSubscription, billing_cycle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={newSubscription.start_date}
                  onChange={(e) =>
                    setNewSubscription({ ...newSubscription, start_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Días de trial (0 para ninguno)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newSubscription.trial_days}
                  onChange={(e) =>
                    setNewSubscription({
                      ...newSubscription,
                      trial_days: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={newSubscription.auto_renew}
                  onChange={(e) =>
                    setNewSubscription({ ...newSubscription, auto_renew: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="auto_renew">Renovación automática</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSubscription}>Crear Suscripción</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveTab('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientsCount}</div>
            <p className="text-xs text-muted-foreground">Todos los clientes</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveTab('active')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Suscripción</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Activas + Trials</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveTab('no-subscription')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Suscripción</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noSubscriptionCount}</div>
            <p className="text-xs text-muted-foreground">Clientes sin plan</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveTab('trials')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialsCount}</div>
            <p className="text-xs text-muted-foreground">
              {trialSubscriptions.filter((s) => s.trial_end_date && differenceInDays(new Date(s.trial_end_date), new Date()) < 7).length} vencen pronto
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveTab('changes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios Pendientes</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingChangesCount}
              {pendingChangesCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingChangesCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Todos los Clientes</TabsTrigger>
          <TabsTrigger value="active">Con Suscripción</TabsTrigger>
          <TabsTrigger value="no-subscription">
            Sin Suscripción
            {noSubscriptionCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {noSubscriptionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trials">Trials</TabsTrigger>
          <TabsTrigger value="changes">
            Cambios Pendientes
            {pendingChangesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingChangesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended">Suspendidas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Tab: Todos los Clientes */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Clientes</CardTitle>
              <CardDescription>
                {clients.length} clientes registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No hay clientes registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {client.name}
                            {!client.is_active && (
                              <Badge variant="outline" className="text-xs">Inactivo</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.tenant_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {client.subscription?.plan?.name || (
                            <span className="text-muted-foreground">Sin plan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.subscription 
                            ? getStatusBadge(client.subscription.status)
                            : <Badge variant="outline">Sin suscripción</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {client.subscription?.billing_cycle === 'monthly' ? 'Mensual' : 
                           client.subscription?.billing_cycle === 'yearly' ? 'Anual' : '-'}
                        </TableCell>
                        <TableCell>
                          {client.subscription?.current_period_end 
                            ? format(new Date(client.subscription.current_period_end), 'dd/MM/yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {client.subscription?.plan
                            ? `$${client.subscription.billing_cycle === 'monthly'
                                ? client.subscription.plan.price_monthly
                                : client.subscription.plan.price_yearly}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!client.subscription ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setNewSubscription({
                                    ...newSubscription,
                                    tenant_id: client.id,
                                  });
                                  setCreateDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Asignar plan
                              </Button>
                            ) : (
                              <>
                                {client.subscription.status === 'active' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(client.subscription!.id, client.subscription!.status)}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspender
                                  </Button>
                                ) : client.subscription.status === 'suspended' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(client.subscription!.id, client.subscription!.status)}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Activar
                                  </Button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sin Suscripción */}
        <TabsContent value="no-subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes sin Suscripción</CardTitle>
              <CardDescription>
                {clients.filter(c => !c.subscription).length} clientes sin plan asignado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.filter(c => !c.subscription).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Todos los clientes tienen suscripción asignada
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.filter(c => !c.subscription).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.tenant_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {client.is_active 
                            ? <Badge variant="default">Activo</Badge>
                            : <Badge variant="outline">Inactivo</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(client.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setNewSubscription({
                                ...newSubscription,
                                tenant_id: client.id,
                              });
                              setCreateDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Asignar plan
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Suspendidas */}
        <TabsContent value="suspended" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones Suspendidas</CardTitle>
              <CardDescription>
                {clients.filter(c => c.subscription?.status === 'suspended').length} suscripciones suspendidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.filter(c => c.subscription?.status === 'suspended').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay suscripciones suspendidas
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.filter(c => c.subscription?.status === 'suspended').map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.tenant_type}</Badge>
                        </TableCell>
                        <TableCell>{client.subscription?.plan?.name}</TableCell>
                        <TableCell>
                          {client.subscription?.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleToggleStatus(client.subscription!.id, 'suspended')}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Reactivar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Suscripciones Activas */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones Activas</CardTitle>
              <CardDescription>
                {activeSubscriptions.length} suscripciones activas o en trial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No hay suscripciones activas
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.tenant.name}</TableCell>
                        <TableCell>{sub.plan.name}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.current_period_start), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.current_period_end), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          ${sub.billing_cycle === 'monthly'
                            ? sub.plan.price_monthly
                            : sub.plan.price_yearly}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {sub.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(sub.id, sub.status)}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Suspender
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(sub.id, sub.status)}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Activar
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Ciclo de Facturación */}
        <TabsContent value="billing" className="space-y-6">
          {/* Suscriptores Mensuales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Suscriptores Mensuales
                  </CardTitle>
                  <CardDescription>
                    {monthlySubscriptions.length} suscripciones con renovación cada 30 días
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {monthlySubscriptions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Monto/Mes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No hay suscriptores mensuales activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySubscriptions
                      .sort((a, b) => new Date(a.current_period_end).getTime() - new Date(b.current_period_end).getTime())
                      .map((sub) => {
                        const endInfo = getDaysUntilEnd(sub.current_period_end);
                        return (
                          <TableRow key={sub.id} className={endInfo.days <= 7 ? 'bg-destructive/5' : ''}>
                            <TableCell className="font-medium">{sub.tenant.name}</TableCell>
                            <TableCell>{sub.plan.name}</TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>{format(new Date(sub.current_period_start), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="font-medium">
                              {format(new Date(sub.current_period_end), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold ${endInfo.color}`}>
                                {endInfo.label}
                              </span>
                              {endInfo.days <= 7 && endInfo.days > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Próximo a vencer
                                </Badge>
                              )}
                              {endInfo.days <= 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  Requiere pago
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>${sub.plan.price_monthly}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {sub.status === 'suspended' || endInfo.days <= 0 ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleExtendPeriod(sub.id, 'monthly')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Reactivar (+30 días)
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(sub.id, sub.status)}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspender
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Suscriptores Anuales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    Suscriptores Anuales
                  </CardTitle>
                  <CardDescription>
                    {yearlySubscriptions.length} suscripciones con renovación cada 365 días
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1 bg-green-600">
                  {yearlySubscriptions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Monto/Año</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlySubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No hay suscriptores anuales activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    yearlySubscriptions
                      .sort((a, b) => new Date(a.current_period_end).getTime() - new Date(b.current_period_end).getTime())
                      .map((sub) => {
                        const endInfo = getDaysUntilEnd(sub.current_period_end);
                        return (
                          <TableRow key={sub.id} className={endInfo.days <= 30 ? 'bg-yellow-500/5' : ''}>
                            <TableCell className="font-medium">{sub.tenant.name}</TableCell>
                            <TableCell>{sub.plan.name}</TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>{format(new Date(sub.current_period_start), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="font-medium">
                              {format(new Date(sub.current_period_end), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold ${endInfo.days <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {endInfo.days} días
                              </span>
                              {endInfo.days <= 30 && endInfo.days > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Próximo a vencer
                                </Badge>
                              )}
                              {endInfo.days <= 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  Requiere pago
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>${sub.plan.price_yearly}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {sub.status === 'suspended' || endInfo.days <= 0 ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleExtendPeriod(sub.id, 'yearly')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Reactivar (+1 año)
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(sub.id, sub.status)}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspender
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Trials Activos */}
        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trials Activos</CardTitle>
              <CardDescription>
                {trialSubscriptions.length} suscripciones en período de prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay trials activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    trialSubscriptions
                      .sort((a, b) => {
                        const daysA = differenceInDays(new Date(a.trial_end_date!), new Date());
                        const daysB = differenceInDays(new Date(b.trial_end_date!), new Date());
                        return daysA - daysB;
                      })
                      .map((sub) => {
                        const { days, color } = getTrialDaysRemaining(sub.trial_end_date!);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.tenant.name}</TableCell>
                            <TableCell>{sub.plan.name}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${color}`}>{days} días</span>
                              {days <= 7 && (
                                <Badge variant="destructive" className="ml-2">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Vence pronto
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.trial_end_date!), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleActivateTrial(sub.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activar Ahora
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExtendTrial(sub.id, sub.trial_end_date!, 15)}
                                >
                                  +15 días
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExtendTrial(sub.id, sub.trial_end_date!, 30)}
                                >
                                  +30 días
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelSubscription(sub.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cambios Pendientes */}
        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Cambio de Plan</CardTitle>
              <CardDescription>
                {pendingChanges.length} solicitudes pendientes de aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan Actual → Nuevo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingChanges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay cambios pendientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingChanges.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.tenant.name}</TableCell>
                        <TableCell>
                          {request.change_type === 'remove_addon' ? (
                            <span className="text-sm text-muted-foreground">Pack a eliminar</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{request.current_plan?.name || '-'}</span>
                              <span className="text-xs text-muted-foreground">↓</span>
                              <span className="text-sm font-medium">
                                {request.requested_plan?.name || '-'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getChangeTypeBadge(request.change_type)}
                          {request.change_type === 'replacement' && request.current_plan && request.requested_plan && (
                            <div className="mt-1">
                              {getChangeBadge(
                                request.current_plan.price_monthly,
                                request.requested_plan.price_monthly
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={request.reason}>
                            {request.reason}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveChange(request)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectChange(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
              <CardDescription>
                Suscripciones canceladas y cambios de plan procesados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay historial
                      </TableCell>
                    </TableRow>
                  ) : (
                    historicalItems.slice(0, 50).map((item) => {
                      const isSubscription = 'tenant_id' in item && 'plan_id' in item && 'billing_cycle' in item;
                      const isCancelled = isSubscription && item.status === 'cancelled';

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {isCancelled ? (
                              <Badge variant="outline">Cancelación</Badge>
                            ) : (
                              <Badge variant="secondary">Cambio de Plan</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {isSubscription ? item.tenant.name : (item as ChangeRequest).tenant.name}
                          </TableCell>
                          <TableCell>
                            {isCancelled ? (
                              <span className="text-sm">
                                Suscripción cancelada: {(item as Subscription).plan.name}
                              </span>
                            ) : (
                              <span className="text-sm">
                                {(item as ChangeRequest).current_plan.name} →{' '}
                                {(item as ChangeRequest).requested_plan.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCancelled ? (
                              getStatusBadge('cancelled')
                            ) : (
                              <Badge
                                variant={
                                  (item as ChangeRequest).status === 'approved'
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {(item as ChangeRequest).status === 'approved'
                                  ? 'Aprobado'
                                  : 'Rechazado'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
