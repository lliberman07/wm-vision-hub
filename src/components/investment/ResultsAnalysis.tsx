import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { Download, Save, AlertTriangle, TrendingUp, Calculator, DollarSign } from 'lucide-react';
import { InvestmentItem, CreditLine, FinancialAnalysis, Alert as AlertType } from '@/types/investment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatNumber } from '@/utils/numberFormat';

interface ResultsAnalysisProps {
  items: InvestmentItem[];
  creditLines: CreditLine[];
  analysis: FinancialAnalysis;
  alerts: AlertType[];
  estimatedMonthlyIncome: number;
  grossMarginPercentage: number;
  onIncomeChange: (income: number) => void;
  onMarginChange: (margin: number) => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

export const ResultsAnalysis = ({
  items,
  creditLines,
  analysis,
  alerts,
  estimatedMonthlyIncome,
  grossMarginPercentage,
  onIncomeChange,
  onMarginChange
}: ResultsAnalysisProps) => {
  const { language, t } = useLanguage();
  const [sensitivityRate, setSensitivityRate] = useState([0]);
  const [sensitivityIncome, setSensitivityIncome] = useState([0]);

  const selectedItems = items.filter(item => item.isSelected);

  const getItemName = (item: InvestmentItem) => (item.nameKey ? t(item.nameKey) : item.name);

  // Chart data preparation
  const pieData = selectedItems.map((item, index) => ({
    name: getItemName(item),
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  const financingData = selectedItems.map((item, index) => {
    const label = getItemName(item);
    return {
      name: label.length > 15 ? label.substring(0, 12) + '...' : label,
      adelanto: item.advanceAmount,
      financiado: item.financeBalance,
      color: COLORS[index % COLORS.length]
    };
  });

  const creditLineData = creditLines.map((cl, index) => ({
    name: cl.type === 'personal' ? t('simulator.items.creditType.personal') : cl.type === 'capital' ? t('simulator.items.creditType.capital') : t('simulator.items.creditType.mortgage'),
    cuota: cl.monthlyPayment,
    color: COLORS[index % COLORS.length]
  }));

  // Sensitivity analysis data
  const sensitivityData = [];
  for (let i = -20; i <= 20; i += 5) {
    const adjustedRate = Math.max(0, (sensitivityRate[0] || 0) + i);
    const adjustedIncome = Math.max(0, estimatedMonthlyIncome * (1 + (sensitivityIncome[0] || 0) / 100 + i / 100));
    const adjustedMargin = adjustedIncome * (grossMarginPercentage / 100);
    const adjustedBreakEven = analysis.totalInvestment > 0 && adjustedMargin > 0 ? analysis.totalInvestment / adjustedMargin : 0;
    
    sensitivityData.push({
      scenario: `${i >= 0 ? '+' : ''}${i}%`,
      breakEven: adjustedBreakEven,
      roi: adjustedIncome > 0 ? (adjustedMargin * 12 / analysis.totalInvestment) * 100 : 0
    });
  }

  const netMonthlyIncome = estimatedMonthlyIncome * (grossMarginPercentage / 100);
  const debtToIncomeRatio = estimatedMonthlyIncome > 0 ? (analysis.monthlyPaymentTotal / estimatedMonthlyIncome) * 100 : 0;

  // Custom tooltip formatter for charts
  const tooltipFormatter = (value: number) => formatCurrency(value, language);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Resultados y Análisis Financiero</h3>
          <p className="text-muted-foreground">
            Análisis completo del plan de inversión con métricas y proyecciones
          </p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Income Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Configuración de Ingresos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ingresos Mensuales Estimados</Label>
              <Input
                type="number"
                value={estimatedMonthlyIncome}
                onChange={(e) => onIncomeChange(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Margen Bruto (%)</Label>
              <Input
                type="number"
                value={grossMarginPercentage}
                onChange={(e) => onMarginChange(Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Ingreso Neto:</span>
                <div className="font-semibold">{formatCurrency(netMonthlyIncome, language)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Carga Financiera:</span>
                <div className="font-semibold">{debtToIncomeRatio.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Flujo Libre:</span>
                <div className="font-semibold">{formatCurrency(netMonthlyIncome - analysis.monthlyPaymentTotal, language)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">ROI Anual:</span>
                <div className="font-semibold">{analysis.roi.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Inversión Total</Label>
                  <div className="text-2xl font-bold">{formatCurrency(analysis.totalInvestment, language)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Adelantos Requeridos</Label>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(analysis.totalAdvances, language)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Total Financiado</Label>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(analysis.totalFinanced, language)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Pago Mensual</Label>
                  <div className="text-2xl font-bold text-accent">{formatCurrency(analysis.monthlyPaymentTotal, language)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Ítem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{getItemName(item)}</div>
                        <div className="text-sm text-muted-foreground">
                          Adelanto: {item.advancePercentage}% • Financiado: {((item.financeBalance / item.amount) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.amount, language)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.advanceAmount, language)} + {formatCurrency(item.financeBalance, language)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Investment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Inversión</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financing vs Advance */}
            <Card>
              <CardHeader>
                <CardTitle>Adelanto vs Financiamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="adelanto" stackId="a" fill="#f59e0b" name="Adelanto" />
                    <Bar dataKey="financiado" stackId="a" fill="#3b82f6" name="Financiado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Payments by Credit Type */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos Mensuales por Tipo de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creditLineData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="cuota" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Punto de Equilibrio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analysis.breakEvenMonths.toFixed(1)} meses
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tiempo para recuperar la inversión total con ingresos netos proyectados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Payback Period</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {analysis.paybackPeriod.toFixed(1)} meses
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tiempo para recuperar los adelantos realizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>ROI Anual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analysis.roi.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Retorno sobre la inversión anualizado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Flujo de Caja Proyectado</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ingresos mensuales brutos:</span>
                      <span className="font-medium">{formatCurrency(estimatedMonthlyIncome, language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margen bruto ({grossMarginPercentage}%):</span>
                      <span className="font-medium">{formatCurrency(netMonthlyIncome, language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagos de financiamiento:</span>
                      <span className="font-medium text-destructive">-{formatCurrency(analysis.monthlyPaymentTotal, language)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Flujo libre mensual:</span>
                      <span className={netMonthlyIncome - analysis.monthlyPaymentTotal >= 0 ? 'text-primary' : 'text-destructive'}>
                        {formatCurrency(netMonthlyIncome - analysis.monthlyPaymentTotal, language)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Indicadores de Riesgo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Relación deuda/ingresos:</span>
                      <Badge variant={debtToIncomeRatio > 40 ? 'destructive' : debtToIncomeRatio > 30 ? 'secondary' : 'default'}>
                        {debtToIncomeRatio.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Apalancamiento:</span>
                      <span className="font-medium">
                        {analysis.totalInvestment > 0 ? ((analysis.totalFinanced / analysis.totalInvestment) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cobertura de pagos:</span>
                      <Badge variant={netMonthlyIncome / analysis.monthlyPaymentTotal > 1.5 ? 'default' : 'destructive'}>
                        {analysis.monthlyPaymentTotal > 0 ? (netMonthlyIncome / analysis.monthlyPaymentTotal).toFixed(1) : 'N/A'}x
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Sensibilidad</CardTitle>
              <p className="text-sm text-muted-foreground">
                Evalúe cómo cambios en variables clave afectan la rentabilidad del proyecto
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Variación en Tasas de Interés (%)</Label>
                  <Slider
                    value={sensitivityRate}
                    onValueChange={setSensitivityRate}
                    max={10}
                    min={-10}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">
                    Variación: {sensitivityRate[0] >= 0 ? '+' : ''}{sensitivityRate[0]}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Variación en Ingresos (%)</Label>
                  <Slider
                    value={sensitivityIncome}
                    onValueChange={setSensitivityIncome}
                    max={50}
                    min={-50}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground">
                    Variación: {sensitivityIncome[0] >= 0 ? '+' : ''}{sensitivityIncome[0]}%
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="breakEven" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Punto de Equilibrio (meses)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="ROI Anual (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          Guardar Escenario
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Exportar a PDF
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>
    </div>
  );
};