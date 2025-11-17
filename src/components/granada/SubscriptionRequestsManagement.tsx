import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  created_at: string;
  current_period_start: string;
  current_period_end: string;
  trial_end_date: string | null;
  tenant_name: string;
  plan_name: string;
  user_count: number;
}

export function SubscriptionRequestsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      const { data: subsData, error: subsError } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          subscription_plans(name),
          pms_tenants(name)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      const { data: userCounts, error: userError } = await supabase
        .from('pms_client_users')
        .select('tenant_id')
        .eq('is_active', true);

      if (userError) throw userError;

      const userCountMap = (userCounts || []).reduce((acc: any, item: any) => {
        acc[item.tenant_id] = (acc[item.tenant_id] || 0) + 1;
        return acc;
      }, {});

      const formattedData = (subsData || []).map((sub: any) => ({
        id: sub.id,
        tenant_id: sub.tenant_id,
        plan_id: sub.plan_id,
        status: sub.status,
        billing_cycle: sub.billing_cycle,
        created_at: sub.created_at,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        trial_end_date: sub.trial_end_date,
        tenant_name: sub.pms_tenants?.name || 'N/A',
        plan_name: sub.subscription_plans?.name || 'N/A',
        user_count: userCountMap[sub.tenant_id] || 0
      }));

      setSubscriptions(formattedData);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, trialEndDate: string | null) => {
    if (status === 'trial' && trialEndDate) {
      const daysLeft = Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Trial ({daysLeft} días)</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Activa</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Suspendida</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suscripciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trial</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suscripciones de Clientes</CardTitle>
          <CardDescription>
            Vista de todas las suscripciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay suscripciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Inicio Período</TableHead>
                  <TableHead>Fin Período</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.tenant_name}</TableCell>
                    <TableCell>{subscription.plan_name}</TableCell>
                    <TableCell className="capitalize">
                      {subscription.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                    </TableCell>
                    <TableCell>{subscription.user_count}</TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status, subscription.trial_end_date)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscription.current_period_start), "d 'de' MMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscription.current_period_end), "d 'de' MMM, yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
