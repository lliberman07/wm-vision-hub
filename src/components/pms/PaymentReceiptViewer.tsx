import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, Mail, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateDisplay } from '@/utils/dateUtils';

interface PaymentReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
}

export function PaymentReceiptViewer({ open, onOpenChange, paymentId }: PaymentReceiptViewerProps) {
  const [receipt, setReceipt] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (open && paymentId) {
      fetchReceiptData();
    }
  }, [open, paymentId]);

  const fetchReceiptData = async () => {
    setLoading(true);
    try {
      // Obtener recibo
      const { data: receiptData, error: receiptError } = await supabase
        .from('pms_payment_receipts' as any)
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();

      if (receiptError) throw receiptError;

      if (receiptData) {
        setReceipt(receiptData);

        // Obtener logs de emails
        const receiptId = (receiptData as any).id;
        const { data: logsData, error: logsError } = await supabase
          .from('pms_receipt_email_logs' as any)
          .select('*')
          .eq('receipt_id', receiptId)
          .order('sent_at', { ascending: false });

        if (logsError) throw logsError;
        setEmailLogs(logsData || []);
      } else {
        setReceipt(null);
        setEmailLogs([]);
      }
    } catch (error: any) {
      console.error('Error fetching receipt data:', error);
      toast.error('Error al cargar el recibo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receipt?.pdf_url) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(receipt.pdf_url);

      if (error) throw error;

      // Crear blob y descargar
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Recibo descargado correctamente');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el recibo');
    } finally {
      setDownloading(false);
    }
  };

  const handleResendEmails = async () => {
    if (!receipt?.id) return;

    setResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-payment-receipt-emails', {
        body: { receipt_id: receipt.id },
      });

      if (error) throw error;

      toast.success('Emails reenviados correctamente');
      await fetchReceiptData(); // Recargar logs
    } catch (error: any) {
      console.error('Error resending emails:', error);
      toast.error('Error al reenviar emails');
    } finally {
      setResending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Generado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Fallido</Badge>;
      case 'bounced':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Rebotado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'tenant':
        return 'Inquilino';
      case 'owner':
        return 'Propietario';
      case 'staff':
        return 'Staff';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recibo de Pago
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando recibo...
          </div>
        ) : !receipt ? (
          <div className="py-8 text-center text-muted-foreground">
            No se encontró el recibo para este pago
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del Recibo */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{receipt.receipt_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Fecha: {formatDateDisplay(receipt.receipt_date)}
                  </p>
                </div>
                {getStatusBadge(receipt.status)}
              </div>

              {receipt.pdf_generated_at && (
                <p className="text-sm text-muted-foreground">
                  Generado: {new Date(receipt.pdf_generated_at).toLocaleString('es-AR')}
                </p>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading || receipt.status !== 'generated'}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? 'Descargando...' : 'Descargar PDF'}
                </Button>

                <Button
                  onClick={handleResendEmails}
                  disabled={resending || receipt.status !== 'generated'}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {resending ? 'Reenviando...' : 'Reenviar Emails'}
                </Button>
              </div>
            </div>

            {/* Logs de Envío de Emails */}
            {emailLogs.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Historial de Envíos</h4>
                <div className="space-y-2">
                  {emailLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start justify-between p-3 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.recipient_email}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRecipientTypeLabel(log.recipient_type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.sent_at).toLocaleString('es-AR')}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1">
                            Error: {log.error_message}
                          </p>
                        )}
                      </div>
                      <div>
                        {getEmailStatusBadge(log.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {receipt.metadata && Object.keys(receipt.metadata).length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Información Adicional</h4>
                <div className="text-sm space-y-1">
                  {receipt.metadata.file_size && (
                    <p>Tamaño del archivo: {(receipt.metadata.file_size / 1024).toFixed(2)} KB</p>
                  )}
                  {receipt.metadata.generated_by && (
                    <p>Generado por: {receipt.metadata.generated_by}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
