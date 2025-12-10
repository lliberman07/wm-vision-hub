import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export function GranadaFooter() {
  const { t } = useGranadaLanguage();
  
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Link to="/granada-platform" className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold">Granada Platform</span>
            </Link>
          </div>
        </div>
        <Separator className="my-8 bg-border" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
            <Link to="/pms/login" className="hover:text-foreground transition-colors">{t('nav.access_pms')}</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Granada Platform. {t('footer.rights')}.</p>
        </div>
      </div>
    </footer>
  );
}
