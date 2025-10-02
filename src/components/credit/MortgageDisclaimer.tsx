import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const MortgageDisclaimer = () => {
  const { t } = useLanguage();

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <AlertCircle className="h-5 w-5 text-blue-600" />
      <AlertDescription className="text-blue-900 ml-2">
        {t('mortgage.disclaimer.text')}
      </AlertDescription>
    </Alert>
  );
};
