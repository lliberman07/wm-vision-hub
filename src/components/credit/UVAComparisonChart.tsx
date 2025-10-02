import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UVAComparisonChartProps {
  monto: number;
  plazoMeses: number;
  tasaUVA: number; // TEA
  tasaTradicional: number; // TEA
  inflacionAnual: number;
  ingreso: number;
}

const UVAComparisonChart = ({ 
  monto, 
  plazoMeses, 
  tasaUVA, 
  tasaTradicional, 
  inflacionAnual,
  ingreso 
}: UVAComparisonChartProps) => {
  const { t, language } = useLanguage();

  // Calcular tasa mensual desde TEA
  const calculateMonthlyRate = (tea: number) => {
    return Math.pow(1 + tea / 100, 1 / 12) - 1;
  };

  const tasaMensualUVA = calculateMonthlyRate(tasaUVA);
  const tasaMensualTradicional = calculateMonthlyRate(tasaTradicional);
  const inflacionMensual = inflacionAnual / 100 / 12;

  // Calcular cuota fija sistema francés
  const calculateFrenchInstallment = (monto: number, tasaMensual: number, plazoMeses: number) => {
    if (tasaMensual === 0) return monto / plazoMeses;
    return monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  };

  const cuotaInicialUVA = calculateFrenchInstallment(monto, tasaMensualUVA, plazoMeses);
  const cuotaTradicional = calculateFrenchInstallment(monto, tasaMensualTradicional, plazoMeses);

  // Generar datos de comparación (cada 6 meses para no saturar)
  const comparisonData = [];
  for (let mes = 0; mes <= plazoMeses; mes += 6) {
    if (mes === 0) mes = 1; // Evitar mes 0
    
    // UVA se ajusta por inflación
    const cuotaUVA = cuotaInicialUVA * Math.pow(1 + inflacionMensual, mes - 1);
    const porcentajeIngresoUVA = (cuotaUVA / ingreso) * 100;
    const porcentajeIngresoTradicional = (cuotaTradicional / ingreso) * 100;

    comparisonData.push({
      mes,
      cuotaUVA: Math.round(cuotaUVA),
      cuotaTradicional: Math.round(cuotaTradicional),
      porcentajeIngresoUVA: Number(porcentajeIngresoUVA.toFixed(1)),
      porcentajeIngresoTradicional: Number(porcentajeIngresoTradicional.toFixed(1))
    });
  }

  // Calcular totales pagados
  const totalPagadoUVA = comparisonData.reduce((sum, d) => sum + d.cuotaUVA, 0) * (plazoMeses / comparisonData.length);
  const totalPagadoTradicional = cuotaTradicional * plazoMeses;
  const ahorroInicial = cuotaTradicional - cuotaInicialUVA;
  const diferenciaTotal = totalPagadoUVA - totalPagadoTradicional;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('credit.uva.comparison.title')}
        </CardTitle>
        <CardDescription>
          {t('credit.uva.comparison.description')} ({inflacionAnual}% {t('credit.uva.comparison.inflationAssumption')})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert explicativo */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('credit.uva.comparison.alert.title')}</AlertTitle>
          <AlertDescription>
            {t('credit.uva.comparison.alert.description')}
          </AlertDescription>
        </Alert>

        {/* Comparación inicial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{t('credit.uva.comparison.initialUVA')}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(cuotaInicialUVA, language, 'ARS')}</p>
            <p className="text-xs text-muted-foreground mt-1">TEA: {tasaUVA.toFixed(2)}%</p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{t('credit.uva.comparison.traditional')}</p>
            <p className="text-2xl font-bold">{formatCurrency(cuotaTradicional, language, 'ARS')}</p>
            <p className="text-xs text-muted-foreground mt-1">TEA: {tasaTradicional.toFixed(2)}%</p>
          </div>

          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{t('credit.uva.comparison.initialSaving')}</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(ahorroInicial, language, 'ARS')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((ahorroInicial / cuotaTradicional) * 100).toFixed(0)}% {t('credit.uva.comparison.less')}
            </p>
          </div>
        </div>

        {/* Gráfico de evolución */}
        <div>
          <h4 className="text-sm font-semibold mb-4">{t('credit.uva.comparison.evolutionChart')}</h4>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="mes" 
                label={{ value: t('credit.uva.chart.xaxis'), position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: t('credit.uva.comparison.installment'), angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => formatCurrency(value, language, 'ARS')}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: '% ' + t('credit.uva.comparison.income'), angle: 90, position: 'insideRight' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name.includes('cuota')) {
                    return [formatCurrency(value, language, 'ARS'), name];
                  }
                  return [`${value}%`, name];
                }}
                labelFormatter={(label) => `${t('credit.uva.chart.tooltip.mes')} ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="cuotaUVA" 
                fill="hsl(var(--primary))" 
                opacity={0.8}
                name={t('credit.uva.comparison.legend.uva')}
              />
              <Bar 
                yAxisId="left"
                dataKey="cuotaTradicional" 
                fill="hsl(var(--muted-foreground))" 
                opacity={0.6}
                name={t('credit.uva.comparison.legend.traditional')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="porcentajeIngresoUVA"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="% Ingreso UVA"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Totales finales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t('credit.uva.comparison.totalUVA')}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalPagadoUVA, language, 'ARS')}</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t('credit.uva.comparison.totalTraditional')}</p>
            <p className="text-lg font-bold">{formatCurrency(totalPagadoTradicional, language, 'ARS')}</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${diferenciaTotal > 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
            <p className="text-xs text-muted-foreground mb-1">{t('credit.uva.comparison.difference')}</p>
            <p className={`text-lg font-bold ${diferenciaTotal > 0 ? 'text-destructive' : 'text-success'}`}>
              {diferenciaTotal > 0 ? '+' : ''}{formatCurrency(diferenciaTotal, language, 'ARS')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UVAComparisonChart;
