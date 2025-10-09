import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface Distribution {
  id: string;
  owner_id: string;
  amount: number;
  share_percent: number;
  currency: string;
  created_at: string;
  pms_owners: {
    full_name: string;
  };
}

interface PaymentDistributionsProps {
  paymentId: string;
}

export function PaymentDistributions({ paymentId }: PaymentDistributionsProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchDistributions();
    }
  }, [paymentId]);

  const fetchDistributions = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_payment_distributions')
        .select(`
          *,
          pms_owners (
            full_name
          )
        `)
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDistributions(data || []);
    } catch (error) {
      console.error('Error fetching distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando distribuciones...</div>;
  }

  if (distributions.length === 0) {
    return null;
  }

  const total = distributions.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Distribución del Pago
        </CardTitle>
        <CardDescription>
          Montos distribuidos entre propietarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propietario</TableHead>
              <TableHead>Porcentaje</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Moneda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributions.map((dist) => (
              <TableRow key={dist.id}>
                <TableCell className="font-medium">
                  {dist.pms_owners.full_name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {dist.share_percent}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(dist.amount).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{dist.currency}</Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell className="text-right">
                {total.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                <Badge>{distributions[0]?.currency || 'ARS'}</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
