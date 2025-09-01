import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-primary text-primary-foreground">
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
                Property Management
              </Link>
              <Link to="/services/brokerage" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Brokerage
              </Link>
              <Link to="/services/consulting" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Consulting Services
              </Link>
              <Link to="/services/development" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Real Estate Development
              </Link>
              <Link to="/services/investments" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Trust & Investments
              </Link>
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Industrias</h3>
            <div className="space-y-2">
              <Link to="/industries/commercial" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Commercial
              </Link>
              <Link to="/industries/health" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Health
              </Link>
              <Link to="/industries/industrial" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Industrial
              </Link>
              <Link to="/industries/logistics" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Logistics
              </Link>
              <Link to="/industries/governments" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Governments
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Enlaces Rápidos</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.about')}
              </Link>
              <Link to="/financing" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.financing')}
              </Link>
              <Link to="/financing/simulator" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Simulador
              </Link>
              <Link to="/contact" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.contact')}
              </Link>
              <Link to="/faq" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                {t('nav.faq')}
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <LanguageSwitcher variant="footer" />
              <Button variant="secondary" size="sm" asChild>
                <Link to="/financing/signup">{t('nav.getStarted')} Hoy</Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-primary-foreground/80">
            © 2025 WM Management & Investments. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;