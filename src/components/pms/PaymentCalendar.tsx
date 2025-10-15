import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentCell } from './PaymentCell';
import { PaymentCellModal } from './PaymentCellModal';
import { Download, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/numberFormat';

interface PaymentCalendarProps {
  contractId: string;
  currency: string;
}

export function PaymentCalendar({ contractId, currency }: PaymentCalendarProps) {
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchScheduleItems();
  }, [contractId]);

  const fetchScheduleItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pms_payment_schedule_items')
        .select(`
          *,
          projection:pms_contract_monthly_projections(*),
          payment:pms_payments(*),
          payment_method:pms_contract_payment_methods(*),
          owner:pms_owners(id, full_name, email)
        `)
        .eq('contract_id', contractId)
        .order('period_date', { ascending: true });

      if (error) throw error;
      setScheduleItems(data || []);
    } catch (error: any) {
      toast.error('Error al cargar calendario de pagos', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedByMonth = scheduleItems.reduce((acc, item) => {
    const monthKey = format(new Date(item.period_date), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredMonths = Object.keys(groupedByMonth).filter(monthKey => {
    if (filterStatus === 'all') return true;
    return groupedByMonth[monthKey].some(item => item.status === filterStatus);
  });

  const getTotals = () => {
    const total = scheduleItems.reduce((sum, item) => sum + Number(item.expected_amount), 0);
    const paid = scheduleItems
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.expected_amount), 0);
    const pending = total - paid;
    const overdue = scheduleItems
      .filter(item => item.status === 'overdue')
      .reduce((sum, item) => sum + Number(item.expected_amount), 0);

    return { total, paid, pending, overdue };
  };

  const totals = getTotals();

  const handleCellClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendario de Pagos
              </CardTitle>
              <CardDescription>
                Historial y proyección mensual de pagos del contrato
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Esperado</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.total, 'es', currency as any)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">Total Pagado</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.paid, 'es', currency as any)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700 mb-1">Pendiente</p>
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totals.pending, 'es', currency as any)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 mb-1">Vencido</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.overdue, 'es', currency as any)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {filteredMonths.map((monthKey) => {
              const monthItems = groupedByMonth[monthKey];
              const monthDate = new Date(monthKey + '-01');
              const monthTotal = monthItems.reduce((sum, item) => sum + Number(item.expected_amount), 0);

              return (
                <div key={monthKey} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold capitalize">
                      {format(monthDate, 'MMMM yyyy', { locale: es })}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Total Mes: <span className="font-semibold">{formatCurrency(monthTotal, 'es', currency as any)}</span>
                      </span>
                      <Badge variant={monthItems.every(i => i.status === 'paid') ? 'default' : 'secondary'}>
                        {monthItems.filter(i => i.status === 'paid').length} / {monthItems.length} pagados
                      </Badge>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Monto Esperado</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthItems.map((item) => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => handleCellClick(item)}>
                          <TableCell className="font-mono font-medium">{item.item}</TableCell>
                          <TableCell>{item.owner?.full_name || 'N/A'}</TableCell>
                          <TableCell>{item.owner_percentage}%</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.expected_amount, 'es', currency as any)}
                          </TableCell>
                          <TableCell>
                            <div className="w-48">
                              <PaymentCell
                                status={item.status}
                                expectedAmount={item.expected_amount}
                                paidAmount={item.payment?.paid_amount}
                                periodDate={item.period_date}
                                onClick={() => handleCellClick(item)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {filteredMonths.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay pagos programados para este contrato</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentCellModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        scheduleItem={selectedItem}
        onSuccess={fetchScheduleItems}
      />
    </>
  );
}
