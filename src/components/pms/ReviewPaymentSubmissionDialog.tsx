import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { formatDateDisplay, formatDateToDisplay } from "@/utils/dateUtils";

interface ReviewPaymentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
  onSuccess: () => void;
}

export function ReviewPaymentSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: ReviewPaymentSubmissionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('approve_payment_submission', {
        submission_id_param: submission.id,
      });

      if (error) throw error;

      toast.success('Pago aprobado y registrado exitosamente');
      onSuccess();
    } catch (error: any) {
      toast.error('Error al aprobar pago', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('pms_payment_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success('Pago rechazado. Se notificará al inquilino.');
      onSuccess();
    } catch (error: any) {
      toast.error('Error al rechazar pago', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar Pago Informado</DialogTitle>
          <DialogDescription>
            Verifique los detalles del pago informado por el inquilino
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Inquilino</Label>
              <p className="font-medium">{submission.contract.tenant_renter.full_name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Contrato</Label>
              <p className="font-medium">{submission.contract.contract_number}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Mes</Label>
              <p className="font-medium">
                {formatDateDisplay(submission.schedule_item.period_date)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Propietario</Label>
              <p className="font-medium">{submission.schedule_item.owner.full_name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Monto Esperado</Label>
              <p className="font-medium">
                ${submission.schedule_item.expected_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Monto Pagado</Label>
              <p className="font-medium text-green-600">
                ${submission.paid_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Fecha de Pago</Label>
              <p className="font-medium">
                {formatDateDisplay(submission.paid_date)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Método de Pago</Label>
              <p className="font-medium">{submission.payment_method}</p>
            </div>
            {submission.reference_number && (
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Número de Referencia</Label>
                <p className="font-medium">{submission.reference_number}</p>
              </div>
            )}
            {submission.notes && (
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Notas</Label>
                <p className="text-sm">{submission.notes}</p>
              </div>
            )}
          </div>

          {submission.receipt_url && (
            <div className="border rounded-lg p-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Comprobante Adjunto</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <a
                  href={submission.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Ver comprobante
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {action === 'reject' && submission.status === 'pending' && (
            <div>
              <Label htmlFor="rejection_reason">Motivo del Rechazo *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique el motivo del rechazo..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {submission.status === 'pending' && (
            <>
              {action === 'reject' ? (
                <>
                  <Button variant="outline" onClick={() => setAction(null)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirmar Rechazo
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cerrar
                  </Button>
                  <Button variant="destructive" onClick={() => setAction('reject')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button variant="default" onClick={handleApprove} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar y Registrar
                  </Button>
                </>
              )}
            </>
          )}
          {submission.status !== 'pending' && (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
