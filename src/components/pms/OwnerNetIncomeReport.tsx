import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Users, DollarSign, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PropertyYieldCalculator } from './PropertyYieldCalculator';
import { consolidateFlows, type CurrencyFlows } from '@/utils/currencyConversion';

interface OwnerNetIncomeReportProps {
  tenantId: string;
  selectedContract: string;
  viewMode?: 'accrual' | 'cash';
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
  income_details?: IncomeDetail[];
}

interface IncomeDetail {
  item: string;
  period_date: string;
  amount: number;
  paid_date: string;
}

interface ReimbursementData {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  is_paid: boolean;
  schedule_item_id?: string;
}

export const OwnerNetIncomeReport = ({ tenantId, selectedContract, viewMode = 'cash' }: OwnerNetIncomeReportProps) => {
  const [ownerTotals, setOwnerTotals] = useState<MonthlyOwnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState<'contract' | 'payment'>('contract');
  const [contractCurrency, setContractCurrency] = useState<string>('ARS');
  const [exchangeRate, setExchangeRate] = useState<number>(1450);
  
  // Sincronizar con el modo externo
  const viewByPaymentDate = viewMode === 'cash';

  useEffect(() => {
    if (tenantId && selectedContract) {
      fetchOwnerTotals();
    }
  }, [tenantId, selectedContract, viewMode, displayCurrency]);

  const fetchOwnerTotals = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching owner totals - viewByPaymentDate:', viewByPaymentDate);

      // 1. Obtener información del contrato (incluyendo currency)
      const { data: contract, error: contractError } = await supabase
        .from('pms_contracts')
        .select('property_id, currency')
        .eq('id', selectedContract)
        .single();

      if (contractError) throw contractError;
      if (!contract) {
        setOwnerTotals([]);
        return;
      }

      // Guardar moneda del contrato
      setContractCurrency(contract.currency || 'ARS');

      // 2. Obtener propietarios del contrato
      const { data: owners, error: ownersError } = await supabase
        .from('pms_owner_properties')
        .select('owner_id, share_percent, pms_owners!inner(id, full_name)')
        .eq('property_id', contract.property_id)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      if (ownersError) throw ownersError;
      if (!owners || owners.length === 0) {
        setOwnerTotals([]);
        return;
      }

      if (viewByPaymentDate) {
        // NUEVA LÓGICA: Agrupar por fecha de pago
        // 3. Obtener todos los schedule items pagados
        const { data: scheduleItems, error: itemsError } = await supabase
          .from('pms_payment_schedule_items')
          .select('id, period_date, item, expected_amount, status, expense_id')
          .eq('contract_id', selectedContract)
          .eq('status', 'paid');

        if (itemsError) throw itemsError;

        // 4. Obtener todos los pagos de esos schedule items con información de conversión
        const scheduleItemIds = scheduleItems?.map(item => item.id) || [];
        
        const { data: payments, error: paymentsError } = await supabase
          .from('pms_payments')
          .select('id, schedule_item_id, paid_date, paid_amount, currency, exchange_rate, contract_currency, amount_in_contract_currency')
          .in('schedule_item_id', scheduleItemIds)
          .order('paid_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        // 5. Combinar manualmente en JavaScript
        const paidItems = scheduleItems?.map(item => ({
          ...item,
          pms_payments: payments?.filter(p => p.schedule_item_id === item.id) || []
        })) || [];

        // 6. Obtener gastos del mes (basado en expense_date, no en paid_date)
        const { data: expenses, error: expensesError } = await supabase
          .from('pms_expenses')
          .select('id, category, description, amount, expense_date, is_reimbursable, reimbursement_status, schedule_item_id')
          .eq('contract_id', selectedContract)
          .order('expense_date', { ascending: false });

        if (expensesError) throw expensesError;

        console.log('💰 Paid items:', paidItems);
        console.log('💸 Expenses:', expenses);

        // 7. Agrupar por mes de pago - considerando múltiples pagos por item
        const paymentsByMonth: Record<string, any[]> = {};
        
        paidItems?.forEach((item: any) => {
          if (item.pms_payments?.length > 0) {
            item.pms_payments.forEach((payment: any) => {
              const period = payment.paid_date.substring(0, 7); // YYYY-MM
              
              if (!paymentsByMonth[period]) {
                paymentsByMonth[period] = [];
              }
              
              // Agregar una entrada por cada pago
              paymentsByMonth[period].push({
                ...item,
                current_payment: payment // El pago actual que estamos procesando
              });
            });
          }
        });

        console.log('📅 Payments grouped by month:', paymentsByMonth);

        // 8. Para cada período y propietario, calcular totales
        const monthlyData: MonthlyOwnerData[] = [];

        Object.entries(paymentsByMonth).forEach(([period, items]) => {
          owners.forEach((owner: any) => {
            // Calcular ingresos cobrados en este mes
            const incomeDetails: IncomeDetail[] = [];
            let totalIncome = 0;

            items.forEach((item: any) => {
              // Solo sumar items de ingreso regular (no reembolsos)
              if (!item.expense_id && item.current_payment) {
                // Determinar qué monto usar según la vista seleccionada
                let amountToUse = item.current_payment.paid_amount;
                
                if (displayCurrency === 'contract' && item.current_payment.amount_in_contract_currency) {
                  amountToUse = item.current_payment.amount_in_contract_currency;
                }
                
                const ownerShare = (amountToUse * owner.share_percent) / 100;
                totalIncome += ownerShare;

                incomeDetails.push({
                  item: item.item || 'UNICO',
                  period_date: item.period_date,
                  amount: ownerShare,
                  paid_date: item.current_payment.paid_date
                });
              }
            });

            // Calcular gastos del mes (no reembolsables)
            const monthExpenses = expenses?.filter(exp => {
              const expPeriod = exp.expense_date.substring(0, 7);
              return expPeriod === period && !exp.is_reimbursable;
            }) || [];

            const totalExpenses = monthExpenses.reduce((sum, exp) => 
              sum + ((exp.amount * owner.share_percent) / 100), 0
            );

            // Obtener reembolsos pagados en este mes
            const paidReimbursements = items
              .filter((item: any) => item.expense_id)
              .map((item: any) => {
                const expense = expenses?.find(exp => exp.id === item.expense_id);
                if (!expense) return null;

                return {
                  id: expense.id,
                  category: expense.category,
                  description: expense.description || '',
                  amount: (expense.amount * owner.share_percent) / 100,
                  expense_date: expense.expense_date,
                  status: 'paid',
                  is_paid: true,
                  schedule_item_id: item.id
                };
              })
              .filter(Boolean) as ReimbursementData[];

            // Agregar reembolsos con error (sin schedule_item_id)
            const errorReimbursements = expenses?.filter(exp => {
              const expPeriod = exp.expense_date.substring(0, 7);
              return expPeriod === period && 
                     exp.is_reimbursable && 
                     !exp.schedule_item_id;
            }).map(exp => ({
              id: exp.id,
              category: exp.category,
              description: exp.description || '',
              amount: (exp.amount * owner.share_percent) / 100,
              expense_date: exp.expense_date,
              status: 'error',
              is_paid: false
            })) || [];

            const allReimbursements = [...paidReimbursements, ...errorReimbursements];

            // IMPORTANTE: Solo sumar reembolsos pagados al total de ingresos
            const paidReimbursementsTotal = paidReimbursements.reduce((sum, r) => sum + r.amount, 0);

            monthlyData.push({
              period,
              owner_id: owner.owner_id,
              full_name: owner.pms_owners.full_name,
              share_percent: owner.share_percent,
              income: totalIncome + paidReimbursementsTotal,
              expenses: totalExpenses,
              net_result: totalIncome + paidReimbursementsTotal - totalExpenses,
              reimbursements: allReimbursements.length > 0 ? allReimbursements : undefined,
              income_details: incomeDetails
            });
          });
        });

        console.log('📊 Monthly data (by payment date):', monthlyData);
        setOwnerTotals(monthlyData);

      } else {
        // LÓGICA ANTERIOR: Agrupar por período de devengamiento (cashflow)
        const { data: cashflow, error: cashflowError } = await supabase
          .from('pms_cashflow_property')
          .select('*')
          .eq('contract_id', selectedContract)
          .order('period', { ascending: false })
          .limit(12);

        if (cashflowError) throw cashflowError;

        const { data: reimbursableExpenses } = await supabase
          .from('pms_expenses')
          .select('id, category, description, amount, expense_date, reimbursement_status, schedule_item_id')
          .eq('contract_id', selectedContract)
          .eq('is_reimbursable', true)
          .order('expense_date', { ascending: false });

        const { data: scheduleItems } = await supabase
          .from('pms_payment_schedule_items')
          .select('id, period_date, status, expense_id')
          .eq('contract_id', selectedContract)
          .not('expense_id', 'is', null) as any;

        const monthlyData: MonthlyOwnerData[] = [];
        
        cashflow?.forEach(cf => {
          owners.forEach((owner: any) => {
            const periodReimbursements = reimbursableExpenses?.filter(exp => {
              const expPeriod = exp.expense_date.substring(0, 7);
              return expPeriod === cf.period;
            }).map(exp => {
              const scheduleItem = scheduleItems?.find((si: any) => si.expense_id === exp.id);
              
              let isPaid = false;
              let displayStatus = exp.reimbursement_status;
              
              if (!exp.schedule_item_id) {
                displayStatus = 'error';
              } else if (scheduleItem?.status === 'paid') {
                isPaid = true;
                displayStatus = 'paid';
              } else {
                displayStatus = 'pending';
              }
              
              return {
                id: exp.id,
                category: exp.category,
                description: exp.description || '',
                amount: (exp.amount * owner.share_percent) / 100,
                expense_date: exp.expense_date,
                status: displayStatus,
                is_paid: isPaid,
                schedule_item_id: exp.schedule_item_id
              };
            }) || [];

            // Solo sumar reembolsos pagados
            const paidReimbursementsTotal = periodReimbursements
              .filter(r => r.is_paid)
              .reduce((sum, r) => sum + r.amount, 0);

            monthlyData.push({
              period: cf.period,
              owner_id: owner.owner_id,
              full_name: owner.pms_owners.full_name,
              share_percent: owner.share_percent,
              income: (cf.total_income * owner.share_percent) / 100 + paidReimbursementsTotal,
              expenses: (cf.total_expenses * owner.share_percent) / 100,
              net_result: ((cf.total_income - cf.total_expenses) * owner.share_percent) / 100 + paidReimbursementsTotal,
              reimbursements: periodReimbursements.length > 0 ? periodReimbursements : undefined
            });
          });
        });

        setOwnerTotals(monthlyData);
      }
    } catch (error) {
      console.error('❌ Error fetching monthly data:', error);
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

  // Calcular resultado consolidado en moneda funcional
  const calculateConsolidatedResult = () => {
    const flows: CurrencyFlows = {};
    
    ownerTotals.forEach(data => {
      const currency = contractCurrency;
      if (!flows[currency]) {
        flows[currency] = { income: 0, expenses: 0, net: 0 };
      }
      flows[currency].income += data.income;
      flows[currency].expenses += data.expenses;
      flows[currency].net += data.net_result;
    });

    return consolidateFlows(flows, contractCurrency === 'USD' ? 'USD' : 'USD', exchangeRate);
  };

  const consolidatedResult = calculateConsolidatedResult();

  return (
    <>
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los montos se muestran en <strong>{contractCurrency}</strong> (moneda del contrato) 
          para permitir el cálculo de rendimiento anual.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Totales por Propietario
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="currency-display" className="text-sm text-muted-foreground">
                  Ver montos en:
                </Label>
                <Select value={displayCurrency} onValueChange={(val: 'contract' | 'payment') => setDisplayCurrency(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Moneda del Contrato</SelectItem>
                    <SelectItem value="payment">Moneda de Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
                        {viewByPaymentDate && data.income_details && data.income_details.length > 0 && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="income-details" className="border-0">
                              <AccordionTrigger className="py-1 hover:no-underline">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {data.income_details.length} Pago{data.income_details.length > 1 ? 's' : ''}
                                </Badge>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-4 space-y-2 mt-2">
                                  {data.income_details.map((detail, idx) => (
                                    <div key={idx} className="text-xs border-l-2 border-blue-300 pl-2 py-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="font-medium text-blue-700">
                                            Item {detail.item} - {detail.period_date}
                                          </div>
                                          <div className="text-muted-foreground">
                                            Cobrado: {new Date(detail.paid_date).toLocaleDateString('es-AR')}
                                          </div>
                                        </div>
                                        <div className="text-right font-semibold text-blue-700">
                                          ${formatCurrency(detail.amount)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
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
                                    <span>Total Reembolsos Pagados:</span>
                                    <span className="text-purple-700">
                                      ${formatCurrency(data.reimbursements.filter(r => r.is_paid).reduce((sum, r) => sum + r.amount, 0))}
                                    </span>
                                  </div>
                                  {data.reimbursements.some(r => !r.is_paid) && (
                                    <div className="text-xs text-muted-foreground italic">
                                      * Los reembolsos con error no se incluyen en el total de ingresos
                                    </div>
                                  )}
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

      <Separator className="my-6" />

      <PropertyYieldCalculator
        monthlyNetIncome={consolidatedResult.netResult / Object.keys(groupByPeriod(ownerTotals)).length || 0}
        functionalCurrency={contractCurrency === 'USD' ? 'USD' : 'USD'}
        propertyValue={0}
      />

      <Card className="mt-6 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Resultado Consolidado
          </CardTitle>
          <CardDescription>
            Resumen total en moneda funcional para análisis de rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {consolidatedResult.functionalCurrency} {consolidatedResult.totalIncome.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-sm text-muted-foreground mb-1">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {consolidatedResult.functionalCurrency} {consolidatedResult.totalExpenses.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              consolidatedResult.netResult >= 0 
                ? 'bg-primary/5 border-primary/30' 
                : 'bg-destructive/5 border-destructive/30'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">Resultado Neto</p>
              <p className={`text-3xl font-bold ${
                consolidatedResult.netResult >= 0 
                  ? 'text-primary' 
                  : 'text-destructive'
              }`}>
                {consolidatedResult.functionalCurrency} {consolidatedResult.netResult.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>

          {consolidatedResult.breakdown.length > 1 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Detalle por Moneda:</p>
                <div className="grid grid-cols-2 gap-3">
                  {consolidatedResult.breakdown.map(item => (
                    <div key={item.currency} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{item.currency}</Badge>
                        <span className="text-sm text-muted-foreground">Neto: ${item.net.toLocaleString('es-AR', {
                          minimumFractionDigits: 2
                        })}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ingresos: ${item.income.toLocaleString('es-AR')} • 
                        Gastos: ${item.expenses.toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Tipo de cambio utilizado: 1 USD = {consolidatedResult.exchangeRate.toLocaleString('es-AR')} ARS.
              {contractCurrency !== 'USD' && ' Los montos se consolidaron a USD para cálculo de rendimiento.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </>
  );
};
