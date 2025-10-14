import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CancelContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
  onSuccess: () => void;
}

export function CancelContractDialog({ open, onOpenChange, contract, onSuccess }: CancelContractDialogProps) {
  const [cancellationDate, setCancellationDate] = useState<Date>();
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!cancellationDate || !cancellationReason.trim()) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('cancel_contract', {
        contract_id_param: contract.id,
        cancellation_date_param: format(cancellationDate, 'yyyy-MM-dd'),
        cancellation_reason_param: cancellationReason,
        cancelled_by_param: userData.user?.id
      });

      if (error) throw error;

      toast.success('Contrato cancelado exitosamente');
      onSuccess();
      onOpenChange(false);
      setCancellationDate(undefined);
      setCancellationReason('');
    } catch (error: any) {
      toast.error('Error al cancelar contrato', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Contrato</DialogTitle>
          <DialogDescription>
            Contrato #{contract?.contract_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Advertencia:</strong> Esta acción cancelará el contrato y todas las cuotas pendientes desde la fecha de cancelación.
              Los pagos ya realizados se mantendrán registrados.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Fecha de Cancelación *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !cancellationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {cancellationDate ? format(cancellationDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={cancellationDate}
                  onSelect={setCancellationDate}
                  disabled={(date) =>
                    date < new Date(contract?.start_date) || date > new Date(contract?.end_date)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Motivo de Cancelación *</Label>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ej: Falta de pago, rescisión anticipada por mutuo acuerdo, etc."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
            {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
