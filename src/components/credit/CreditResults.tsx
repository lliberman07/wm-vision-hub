import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditResult } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";
import { Plus, AlertCircle } from "lucide-react";

interface CreditResultsProps {
  results: CreditResult[];
  onAddToComparator: (result: CreditResult) => void;
  loading: boolean;
}

const CreditResults = ({ results, onAddToComparator, loading }: CreditResultsProps) => {
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('credit.results.loading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('credit.results.empty.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('credit.results.empty.message')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('credit.results.title')}</h2>
        <p className="text-muted-foreground">
          {t('credit.results.found')}: {results.length}
        </p>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{result.entidad}</h3>
                    {result.esUVA && (
                      <Badge variant="secondary">UVA</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.producto}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddToComparator(result)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('credit.results.addToComparator')}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t('credit.results.cuota')}</p>
                  <p className="font-semibold text-primary">
                    {formatCurrency(result.cuota, language, 'ARS')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('credit.results.porcentajeIngreso')}</p>
                  <p className="font-semibold">{result.porcentajeIngreso.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('credit.results.tasa')}</p>
                  <p className="font-semibold">
                    {result.tasa > 0 ? `${(result.tasa * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('credit.results.cft')}</p>
                  <p className="font-semibold">
                    {result.cft > 0 ? `${(result.cft * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
              </div>

              {result.ltv && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {t('credit.results.ltv')}: <span className="font-semibold">{result.ltv.toFixed(1)}%</span>
                  </p>
                </div>
              )}

              {result.observaciones.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-1">{t('credit.results.observaciones')}:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {result.observaciones.map((obs, idx) => (
                      <li key={idx}>• {obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreditResults;
