import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/numberFormat";

interface UVARiskIndicatorProps {
  cuotaInicial: number;
  ingreso: number;
  plazoMeses: number;
  inflacionAnual: number;
  aumentoSalarialEsperado?: number; // % anual de aumento salarial esperado
}

const UVARiskIndicator = ({ 
  cuotaInicial, 
  ingreso, 
  plazoMeses, 
  inflacionAnual,
  aumentoSalarialEsperado = 0
}: UVARiskIndicatorProps) => {
  const { t, language } = useLanguage();

  const inflacionMensual = inflacionAnual / 100 / 12;
  const aumentoSalarialMensual = aumentoSalarialEsperado / 100 / 12;

  // Proyecciones clave
  const mesProyeccion = Math.min(plazoMeses, 60); // Proyectar hasta 5 años máximo
  const cuotaProyectada = cuotaInicial * Math.pow(1 + inflacionMensual, mesProyeccion);
  const ingresoProyectado = ingreso * Math.pow(1 + aumentoSalarialMensual, mesProyeccion);
  
  const porcentajeIngresoInicial = (cuotaInicial / ingreso) * 100;
  const porcentajeIngresoProyectado = (cuotaProyectada / ingresoProyectado) * 100;

  // Determinar nivel de riesgo
  const getRiskLevel = () => {
    if (porcentajeIngresoProyectado > 50) return 'critical';
    if (porcentajeIngresoProyectado > 40) return 'high';
    if (porcentajeIngresoProyectado > 30) return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel();

  const riskConfig = {
    critical: {
      icon: AlertTriangle,
      color: 'destructive',
      title: t('credit.uva.risk.critical.title'),
      description: t('credit.uva.risk.critical.description'),
      bgClass: 'bg-destructive/10 border-destructive/30',
      textClass: 'text-destructive'
    },
    high: {
      icon: AlertCircle,
      color: 'warning',
      title: t('credit.uva.risk.high.title'),
      description: t('credit.uva.risk.high.description'),
      bgClass: 'bg-warning/10 border-warning/30',
      textClass: 'text-warning'
    },
    medium: {
      icon: AlertCircle,
      color: 'primary',
      title: t('credit.uva.risk.medium.title'),
      description: t('credit.uva.risk.medium.description'),
      bgClass: 'bg-primary/10 border-primary/30',
      textClass: 'text-primary'
    },
    low: {
      icon: CheckCircle,
      color: 'success',
      title: t('credit.uva.risk.low.title'),
      description: t('credit.uva.risk.low.description'),
      bgClass: 'bg-success/10 border-success/30',
      textClass: 'text-success'
    }
  };

  const config = riskConfig[riskLevel];
  const RiskIcon = config.icon;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('credit.uva.risk.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert de nivel de riesgo */}
        <Alert className={config.bgClass}>
          <RiskIcon className={`h-5 w-5 ${config.textClass}`} />
          <AlertTitle className={config.textClass}>{config.title}</AlertTitle>
          <AlertDescription>{config.description}</AlertDescription>
        </Alert>

        {/* Métricas actuales vs proyectadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold">{t('credit.uva.risk.current')}</h4>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('credit.uva.risk.installment')}</span>
                <span className="font-semibold">{formatCurrency(cuotaInicial, language, 'ARS')}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('credit.uva.risk.percentageIncome')}</span>
                <span className="font-semibold">{porcentajeIngresoInicial.toFixed(1)}%</span>
              </div>
              <Progress value={porcentajeIngresoInicial} className="h-2" />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted rounded-lg border-2 border-primary/20">
            <h4 className="text-sm font-semibold">
              {t('credit.uva.risk.projected')} ({(mesProyeccion / 12).toFixed(0)} {t('credit.uva.risk.years')})
            </h4>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('credit.uva.risk.installment')}</span>
                <span className="font-semibold">{formatCurrency(cuotaProyectada, language, 'ARS')}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('credit.uva.risk.percentageIncome')}</span>
                <span className={`font-semibold ${config.textClass}`}>
                  {porcentajeIngresoProyectado.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(porcentajeIngresoProyectado, 100)} 
                className={`h-2 ${riskLevel === 'critical' || riskLevel === 'high' ? '[&>div]:bg-destructive' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Análisis de brecha salarial */}
        {aumentoSalarialEsperado < inflacionAnual && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('credit.uva.risk.salaryGap.title')}</AlertTitle>
            <AlertDescription>
              {t('credit.uva.risk.salaryGap.description')} {inflacionAnual.toFixed(0)}% {t('credit.uva.risk.salaryGap.vs')} {aumentoSalarialEsperado.toFixed(0)}%.
            </AlertDescription>
          </Alert>
        )}

        {/* Recomendaciones */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="text-sm font-semibold mb-3">{t('credit.uva.risk.recommendations.title')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('credit.uva.risk.recommendations.point1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('credit.uva.risk.recommendations.point2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('credit.uva.risk.recommendations.point3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('credit.uva.risk.recommendations.point4')}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UVARiskIndicator;
