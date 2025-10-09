import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id?: string;
  payment_method: string;
  percentage: number;
  destination_account: string;
  notes: string;
  item: string;
}

interface ContractPaymentMethodsProps {
  contractId: string;
}

export function ContractPaymentMethods({ contractId }: ContractPaymentMethodsProps) {
  const { currentTenant } = usePMS();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [newMethod, setNewMethod] = useState<PaymentMethod>({
    payment_method: 'transfer',
    percentage: 100,
    destination_account: '',
    notes: '',
    item: 'UNICO',
  });

  useEffect(() => {
    if (contractId) {
      fetchMethods();
    }
  }, [contractId]);

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from('pms_contract_payment_methods')
      .select('*')
      .eq('contract_id', contractId);

    if (error) {
      toast.error('Error al cargar métodos de pago');
      return;
    }

    if (data) setMethods(data);
  };

  const handleAdd = async () => {
    if (!newMethod.payment_method) {
      toast.error('Selecciona un método de pago');
      return;
    }

    const totalPercentage = methods.reduce((sum, m) => sum + Number(m.percentage), 0);
    
    if (totalPercentage + Number(newMethod.percentage) > 100) {
      toast.error('La suma de porcentajes no puede exceder 100%');
      return;
    }

    try {
      const { error } = await supabase
        .from('pms_contract_payment_methods')
        .insert([{
          contract_id: contractId,
          tenant_id: currentTenant?.id,
          payment_method: newMethod.payment_method,
          percentage: newMethod.percentage,
          destination_account: newMethod.destination_account,
          notes: newMethod.notes,
          item: newMethod.item,
        }]);

      if (error) throw error;

      toast.success('Método de pago agregado');
      setNewMethod({
        payment_method: 'transfer',
        percentage: 100 - totalPercentage - Number(newMethod.percentage),
        destination_account: '',
        notes: '',
        item: 'UNICO',
      });
      fetchMethods();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pms_contract_payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Método eliminado');
      fetchMethods();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const totalPercentage = methods.reduce((sum, m) => sum + Number(m.percentage), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago del Contrato</CardTitle>
        <CardDescription>
          Define cómo se distribuyen los pagos entre propietarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label>Método</Label>
            <Select
              value={newMethod.payment_method}
              onValueChange={(value) => setNewMethod({ ...newMethod, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>% Distribución</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={newMethod.percentage}
              onChange={(e) => setNewMethod({ ...newMethod, percentage: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>Cuenta Destino</Label>
            <Input
              value={newMethod.destination_account}
              onChange={(e) => setNewMethod({ ...newMethod, destination_account: e.target.value })}
              placeholder="CBU/Alias"
            />
          </div>

          <div>
            <Label>Item</Label>
            <Select
              value={newMethod.item}
              onValueChange={(value) => setNewMethod({ ...newMethod, item: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNICO">ÚNICO</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>

        <div className="text-sm">
          Total asignado: <strong>{totalPercentage}%</strong>
          {totalPercentage !== 100 && (
            <span className="text-destructive ml-2">
              (Debe sumar 100%)
            </span>
          )}
        </div>

        {methods.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Item</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="capitalize">{method.payment_method}</TableCell>
                  <TableCell>{method.percentage}%</TableCell>
                  <TableCell>{method.destination_account || '-'}</TableCell>
                  <TableCell>{method.item}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(method.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
