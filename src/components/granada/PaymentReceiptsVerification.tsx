import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentReceipt {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  receipt_url: string;
  verification_status: string;
  verification_notes: string | null;
  uploaded_by: string;
  created_at: string;
  subscription_invoices: {
    invoice_number: string;
    amount: number;
    currency: string;
    subscription_id: string;
    tenant_subscriptions: {
      tenant_id: string;
      billing_cycle: string;
      pms_tenants: {
        name: string;
        admin_email: string;
      };
    };
  };
}

export function PaymentReceiptsVerification() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_receipts')
        .select(`
          *,
          subscription_invoices!inner (
            invoice_number,
            amount,
            currency,
            subscription_id,
            tenant_subscriptions!inner (
              tenant_id,
              billing_cycle,
              pms_tenants!inner (
                name,
                admin_email
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data as any);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comprobantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (receiptId: string, status: 'verified' | 'rejected') => {
    try {
      setProcessing(true);

      // Update receipt status
      const { error: receiptError } = await supabase
        .from('payment_receipts')
        .update({
          verification_status: status,
          verification_notes: verificationNotes || null,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', receiptId);

      if (receiptError) throw receiptError;

      // If verified, update invoice status to paid
      if (status === 'verified') {
        const receipt = receipts.find(r => r.id === receiptId);
        if (receipt) {
          const { error: invoiceError } = await supabase
            .from('subscription_invoices')
            .update({
              status: 'paid',
              paid_date: receipt.payment_date,
              payment_method: 'transferencia',
            })
            .eq('id', receipt.invoice_id);

          if (invoiceError) throw invoiceError;

          // Activate subscription if it was suspended
          const { data: subscription } = await supabase
            .from('tenant_subscriptions')
            .select('status')
            .eq('id', receipt.subscription_invoices.subscription_id)
            .single();

          if (subscription && (subscription.status === 'suspended' || subscription.status === 'past_due')) {
            const { error: subError } = await supabase
              .from('tenant_subscriptions')
              .update({ status: 'active' })
              .eq('id', receipt.subscription_invoices.subscription_id);

            if (subError) console.error('Error activating subscription:', subError);
          }
        }
      }

      toast({
        title: status === 'verified' ? 'Comprobante Verificado' : 'Comprobante Rechazado',
        description: status === 'verified' 
          ? 'La factura ha sido marcada como pagada y la suscripción activada'
          : 'El comprobante ha sido rechazado',
      });

      setSelectedReceipt(null);
      setVerificationNotes('');
      fetchReceipts();
    } catch (error) {
      console.error('Error verifying receipt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la verificación',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verificado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Pendiente
          </Badge>
        );
    }
  };

  const pendingReceipts = receipts.filter(r => r.verification_status === 'pending');
  const processedReceipts = receipts.filter(r => r.verification_status !== 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobantes Pendientes de Verificación</CardTitle>
          <CardDescription>
            Comprobantes de pago enviados por los clientes que requieren revisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReceipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay comprobantes pendientes de verificación</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Fecha Subida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {receipt.subscription_invoices.tenant_subscriptions.pms_tenants.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {receipt.subscription_invoices.tenant_subscriptions.pms_tenants.admin_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {receipt.subscription_invoices.invoice_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {receipt.subscription_invoices.currency} ${receipt.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(receipt.payment_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(receipt.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobantes Procesados</CardTitle>
          <CardDescription>
            Historial de comprobantes verificados o rechazados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedReceipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay comprobantes procesados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      {receipt.subscription_invoices.tenant_subscriptions.pms_tenants.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {receipt.subscription_invoices.invoice_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {receipt.subscription_invoices.currency} ${receipt.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.verification_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {receipt.verification_notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verificar Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Revisa el comprobante y verifica o rechaza el pago
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">
                    {selectedReceipt.subscription_invoices.tenant_subscriptions.pms_tenants.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {selectedReceipt.subscription_invoices.tenant_subscriptions.pms_tenants.admin_email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Factura</p>
                  <p className="font-mono font-medium">
                    {selectedReceipt.subscription_invoices.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto</p>
                  <p className="font-medium">
                    {selectedReceipt.subscription_invoices.currency} ${selectedReceipt.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de Pago</p>
                  <p className="font-medium">
                    {format(new Date(selectedReceipt.payment_date), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ciclo de Facturación</p>
                  <p className="font-medium">
                    {selectedReceipt.subscription_invoices.tenant_subscriptions.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Comprobante de Pago</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a href={selectedReceipt.receipt_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Comprobante
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas de Verificación (opcional)</Label>
                <Textarea
                  placeholder="Agrega notas sobre la verificación..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedReceipt(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReceipt && handleVerify(selectedReceipt.id, 'rejected')}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rechazar
            </Button>
            <Button
              onClick={() => selectedReceipt && handleVerify(selectedReceipt.id, 'verified')}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Verificar y Activar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
