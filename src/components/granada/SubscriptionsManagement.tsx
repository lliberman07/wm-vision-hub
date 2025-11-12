import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
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

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_tenant_subscriptions')
        .select(`
          id,
          tenant_id,
          plan_id,
          status,
          start_date,
          end_date,
          trial_end_date,
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

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de suscripciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Suscripciones
            </CardTitle>
            <CardDescription>
              Administrar suscripciones de clientes
            </CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Suscripción
          </Button>
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
              <TableHead>Fin Prueba</TableHead>
              <TableHead>Monto</TableHead>
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
                  {subscription.end_date
                    ? format(new Date(subscription.end_date), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {subscription.trial_end_date
                    ? format(new Date(subscription.trial_end_date), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {subscription.plan.currency} ${subscription.plan.price.toLocaleString()}
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
  );
}
