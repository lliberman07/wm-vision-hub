import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { ReceiptUpload } from './ReceiptUpload';

interface TenantExpenseFormProps {
  contractId: string;
  tenantId: string;
  propertyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TenantExpenseForm = ({
  contractId,
  tenantId,
  propertyId,
  onSuccess,
  onCancel,
}: TenantExpenseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [attributableToPropietario, setAttributableToPropietario] = useState<boolean>(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !amount || !expenseDate) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('pms_expenses').insert({
        contract_id: contractId,
        tenant_id: tenantId,
        property_id: propertyId,
        category,
        amount: parseFloat(amount),
        expense_date: expenseDate,
        description,
        currency: 'ARS',
        paid_by: 'inquilino',
        attributable_to: attributableToPropietario ? 'propietario' : 'inquilino',
        status: 'pending',
        receipt_url: receiptUrl,
      });

      if (error) throw error;

      toast.success(
        attributableToPropietario
          ? 'Gasto registrado. Pendiente de aprobación del propietario.'
          : 'Gasto registrado exitosamente.'
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error al registrar gasto:', error);
      toast.error('Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Reparaciones">Reparaciones</SelectItem>
            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="Servicios">Servicios</SelectItem>
            <SelectItem value="Expensas">Expensas</SelectItem>
            <SelectItem value="Otros">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto (ARS) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense_date">Fecha del Gasto *</Label>
        <Input
          id="expense_date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles del gasto..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Recibo</Label>
        <ReceiptUpload onUploadComplete={(url) => setReceiptUrl(url)} />
        {receiptUrl && (
          <p className="text-xs text-green-600">✓ Recibo cargado</p>
        )}
      </div>

      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="attributable"
          checked={attributableToPropietario}
          onCheckedChange={(checked) => setAttributableToPropietario(checked as boolean)}
        />
        <Label htmlFor="attributable" className="cursor-pointer">
          Este gasto es atribuible al propietario (será descontado de la próxima cuota si se aprueba)
        </Label>
      </div>

      {attributableToPropietario && (
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          ℹ️ Si el propietario aprueba este gasto, se descontará automáticamente de tu próxima cuota de alquiler.
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Registrando...' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  );
};
