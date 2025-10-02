import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";

interface BankCardProps {
  entityCode: number;
  entityName: string;
  creditType: string;
  tea: number;
  maxTerm: number;
  maxAmount: number;
  ltv: number;
  productCount: number;
  onViewDetails: () => void;
}

const BankCard = ({
  entityName,
  creditType,
  tea,
  maxTerm,
  maxAmount,
  ltv,
  productCount,
  onViewDetails
}: BankCardProps) => {
  const { t, language } = useLanguage();

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{entityName}</h3>
            <p className="text-sm text-muted-foreground">{creditType}</p>
            {productCount > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                {productCount} {t('credit.bank.products')}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">TEA:</span>
            <span className="font-semibold text-primary text-lg">{tea.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('credit.bank.maxTerm')}:</span>
            <span className="font-semibold">{maxTerm} {t('credit.bank.years')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('credit.bank.maxAmount')}:</span>
            <span className="font-semibold">{formatCurrency(maxAmount, language)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('credit.bank.financing')}:</span>
            <span className="font-semibold">{t('credit.bank.upTo')} {(ltv * 100).toFixed(0)}%</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full group"
          onClick={onViewDetails}
        >
          {t('credit.bank.viewDetails')}
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default BankCard;
