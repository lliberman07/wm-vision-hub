import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, Banknote } from "lucide-react";

interface CurrencySelectorProps {
  variant?: "default" | "compact";
}

const CurrencySelector = ({ variant = "default" }: CurrencySelectorProps) => {
  const { currency, setCurrency, t } = useLanguage();

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <Button
          variant={currency === 'ARS' ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrency('ARS')}
          className="h-8 px-3 text-xs"
        >
          <Banknote className="h-3 w-3 mr-1" />
          ARS
        </Button>
        <Button
          variant={currency === 'USD' ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrency('USD')}
          className="h-8 px-3 text-xs"
        >
          <DollarSign className="h-3 w-3 mr-1" />
          USD
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('currency.selector.label')}</label>
      <div className="flex gap-2 bg-muted/50 rounded-lg p-1">
        <Button
          variant={currency === 'ARS' ? "default" : "ghost"}
          onClick={() => setCurrency('ARS')}
          className="flex-1"
        >
          <Banknote className="h-4 w-4 mr-2" />
          {t('currency.ars')}
        </Button>
        <Button
          variant={currency === 'USD' ? "default" : "ghost"}
          onClick={() => setCurrency('USD')}
          className="flex-1"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          {t('currency.usd')}
        </Button>
      </div>
    </div>
  );
};

export default CurrencySelector;