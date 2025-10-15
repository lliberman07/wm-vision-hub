import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

interface ExpenseDeductionReversalProps {
  expenseId: string;
  expenseAmount: number;
  onSuccess: () => void;
}

export const ExpenseDeductionReversal = ({
  expenseId,
  expenseAmount,
  onSuccess,
}: ExpenseDeductionReversalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReverse = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('reverse_expense_deduction', {
        expense_id_param: expenseId,
      });

      if (error) throw error;

      toast.success('Deducción revertida. El monto se restauró en la cuota.');
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error al reversar deducción:', error);
      toast.error(error.message || 'Error al reversar la deducción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reversar Descuento
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reversar descuento del gasto?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta acción revertirá el descuento de <strong>${expenseAmount.toLocaleString('es-AR')}</strong> que se aplicó a la cuota del inquilino.
              </p>
              <p className="text-yellow-600 dark:text-yellow-400">
                ⚠️ El monto se restaurará en la próxima cuota y el gasto quedará marcado como "Rechazado".
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. ¿Está seguro?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReverse}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Revirtiendo...' : 'Sí, Reversar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
