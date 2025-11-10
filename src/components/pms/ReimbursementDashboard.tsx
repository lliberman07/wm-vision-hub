import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';

interface ReimbursementStats {
  totalPending: number;
  totalPaid: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number; count: number }[];
}

interface ReimbursementDashboardProps {
  tenantId: string;
}

export function ReimbursementDashboard({ tenantId }: ReimbursementDashboardProps) {
  const [stats, setStats] = useState<ReimbursementStats | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, [tenantId]);

  useEffect(() => {
    if (contracts.length > 0) {
      fetchReimbursementStats();
    }
  }, [selectedContract, contracts]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_contracts')
        .select('id, contract_number, status')
        .eq('tenant_id', tenantId)
        .order('contract_number');

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchReimbursementStats = async () => {
    setLoading(true);
    try {
      // Construir query base
      let expensesQuery = supabase
        .from('pms_expenses')
        .select('*, contract:pms_contracts!inner(contract_number)')
        .eq('is_reimbursable', true)
        .eq('pms_contracts.tenant_id', tenantId);

      // Filtrar por contrato si está seleccionado
      if (selectedContract !== 'all') {
        expensesQuery = expensesQuery.eq('contract_id', selectedContract);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;

      if (expensesError) throw expensesError;

      // Obtener schedule items para saber cuáles están pagados
      let scheduleQuery = supabase
        .from('pms_payment_schedule_items')
        .select('expense_id, status, expected_amount')
        .not('expense_id', 'is', null);

      if (selectedContract !== 'all') {
        scheduleQuery = scheduleQuery.eq('contract_id', selectedContract);
      }

      const { data: scheduleItems } = await scheduleQuery as any;

      // Crear mapa de estados de pago
      const paymentStatusMap = new Map();
      scheduleItems?.forEach((item: any) => {
        if (!paymentStatusMap.has(item.expense_id)) {
          paymentStatusMap.set(item.expense_id, []);
        }
        paymentStatusMap.get(item.expense_id).push(item.status);
      });

      // Calcular estadísticas
      let totalPending = 0;
      let totalPaid = 0;
      let pendingCount = 0;
      let paidCount = 0;
      const categoryMap = new Map<string, { amount: number; count: number }>();
      const monthlyMap = new Map<string, { amount: number; count: number }>();

      expenses?.forEach(exp => {
        const statuses = paymentStatusMap.get(exp.id) || [];
        const isPaid = statuses.length > 0 && statuses.every((s: string) => s === 'paid');
        
        // Totales
        if (isPaid) {
          totalPaid += exp.amount;
          paidCount++;
        } else {
          totalPending += exp.amount;
          pendingCount++;
        }

        // Por categoría
        const catData = categoryMap.get(exp.category) || { amount: 0, count: 0 };
        catData.amount += exp.amount;
        catData.count += 1;
        categoryMap.set(exp.category, catData);

        // Por mes
        const month = exp.expense_date.substring(0, 7); // YYYY-MM
        const monthData = monthlyMap.get(month) || { amount: 0, count: 0 };
        monthData.amount += exp.amount;
        monthData.count += 1;
        monthlyMap.set(month, monthData);
      });

      // Convertir a arrays y ordenar
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);

      const monthlyTrend = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Últimos 12 meses

      setStats({
        totalPending,
        totalPaid,
        totalAmount: totalPending + totalPaid,
        pendingCount,
        paidCount,
        categoryBreakdown,
        monthlyTrend
      });

    } catch (error) {
      console.error('Error fetching reimbursement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Cargando estadísticas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No hay datos de reembolsos disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de contratos */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Reembolsos</h2>
          <p className="text-muted-foreground">Análisis de gastos reembolsables</p>
        </div>
        <Select value={selectedContract} onValueChange={setSelectedContract}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los contratos</SelectItem>
            {contracts.map((contract) => (
              <SelectItem key={contract.id} value={contract.id}>
                {contract.contract_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reembolsos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount, 'es', 'ARS')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingCount + stats.paidCount} gastos totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.totalPending, 'es', 'ARS')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingCount} gasto{stats.pendingCount !== 1 ? 's' : ''} pendiente{stats.pendingCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid, 'es', 'ARS')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paidCount} gasto{stats.paidCount !== 1 ? 's' : ''} pagado{stats.paidCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount > 0 
                ? `${Math.round((stats.totalPaid / stats.totalAmount) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paidCount} de {stats.pendingCount + stats.paidCount} cobrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por categorías */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Reembolsos por Categoría
          </CardTitle>
          <CardDescription>Distribución de gastos reembolsables por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.categoryBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="text-right">% del Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.categoryBreakdown.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{cat.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(cat.amount, 'es', 'ARS')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>
                        {Math.round((cat.amount / stats.totalAmount) * 100)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de categorías</p>
          )}
        </CardContent>
      </Card>

      {/* Tendencia mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tendencia Mensual
          </CardTitle>
          <CardDescription>Evolución de reembolsos en los últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.monthlyTrend.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.monthlyTrend.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">
                      {new Date(month.month + '-01').toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{month.count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-700">
                      {formatCurrency(month.amount, 'es', 'ARS')}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(month.amount / month.count, 'es', 'ARS')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de tendencia</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}