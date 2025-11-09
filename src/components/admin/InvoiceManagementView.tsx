import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Upload, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  tenant_subscriptions: {
    pms_tenants: {
      name: string;
    };
  };
}

export default function InvoiceManagementView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paidDate, setPaidDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select(`
          *,
          tenant_subscriptions!inner(
            pms_tenants!inner(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, paidDate }: { invoiceId: string; paidDate: string }) => {
      const { error } = await supabase
        .from('subscription_invoices')
        .update({
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Factura marcada como pagada" });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPaymentDialogOpen(false);
      setProofFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo marcar la factura", variant: "destructive" });
    }
  });

  const handleFileUpload = async () => {
    if (!proofFile || !selectedInvoice) return null;

    setUploading(true);
    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `payment-proof-${selectedInvoice.id}-${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: "Error al subir archivo", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice) return;

    markAsPaidMutation.mutate({
      invoiceId: selectedInvoice.id,
      paidDate: paidDate || new Date().toISOString()
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Pagada</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencida</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
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
          <CardTitle>Gestión de Facturas</CardTitle>
          <CardDescription>
            Marca facturas como pagadas y sube comprobantes de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.tenant_subscriptions.pms_tenants.name}</TableCell>
                  <TableCell>
                    {invoice.currency} ${invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.paid_date 
                      ? format(new Date(invoice.paid_date), 'dd/MM/yyyy', { locale: es })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaidDate(new Date().toISOString().split('T')[0]);
                          setPaymentDialogOpen(true);
                        }}
                      >
                        Marcar Pagada
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {invoices?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay facturas registradas
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Factura como Pagada</DialogTitle>
            <DialogDescription>
              Registra el pago y opcionalmente sube el comprobante
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paid_date">Fecha de Pago</Label>
              <Input
                id="paid_date"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
