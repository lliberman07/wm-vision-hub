import { useState, useEffect } from 'react';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { PMSPageWrapper } from '@/components/pms/PMSPageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';
import { useToast } from '@/hooks/use-toast';
import { PaymentReceiptUpload } from '@/components/subscription/PaymentReceiptUpload';
import { SubscriptionChangeDialog } from '@/components/client-admin/SubscriptionChangeDialog';
import { RemovePackDialog } from '@/components/subscription/RemovePackDialog';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Upload, Building2, Users, FileText, Package, TrendingUp, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
interface SubscriptionData {
  id: string;
  plan_id: string;
  status: string;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  billing_cycle: string;
  is_addon: boolean;
  subscription_code: string | null;
  subscription_plans: {
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_users: number | null;
    max_properties: number | null;
    max_contracts: number | null;
    max_branches: number | null;
  };
}
interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  billing_period_start: string;
  billing_period_end: string;
  payment_receipts?: {
    id: string;
    receipt_url: string;
    verification_status: string;
  }[];
}
interface UsageLimits {
  users: {
    current: number;
    limit: number;
  };
  properties: {
    current: number;
    limit: number;
  };
  contracts: {
    current: number;
    limit: number;
  };
  branches: {
    current: number;
    limit: number;
  };
}
export default function MySubscription() {
  const {
    currentTenant
  } = usePMS();
  const {
    toast
  } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);

  // Dialog states
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [changeDialogMode, setChangeDialogMode] = useState<'replacement' | 'addon'>('replacement');
  const [removePackDialog, setRemovePackDialog] = useState<{
    open: boolean;
    subscription: SubscriptionData | null;
  }>({
    open: false,
    subscription: null
  });
  const baseSubscription = subscriptions.find(s => !s.is_addon);
  const addonSubscriptions = subscriptions.filter(s => s.is_addon);
  useEffect(() => {
    if (currentTenant) {
      loadSubscriptionData();
    }
  }, [currentTenant]);
  const loadSubscriptionData = async () => {
    if (!currentTenant) return;
    try {
      // Cargar TODAS las suscripciones (base + addons)
      const {
        data: subData,
        error: subError
      } = await supabase.from('tenant_subscriptions').select(`
          *,
          subscription_code,
          subscription_plans (
            name,
            price_monthly,
            price_yearly,
            max_users,
            max_properties,
            max_contracts,
            max_branches
          )
        `).eq('tenant_id', currentTenant.id).in('status', ['active', 'trial', 'past_due']).order('is_addon', {
        ascending: true
      }).order('created_at', {
        ascending: true
      });
      if (subError) {
        console.error('Error fetching subscriptions:', subError);
        throw subError;
      }
      setSubscriptions((subData || []) as any);

      // Cargar facturas
      const {
        data: invoicesData,
        error: invError
      } = await supabase.from('subscription_invoices').select('*').eq('tenant_id', currentTenant.id).order('issue_date', {
        ascending: false
      }).limit(12);
      if (invError) throw invError;

      // Cargar comprobantes de pago para cada factura
      const invoicesWithReceipts = await Promise.all((invoicesData || []).map(async (invoice: any) => {
        const {
          data: receipts
        } = await supabase.from('payment_receipts').select('id, receipt_url, verification_status').eq('invoice_id', invoice.id);
        return {
          ...invoice,
          payment_receipts: receipts || []
        };
      }));
      setInvoices(invoicesWithReceipts as any);

      // Cargar límites de uso agregados
      const [usersRes, propsRes, contractsRes, branchesRes] = await Promise.all([supabase.rpc('check_tenant_limits', {
        p_tenant_id: currentTenant.id,
        p_resource_type: 'user'
      }), supabase.rpc('check_tenant_limits', {
        p_tenant_id: currentTenant.id,
        p_resource_type: 'property'
      }), supabase.rpc('check_tenant_limits', {
        p_tenant_id: currentTenant.id,
        p_resource_type: 'contract'
      }), supabase.rpc('check_tenant_limits', {
        p_tenant_id: currentTenant.id,
        p_resource_type: 'branch'
      })]);
      setUsageLimits({
        users: {
          current: (usersRes.data as any)?.current_count || 0,
          limit: (usersRes.data as any)?.limit || 0
        },
        properties: {
          current: (propsRes.data as any)?.current_count || 0,
          limit: (propsRes.data as any)?.limit || 0
        },
        contracts: {
          current: (contractsRes.data as any)?.current_count || 0,
          limit: (contractsRes.data as any)?.limit || 0
        },
        branches: {
          current: (branchesRes.data as any)?.current_count || 0,
          limit: (branchesRes.data as any)?.limit || 0
        }
      });
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la suscripción',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status: string) => {
    const variants: Record<string, {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }> = {
      trial: {
        label: 'Prueba',
        variant: 'secondary'
      },
      active: {
        label: 'Activo',
        variant: 'default'
      },
      suspended: {
        label: 'Suspendido',
        variant: 'destructive'
      },
      cancelled: {
        label: 'Cancelado',
        variant: 'outline'
      }
    };
    const config = variants[status] || {
      label: status,
      variant: 'outline'
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0 || limit >= 9999) return 0;
    return Math.min(current / limit * 100, 100);
  };
  const formatLimit = (limit: number | null) => {
    if (limit === null || limit >= 9999) return 'Ilimitado';
    return limit.toString();
  };
  const openChangeDialog = (mode: 'replacement' | 'addon') => {
    setChangeDialogMode(mode);
    setChangeDialogOpen(true);
  };
  if (loading) {
    return <PMSPageWrapper>
        <PMSLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center shadow-none bg-secondary-foreground opacity-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando suscripción...</p>
            </div>
          </div>
        </PMSLayout>
      </PMSPageWrapper>;
  }
  if (!baseSubscription) {
    return <PMSPageWrapper>
        <PMSLayout>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No se encontró información de suscripción</p>
            </CardContent>
          </Card>
        </PMSLayout>
      </PMSPageWrapper>;
  }
  const daysRemaining = baseSubscription.trial_end ? differenceInDays(new Date(baseSubscription.trial_end), new Date()) : null;
  const isTrialExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
  return <PMSPageWrapper>
      <PMSLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-2xl">Mi Suscripción</h1>
                <p className="text-muted-foreground text-sm md:text-base text-justify font-sans mx-[20px]">
                  Gestiona tu plan y facturación
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button variant="outline" onClick={() => openChangeDialog('replacement')} className="shadow-sm hover:shadow-md transition-shadow my-0">
                  Cambiar Plan Base
                </Button>
                <Button onClick={() => openChangeDialog('addon')} className="shadow-sm hover:shadow-md transition-shadow my-0">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Agregar Capacidad
                </Button>
              </div>
            </div>
          </div>

          {/* Alert de Trial Expirando */}
          {isTrialExpiringSoon && <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>¡Tu período de prueba está por expirar!</AlertTitle>
              <AlertDescription>
                Te quedan {daysRemaining} día{daysRemaining !== 1 ? 's' : ''} de prueba.
                Sube tu comprobante de pago para continuar con acceso completo.
              </AlertDescription>
            </Alert>}

          {/* Capacidad Actual Agregada */}
          {usageLimits && <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Tu Capacidad Actual
                </CardTitle>
                <CardDescription>
                  Límites agregados de tu plan base + packs adicionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{
                label: 'Propiedades Activas',
                key: 'properties' as const,
                icon: Building2
              }, {
                label: 'Contratos Activos',
                key: 'contracts' as const,
                icon: FileText
              }, {
                label: 'Usuarios',
                key: 'users' as const,
                icon: Users
              }, {
                label: 'Sucursales',
                key: 'branches' as const,
                icon: Building2
              }].map(({
                label,
                key,
                icon: Icon
              }) => {
                const usage = usageLimits[key];
                const percentage = getUsagePercentage(usage.current, usage.limit);
                const isNearLimit = percentage > 80;
                const isAtLimit = percentage >= 100;
                return <div key={key} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {usage.current} / {formatLimit(usage.limit)}
                        </div>
                        <Progress value={percentage} className={isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''} />
                        {isAtLimit && <p className="text-xs text-destructive">Límite alcanzado</p>}
                        {isNearLimit && !isAtLimit && <p className="text-xs text-yellow-600">Cerca del límite</p>}
                      </div>;
              })}
                </div>
              </CardContent>
            </Card>}

          {/* Planes y Packs Activos */}
          <Card>
            <CardHeader>
              <CardTitle>Planes y Packs Activos</CardTitle>
              <CardDescription>
                Detalle de tu plan base y packs adicionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propiedades</TableHead>
                    <TableHead>Contratos</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map(sub => <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.subscription_plans.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.is_addon ? 'secondary' : 'default'}>
                          {sub.is_addon ? 'Pack adicional' : 'Plan base'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>{formatLimit(sub.subscription_plans.max_properties)}</TableCell>
                      <TableCell>{formatLimit(sub.subscription_plans.max_contracts)}</TableCell>
                      <TableCell>{formatLimit(sub.subscription_plans.max_users)}</TableCell>
                      <TableCell>
                        ${sub.billing_cycle === 'monthly' ? sub.subscription_plans.price_monthly.toLocaleString() : sub.subscription_plans.price_yearly.toLocaleString()}
                        /{sub.billing_cycle === 'monthly' ? 'mes' : 'año'}
                      </TableCell>
                      <TableCell className="text-right">
                        {sub.is_addon && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setRemovePackDialog({
                      open: true,
                      subscription: sub
                    })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>}
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Estado de la Suscripción Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Estado del Plan Base</span>
                {getStatusBadge(baseSubscription.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código de Suscripción</p>
                  <p className="text-xl font-bold font-mono tracking-wider text-primary">
                    {baseSubscription.subscription_code || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan Actual</p>
                  <p className="text-xl font-bold">{baseSubscription.subscription_plans.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciclo de Facturación</p>
                  <p className="text-xl font-bold">
                    {baseSubscription.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}
                  </p>
                </div>
                {baseSubscription.trial_end && baseSubscription.status === 'trial' && <div>
                    <p className="text-sm text-muted-foreground">Trial termina</p>
                    <p className="text-xl font-bold">
                      {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}` : 'Expirado'}
                    </p>
                  </div>}
                <div>
                  <p className="text-sm text-muted-foreground">Período Vigente</p>
                  <p className="text-lg font-medium">
                    {format(new Date(baseSubscription.current_period_start), 'dd/MM/yyyy', {
                    locale: es
                  })} - {format(new Date(baseSubscription.current_period_end), 'dd/MM/yyyy', {
                    locale: es
                  })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                {baseSubscription.billing_cycle === 'monthly' ? 'Facturación mensual' : 'Facturación anual'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => {
                  const hasReceipt = invoice.payment_receipts && invoice.payment_receipts.length > 0;
                  const receiptStatus = hasReceipt ? invoice.payment_receipts[0].verification_status : null;
                  return <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {invoice.billing_period_start && invoice.billing_period_end ? <>
                              {format(new Date(invoice.billing_period_start), 'dd MMM', {
                          locale: es
                        })} -{' '}
                              {format(new Date(invoice.billing_period_end), 'dd MMM yyyy', {
                          locale: es
                        })}
                            </> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.currency} ${invoice.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {invoice.status === 'paid' ? <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Pagado
                            </Badge> : hasReceipt ? receiptStatus === 'verified' ? <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Verificado
                              </Badge> : receiptStatus === 'rejected' ? <Badge variant="destructive" className="gap-1">
                                Rechazado
                              </Badge> : <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                En revisión
                              </Badge> : <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pendiente
                            </Badge>}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy', {
                        locale: es
                      })}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.status === 'pending' && !hasReceipt && <Button size="sm" onClick={() => setUploadingInvoiceId(invoice.id)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Comprobante
                            </Button>}
                          {hasReceipt && receiptStatus === 'pending' && <Badge variant="outline">Comprobante enviado</Badge>}
                        </TableCell>
                      </TableRow>;
                })}
                  {invoices.length === 0 && <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay facturas registradas
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Upload Receipt Dialog */}
          {uploadingInvoiceId && <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
                <div className="relative">
                  <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10" onClick={() => setUploadingInvoiceId(null)}>
                    ✕
                  </Button>
                  <PaymentReceiptUpload invoiceId={uploadingInvoiceId} tenantId={currentTenant!.id} amount={invoices.find(i => i.id === uploadingInvoiceId)?.amount || 0} onSuccess={() => {
                setUploadingInvoiceId(null);
                loadSubscriptionData();
              }} />
                </div>
              </div>
            </div>}

          {/* Change Plan Dialog */}
          {baseSubscription && <SubscriptionChangeDialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen} currentPlanId={baseSubscription.plan_id} currentPlanName={baseSubscription.subscription_plans.name} tenantId={currentTenant!.id} billingCycle={baseSubscription.billing_cycle as 'monthly' | 'yearly'} initialChangeType={changeDialogMode} onSuccess={loadSubscriptionData} />}

          {/* Remove Pack Dialog */}
          {removePackDialog.subscription && <RemovePackDialog open={removePackDialog.open} onOpenChange={open => setRemovePackDialog({
          ...removePackDialog,
          open
        })} subscriptionId={removePackDialog.subscription.id} planName={removePackDialog.subscription.subscription_plans.name} planLimits={{
          max_properties: removePackDialog.subscription.subscription_plans.max_properties,
          max_contracts: removePackDialog.subscription.subscription_plans.max_contracts,
          max_users: removePackDialog.subscription.subscription_plans.max_users,
          max_branches: removePackDialog.subscription.subscription_plans.max_branches
        }} tenantId={currentTenant!.id} onSuccess={loadSubscriptionData} />}
        </div>
      </PMSLayout>
    </PMSPageWrapper>;
}