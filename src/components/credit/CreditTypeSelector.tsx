import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, User, Car } from "lucide-react";
import { CreditType } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditTypeSelectorProps {
  onSelect: (type: CreditType) => void;
  selectedType?: CreditType;
}

const CreditTypeSelector = ({ onSelect, selectedType }: CreditTypeSelectorProps) => {
  const { t } = useLanguage();

  const types: { value: CreditType; icon: any; label: string; description: string }[] = [
    {
      value: 'hipotecario',
      icon: Home,
      label: t('credit.type.hipotecario'),
      description: t('credit.type.hipotecario.desc')
    },
    {
      value: 'personal',
      icon: User,
      label: t('credit.type.personal'),
      description: t('credit.type.personal.desc')
    },
    {
      value: 'prendario',
      icon: Car,
      label: t('credit.type.prendario'),
      description: t('credit.type.prendario.desc')
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('credit.selector.title')}</h2>
        <p className="text-muted-foreground">{t('credit.selector.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map(({ value, icon: Icon, label, description }) => (
          <Card
            key={value}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === value ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect(value)}
          >
            <CardContent className="p-6 text-center">
              <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Button
                className="mt-4 w-full"
                variant={selectedType === value ? 'default' : 'outline'}
              >
                {selectedType === value ? t('credit.selector.selected') : t('credit.selector.select')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreditTypeSelector;
