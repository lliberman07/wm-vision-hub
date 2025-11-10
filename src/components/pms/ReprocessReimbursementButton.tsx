import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReprocessReimbursementButtonProps {
  expense: {
    id: string;
    category: string;
    amount: number;
    contract_id: string;
    property_id: string;
    tenant_id: string;
    currency: string;
    expense_date: string;
    is_reimbursable: boolean;
  };
  onSuccess?: () => void;
}

export function ReprocessReimbursementButton({ 
  expense, 
  onSuccess 
}: ReprocessReimbursementButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReprocess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-reimbursement-schedule-item',
        { body: { expense } }
      );

      if (error) throw error;

      toast({
        title: "Reembolso reprocesado",
        description: `Se crearon ${data?.itemsCreated || 0} ítems de calendario exitosamente`,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error reprocessing reimbursement:', error);
      toast({
        title: "Error al reprocesar",
        description: error.message || "No se pudo crear los ítems de calendario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reprocesar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reprocesar Reembolso</AlertDialogTitle>
          <AlertDialogDescription>
            Esto intentará crear nuevamente los ítems de calendario de pago para este gasto reembolsable.
            <br /><br />
            <strong>Gasto:</strong> {expense.category}
            <br />
            <strong>Monto:</strong> ${expense.amount.toLocaleString('es-AR')} {expense.currency}
            <br />
            <strong>Fecha:</strong> {new Date(expense.expense_date).toLocaleDateString('es-AR')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReprocess} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
