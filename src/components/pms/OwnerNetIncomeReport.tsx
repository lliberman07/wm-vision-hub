import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OwnerNetIncomeReportProps {
  tenantId: string;
  selectedContract: string;
}

interface MonthlyOwnerData {
  period: string;
  owner_id: string;
  full_name: string;
  share_percent: number;
  income: number;
  expenses: number;
  net_result: number;
}

export const OwnerNetIncomeReport = ({ tenantId, selectedContract }: OwnerNetIncomeReportProps) => {
  const [ownerTotals, setOwnerTotals] = useState<MonthlyOwnerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId && selectedContract) {
      fetchOwnerTotals();
    }
  }, [tenantId, selectedContract]);

  const fetchOwnerTotals = async () => {
    setLoading(true);
    try {
      // 1. Obtener cashflow del contrato (ya tiene datos mes a mes)
      const { data: cashflow, error: cashflowError } = await supabase
        .from('pms_cashflow_property')
        .select('*')
        .eq('contract_id', selectedContract)
        .order('period', { ascending: false })
        .limit(12);

      if (cashflowError) throw cashflowError;

      // 2. Obtener información del contrato
      const { data: contract } = await supabase
        .from('pms_contracts')
        .select('property_id')
        .eq('id', selectedContract)
        .single();

      if (!contract) {
        setOwnerTotals([]);
        return;
      }

      // 3. Obtener propietarios del contrato
      const { data: owners } = await supabase
        .from('pms_owner_properties')
        .select('owner_id, share_percent, pms_owners!inner(full_name)')
        .eq('property_id', contract.property_id)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      // 4. Para cada período, distribuir según propietarios
      const monthlyData: MonthlyOwnerData[] = [];
      
      cashflow?.forEach(cf => {
        owners?.forEach((owner: any) => {
          monthlyData.push({
            period: cf.period,
            owner_id: owner.owner_id,
            full_name: owner.pms_owners.full_name,
            share_percent: owner.share_percent,
            income: (cf.total_income * owner.share_percent) / 100,
            expenses: (cf.total_expenses * owner.share_percent) / 100,
            net_result: ((cf.total_income - cf.total_expenses) * owner.share_percent) / 100
          });
        });
      });

      setOwnerTotals(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
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

  const groupByPeriod = (data: MonthlyOwnerData[]) => {
    return data.reduce((acc, item) => {
      if (!acc[item.period]) {
        acc[item.period] = [];
      }
      acc[item.period].push(item);
      return acc;
    }, {} as Record<string, MonthlyOwnerData[]>);
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
              <TableHead>Período</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-center">%</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Gastos</TableHead>
              <TableHead className="text-right">Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupByPeriod(ownerTotals)).map(([period, periodData]) => (
              <>
                {periodData.map((data, index) => (
                  <TableRow key={`${period}-${data.owner_id}`}>
                    {index === 0 && (
                      <TableCell rowSpan={periodData.length} className="font-bold align-top">
                        {period}
                      </TableCell>
                    )}
                    <TableCell className="bg-muted/30">{data.full_name}</TableCell>
                    <TableCell className="text-center bg-muted/30">
                      <Badge variant="outline">{data.share_percent}%</Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600 bg-muted/30">
                      ${formatCurrency(data.income)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 bg-muted/30">
                      ${formatCurrency(data.expenses)}
                    </TableCell>
                    <TableCell className="text-right bg-muted/30">
                      <Badge variant={data.net_result >= 0 ? 'default' : 'destructive'}>
                        ${formatCurrency(data.net_result)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-primary/10">
                  <TableCell colSpan={3}>Subtotal {period}</TableCell>
                  <TableCell className="text-right text-green-600">
                    ${formatCurrency(periodData.reduce((sum, d) => sum + d.income, 0))}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    ${formatCurrency(periodData.reduce((sum, d) => sum + d.expenses, 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={periodData.reduce((sum, d) => sum + d.net_result, 0) >= 0 ? 'default' : 'destructive'}>
                      ${formatCurrency(periodData.reduce((sum, d) => sum + d.net_result, 0))}
                    </Badge>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
