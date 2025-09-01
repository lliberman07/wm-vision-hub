import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "header" | "footer";
}

const LanguageSwitcher = ({ variant = "header" }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
  };

  if (variant === "footer") {
    return (
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-primary-foreground/80" />
        <span className="text-sm text-primary-foreground/80">{t('common.language')}:</span>
        <div className="flex space-x-1">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              language === 'en'
                ? 'text-primary-foreground bg-primary-foreground/20'
                : 'text-primary-foreground/80 hover:text-primary-foreground'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange('es')}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              language === 'es'
                ? 'text-primary-foreground bg-primary-foreground/20'
                : 'text-primary-foreground/80 hover:text-primary-foreground'
            }`}
          >
            ES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLanguageChange('en')}
        className="h-8 px-2 text-xs"
      >
        EN
      </Button>
      <Button
        variant={language === 'es' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLanguageChange('es')}
        className="h-8 px-2 text-xs"
      >
        ES
      </Button>
    </div>
  );
};

export default LanguageSwitcher;