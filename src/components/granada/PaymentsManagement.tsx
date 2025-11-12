import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  status: string;
  created_at: string;
  subscription: {
    tenant: {
      name: string;
    };
  };
}

export function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_subscription_payments')
        .select(`
          id,
          subscription_id,
          amount,
          currency,
          payment_date,
          payment_method,
          status,
          created_at,
          subscription:subscription_id (
            tenant:tenant_id (
              name
            )
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de pagos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pagos de Suscripciones
        </CardTitle>
        <CardDescription>
          Historial de pagos de clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Fecha Pago</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.subscription?.tenant?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  {payment.currency} ${payment.amount.toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">{payment.payment_method}</TableCell>
                <TableCell>
                  {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(payment.status)}>
                    {getStatusLabel(payment.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {payments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay pagos registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
