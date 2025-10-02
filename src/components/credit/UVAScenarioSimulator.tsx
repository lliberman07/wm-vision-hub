import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface UVAScenarioSimulatorProps {
  cuotaInicial: number;
  plazoMeses: number;
  ingreso: number;
  inflacionBase: number;
}

const UVAScenarioSimulator = ({ 
  cuotaInicial, 
  plazoMeses, 
  ingreso,
  inflacionBase 
}: UVAScenarioSimulatorProps) => {
  const { t, language } = useLanguage();
  
  // Escenarios predefinidos
  const [inflacionOptimista, setInflacionOptimista] = useState(Math.max(20, inflacionBase - 50));
  const [inflacionPesimista, setInflacionPesimista] = useState(inflacionBase + 50);
  const [aumentoSalarialOptimista, setAumentoSalarialOptimista] = useState(inflacionOptimista);
  const [aumentoSalarialPesimista, setAumentoSalarialPesimista] = useState(Math.max(0, inflacionPesimista - 30));

  // Generar proyecciones para los 3 escenarios
  const generateScenarioData = (
    inflacion: number, 
    aumentoSalarial: number, 
    label: string
  ) => {
    const inflacionMensual = inflacion / 100 / 12;
    const aumentoSalarialMensual = aumentoSalarial / 100 / 12;
    const data = [];

    for (let mes = 0; mes <= plazoMeses; mes += 6) {
      if (mes === 0) mes = 1;
      
      const cuota = cuotaInicial * Math.pow(1 + inflacionMensual, mes - 1);
      const ingresoAjustado = ingreso * Math.pow(1 + aumentoSalarialMensual, mes - 1);
      const porcentaje = (cuota / ingresoAjustado) * 100;

      data.push({
        mes,
        [`cuota_${label}`]: Math.round(cuota),
        [`porcentaje_${label}`]: Number(porcentaje.toFixed(1))
      });
    }

    return data;
  };

  const dataOptimista = generateScenarioData(inflacionOptimista, aumentoSalarialOptimista, 'optimista');
  const dataBase = generateScenarioData(inflacionBase, inflacionBase, 'base');
  const dataPesimista = generateScenarioData(inflacionPesimista, aumentoSalarialPesimista, 'pesimista');

  // Combinar datos
  const combinedData = dataOptimista.map((opt, idx) => ({
    ...opt,
    ...dataBase[idx],
    ...dataPesimista[idx]
  }));

  // Calcular métricas finales
  const calculateFinalMetrics = (inflacion: number, aumentoSalarial: number) => {
    const mesProyeccion = Math.min(plazoMeses, 60);
    const inflacionMensual = inflacion / 100 / 12;
    const aumentoSalarialMensual = aumentoSalarial / 100 / 12;
    
    const cuotaFinal = cuotaInicial * Math.pow(1 + inflacionMensual, mesProyeccion);
    const ingresoFinal = ingreso * Math.pow(1 + aumentoSalarialMensual, mesProyeccion);
    const porcentajeFinal = (cuotaFinal / ingresoFinal) * 100;
    
    return { cuotaFinal, ingresoFinal, porcentajeFinal };
  };

  const metricsOptimista = calculateFinalMetrics(inflacionOptimista, aumentoSalarialOptimista);
  const metricsBase = calculateFinalMetrics(inflacionBase, inflacionBase);
  const metricsPesimista = calculateFinalMetrics(inflacionPesimista, aumentoSalarialPesimista);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t('credit.uva.scenarios.title')}</CardTitle>
        <CardDescription>{t('credit.uva.scenarios.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">{t('credit.uva.scenarios.tabs.comparison')}</TabsTrigger>
            <TabsTrigger value="settings">{t('credit.uva.scenarios.tabs.settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            {/* Gráfico comparativo */}
            <div>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={combinedData}>
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
                    label={{ value: '% Ingreso', angle: 90, position: 'insideRight' }}
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
                  
                  {/* Áreas de cuotas */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cuota_optimista"
                    fill="hsl(var(--success))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    name={t('credit.uva.scenarios.optimistic')}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cuota_base"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name={t('credit.uva.scenarios.base')}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cuota_pesimista"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name={t('credit.uva.scenarios.pessimistic')}
                  />

                  {/* Líneas de porcentaje de ingreso */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentaje_optimista"
                    stroke="hsl(var(--success))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="% Optimista"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentaje_base"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="% Base"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentaje_pesimista"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="% Pesimista"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas finales comparativas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-success" />
                  <h4 className="font-semibold text-success">{t('credit.uva.scenarios.optimistic')}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('credit.uva.scenarios.metrics.finalInstallment')}</span>
                    <span className="font-semibold">{formatCurrency(metricsOptimista.cuotaFinal, language, 'ARS')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% {t('credit.uva.scenarios.metrics.income')}</span>
                    <span className="font-semibold text-success">{metricsOptimista.porcentajeFinal.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Minus className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-primary">{t('credit.uva.scenarios.base')}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('credit.uva.scenarios.metrics.finalInstallment')}</span>
                    <span className="font-semibold">{formatCurrency(metricsBase.cuotaFinal, language, 'ARS')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% {t('credit.uva.scenarios.metrics.income')}</span>
                    <span className="font-semibold text-primary">{metricsBase.porcentajeFinal.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                  <h4 className="font-semibold text-destructive">{t('credit.uva.scenarios.pessimistic')}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('credit.uva.scenarios.metrics.finalInstallment')}</span>
                    <span className="font-semibold">{formatCurrency(metricsPesimista.cuotaFinal, language, 'ARS')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% {t('credit.uva.scenarios.metrics.income')}</span>
                    <span className="font-semibold text-destructive">{metricsPesimista.porcentajeFinal.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escenario Optimista */}
              <div className="space-y-4 p-4 bg-success/5 border border-success/20 rounded-lg">
                <h4 className="font-semibold text-success flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {t('credit.uva.scenarios.optimistic')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>{t('credit.uva.scenarios.settings.inflation')}: {inflacionOptimista}%</Label>
                    <Slider
                      value={[inflacionOptimista]}
                      onValueChange={(v) => setInflacionOptimista(v[0])}
                      min={10}
                      max={200}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{t('credit.uva.scenarios.settings.salaryIncrease')}: {aumentoSalarialOptimista}%</Label>
                    <Slider
                      value={[aumentoSalarialOptimista]}
                      onValueChange={(v) => setAumentoSalarialOptimista(v[0])}
                      min={0}
                      max={200}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Escenario Pesimista */}
              <div className="space-y-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('credit.uva.scenarios.pessimistic')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>{t('credit.uva.scenarios.settings.inflation')}: {inflacionPesimista}%</Label>
                    <Slider
                      value={[inflacionPesimista]}
                      onValueChange={(v) => setInflacionPesimista(v[0])}
                      min={10}
                      max={300}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{t('credit.uva.scenarios.settings.salaryIncrease')}: {aumentoSalarialPesimista}%</Label>
                    <Slider
                      value={[aumentoSalarialPesimista]}
                      onValueChange={(v) => setAumentoSalarialPesimista(v[0])}
                      min={0}
                      max={200}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t('credit.uva.scenarios.settings.note')}:</strong> {t('credit.uva.scenarios.settings.noteDescription')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UVAScenarioSimulator;
