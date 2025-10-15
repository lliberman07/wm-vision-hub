import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpenseDistribution {
  expense_id: string;
  expense_date: string;
  property_code: string;
  property_address: string;
  category: string;
  description: string;
  total_amount: number;
  currency: string;
  owner_name: string;
  owner_id: string;
  share_percent: number;
  distributed_amount: number;
  receipt_url: string | null;
}

interface ExpenseDistributionReportProps {
  tenantId: string;
  properties: Array<{ id: string; code: string; address: string }>;
}

export function ExpenseDistributionReport({ tenantId, properties }: ExpenseDistributionReportProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [distributions, setDistributions] = useState<ExpenseDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerTotals, setOwnerTotals] = useState<Map<string, { name: string; total: number }>>(new Map());

  useEffect(() => {
    if (tenantId) {
      fetchDistributions();
    }
  }, [tenantId, selectedProperty]);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('pms_expenses')
        .select(`
          id,
          expense_date,
          category,
          description,
          amount,
          currency,
          receipt_url,
          property_id,
          pms_properties!inner (
            code,
            address
          )
        `)
        .eq('tenant_id', tenantId)
        .order('expense_date', { ascending: false });

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data: expenses, error: expensesError } = await query;

      if (expensesError) throw expensesError;

      if (!expenses || expenses.length === 0) {
        setDistributions([]);
        setOwnerTotals(new Map());
        return;
      }

      // Fetch owner properties for each expense
      const distributionsData: ExpenseDistribution[] = [];
      const totals = new Map<string, { name: string; total: number }>();

      for (const expense of expenses) {
        const { data: ownerProps, error: ownersError } = await supabase
          .from('pms_owner_properties')
          .select(`
            share_percent,
            pms_owners!inner (
              id,
              full_name
            )
          `)
          .eq('property_id', expense.property_id)
          .or(`end_date.is.null,end_date.gte.${expense.expense_date}`)
          .lte('start_date', expense.expense_date);

        if (ownersError) {
          console.error('Error fetching owners:', ownersError);
          continue;
        }

        if (ownerProps && ownerProps.length > 0) {
          for (const ownerProp of ownerProps) {
            const distributedAmount = (expense.amount * ownerProp.share_percent) / 100;
            const ownerId = ownerProp.pms_owners.id;
            const ownerName = ownerProp.pms_owners.full_name;

            distributionsData.push({
              expense_id: expense.id,
              expense_date: expense.expense_date,
              property_code: expense.pms_properties.code,
              property_address: expense.pms_properties.address,
              category: expense.category,
              description: expense.description || '',
              total_amount: expense.amount,
              currency: expense.currency,
              owner_name: ownerName,
              owner_id: ownerId,
              share_percent: ownerProp.share_percent,
              distributed_amount: distributedAmount,
              receipt_url: expense.receipt_url,
            });

            // Update totals
            const currentTotal = totals.get(ownerId) || { name: ownerName, total: 0 };
            totals.set(ownerId, {
              name: ownerName,
              total: currentTotal.total + distributedAmount,
            });
          }
        }
      }

      setDistributions(distributionsData);
      setOwnerTotals(totals);
    } catch (error) {
      console.error('Error fetching expense distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group distributions by expense
  const groupedDistributions = distributions.reduce((acc, dist) => {
    if (!acc[dist.expense_id]) {
      acc[dist.expense_id] = [];
    }
    acc[dist.expense_id].push(dist);
    return acc;
  }, {} as Record<string, ExpenseDistribution[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Cargando distribución de gastos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Distribución de Gastos por Propietario
            </CardTitle>
            <CardDescription>
              Detalle de gastos distribuidos según porcentaje de participación
            </CardDescription>
          </div>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las propiedades</SelectItem>
              {properties.map(prop => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {distributions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay gastos registrados</p>
            <p className="text-sm mt-2">
              Los gastos se distribuyen automáticamente entre propietarios según su porcentaje de participación
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="text-right">Monto Atribuido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedDistributions).map(([expenseId, expenseDists], groupIndex) => {
                  const firstDist = expenseDists[0];
                  return expenseDists.map((dist, index) => (
                    <TableRow key={`${expenseId}-${dist.owner_id}`} className={index === 0 ? 'border-t-2' : ''}>
                      {index === 0 ? (
                        <>
                          <TableCell rowSpan={expenseDists.length} className="font-medium align-top">
                            {format(new Date(dist.expense_date), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell rowSpan={expenseDists.length} className="align-top">
                            <div>
                              <div className="font-medium">{dist.property_code}</div>
                              <div className="text-xs text-muted-foreground">{dist.property_address}</div>
                            </div>
                          </TableCell>
                          <TableCell rowSpan={expenseDists.length} className="align-top">
                            <Badge variant="outline">{dist.category}</Badge>
                          </TableCell>
                          <TableCell rowSpan={expenseDists.length} className="align-top text-sm">
                            {dist.description}
                          </TableCell>
                          <TableCell rowSpan={expenseDists.length} className="text-right font-bold align-top">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-red-600">
                                ${dist.total_amount.toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {dist.currency}
                              </Badge>
                            </div>
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell className="bg-muted/30">
                        {dist.owner_name}
                      </TableCell>
                      <TableCell className="text-center bg-muted/30">
                        <Badge variant="secondary">
                          {dist.share_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium bg-muted/30">
                        ${dist.distributed_amount.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>

            {ownerTotals.size > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Totales por Propietario</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(ownerTotals.entries()).map(([ownerId, data]) => (
                    <Card key={ownerId} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Propietario</p>
                            <p className="font-semibold">{data.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Gastos</p>
                            <p className="font-bold text-red-600">
                              ${data.total.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
