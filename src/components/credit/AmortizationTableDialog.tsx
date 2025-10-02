import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAmortizationTable } from '@/hooks/useAmortizationTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/numberFormat';

interface AmortizationTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banco: string;
  producto: string;
  montoFinanciado: number;
  tasaMensual: number;
  plazoMeses: number;
}

export const AmortizationTableDialog = ({
  open,
  onOpenChange,
  banco,
  producto,
  montoFinanciado,
  tasaMensual,
  plazoMeses
}: AmortizationTableDialogProps) => {
  const { t, language } = useLanguage();
  const amortizationTable = useAmortizationTable(montoFinanciado, tasaMensual / 100, plazoMeses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {t('mortgage.amortization.title')} - {banco}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{producto}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('mortgage.amortization.financedAmount')}: </span>
              <span className="font-semibold">{formatCurrency(montoFinanciado, language)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('mortgage.amortization.term')}: </span>
              <span className="font-semibold">{plazoMeses} {t('mortgage.results.months')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('mortgage.amortization.monthlyRate')}: </span>
              <span className="font-semibold">{tasaMensual.toFixed(4)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('mortgage.amortization.system')}: </span>
              <span className="font-semibold">{t('mortgage.amortization.frenchSystem')}</span>
            </div>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('mortgage.amortization.month')}</TableHead>
                  <TableHead className="text-right">{t('mortgage.amortization.installment')}</TableHead>
                  <TableHead className="text-right">{t('mortgage.amortization.capital')}</TableHead>
                  <TableHead className="text-right">{t('mortgage.amortization.interest')}</TableHead>
                  <TableHead className="text-right">{t('mortgage.amortization.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortizationTable.map((row) => (
                  <TableRow key={row.mes}>
                    <TableCell className="font-medium">{row.mes}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.cuota, language)}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatCurrency(row.capital, language)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 dark:text-orange-400">
                      {formatCurrency(row.interes, language)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.saldo, language)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p className="font-semibold mb-2">{t('mortgage.amortization.note')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('mortgage.amortization.noteFixed')}</li>
              <li>{t('mortgage.amortization.noteCapital')}</li>
              <li>{t('mortgage.amortization.noteInterest')}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
