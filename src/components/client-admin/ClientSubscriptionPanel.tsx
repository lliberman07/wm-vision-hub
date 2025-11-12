import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, AlertCircle, TrendingUp, FileText, Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UsageLimits {
  users: { current: number; limit: number | null };
  properties: { current: number; limit: number | null };
  contracts: { current: number; limit: number | null };
  branches: { current: number; limit: number | null };
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  status: string;
  payment_proof_url: string | null;
}

export function ClientSubscriptionPanel() {
  const { clientData, subscription } = useClient();
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clientData]);

  const loadData = async () => {
    if (!clientData) return;

    try {
      // Load usage limits
      const limitsPromises = ['user', 'property', 'contract', 'branch'].map(async (type) => {
        const { data } = await supabase.rpc('check_tenant_limits', {
          p_tenant_id: clientData.id,
          p_resource_type: type
        });
        return { type, data };
      });

      const limitsResults = await Promise.all(limitsPromises);
      const limits = limitsResults.reduce((acc, { type, data }) => {
        acc[`${type}s` as keyof UsageLimits] = {
          current: data?.current_count || 0,
          limit: data?.limit
        };
        return acc;
      }, {} as UsageLimits);

      setUsageLimits(limits);

      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('tenant_id', clientData.id)
        .order('issue_date', { ascending: false })
        .limit(10);

      if (!invoicesError) {
        setInvoices(invoicesData || []);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      active: { label: 'Activa', variant: 'default' },
      trial: { label: 'Prueba', variant: 'secondary' },
      expired: { label: 'Vencida', variant: 'destructive' },
      suspended: { label: 'Suspendida', variant: 'destructive' },
      paid: { label: 'Pagada', variant: 'default' },
      pending: { label: 'Pendiente', variant: 'secondary' },
      overdue: { label: 'Vencida', variant: 'destructive' },
    };
    return config[status] || { label: status, variant: 'outline' };
  };

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (!limit) return 0;
    return (current / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-orange-500';
    return 'text-primary';
  };

  const requestPlanChange = async () => {
    toast.info('Funcionalidad próximamente disponible');
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Suscripción</CardTitle>
          <CardDescription>No hay una suscripción activa</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Suscripción</h2>
        <p className="text-muted-foreground">Gestiona tu plan y facturación</p>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{subscription.plan_name}</CardTitle>
              <CardDescription>Plan actual</CardDescription>
            </div>
            <Badge variant={getStatusBadge(subscription.status).variant}>
              {getStatusBadge(subscription.status).label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Inicio</div>
                <div className="text-muted-foreground">
                  {new Date(subscription.start_date).toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>
            
            {subscription.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">Fin</div>
                  <div className="text-muted-foreground">
                    {new Date(subscription.end_date).toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {subscription.is_trial && subscription.trial_end_date && (
            <div className="flex items-center gap-2 p-4 bg-secondary rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <div className="text-sm">
                Período de prueba finaliza el {new Date(subscription.trial_end_date).toLocaleDateString('es-AR')}
              </div>
            </div>
          )}

          <Button onClick={requestPlanChange} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Solicitar Cambio de Plan
          </Button>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      {usageLimits && (
        <Card>
          <CardHeader>
            <CardTitle>Límites de Uso</CardTitle>
            <CardDescription>Uso actual vs límites del plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(usageLimits).map(([key, value]) => {
              const percentage = getUsagePercentage(value.current, value.limit);
              const label = {
                users: 'Usuarios',
                properties: 'Propiedades',
                contracts: 'Contratos',
                branches: 'Sucursales'
              }[key] || key;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className={getUsageColor(percentage)}>
                      {value.current} / {value.limit || '∞'}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Facturas y comprobantes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Factura</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprobante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{new Date(invoice.issue_date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>${invoice.amount.toLocaleString('es-AR')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(invoice.status).variant}>
                      {getStatusBadge(invoice.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.payment_proof_url ? (
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
