import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OwnerNetIncomeReportProps {
  tenantId: string;
  selectedProperty: string;
}

interface OwnerTotal {
  owner_id: string;
  full_name: string;
  share_percent: number;
  total_income: number;
  total_expenses: number;
  net_result: number;
  currency: string;
}

export const OwnerNetIncomeReport = ({ tenantId, selectedProperty }: OwnerNetIncomeReportProps) => {
  const [ownerTotals, setOwnerTotals] = useState<OwnerTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId && selectedProperty) {
      fetchOwnerTotals();
    }
  }, [tenantId, selectedProperty]);

  const fetchOwnerTotals = async () => {
    setLoading(true);
    try {
      // 1. Obtener ingresos distribuidos por propietario
      const { data: distributions, error: distError } = await supabase
        .from('pms_payment_distributions')
        .select(`
          owner_id,
          amount,
          share_percent,
          currency,
          pms_owners!inner(full_name)
        `)
        .eq('tenant_id', tenantId);

      if (distError) throw distError;

      // 2. Obtener gastos totales de la propiedad
      const { data: expenses, error: expError } = await supabase
        .from('pms_expenses')
        .select('amount, currency')
        .eq('property_id', selectedProperty)
        .neq('status', 'rejected');

      if (expError) throw expError;

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0;

      // 3. Obtener propietarios actuales con sus porcentajes
      const { data: owners, error: ownersError } = await supabase
        .from('pms_owner_properties')
        .select(`
          owner_id,
          share_percent,
          pms_owners!inner(full_name)
        `)
        .eq('property_id', selectedProperty)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      if (ownersError) throw ownersError;

      // 4. Agrupar distribuciones por propietario
      const incomeByOwner = new Map<string, { total: number; share: number; name: string }>();
      
      distributions?.forEach((dist: any) => {
        const existing = incomeByOwner.get(dist.owner_id) || { total: 0, share: 0, name: '' };
        incomeByOwner.set(dist.owner_id, {
          total: existing.total + Number(dist.amount || 0),
          share: dist.share_percent,
          name: dist.pms_owners.full_name
        });
      });

      // 5. Calcular totales por propietario
      const totals: OwnerTotal[] = owners?.map((owner: any) => {
        const income = incomeByOwner.get(owner.owner_id)?.total || 0;
        const ownerExpenses = totalExpenses * (owner.share_percent / 100);
        
        return {
          owner_id: owner.owner_id,
          full_name: owner.pms_owners.full_name,
          share_percent: owner.share_percent,
          total_income: income,
          total_expenses: ownerExpenses,
          net_result: income - ownerExpenses,
          currency: 'ARS'
        };
      }) || [];

      setOwnerTotals(totals);
    } catch (error) {
      console.error('Error fetching owner totals:', error);
      setOwnerTotals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Totales por Propietario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (ownerTotals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Totales por Propietario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay datos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Totales por Propietario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-center">Participación</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Gastos</TableHead>
              <TableHead className="text-right">Resultado Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownerTotals.map((owner) => (
              <TableRow key={owner.owner_id}>
                <TableCell className="font-medium">{owner.full_name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{owner.share_percent}%</Badge>
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  ${formatCurrency(owner.total_income)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  ${formatCurrency(owner.total_expenses)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={owner.net_result >= 0 ? 'default' : 'destructive'}>
                    ${formatCurrency(owner.net_result)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2}>TOTAL</TableCell>
              <TableCell className="text-right text-green-600">
                ${formatCurrency(ownerTotals.reduce((sum, o) => sum + o.total_income, 0))}
              </TableCell>
              <TableCell className="text-right text-red-600">
                ${formatCurrency(ownerTotals.reduce((sum, o) => sum + o.total_expenses, 0))}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={
                  ownerTotals.reduce((sum, o) => sum + o.net_result, 0) >= 0 
                    ? 'default' 
                    : 'destructive'
                }>
                  ${formatCurrency(ownerTotals.reduce((sum, o) => sum + o.net_result, 0))}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
