import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ActivateContractDialogProps {
  contractId: string;
  contractNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ActivateContractDialog({
  contractId,
  contractNumber,
  open,
  onOpenChange,
  onSuccess,
}: ActivateContractDialogProps) {
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const { error } = await supabase.rpc('activate_contract', {
        contract_id_param: contractId,
      });

      if (error) throw error;

      toast.success('Contrato activado correctamente');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error activating contract:', error);
      toast.error(error.message || 'Error al activar contrato');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Activar contrato {contractNumber}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Al activar este contrato se realizarán las siguientes acciones:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Se generarán las proyecciones mensuales de pagos</li>
              <li>Se creará el calendario de pagos por propietario</li>
              <li>La propiedad pasará a estado "Alquilada"</li>
              <li>Los datos críticos del contrato ya no podrán modificarse</li>
            </ul>
            <p className="font-medium text-foreground mt-4">
              Esta acción requiere que el contrato tenga:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Al menos un propietario asignado</li>
              <li>Métodos de pago configurados (100%)</li>
              <li>Índices económicos si requiere ajustes</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isActivating}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleActivate} disabled={isActivating}>
            {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activar Contrato
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
