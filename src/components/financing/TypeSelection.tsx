import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TypeSelectionProps {
  data: any;
  onNext: (data: any) => void;
}

export const TypeSelection = ({ data, onNext }: TypeSelectionProps) => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>(data.type || '');

  const handleNext = () => {
    if (selectedType) {
      onNext({ type: selectedType });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {t('Select Application Type')}
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {t('Are you applying as an Individual (Persona Física) or as a Company (Persona Jurídica)?')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedType} 
          onValueChange={setSelectedType}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="flex items-center gap-3 cursor-pointer flex-1">
              <User className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">{t('Individual')}</div>
                <div className="text-sm text-muted-foreground">{t('Persona Física')}</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <RadioGroupItem value="company" id="company" />
            <Label htmlFor="company" className="flex items-center gap-3 cursor-pointer flex-1">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">{t('Company')}</div>
                <div className="text-sm text-muted-foreground">{t('Persona Jurídica')}</div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <div className="flex justify-end">
          <Button 
            onClick={handleNext} 
            disabled={!selectedType}
            className="min-w-[100px]"
          >
            {t('Next')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};