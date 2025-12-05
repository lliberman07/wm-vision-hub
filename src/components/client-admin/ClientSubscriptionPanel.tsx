import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, AlertCircle, TrendingUp, FileText, Upload, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SubscriptionChangeDialog } from './SubscriptionChangeDialog';
import { PaymentReceiptUpload } from '@/components/subscription/PaymentReceiptUpload';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  currency: string;
  status: string;
  payment_proof_url?: string | null;
  payment_reference?: string | null;
  payment_receipts?: {
    id: string;
    receipt_url: string;
    verification_status: string;
    payment_date: string;
  }[];
}

interface ChangeRequest {
  id: string;
  requested_plan_name: string;
  current_plan_name: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reason: string | null;
}

export function ClientSubscriptionPanel() {
  const { clientData, subscription } = useClient();
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadData();
  }, [clientData]);

  const loadData = async () => {
    if (!clientData) return;

    try {
      // Load usage limits
      const limitsPromises = ['user', 'property', 'contract', 'branch'].map(async (type) => {
        const { data } = await supabase.rpc('check_tenant_limits' as any, {
          p_tenant_id: clientData.id,
          p_resource_type: type
        });
        return { type, data };
      });

      const limitsResults = await Promise.all(limitsPromises);
      const limits = limitsResults.reduce((acc, { type, data }) => {
        const limitData = data as any;
        acc[`${type}s` as keyof UsageLimits] = {
          current: limitData?.current_count || 0,
          limit: limitData?.limit
        };
        return acc;
      }, {} as UsageLimits);

      setUsageLimits(limits);

      // Load invoices with payment receipts
      const { data: invoicesWithReceipts, error: joinError } = await supabase
        .from('subscription_invoices')
        .select(`
          *,
          payment_receipts (
            id,
            receipt_url,
            verification_status,
            payment_date
          )
        `)
        .eq('tenant_id', clientData.id)
        .order('issue_date', { ascending: false })
        .limit(10);

      if (!joinError && invoicesWithReceipts) {
        setInvoices(invoicesWithReceipts as any[]);
      } else if (joinError) {
        // Fallback: try to get invoices without receipts join
        console.warn('Error loading invoices with receipts, trying fallback:', joinError);
        const { data: simpleInvoices, error: simpleError } = await supabase
          .from('subscription_invoices')
          .select('*')
          .eq('tenant_id', clientData.id)
          .order('issue_date', { ascending: false })
          .limit(10);
        
        if (!simpleError && simpleInvoices) {
          setInvoices(simpleInvoices.map(inv => ({ ...inv, payment_receipts: [] })) as any[]);
        } else {
          console.error('Error loading invoices:', simpleError);
        }
      }

      // Load change requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('subscription_change_requests')
        .select(`
          *,
          current_plan:subscription_plans!subscription_change_requests_current_plan_id_fkey(name),
          requested_plan:subscription_plans!subscription_change_requests_requested_plan_id_fkey(name)
        `)
        .eq('tenant_id', clientData.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (!requestsError && requestsData) {
        setChangeRequests(requestsData.map((req: any) => ({
          id: req.id,
          requested_plan_name: req.requested_plan?.name || 'N/A',
          current_plan_name: req.current_plan?.name || 'N/A',
          status: req.status,
          requested_at: req.requested_at,
          reviewed_at: req.reviewed_at,
          reason: req.reason
        })));
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

  const getChangeStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUploadClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    setSelectedInvoice(null);
    loadData();
    toast.success('Comprobante subido correctamente. Será verificado por nuestro equipo.');
  };

  const getReceiptStatus = (invoice: Invoice) => {
    if (!invoice.payment_receipts || invoice.payment_receipts.length === 0) {
      return null;
    }
    const latest = invoice.payment_receipts[0];
    return latest.verification_status;
  };

  const getReceiptStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-xs"><Clock className="h-3 w-3" /> En revisión</Badge>;
      case 'verified':
        return <Badge className="gap-1 text-xs bg-green-600"><CheckCircle className="h-3 w-3" /> Verificado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> Rechazado</Badge>;
      default:
        return null;
    }
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
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadge(subscription.status).variant}>
                {getStatusBadge(subscription.status).label}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setChangeDialogOpen(true)}
                disabled={changeRequests.some(r => r.status === 'pending')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Cambiar Plan
              </Button>
            </div>
          </div>
          {changeRequests.some(r => r.status === 'pending') && (
            <p className="text-sm text-muted-foreground mt-2">
              Ya tienes una solicitud de cambio de plan pendiente de revisión.
            </p>
          )}
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
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay facturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const receiptStatus = getReceiptStatus(invoice);
                  const canUpload = invoice.status !== 'paid' && receiptStatus !== 'pending' && receiptStatus !== 'verified';
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.issue_date).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString('es-AR')} {invoice.currency}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(invoice.status).variant}>
                          {getStatusBadge(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {receiptStatus ? (
                            <>
                              {getReceiptStatusBadge(receiptStatus)}
                              {invoice.payment_receipts?.[0]?.receipt_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(invoice.payment_receipts![0].receipt_url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : canUpload ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUploadClick(invoice)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Informar Pago
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
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

      {/* Change Requests History */}
      {changeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Cambio de Plan</CardTitle>
            <CardDescription>Historial de solicitudes de cambio de suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan Actual</TableHead>
                  <TableHead>Plan Solicitado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Revisado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.requested_at), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>{request.current_plan_name}</TableCell>
                    <TableCell className="font-medium">{request.requested_plan_name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={request.reason || ''}>
                      {request.reason || '-'}
                    </TableCell>
                    <TableCell>{getChangeStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.reviewed_at 
                        ? format(new Date(request.reviewed_at), "dd/MM/yyyy", { locale: es })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Subscription Change Dialog */}
      {subscription && clientData && (
        <SubscriptionChangeDialog
          open={changeDialogOpen}
          onOpenChange={setChangeDialogOpen}
          currentPlanId={subscription.plan_id}
          currentPlanName={subscription.plan_name}
          tenantId={clientData.id}
          billingCycle="monthly"
          onSuccess={loadData}
        />
      )}

      {/* Upload Receipt Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informar Pago</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Factura: {selectedInvoice.invoice_number} - ${selectedInvoice.amount.toLocaleString('es-AR')} {selectedInvoice.currency}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && clientData && (
            <PaymentReceiptUpload
              invoiceId={selectedInvoice.id}
              tenantId={clientData.id}
              amount={selectedInvoice.amount}
              onSuccess={handleUploadSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
