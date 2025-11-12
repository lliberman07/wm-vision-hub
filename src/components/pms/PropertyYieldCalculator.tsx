import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Percent, DollarSign, Calculator, Info } from 'lucide-react';
import { useExchangeRate } from '@/hooks/useExchangeRate';

interface PropertyYieldCalculatorProps {
  monthlyNetIncome: number;
  functionalCurrency: string;
  propertyValue?: number;
  onPropertyValueChange?: (value: number) => void;
  showExchangeRateInfo?: boolean;
}

export const PropertyYieldCalculator = ({
  monthlyNetIncome,
  functionalCurrency,
  propertyValue: externalValue = 0,
  onPropertyValueChange,
  showExchangeRateInfo = false
}: PropertyYieldCalculatorProps) => {
  const [internalValue, setInternalValue] = useState(externalValue);
  const { rate: exchangeRate, source } = useExchangeRate({
    sourceType: 'oficial',
    preferredType: 'sell'
  });

  // Sincronizar con valor externo cuando cambia
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  const handleValueChange = (newValue: number) => {
    setInternalValue(newValue);
    onPropertyValueChange?.(newValue);
  };

  const propertyValue = internalValue;

  const annualIncome = monthlyNetIncome * 12;
  const grossYield = propertyValue > 0 ? (annualIncome / propertyValue) * 100 : 0;
  const estimatedCapRate = grossYield * 0.85; // Assuming 15% operating expenses

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Cálculo de Rentabilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="propertyValue" className="text-sm font-medium">
            Valor de Mercado de la Propiedad ({functionalCurrency})
          </Label>
          <Input
            id="propertyValue"
            type="number"
            value={propertyValue || ''}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            placeholder="Ej: 150000"
            className="mt-1.5"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={DollarSign}
            label="Ingreso Neto Mensual"
            value={monthlyNetIncome.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            currency={functionalCurrency}
          />
          
          <MetricCard
            icon={TrendingUp}
            label="Ingreso Neto Anual"
            value={annualIncome.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            currency={functionalCurrency}
          />
          
          <MetricCard
            icon={Percent}
            label="Gross Yield Anual"
            value={grossYield.toFixed(2)}
            suffix="%"
            highlight
          />
          
          <MetricCard
            icon={Percent}
            label="Cap Rate Estimado"
            value={estimatedCapRate.toFixed(2)}
            suffix="%"
            description="Asumiendo 15% gastos operativos"
          />
        </div>

        {showExchangeRateInfo && exchangeRate && (
          <>
            <Separator />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Tipo de cambio utilizado: 1 USD = ${exchangeRate.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ARS. Los montos se consolidaron a USD para cálculo de rendimiento.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  currency?: string;
  suffix?: string;
  highlight?: boolean;
  description?: string;
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
  currency,
  suffix,
  highlight,
  description
}: MetricCardProps) => {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {currency && <span className="text-sm font-normal mr-1">{currency}</span>}
        {value}
        {suffix && <span className="text-lg ml-0.5">{suffix}</span>}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};
