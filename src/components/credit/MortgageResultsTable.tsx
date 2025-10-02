import { useLanguage } from '@/contexts/LanguageContext';
import { MortgageSimulationResult } from '@/types/credit';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/numberFormat';

interface MortgageResultsTableProps {
  results: MortgageSimulationResult[];
}

export const MortgageResultsTable = ({ results }: MortgageResultsTableProps) => {
  const { t, language } = useLanguage();

  const getStatusBadge = (estado: MortgageSimulationResult['estado'], plazoRecomendado: number | null) => {
    switch (estado) {
      case 'VIABLE':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            {t('mortgage.status.viable')}
          </Badge>
        );
      case 'NO_VIABLE_EXTENDER':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {t('mortgage.status.extendTo')} {plazoRecomendado} {t('mortgage.form.months')}
          </Badge>
        );
      case 'NO_VIABLE':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            {t('mortgage.status.notViable')}
          </Badge>
        );
    }
  };

  if (results.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        {t('mortgage.results.noResults')}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">{t('mortgage.results.title')}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mortgage.results.bank')}</TableHead>
              <TableHead>{t('mortgage.results.product')}</TableHead>
              <TableHead className="text-right">{t('mortgage.results.downPayment')}</TableHead>
              <TableHead className="text-right">{t('mortgage.results.financedAmount')}</TableHead>
              <TableHead className="text-right">{t('mortgage.results.monthlyInstallment')}</TableHead>
              <TableHead className="text-right">{t('mortgage.results.maxAllowedInstallment')}</TableHead>
              <TableHead className="text-center">{t('mortgage.results.recommendedTerm')}</TableHead>
              <TableHead className="text-center">{t('mortgage.results.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{result.banco}</TableCell>
                <TableCell>{result.producto}</TableCell>
                <TableCell className="text-right font-semibold text-warning">
                  {formatCurrency(result.pago_inicial_requerido, language)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(result.monto_a_financiar, language)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(result.cuota_inicial, language)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(result.cuota_maxima_permitida, language)}
                </TableCell>
                <TableCell className="text-center">
                  {result.plazo_recomendado 
                    ? `${result.plazo_recomendado} ${t('mortgage.form.months')}`
                    : `${result.plazo_deseado} ${t('mortgage.form.months')}`
                  }
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(result.estado, result.plazo_recomendado)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
