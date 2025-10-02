import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CreditDisclaimer = () => {
  const { t } = useLanguage();

  return (
    <Alert className="mt-8">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {t('credit.disclaimer')}
      </AlertDescription>
    </Alert>
  );
};

export default CreditDisclaimer;
