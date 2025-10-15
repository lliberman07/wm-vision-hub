import { useContractProjections } from '@/hooks/useContractProjections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateDisplay } from '@/utils/dateUtils';

interface ContractMonthlyProjectionsProps {
  contractId: string;
  currency: string;
}

export const ContractMonthlyProjections = ({ contractId, currency }: ContractMonthlyProjectionsProps) => {
  const { projections, loading } = useContractProjections(contractId);
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Agrupar proyecciones por mes
  const groupedByMonth = projections.reduce((acc, proj) => {
    const key = proj.period_date;
    if (!acc[key]) {
      acc[key] = { month_number: proj.month_number, period_date: proj.period_date, items: {} };
    }
    acc[key].items[proj.item] = proj;
    return acc;
  }, {} as Record<string, any>);

  const monthlyData = Object.values(groupedByMonth).sort((a: any, b: any) => a.month_number - b.month_number);

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay proyecciones mensuales generadas para este contrato.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Proyección de Cuotas Mensuales
        </CardTitle>
        <CardDescription>
          Montos proyectados mes a mes considerando ajustes por índices económicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Mes</TableHead>
                <TableHead className="min-w-[120px]">Periodo</TableHead>
                <TableHead className="text-right min-w-[140px]">Item A</TableHead>
                <TableHead className="text-center min-w-[100px]">Ajuste A</TableHead>
                <TableHead className="text-right min-w-[140px]">Item B</TableHead>
                <TableHead className="text-center min-w-[100px]">Ajuste B</TableHead>
                <TableHead className="text-right min-w-[140px]">Total Mensual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month: any) => {
                const itemA = month.items['A'];
                const itemB = month.items['B'];
                const total = (itemA?.adjusted_amount || 0) + (itemB?.adjusted_amount || 0);
                const hasAdjustment = itemA?.adjustment_applied || itemB?.adjustment_applied;

                return (
                  <TableRow key={month.period_date} className={hasAdjustment ? 'bg-accent/50' : ''}>
                    <TableCell className="font-medium">{month.month_number}</TableCell>
                    <TableCell>
                      {formatDateDisplay(month.period_date).substring(3)}
                    </TableCell>
                    
                    {/* Item A */}
                    <TableCell className="text-right font-mono">
                      {itemA ? formatCurrency(itemA.adjusted_amount, language as 'en' | 'es', currency as 'ARS' | 'USD') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemA?.adjustment_applied ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {itemA.adjustment_percentage.toFixed(2)}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Índices aplicados:</p>
                                {itemA.indices_used?.indices?.map((idx: any, i: number) => (
                                  <p key={i}>{idx.period}: {idx.value}%</p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : itemA?.pending_indices ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="gap-1">
                                <Info className="h-3 w-3" />
                                Pendiente
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Faltan índices económicos para calcular el ajuste
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Item B */}
                    <TableCell className="text-right font-mono">
                      {itemB ? formatCurrency(itemB.adjusted_amount, language as 'en' | 'es', currency as 'ARS' | 'USD') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemB?.adjustment_applied ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {itemB.adjustment_percentage.toFixed(2)}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Índices aplicados:</p>
                                {itemB.indices_used?.indices?.map((idx: any, i: number) => (
                                  <p key={i}>{idx.period}: {idx.value}%</p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : itemB?.pending_indices ? (
                        <Badge variant="outline" className="gap-1">
                          <Info className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-right font-semibold font-mono">
                      {formatCurrency(total, language as 'en' | 'es', currency as 'ARS' | 'USD')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-accent/50" />
            <span>Mes con ajuste aplicado</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              %
            </Badge>
            <span>Ajuste por índices económicos</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" />
            </Badge>
            <span>Pendiente de índices</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
