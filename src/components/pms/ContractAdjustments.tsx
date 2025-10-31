import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { formatDateDisplay } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';

interface ContractData {
  indice_ajuste: string | null;
  frecuencia_ajuste: string | null;
  fecha_primer_ajuste: string | null;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  monto_a: number | null;
  monto_b: number | null;
  currency: string;
  rounding_mode: string;
}

interface AdjustmentRow {
  id: string;
  applied_at: string;
  period_from: string;
  period_to: string;
  prev_amount: number;
  new_amount: number;
  pct_cumulative: number;
  factor: number;
}

interface CurrentData {
  current_amount: number;
  current_item_a: number | null;
  current_item_b: number | null;
  last_adjustment_date: string | null;
  next_adjustment_date: string;
}

interface ContractAdjustmentsProps {
  contractId: string;
}

export function ContractAdjustments({ contractId }: ContractAdjustmentsProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [currentData, setCurrentData] = useState<CurrentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contractId) {
      fetchData();
    }
  }, [contractId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener datos del contrato
      const { data: contract, error: contractError } = await supabase
        .from('pms_contracts')
        .select('indice_ajuste, frecuencia_ajuste, fecha_primer_ajuste, start_date, end_date, monthly_rent, monto_a, monto_b, currency, rounding_mode')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      setContractData(contract);

      // Si no tiene ajuste configurado, no cargar historial
      if (!contract.indice_ajuste || contract.indice_ajuste === 'Sin ajuste') {
        setAdjustments([]);
        setCurrentData(null);
        return;
      }

      // Obtener historial de ajustes
      const { data: adjustmentsData, error: adjustmentsError } = await supabase
        .from('pms_contract_adjustments')
        .select('*')
        .eq('contract_id', contractId)
        .order('applied_at', { ascending: false });

      if (adjustmentsError) throw adjustmentsError;
      setAdjustments(adjustmentsData || []);

      // Obtener datos actuales
      const { data: current, error: currentError } = await supabase
        .from('pms_contract_current')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (currentError && currentError.code !== 'PGRST116') throw currentError;
      setCurrentData(current);

    } catch (error) {
      console.error('Error fetching adjustments data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ajustes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustment = async () => {
    try {
      setApplying(true);

      const { data, error } = await supabase
        .rpc('rpc_apply_contract_adjustment', {
          p_contract_id: contractId,
          p_asof: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      const result = data as any;

      if (result?.error) {
        toast({
          title: "Información",
          description: result.error,
          variant: "default"
        });
      } else if (result?.message) {
        toast({
          title: "Información",
          description: result.message,
          variant: "default"
        });
      } else if (result?.success) {
        toast({
          title: "Ajuste aplicado",
          description: `Nuevo monto: ${formatCurrency(result.new_amount, contractData?.currency || 'ARS')}`,
          variant: "default"
        });
        
        await fetchData();
      }
    } catch (error) {
      console.error('Error applying adjustment:', error);
      toast({
        title: "Error",
        description: "No se pudo aplicar el ajuste",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'ARS') => {
    const symbol = currency === 'USD' ? 'USD ' : '$';
    return `${symbol}${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando ajustes...</span>
      </div>
    );
  }

  if (!contractData?.indice_ajuste || contractData.indice_ajuste === 'Sin ajuste') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Este contrato no tiene ajustes programados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isAdjustmentDue = currentData && 
    new Date(currentData.next_adjustment_date) <= new Date();

  return (
    <div className="space-y-4">
      {/* Condiciones del Ajuste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condiciones del Ajuste</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">Índice de ajuste</TableCell>
                <TableCell>
                  <Badge variant="outline">{contractData.indice_ajuste}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Frecuencia de ajuste</TableCell>
                <TableCell>{contractData.frecuencia_ajuste}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Fecha del primer ajuste</TableCell>
                <TableCell>
                  {contractData.fecha_primer_ajuste 
                    ? formatDateDisplay(contractData.fecha_primer_ajuste)
                    : 'No definida'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Modo de redondeo</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {contractData.rounding_mode === 'NEAREST' && 'Al más cercano'}
                    {contractData.rounding_mode === 'UP' && 'Hacia arriba'}
                    {contractData.rounding_mode === 'DOWN' && 'Hacia abajo'}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Valores Actuales */}
      {currentData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Monto Vigente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(currentData.current_amount, contractData.currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Último Ajuste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg">
                {currentData.last_adjustment_date 
                  ? formatDateDisplay(currentData.last_adjustment_date)
                  : 'Sin ajustes aplicados'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Próximo Ajuste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg">
                  {formatDateDisplay(currentData.next_adjustment_date)}
                </div>
                {isAdjustmentDue && (
                  <Button 
                    onClick={handleApplyAdjustment}
                    disabled={applying}
                    size="sm"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historial de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Historial de Ajustes
          </CardTitle>
          <CardDescription>
            {adjustments.length > 0 
              ? `${adjustments.length} ajuste(s) aplicado(s)` 
              : 'No hay ajustes registrados aún'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No hay ajustes registrados aún.
              </p>
              {contractData.fecha_primer_ajuste && (
                <p className="text-sm text-primary">
                  Próximo ajuste programado para {formatDateDisplay(contractData.fecha_primer_ajuste)}
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Aplicación</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Monto Anterior</TableHead>
                    <TableHead className="text-right">Nuevo Monto</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                    <TableHead className="text-right">Factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDateDisplay(adj.applied_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {new Date(adj.period_from).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(adj.period_to).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(adj.prev_amount, contractData.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(adj.new_amount, contractData.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={adj.pct_cumulative >= 0 ? 'default' : 'secondary'}
                          className={adj.pct_cumulative >= 0 ? 'bg-green-600' : ''}
                        >
                          {adj.pct_cumulative >= 0 ? '+' : ''}{adj.pct_cumulative.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {adj.factor.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
