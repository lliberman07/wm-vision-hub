import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";
import {
  Home,
  Search,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  RefreshCw,
} from "lucide-react";

export function PropertyLifecycleStory() {
  const { t } = useGranadaLanguage();

  const steps = [
    {
      number: 1,
      titleKey: 'lifecycle.step1_title',
      descKey: 'lifecycle.step1_desc',
      icon: Home,
    },
    {
      number: 2,
      titleKey: 'lifecycle.step2_title',
      descKey: 'lifecycle.step2_desc',
      icon: Search,
    },
    {
      number: 3,
      titleKey: 'lifecycle.step3_title',
      descKey: 'lifecycle.step3_desc',
      icon: FileText,
    },
    {
      number: 4,
      titleKey: 'lifecycle.step4_title',
      descKey: 'lifecycle.step4_desc',
      icon: CreditCard,
    },
    {
      number: 5,
      titleKey: 'lifecycle.step5_title',
      descKey: 'lifecycle.step5_desc',
      icon: Wrench,
    },
    {
      number: 6,
      titleKey: 'lifecycle.step6_title',
      descKey: 'lifecycle.step6_desc',
      icon: FileBarChart,
    },
    {
      number: 7,
      titleKey: 'lifecycle.step7_title',
      descKey: 'lifecycle.step7_desc',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((step) => (
        <Card 
          key={step.number} 
          className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full ${
            step.number === 7 ? 'lg:col-start-2' : ''
          }`}
        >
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <Badge 
                variant="secondary" 
                className="text-xl font-bold h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
              >
                {step.number}
              </Badge>
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors">
              {t(step.titleKey)}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {t(step.descKey)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
