import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatDateDisplay } from '@/utils/dateUtils';

interface AdjustmentWithMonths {
  id: string;
  application_date: string;
  index_type: string;
  variation_percent: number;
  previous_amount: number;
  new_amount: number;
  item: string;
  created_at: string;
  applied_months: string[];
}

interface ContractAdjustmentsProps {
  contractId: string;
}

export function ContractAdjustments({ contractId }: ContractAdjustmentsProps) {
  const [adjustments, setAdjustments] = useState<AdjustmentWithMonths[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      fetchAdjustments();
    }
  }, [contractId]);

  const fetchAdjustments = async () => {
    try {
      const { data: adjustmentsData, error } = await supabase
        .from('pms_contract_adjustments')
        .select('*')
        .eq('contract_id', contractId)
        .order('application_date', { ascending: false });

      if (error) throw error;

      // Obtener proyecciones para identificar meses donde se aplicó cada ajuste
      const { data: projections } = await supabase
        .from('pms_contract_monthly_projections')
        .select('period_date, adjustment_applied, adjustment_percentage, item, indices_used')
        .eq('contract_id', contractId)
        .eq('adjustment_applied', true)
        .order('period_date', { ascending: true });

      // Mapear ajustes con sus meses aplicados
      const adjustmentsWithMonths = (adjustmentsData || []).map(adj => {
        const appliedMonths: string[] = [];
        
        if (projections) {
          projections.forEach(proj => {
            // Vincular por item y porcentaje de variación similar
            if (proj.item === adj.item && 
                Math.abs(proj.adjustment_percentage - adj.variation_percent) < 0.01) {
              appliedMonths.push(proj.period_date);
            }
          });
        }

        return {
          ...adj,
          applied_months: appliedMonths
        };
      });

      setAdjustments(adjustmentsWithMonths);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando ajustes...</div>;
  }

  if (adjustments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Historial de Ajustes
          </CardTitle>
          <CardDescription>
            No hay ajustes registrados para este contrato
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Historial de Ajustes
        </CardTitle>
        <CardDescription>
          Ajustes aplicados al contrato por índices económicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Aplicación</TableHead>
              <TableHead>Índice</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Meses Aplicados</TableHead>
              <TableHead className="text-right">Monto Anterior</TableHead>
              <TableHead className="text-right">Variación %</TableHead>
              <TableHead className="text-right">Monto Nuevo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((adj) => (
              <TableRow key={adj.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDateDisplay(adj.application_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{adj.index_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{adj.item || 'ÚNICO'}</Badge>
                </TableCell>
                <TableCell>
                  {adj.applied_months.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {adj.applied_months.map((month, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {new Date(month).toLocaleDateString('es-AR', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  ${Number(adj.previous_amount).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={adj.variation_percent > 0 ? 'default' : 'secondary'}
                    className={adj.variation_percent > 0 ? 'bg-green-600' : ''}
                  >
                    {adj.variation_percent > 0 ? '+' : ''}{adj.variation_percent}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${Number(adj.new_amount).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
