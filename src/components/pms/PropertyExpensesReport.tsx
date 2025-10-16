import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyExpensesReportProps {
  propertyId: string;
  tenantId: string;
}

interface MonthlyExpense {
  period: string;
  total_expenses: number;
  distributions: {
    owner_name: string;
    owner_id: string;
    share_percent: number;
    attributed_amount: number;
  }[];
}

export const PropertyExpensesReport = ({ propertyId, tenantId }: PropertyExpensesReportProps) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId && tenantId) {
      fetchExpenses();
    }
  }, [propertyId, tenantId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // 1. Fetch gastos sin contrato de los últimos 12 meses
      const { data: expenses, error: expensesError } = await supabase
        .from('pms_expenses')
        .select('expense_date, amount, category')
        .eq('property_id', propertyId)
        .is('contract_id', null)
        .neq('status', 'rejected')
        .gte('expense_date', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0])
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // 2. Agrupar por mes
      const expensesByPeriod = new Map<string, number>();
      expenses?.forEach(expense => {
        const period = new Date(expense.expense_date).toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit' });
        const current = expensesByPeriod.get(period) || 0;
        expensesByPeriod.set(period, current + Number(expense.amount));
      });

      // 3. Fetch propietarios de la propiedad
      const { data: owners, error: ownersError } = await supabase
        .from('pms_owner_properties')
        .select(`
          owner_id,
          share_percent,
          pms_owners!inner(full_name)
        `)
        .eq('property_id', propertyId)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      if (ownersError) throw ownersError;

      // 4. Crear estructura de datos mes a mes
      const monthlyData: MonthlyExpense[] = Array.from(expensesByPeriod.entries()).map(([period, total]) => ({
        period,
        total_expenses: total,
        distributions: owners?.map((owner: any) => ({
          owner_name: owner.pms_owners.full_name,
          owner_id: owner.owner_id,
          share_percent: owner.share_percent,
          attributed_amount: (total * owner.share_percent) / 100
        })) || []
      }));

      setMonthlyExpenses(monthlyData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMonthlyExpenses([]);
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
            <Building2 className="h-5 w-5" />
            Gastos de Propiedad (Sin Contrato)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (monthlyExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gastos de Propiedad (Sin Contrato)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay gastos registrados sin contrato activo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gastos de Propiedad (Sin Contrato)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-center">Participación</TableHead>
              <TableHead className="text-right">Total Gastos</TableHead>
              <TableHead className="text-right">Monto Atribuido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyExpenses.map((monthData) => (
              <>
                {monthData.distributions.map((dist, index) => (
                  <TableRow key={`${monthData.period}-${dist.owner_id}`}>
                    {index === 0 && (
                      <TableCell 
                        rowSpan={monthData.distributions.length} 
                        className="font-bold align-top"
                      >
                        {monthData.period}
                      </TableCell>
                    )}
                    <TableCell className="bg-muted/30">{dist.owner_name}</TableCell>
                    <TableCell className="text-center bg-muted/30">
                      <Badge variant="outline">{dist.share_percent}%</Badge>
                    </TableCell>
                    {index === 0 && (
                      <TableCell 
                        rowSpan={monthData.distributions.length} 
                        className="text-right text-red-600 font-medium align-top"
                      >
                        ${formatCurrency(monthData.total_expenses)}
                      </TableCell>
                    )}
                    <TableCell className="text-right text-red-600 bg-muted/30">
                      ${formatCurrency(dist.attributed_amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-destructive/10">
                  <TableCell colSpan={3}>Subtotal {monthData.period}</TableCell>
                  <TableCell className="text-right text-red-600">
                    ${formatCurrency(monthData.total_expenses)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    ${formatCurrency(monthData.total_expenses)}
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
