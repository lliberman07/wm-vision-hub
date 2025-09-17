import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditLine, CreditType } from '@/types/investment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/numberFormat';

interface FinancingSourcesProps {
  creditLines: CreditLine[];
  onUpdateCreditLine: (type: CreditType, updates: Partial<CreditLine>) => void;
}

const getCreditLabel = (type: CreditType, t: (key: string) => string) =>
  type === 'personal'
    ? t('simulator.items.creditType.personal')
    : type === 'capital'
    ? t('simulator.items.creditType.capital')
    : t('simulator.items.creditType.mortgage');

const CREDIT_TYPE_COLORS: Record<CreditType, string> = {
  personal: 'bg-blue-100 text-blue-800',
  capital: 'bg-green-100 text-green-800',
  mortgage: 'bg-purple-100 text-purple-800'
};

export const FinancingSources = ({ creditLines, onUpdateCreditLine }: FinancingSourcesProps) => {
  const { t, language, currency } = useLanguage();
  const calculateMonthlyPayment = (amount: number, rate: number, months: number): number => {
    if (rate === 0) return Math.round(amount / months);
    const monthlyRate = rate / 100 / 12;
    return Math.round(amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1));
  };

  const handleRateChange = (type: CreditType, rate: number) => {
    const creditLine = creditLines.find(cl => cl.type === type);
    if (!creditLine) return;
    
    // Round to 2 decimal places
    const roundedRate = Math.round(rate * 100) / 100;
    const monthlyPayment = calculateMonthlyPayment(creditLine.totalAmount, roundedRate, creditLine.termMonths);
    onUpdateCreditLine(type, { interestRate: roundedRate, monthlyPayment });
  };

  const handleTermChange = (type: CreditType, termMonths: number) => {
    const creditLine = creditLines.find(cl => cl.type === type);
    if (!creditLine) return;
    
    const monthlyPayment = calculateMonthlyPayment(creditLine.totalAmount, creditLine.interestRate, termMonths);
    onUpdateCreditLine(type, { termMonths, monthlyPayment });
  };

  const totalMonthlyPayment = creditLines.reduce((sum, cl) => sum + cl.monthlyPayment, 0);
  const totalFinanced = creditLines.reduce((sum, cl) => sum + cl.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">{t('simulator.financing.sourcesTitle')}</h3>
          <p className="text-muted-foreground">
            {t('simulator.financing.sourcesDescription')}
          </p>
        </div>
          <div className="text-right space-y-1">
            <div>
              <Label className="text-sm text-muted-foreground">{t('simulator.financing.totalFinanced')}</Label>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(totalFinanced, language, currency)}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{t('simulator.financing.totalMonthlyPayment')}</Label>
              <div className="text-xl font-bold text-accent">
                {formatCurrency(totalMonthlyPayment, language, currency)}
              </div>
            </div>
          </div>
      </div>

      {creditLines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {t('simulator.financing.noItemsSelected')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {creditLines.map((creditLine) => (
            <Card key={creditLine.type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{getCreditLabel(creditLine.type, t)}</span>
                    <Badge className={CREDIT_TYPE_COLORS[creditLine.type]} variant="secondary">
                      {formatCurrency(creditLine.totalAmount, language, currency)}
                    </Badge>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t('simulator.financing.monthlyPayment')}</div>
                    <div className="text-lg font-semibold text-accent">
                      {formatCurrency(creditLine.monthlyPayment, language, currency)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('simulator.financing.amountToFinance')}</Label>
                    <Input
                      type="number"
                      value={creditLine.totalAmount}
                      readOnly
                      className="bg-muted [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`rate-${creditLine.type}`}>{t('simulator.financing.interestRate')}</Label>
                    <Input
                      id={`rate-${creditLine.type}`}
                      type="number"
                      value={creditLine.interestRate || ''}
                      onChange={(e) => handleRateChange(creditLine.type, Number(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      max="100"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`term-${creditLine.type}`}>{t('simulator.financing.termMonths')}</Label>
                    <Input
                      id={`term-${creditLine.type}`}
                      type="number"
                      value={creditLine.termMonths || ''}
                      onChange={(e) => handleTermChange(creditLine.type, Number(e.target.value) || 0)}
                      min="1"
                      max="360"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('simulator.financing.creditSummary')}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                    <div>
                      <span className="font-medium">{t('simulator.financing.principal')}</span> {formatCurrency(creditLine.totalAmount, language, currency)}
                    </div>
                    <div>
                      <span className="font-medium">{t('simulator.financing.payment')}</span> {formatCurrency(creditLine.monthlyPayment, language, currency)}
                    </div>
                    <div>
                      <span className="font-medium">{t('simulator.financing.totalToPay')}</span> {formatCurrency(creditLine.monthlyPayment * creditLine.termMonths, language, currency)}
                    </div>
                    <div>
                      <span className="font-medium">{t('simulator.financing.interest')}</span> {formatCurrency((creditLine.monthlyPayment * creditLine.termMonths) - creditLine.totalAmount, language, currency)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};