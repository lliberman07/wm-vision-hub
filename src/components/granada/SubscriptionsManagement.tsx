import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Plus, Edit, Ban, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  billing_cycle: string;
  auto_renew: boolean;
  created_at: string;
  tenant: {
    name: string;
    client_type: string;
  };
  plan: {
    name: string;
    price: number;
    currency: string;
  };
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  max_properties: number | null;
  max_contracts: number | null;
  max_client_admins: number;
  is_active: boolean;
}

interface Tenant {
  id: string;
  name: string;
  client_type: string;
}

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tenant_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    trial_days: '0',
    auto_renew: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('pms_subscription_plans' as any)
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData as any || []);

      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('pms_tenants')
        .select('id, name, client_type')
        .order('name');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('pms_tenant_subscriptions' as any)
        .select(`
          id,
          tenant_id,
          plan_id,
          status,
          start_date,
          end_date,
          trial_end_date,
          billing_cycle,
          auto_renew,
          created_at,
          tenant:tenant_id (
            name,
            client_type
          ),
          plan:plan_id (
            name,
            price,
            currency
          )
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscriptions(subsData as any || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const startDate = new Date(formData.start_date);
      const trialDays = parseInt(formData.trial_days);
      
      let trialEndDate = null;
      if (trialDays > 0) {
        const trialEnd = new Date(startDate);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        trialEndDate = trialEnd.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pms_tenant_subscriptions' as any)
        .insert({
          tenant_id: formData.tenant_id,
          plan_id: formData.plan_id,
          status: trialDays > 0 ? 'trial' : 'active',
          start_date: formData.start_date,
          trial_end_date: trialEndDate,
          billing_cycle: formData.billing_cycle,
          auto_renew: formData.auto_renew,
        });

      if (error) throw error;

      toast({
        title: 'Suscripción creada',
        description: 'La suscripción ha sido creada exitosamente',
      });

      setDialogOpen(false);
      setFormData({
        tenant_id: '',
        plan_id: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        trial_days: '0',
        auto_renew: true,
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la suscripción',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('pms_tenant_subscriptions' as any)
        .update({ status: newStatus })
        .eq('id', subId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Suscripción ${newStatus === 'active' ? 'activada' : 'suspendida'} correctamente`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return;

    try {
      const { error } = await supabase
        .from('pms_tenant_subscriptions' as any)
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', subId);

      if (error) throw error;

      toast({
        title: 'Suscripción cancelada',
        description: 'La suscripción ha sido cancelada',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activa',
      trial: 'Prueba',
      suspended: 'Suspendida',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestión de Suscripciones
              </CardTitle>
              <CardDescription>
                Administrar suscripciones de clientes y planes
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Suscripción
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleCreateSubscription}>
                  <DialogHeader>
                    <DialogTitle>Crear Suscripción</DialogTitle>
                    <DialogDescription>
                      Asignar un plan de suscripción a un cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tenant">Cliente *</Label>
                      <Select
                        value={formData.tenant_id}
                        onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name} ({tenant.client_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="plan">Plan *</Label>
                      <Select
                        value={formData.plan_id}
                        onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - {plan.currency} ${plan.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billing_cycle">Ciclo de Facturación *</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Fecha de Inicio *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="trial_days">Días de Prueba</Label>
                      <Input
                        id="trial_days"
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = sin período de prueba
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto_renew"
                        checked={formData.auto_renew}
                        onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="auto_renew" className="cursor-pointer">
                        Renovación automática
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Crear Suscripción
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                <TableHead>Fin Prueba</TableHead>
                <TableHead>Renovación</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.tenant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subscription.tenant.client_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{subscription.plan.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {getStatusLabel(subscription.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(subscription.start_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {subscription.trial_end_date
                      ? format(new Date(subscription.trial_end_date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {subscription.auto_renew ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    {subscription.plan.currency} ${subscription.plan.price.toLocaleString()}/{subscription.billing_cycle === 'monthly' ? 'mes' : subscription.billing_cycle === 'quarterly' ? 'trim' : 'año'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {subscription.status !== 'cancelled' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(subscription.id, subscription.status)}
                            title={subscription.status === 'active' ? 'Suspender' : 'Activar'}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription.id)}
                            title="Cancelar"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {subscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay suscripciones registradas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
