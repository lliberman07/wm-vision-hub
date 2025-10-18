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
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Save, AlertTriangle, TrendingUp, Calculator, DollarSign, FileDown, AlertCircle } from 'lucide-react';
import { InvestmentItem, CreditLine, FinancialAnalysis, Alert as AlertType } from '@/types/investment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatNumber } from '@/utils/numberFormat';
import { EmailModal } from '@/components/EmailModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { t, language, currency } = useLanguage();
  const { toast } = useToast();
  const [sensitivityRate, setSensitivityRate] = useState([0]);
  const [sensitivityIncome, setSensitivityIncome] = useState([0]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const selectedItems = items.filter(item => item.isSelected);

  const getItemName = (item: InvestmentItem) => (item.nameKey ? t(item.nameKey) : item.name);

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

  const handleSaveScenario = async (email: string) => {
    try {
      // Use export-pdf-report to generate both the PDF and save the scenario with a single reference number
      const { data, error } = await supabase.functions.invoke('export-pdf-report', {
        body: {
          email,
          simulationData: {
            items: selectedItems,
            creditLines,
            estimatedMonthlyIncome,
            grossMarginPercentage
          },
          analysisResults: analysis,
          language
        }
      });

      if (error) throw error;

      toast({
        title: t("Escenario guardado"),
        description: t("Su código de simulación es: ") + data.referenceNumber + t(". Recibirá el reporte PDF por email."),
      });
    } catch (error: any) {
      console.error('Error saving scenario:', error);
      toast({
        title: t("Error"),
        description: t("No se pudo guardar el escenario. ") + (error.message || ""),
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async (email: string) => {
    // Both actions are now unified - they save and send PDF with same reference number
    return handleSaveScenario(email);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">{t('simulator.results.title')}</h3>
          <p className="text-muted-foreground">
            {t('simulator.results.subtitle')}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(alerts.length > 0 || (() => {
        const customTotal = creditLines.reduce((s, cl) => s + cl.totalAmount, 0);
        const calculatedTotal = analysis.totalFinanced;
        return customTotal > 0 && Math.abs(customTotal - calculatedTotal) > 1;
      })()) && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
          
          {(() => {
            const customTotal = creditLines.reduce((s, cl) => s + cl.totalAmount, 0);
            const calculatedTotal = analysis.totalFinanced;
            return customTotal > 0 && Math.abs(customTotal - calculatedTotal) > 1 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ Los montos de financiamiento personalizados ({formatCurrency(customTotal, language, currency)}) 
                  difieren del cálculo automático ({formatCurrency(calculatedTotal, language, currency)}). 
                  Considere resetear los valores en la pestaña de Financiamiento.
                </AlertDescription>
              </Alert>
            ) : null;
          })()}
        </div>
      )}

      {/* Income Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{t('simulator.results.incomeConfig.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('simulator.results.estimatedMonthlyIncome')}</Label>
              <Input
                type="number"
                value={estimatedMonthlyIncome || ''}
                onChange={(e) => onIncomeChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('simulator.results.grossMarginPercentage')}</Label>
              <Input
                type="number"
                value={grossMarginPercentage || ''}
                onChange={(e) => onMarginChange(Number(e.target.value) || 0)}
                min="0"
                max="100"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('simulator.results.netIncome')}</span>
                <div className="font-semibold">{formatCurrency(netMonthlyIncome, language, currency)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('simulator.results.debtToIncome')}</span>
                <div className="font-semibold">{debtToIncomeRatio.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('simulator.results.freeCashFlow')}</span>
                <div className="font-semibold">{formatCurrency(netMonthlyIncome - analysis.monthlyPaymentTotal, language, currency)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('simulator.results.annualROI')}</span>
                <div className="font-semibold">{analysis.roi.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">{t('simulator.results.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="analysis">{t('simulator.results.tabs.analysis')}</TabsTrigger>
          <TabsTrigger value="sensitivity">{t('simulator.results.tabs.sensitivity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulator.results.summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('simulator.results.totalInvestment')}</Label>
                  <div className="text-2xl font-bold">{formatCurrency(analysis.totalInvestment, language, currency)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('simulator.results.upfrontPayment')}</Label>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(analysis.totalAdvances, language, currency)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('simulator.results.financedAmount')}</Label>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(analysis.totalFinanced, language, currency)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('simulator.results.monthlyPayment')}</Label>
                  <div className="text-2xl font-bold text-accent">{formatCurrency(analysis.monthlyPaymentTotal, language, currency)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulator.results.detailedBreakdown')}</CardTitle>
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
                          {t('simulator.results.upfrontPayment')}: {item.advancePercentage}% • {t('simulator.results.financedAmount')}: {((item.financeBalance / item.amount) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.amount, language, currency)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.advanceAmount, language, currency)} + {formatCurrency(item.financeBalance, language, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <span>{t('simulator.results.breakEvenPoint')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analysis.breakEvenMonths.toFixed(1)} {t('simulator.results.months')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('simulator.results.breakEvenDescription')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>{t('simulator.results.paybackPeriod')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {analysis.paybackPeriod.toFixed(1)} {t('simulator.results.months')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('simulator.results.paybackDescription')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>{t('simulator.results.annualROI')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analysis.roi.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('simulator.results.annualROIDescription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('simulator.results.detailedAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">{t('simulator.results.projectedCashFlow')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('simulator.results.grossMonthlyIncome')}</span>
                      <span className="font-medium">{formatCurrency(estimatedMonthlyIncome, language, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('simulator.results.grossMargin')} ({grossMarginPercentage}%):</span>
                      <span className="font-medium">{formatCurrency(netMonthlyIncome, language, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('simulator.results.financingPayments')}</span>
                      <span className="font-medium text-destructive">-{formatCurrency(analysis.monthlyPaymentTotal, language, currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{t('simulator.results.freeMonthlyCashFlow')}</span>
                      <span className={netMonthlyIncome - analysis.monthlyPaymentTotal >= 0 ? 'text-primary' : 'text-destructive'}>
                        {formatCurrency(netMonthlyIncome - analysis.monthlyPaymentTotal, language, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">{t('simulator.results.riskIndicators')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('simulator.results.debtToIncome')}</span>
                      <Badge variant={debtToIncomeRatio > 40 ? 'destructive' : debtToIncomeRatio > 30 ? 'secondary' : 'default'}>
                        {debtToIncomeRatio.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('simulator.results.leverage')}</span>
                      <span className="font-medium">
                        {analysis.totalInvestment > 0 ? ((analysis.totalFinanced / analysis.totalInvestment) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('simulator.results.paymentCoverage')}</span>
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
              <CardTitle>{t('simulator.results.sensitivity.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('simulator.results.sensitivity.description')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>{t('simulator.results.sensitivity.rateLabel')}</Label>
                  <Slider
                    value={sensitivityRate}
                    onValueChange={setSensitivityRate}
                    max={10}
                    min={-10}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">
                    {t('simulator.results.sensitivity.variation')} {sensitivityRate[0] >= 0 ? '+' : ''}{sensitivityRate[0]}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>{t('simulator.results.sensitivity.incomeLabel')}</Label>
                  <Slider
                    value={sensitivityIncome}
                    onValueChange={setSensitivityIncome}
                    max={50}
                    min={-50}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground">
                    {t('simulator.results.sensitivity.variation')} {sensitivityIncome[0] >= 0 ? '+' : ''}{sensitivityIncome[0]}%
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
                    name={t('simulator.results.sensitivity.breakEvenLegend')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name={t('simulator.results.sensitivity.annualROILegend')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="flex-1" onClick={() => setShowSaveModal(true)}>
          <Save className="mr-2 h-4 w-4" />
          {t('simulator.results.saveScenario')}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setShowExportModal(true)}>
          <FileDown className="mr-2 h-4 w-4" />
          {t('simulator.results.exportPDF')}
        </Button>
      </div>

      {/* Email Modals */}
      <EmailModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSubmit={handleSaveScenario}
        title="Guardar Escenario"
        description="Ingrese su email para recibir el código de simulación y guardar este escenario."
        actionLabel="Guardar"
      />
      <EmailModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onSubmit={handleExportPDF}
        title="Exportar PDF"
        description="Ingrese su email para recibir el reporte PDF con su código de simulación."
        actionLabel="Generar PDF"
      />
    </div>
  );
};