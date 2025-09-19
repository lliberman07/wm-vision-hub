import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FloatingCTAProps {
  nextStep: string | null;
  isVisible: boolean;
  onNextClick: () => void;
}

export const FloatingCTA = ({ nextStep, isVisible, onNextClick }: FloatingCTAProps) => {
  const { t } = useLanguage();

  if (!isVisible || !nextStep) return null;

  const getStepText = () => {
    switch (nextStep) {
      case 'financing':
        return t('simulator.cta.continueToFinancing');
      case 'results':
        return t('simulator.cta.viewResults');
      default:
        return t('simulator.cta.continue');
    }
  };

  const getStepIcon = () => {
    return nextStep === 'results' ? CheckCircle : ArrowRight;
  };

  const Icon = getStepIcon();

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <Button
        onClick={onNextClick}
        size="lg"
        className="shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white px-6 py-3 rounded-full"
      >
        <span className="mr-2">{getStepText()}</span>
        <Icon className="h-5 w-5" />
      </Button>
    </div>
  );
};