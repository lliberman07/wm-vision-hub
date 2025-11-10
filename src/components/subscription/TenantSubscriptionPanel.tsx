import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, CreditCard, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TenantSubscriptionPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = usePMS();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['tenant-subscription', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return null;

      const { data, error } = await supabase.rpc('get_tenant_subscription_status', {
        p_tenant_id: currentTenant.id
      });

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant
  });

  const { data: pendingInvoices } = useQuery({
    queryKey: ['pending-invoices', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return [];

      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ invoiceId, file }: { invoiceId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${invoiceId}-${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);

      // Update invoice with proof URL
      const { error: updateError } = await supabase
        .from('subscription_invoices')
        .update({ 
          payment_reference: data.publicUrl,
          notes: 'Comprobante subido por el tenant - Pendiente de verificación'
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      return data.publicUrl;
    },
    onSuccess: () => {
      toast({ title: "Comprobante subido", description: "El equipo revisará tu pago pronto" });
      queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
      setUploadDialogOpen(false);
      setProofFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo subir el comprobante", variant: "destructive" });
    }
  });

  const handleUploadProof = async () => {
    if (!proofFile || !selectedInvoiceId) return;

    setUploading(true);
    try {
      await uploadProofMutation.mutateAsync({ invoiceId: selectedInvoiceId, file: proofFile });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscriptionData || !(subscriptionData as any)?.has_subscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes una suscripción activa. Contacta al administrador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const data: any = subscriptionData;
  const { subscription, plan, usage } = data;
  const daysRemaining = subscription?.days_remaining || 0;
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  const isSuspended = subscription?.status === 'suspended';

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Suscripción</CardTitle>
              <CardDescription>Plan {plan?.name}</CardDescription>
            </div>
            <Badge variant={isActive ? "default" : isTrial ? "secondary" : "destructive"}>
              {isTrial ? `Prueba (${daysRemaining} días)` : 
               isActive ? 'Activa' : 
               isSuspended ? 'Suspendida' : subscription?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrial && (
            <Alert className={daysRemaining <= 3 ? "border-destructive" : ""}>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                {daysRemaining > 0 
                  ? `Tu período de prueba finaliza en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}. Asegúrate de realizar el pago para continuar.`
                  : 'Tu período de prueba ha finalizado. Realiza el pago para continuar usando el sistema.'
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Ciclo de facturación</Label>
              <p className="font-medium capitalize">{subscription?.billing_cycle}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Próximo pago</Label>
              <p className="font-medium">
                {subscription?.current_period_end 
                  ? format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: es })
                  : '-'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Uso del Plan</CardTitle>
          <CardDescription>Límites y recursos utilizados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usuarios</span>
              <span className="text-muted-foreground">{usage?.user_count || 0} / {plan?.max_users}</span>
            </div>
            <Progress value={(usage?.user_count || 0) / (plan?.max_users || 1) * 100} />
          </div>

          {plan?.max_properties && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Propiedades</span>
                <span className="text-muted-foreground">
                  {usage?.property_count || 0} / {plan.max_properties === 999999 ? '∞' : plan.max_properties}
                </span>
              </div>
              {plan.max_properties !== 999999 && (
                <Progress value={(usage?.property_count || 0) / plan.max_properties * 100} />
              )}
            </div>
          )}

          {plan?.max_contracts && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Contratos</span>
                <span className="text-muted-foreground">
                  {usage?.contract_count || 0} / {plan.max_contracts === 999999 ? '∞' : plan.max_contracts}
                </span>
              </div>
              {plan.max_contracts !== 999999 && (
                <Progress value={(usage?.contract_count || 0) / plan.max_contracts * 100} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invoices */}
      {pendingInvoices && pendingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Facturas Pendientes</CardTitle>
            <CardDescription>Paga para mantener tu suscripción activa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">ARS ${invoice.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Vence: {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'outline'}>
                    {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                  </Badge>
                </div>

                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <p><strong>Datos bancarios:</strong></p>
                  <p>Titular: WM Property Management</p>
                  <p>CBU: XXXXXXXXXXXXXXXXXXXXXXXX</p>
                  <p>Alias: WM.PROPERTY.MP</p>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedInvoiceId(invoice.id);
                    setUploadDialogOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Comprobante de Pago
                </Button>

                {invoice.payment_reference && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Comprobante enviado - En verificación
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Sube el comprobante de transferencia para que podamos verificar tu pago
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proof">Comprobante (imagen o PDF)</Label>
              <Input
                id="proof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              {proofFile && (
                <p className="text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 inline mr-1" />
                  {proofFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir Comprobante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
