import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useUVAProjection } from "@/hooks/useUVAProjection";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";

interface UVAProjectionChartProps {
  cuotaInicial: number;
  inflacionAnual: number;
  plazoMeses: number;
  ingreso: number;
}

const UVAProjectionChart = ({ cuotaInicial, inflacionAnual, plazoMeses, ingreso }: UVAProjectionChartProps) => {
  const { t, language } = useLanguage();
  const projection = useUVAProjection(cuotaInicial, inflacionAnual, plazoMeses, ingreso);

  // Mostrar proyección cada 12 meses para no saturar el gráfico
  const filteredData = projection.filter((_, idx) => idx % 12 === 0 || idx === projection.length - 1);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t('credit.uva.chart.title')}</CardTitle>
        <CardDescription>
          {t('credit.uva.chart.description')} ({inflacionAnual}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="mes" 
              label={{ value: t('credit.uva.chart.xaxis'), position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              yAxisId="left"
              label={{ value: t('credit.uva.chart.yaxis.cuota'), angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => formatCurrency(value, language, 'ARS')}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: t('credit.uva.chart.yaxis.porcentaje'), angle: 90, position: 'insideRight' }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'cuota') {
                  return [formatCurrency(value, language, 'ARS'), t('credit.uva.chart.tooltip.cuota')];
                }
                return [`${value.toFixed(1)}%`, t('credit.uva.chart.tooltip.porcentaje')];
              }}
              labelFormatter={(label) => `${t('credit.uva.chart.tooltip.mes')} ${label}`}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="cuota" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name={t('credit.uva.chart.legend.cuota')}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="porcentajeIngreso" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name={t('credit.uva.chart.legend.porcentaje')}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">{t('credit.uva.projection.initial')}</p>
            <p className="font-semibold text-primary">{formatCurrency(cuotaInicial, language, 'ARS')}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">{t('credit.uva.projection.middle')}</p>
            <p className="font-semibold text-primary">
              {formatCurrency(projection[Math.floor(projection.length / 2)]?.cuota || 0, language, 'ARS')}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">{t('credit.uva.projection.final')}</p>
            <p className="font-semibold text-primary">
              {formatCurrency(projection[projection.length - 1]?.cuota || 0, language, 'ARS')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UVAProjectionChart;
