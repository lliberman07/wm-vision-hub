import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <span className="font-bold text-lg">WM Management</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              {t('footer.description') || 'Transforming complexity into clarity. Your trusted partner in real estate consulting, investment, and development.'}
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>info@wmmanagement.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>123 Business District, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('nav.services')}</h3>
            <div className="space-y-2">
              <Link to="/services/property-management" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.services.propertyManagement')}
              </Link>
              <Link to="/services/brokerage" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.services.brokerage')}
              </Link>
              <Link to="/services/consulting" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.services.consulting')}
              </Link>
              <Link to="/services/development" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.services.development')}
              </Link>
              <Link to="/services/investments" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.services.investments')}
              </Link>
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('footer.industries.title')}</h3>
            <div className="space-y-2">
              <Link to="/industries/commercial" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.industries.commercial')}
              </Link>
              <Link to="/industries/health" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.industries.health')}
              </Link>
              <Link to="/industries/industrial" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.industries.industrial')}
              </Link>
              <Link to="/industries/logistics" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.industries.logistics')}
              </Link>
              <Link to="/industries/governments" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.industries.governments')}
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('footer.quickLinks.title')}</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.about')}
              </Link>
              <Link to="/financing" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.financing')}
              </Link>
              <Link to="/financing/simulator" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('footer.quickLinks.simulator')}
              </Link>
              <Link to="/contact" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.contact')}
              </Link>
              <Link to="/faq" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.faq')}
              </Link>
            </div>
            <div className="mt-4">
              <LanguageSwitcher variant="footer" />
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-primary-foreground/80">
            {t('footer.copyright')}
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/terms-of-service" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;