import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditLine, CreditType } from '@/types/investment';

interface FinancingSourcesProps {
  creditLines: CreditLine[];
  onUpdateCreditLine: (type: CreditType, updates: Partial<CreditLine>) => void;
}

const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  personal: 'Crédito Personal',
  capital: 'Bienes de Capital',
  mortgage: 'Crédito Hipotecario'
};

const CREDIT_TYPE_COLORS: Record<CreditType, string> = {
  personal: 'bg-blue-100 text-blue-800',
  capital: 'bg-green-100 text-green-800',
  mortgage: 'bg-purple-100 text-purple-800'
};

export const FinancingSources = ({ creditLines, onUpdateCreditLine }: FinancingSourcesProps) => {
  const calculateMonthlyPayment = (amount: number, rate: number, months: number): number => {
    if (rate === 0) return amount / months;
    const monthlyRate = rate / 100 / 12;
    return amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const handleRateChange = (type: CreditType, rate: number) => {
    const creditLine = creditLines.find(cl => cl.type === type);
    if (!creditLine) return;
    
    const monthlyPayment = calculateMonthlyPayment(creditLine.totalAmount, rate, creditLine.termMonths);
    onUpdateCreditLine(type, { interestRate: rate, monthlyPayment });
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
          <h3 className="text-xl font-semibold">Fuentes de Financiamiento</h3>
          <p className="text-muted-foreground">
            Configure las condiciones de financiamiento por tipo de crédito
          </p>
        </div>
        <div className="text-right space-y-1">
          <div>
            <Label className="text-sm text-muted-foreground">Total Financiado</Label>
            <div className="text-xl font-bold text-primary">
              ${totalFinanced.toLocaleString()}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Pago Mensual Total</Label>
            <div className="text-xl font-bold text-accent">
              ${totalMonthlyPayment.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {creditLines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No hay ítems seleccionados para financiar. 
              Vuelva al módulo anterior para seleccionar ítems de inversión.
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
                    <span>{CREDIT_TYPE_LABELS[creditLine.type]}</span>
                    <Badge className={CREDIT_TYPE_COLORS[creditLine.type]} variant="secondary">
                      ${creditLine.totalAmount.toLocaleString()}
                    </Badge>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Pago Mensual</div>
                    <div className="text-lg font-semibold text-accent">
                      ${creditLine.monthlyPayment.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Monto a Financiar</Label>
                    <Input
                      type="number"
                      value={creditLine.totalAmount}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tasa de Interés (%)</Label>
                    <Input
                      type="number"
                      value={creditLine.interestRate}
                      onChange={(e) => handleRateChange(creditLine.type, Number(e.target.value))}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Plazo (meses)</Label>
                    <Input
                      type="number"
                      value={creditLine.termMonths}
                      onChange={(e) => handleTermChange(creditLine.type, Number(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Resumen del crédito:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                    <div>
                      <span className="font-medium">Capital:</span> ${creditLine.totalAmount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Cuota:</span> ${creditLine.monthlyPayment.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total a pagar:</span> ${(creditLine.monthlyPayment * creditLine.termMonths).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Intereses:</span> ${((creditLine.monthlyPayment * creditLine.termMonths) - creditLine.totalAmount).toLocaleString()}
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