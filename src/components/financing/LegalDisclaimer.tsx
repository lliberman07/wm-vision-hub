import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LegalDisclaimer = () => {
  const { t } = useLanguage();

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          {t('Legal Notice')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-amber-700 dark:text-amber-300">
        <p>
          {t('The submission of this financing request does not guarantee approval or imply credit availability. WM Management does not assure the creditworthiness of the applicant (individual or company). Each request is subject to verification processes, risk evaluation, and the internal policies of financial institutions.')}
        </p>
        <p>
          {t('The information provided will be treated confidentially and used exclusively for credit assessment purposes. By submitting this application, you consent to the collection, processing, and verification of the information provided.')}
        </p>
        <p>
          {t('WM Management reserves the right to request additional documentation or information as deemed necessary for the evaluation process. Processing times may vary depending on the complexity of the application and verification requirements.')}
        </p>
        <p className="font-medium">
          {t('By proceeding with this application, you acknowledge that you have read, understood, and agree to these terms and conditions.')}
        </p>
      </CardContent>
    </Card>
  );
};