import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Users, DollarSign } from 'lucide-react';
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
  reimbursements?: ReimbursementData[];
}

interface ReimbursementData {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  is_paid: boolean;
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
        .select('owner_id, share_percent, pms_owners!inner(id, full_name)')
        .eq('property_id', contract.property_id)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      // 4. Obtener gastos reembolsables del contrato
      const { data: reimbursableExpenses } = await supabase
        .from('pms_expenses')
        .select('id, category, description, amount, expense_date, reimbursement_status')
        .eq('contract_id', selectedContract)
        .eq('is_reimbursable', true)
        .order('expense_date', { ascending: false });

      // 5. Obtener schedule items para saber cuáles reembolsos están pagados
      // Usar query raw para evitar error de tipos mientras se regeneran
      const { data: scheduleItems } = await supabase
        .from('pms_payment_schedule_items')
        .select('id, period_date, status, expense_id')
        .eq('contract_id', selectedContract)
        .not('expense_id', 'is', null) as any; // Temporal: evitar error de tipos

      // 6. Para cada período, distribuir según propietarios
      const monthlyData: MonthlyOwnerData[] = [];
      
      cashflow?.forEach(cf => {
        owners?.forEach((owner: any) => {
          // Filtrar reembolsos de este período y este propietario
          const periodReimbursements = reimbursableExpenses?.filter(exp => {
            const expPeriod = exp.expense_date.substring(0, 7); // YYYY-MM
            return expPeriod === cf.period;
          }).map(exp => {
            // Verificar si existe schedule item y su estado
            const scheduleItem = scheduleItems?.find((si: any) => si.expense_id === exp.id);
            
            // Determinar estado real del reembolso
            let isPaid = false;
            let displayStatus = exp.reimbursement_status;
            
            if (!scheduleItem) {
              // No hay schedule item = error en creación o no procesado
              displayStatus = 'error';
            } else if (scheduleItem.status === 'paid') {
              isPaid = true;
              displayStatus = 'paid';
            } else {
              // Existe schedule item pero no está pagado
              displayStatus = 'pending';
            }
            
            return {
              id: exp.id,
              category: exp.category,
              description: exp.description || '',
              amount: (exp.amount * owner.share_percent) / 100, // Distribuir según %
              expense_date: exp.expense_date,
              status: displayStatus,
              is_paid: isPaid
            };
          }) || [];

          monthlyData.push({
            period: cf.period,
            owner_id: owner.owner_id,
            full_name: owner.pms_owners.full_name,
            share_percent: owner.share_percent,
            income: (cf.total_income * owner.share_percent) / 100,
            expenses: (cf.total_expenses * owner.share_percent) / 100,
            net_result: ((cf.total_income - cf.total_expenses) * owner.share_percent) / 100,
            reimbursements: periodReimbursements
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
                    <TableCell className="bg-muted/30">
                      <div className="flex flex-col gap-1">
                        <span>{data.full_name}</span>
                        {data.reimbursements && data.reimbursements.length > 0 && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="reimbursements" className="border-0">
                              <AccordionTrigger className="py-1 hover:no-underline">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {data.reimbursements.length} Reembolso{data.reimbursements.length > 1 ? 's' : ''}
                                </Badge>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-4 space-y-2 mt-2">
                                  {data.reimbursements.map((reimb) => (
                                    <div key={reimb.id} className="text-xs border-l-2 border-purple-300 pl-2 py-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="font-medium text-purple-700">{reimb.category}</div>
                                          {reimb.description && (
                                            <div className="text-muted-foreground">{reimb.description}</div>
                                          )}
                                          <div className="text-muted-foreground">
                                            {new Date(reimb.expense_date).toLocaleDateString('es-AR')}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-semibold text-purple-700">
                                            ${formatCurrency(reimb.amount)}
                                          </div>
                                           <Badge 
                                            variant={
                                              reimb.status === 'paid' ? 'default' : 
                                              reimb.status === 'error' ? 'destructive' : 
                                              'secondary'
                                            }
                                            className="text-xs"
                                          >
                                            {reimb.status === 'paid' ? 'Pagado' : 
                                             reimb.status === 'error' ? 'Error' : 
                                             'Pendiente'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="border-t pt-2 mt-2 flex justify-between text-xs font-semibold">
                                    <span>Total Reembolsos:</span>
                                    <span className="text-purple-700">
                                      ${formatCurrency(data.reimbursements.reduce((sum, r) => sum + r.amount, 0))}
                                    </span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    </TableCell>
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
