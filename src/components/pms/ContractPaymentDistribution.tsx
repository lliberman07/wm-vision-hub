import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/numberFormat';

interface Owner {
  id: string;
  full_name: string;
  share_percent: number;
}

interface ContractPaymentDistributionProps {
  contractId: string;
  propertyId: string;
  monto_a?: number;
  monto_b?: number;
  monto_ajustado_actual_a?: number;
  monto_ajustado_actual_b?: number;
  forma_pago_item_a?: string;
  forma_pago_item_b?: string;
  currency?: string;
}

export function ContractPaymentDistribution({
  contractId,
  propertyId,
  monto_a,
  monto_b,
  monto_ajustado_actual_a,
  monto_ajustado_actual_b,
  forma_pago_item_a = 'Efectivo',
  forma_pago_item_b = 'Efectivo',
  currency = 'ARS'
}: ContractPaymentDistributionProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwners();
  }, [propertyId]);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_owner_properties')
        .select(`
          owner_id,
          share_percent,
          pms_owners (
            id,
            full_name
          )
        `)
        .eq('property_id', propertyId)
        .is('end_date', null);

      if (error) throw error;

      const ownersData = data?.map(op => ({
        id: op.owner_id,
        full_name: (op.pms_owners as any)?.full_name || 'Unknown',
        share_percent: op.share_percent
      })) || [];

      setOwners(ownersData);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'Transferencia': 'Transferencia',
      'Efectivo': 'Efectivo',
      'Cheque': 'Cheque',
      'transfer': 'Transferencia',
      'cash': 'Efectivo',
      'check': 'Cheque'
    };
    return methods[method] || method;
  };

  const formatCurrencyValue = (amount: number) => {
    return formatCurrency(amount, 'es', currency as 'ARS' | 'USD');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (owners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay propietarios asignados a esta propiedad
          </p>
        </CardContent>
      </Card>
    );
  }

  const montoItemA = monto_ajustado_actual_a || monto_a || 0;
  const montoItemB = monto_ajustado_actual_b || monto_b || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Pagos a Propietarios</CardTitle>
        <CardDescription>
          Distribución automática basada en porcentajes de propiedad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {montoItemA > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Badge variant="outline">Item A</Badge>
              <span className="text-sm font-normal text-muted-foreground">
                {getPaymentMethodLabel(forma_pago_item_a)}
              </span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map(owner => (
                  <TableRow key={`${owner.id}-A`}>
                    <TableCell>{owner.full_name}</TableCell>
                    <TableCell>{owner.share_percent}%</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyValue(montoItemA * (owner.share_percent / 100))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={2}>Total Item A</TableCell>
                  <TableCell className="text-right">{formatCurrencyValue(montoItemA)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {montoItemB > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Badge variant="outline">Item B</Badge>
              <span className="text-sm font-normal text-muted-foreground">
                {getPaymentMethodLabel(forma_pago_item_b)}
              </span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map(owner => (
                  <TableRow key={`${owner.id}-B`}>
                    <TableCell>{owner.full_name}</TableCell>
                    <TableCell>{owner.share_percent}%</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyValue(montoItemB * (owner.share_percent / 100))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={2}>Total Item B</TableCell>
                  <TableCell className="text-right">{formatCurrencyValue(montoItemB)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
