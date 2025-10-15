import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, FileText, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  description?: string;
  receipt_url?: string;
  paid_by: string;
  attributable_to: string;
  status: string;
  contract_id: string;
}

interface ExpenseApprovalDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ExpenseApprovalDialog = ({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: ExpenseApprovalDialogProps) => {
  const [loading, setLoading] = useState(false);

  if (!expense) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      // 1. Actualizar estado del gasto a 'approved'
      const { error: updateError } = await supabase
        .from('pms_expenses')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', expense.id);

      if (updateError) throw updateError;

      // 2. Llamar función para descontar del próximo pago
      const { error: deductError } = await supabase.rpc(
        'deduct_approved_expense_from_next_payment',
        { expense_id_param: expense.id }
      );

      if (deductError) {
        console.error('Error al descontar:', deductError);
        toast.warning('Gasto aprobado pero no se pudo descontar automáticamente. Verifique los pagos pendientes.');
      } else {
        toast.success('Gasto aprobado y descontado de la próxima cuota');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al aprobar gasto:', error);
      toast.error('Error al aprobar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pms_expenses')
        .update({
          status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success('Gasto rechazado');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al rechazar gasto:', error);
      toast.error('Error al rechazar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar Gasto del Inquilino</DialogTitle>
          <DialogDescription>
            Apruebe o rechace el gasto reportado por el inquilino
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Categoría</div>
              <Badge variant="outline">{expense.category}</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Monto</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                ${expense.amount.toLocaleString('es-AR')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha del Gasto
            </div>
            <div>{format(new Date(expense.expense_date), 'PPP', { locale: es })}</div>
          </div>

          {expense.description && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Descripción</div>
              <p className="text-sm p-3 bg-muted/50 rounded-md">{expense.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Atribución</div>
            <Badge variant={expense.attributable_to === 'propietario' ? 'default' : 'secondary'}>
              {expense.attributable_to === 'propietario'
                ? 'Atribuible al Propietario (se descontará de la cuota)'
                : 'No atribuible al Propietario'}
            </Badge>
          </div>

          {expense.receipt_url && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recibo Adjunto
              </div>
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Ver recibo →
              </a>
            </div>
          )}

          {expense.attributable_to === 'propietario' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Al aprobar este gasto, se descontará automáticamente ${expense.amount.toLocaleString('es-AR')} de la próxima cuota pendiente del inquilino.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {expense.attributable_to === 'propietario' ? 'Aprobar y Descontar' : 'Aprobar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
