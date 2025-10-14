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
import { RefreshCw } from 'lucide-react';

interface PaymentMethod {
  id?: string;
  payment_method: string;
  percentage: number;
  destination_account: string;
  notes: string;
  item: string;
  owner_id?: string;
  owner_name?: string;
}

interface ContractPaymentMethodsProps {
  contractId: string;
  propertyId?: string;
  montoA?: number;
  montoB?: number;
}

export function ContractPaymentMethods({ contractId, propertyId, montoA, montoB }: ContractPaymentMethodsProps) {
  const { currentTenant } = usePMS();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generateAutomaticMethods = async () => {
    if (!propertyId) {
      toast.error('No se puede generar automáticamente sin propiedad');
      return;
    }

    setIsGenerating(true);
    try {
      // Obtener propietarios de la propiedad
      const { data: owners, error: ownersError } = await supabase
        .from('pms_owner_properties')
        .select(`
          owner_id,
          share_percent,
          pms_owners (
            full_name
          )
        `)
        .eq('property_id', propertyId)
        .is('end_date', null);

      if (ownersError) throw ownersError;

      if (!owners || owners.length === 0) {
        toast.error('No hay propietarios asignados a esta propiedad');
        setIsGenerating(false);
        return;
      }

      // Eliminar métodos existentes
      await supabase
        .from('pms_contract_payment_methods')
        .delete()
        .eq('contract_id', contractId);

      // Generar líneas para cada propietario y cada item activo
      const newMethods: any[] = [];

      owners.forEach((owner: any) => {
        // Si hay Item A
        if (montoA && montoA > 0) {
          newMethods.push({
            contract_id: contractId,
            tenant_id: currentTenant?.id,
            payment_method: 'transfer',
            percentage: owner.share_percent,
            destination_account: '',
            notes: `Propietario: ${owner.pms_owners?.full_name || 'Desconocido'}`,
            item: 'A',
          });
        }

        // Si hay Item B
        if (montoB && montoB > 0) {
          newMethods.push({
            contract_id: contractId,
            tenant_id: currentTenant?.id,
            payment_method: 'transfer',
            percentage: owner.share_percent,
            destination_account: '',
            notes: `Propietario: ${owner.pms_owners?.full_name || 'Desconocido'}`,
            item: 'B',
          });
        }
      });

      if (newMethods.length > 0) {
        const { error: insertError } = await supabase
          .from('pms_contract_payment_methods')
          .insert(newMethods);

        if (insertError) throw insertError;

        toast.success('Métodos de pago generados automáticamente');
        await fetchMethods();
      }
    } catch (error: any) {
      toast.error('Error al generar métodos', { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (id: string, field: 'payment_method' | 'destination_account', value: string) => {
    try {
      const { error } = await supabase
        .from('pms_contract_payment_methods')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast.success('Método actualizado');
      await fetchMethods();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const totalPercentageByItem = (item: string) => 
    methods.filter(m => m.item === item).reduce((sum, m) => sum + Number(m.percentage), 0);

  const calculateAmount = (item: string, percentage: number) => {
    const baseAmount = item === 'A' ? (montoA || 0) : (montoB || 0);
    return baseAmount * (percentage / 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago del Contrato</CardTitle>
        <CardDescription>
          Define cómo se distribuyen los pagos entre propietarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button 
            onClick={generateAutomaticMethods} 
            disabled={isGenerating || !propertyId}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generar Automáticamente
          </Button>
        </div>

        {methods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay métodos de pago configurados. Usa el botón "Generar Automáticamente" para crearlos basándose en los propietarios.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {montoA && montoA > 0 && (
                <div className="text-sm">
                  <strong>Item A:</strong> Total asignado: <strong>{totalPercentageByItem('A')}%</strong>
                  {totalPercentageByItem('A') !== 100 && (
                    <span className="text-destructive ml-2">
                      (Debe sumar 100%)
                    </span>
                  )}
                </div>
              )}
              {montoB && montoB > 0 && (
                <div className="text-sm">
                  <strong>Item B:</strong> Total asignado: <strong>{totalPercentageByItem('B')}%</strong>
                  {totalPercentageByItem('B') !== 100 && (
                    <span className="text-destructive ml-2">
                      (Debe sumar 100%)
                    </span>
                  )}
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Cuenta Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.item}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{method.notes}</TableCell>
                    <TableCell>{method.percentage}%</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(calculateAmount(method.item, method.percentage))}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={method.payment_method}
                        onValueChange={(value) => handleUpdate(method.id!, 'payment_method', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="check">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={method.destination_account || ''}
                        onChange={(e) => handleUpdate(method.id!, 'destination_account', e.target.value)}
                        placeholder="CBU/Alias"
                        className="w-[180px]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
