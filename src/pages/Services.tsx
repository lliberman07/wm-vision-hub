import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import servicesHeroBackground from "@/assets/services-hero-background.jpg";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Hammer, 
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Services = () => {
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        // Wait for the page to fully render before scrolling
        setTimeout(() => {
          const elementTop = element.offsetTop;
          const offsetPosition = elementTop - (window.innerHeight / 2) + (element.offsetHeight / 2);
          
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [location.hash]);
  
  const services = [
    {
      icon: Building2,
      title: t('services.property.title'),
      description: t('services.property.description'),
      features: [
        t('services.property.features.lease'),
        t('services.property.features.maintenance'),
        t('services.property.features.performance'),
        t('services.property.features.reporting')
      ],
      cta: t('services.property.cta'),
      href: "/services/property-management"
    },
    {
      icon: TrendingUp,
      title: t('services.brokerage.title'),
      description: t('services.brokerage.description'),
      features: [
        t('services.brokerage.features.analysis'),
        t('services.brokerage.features.transaction'),
        t('services.brokerage.features.negotiations'),
        t('services.brokerage.features.diligence')
      ],
      cta: t('services.brokerage.cta'),
      href: "/services/brokerage"
    },
    {
      icon: Users,
      title: t('services.consulting.title'),
      description: t('services.consulting.description'),
      features: [
        t('services.consulting.features.feasibility'),
        t('services.consulting.features.legal'),
        t('services.consulting.features.planning'),
        t('services.consulting.features.research')
      ],
      cta: t('services.consulting.cta'),
      href: "/services/consulting"
    },
    {
      icon: Hammer,
      title: t('services.development.title'),
      description: t('services.development.description'),
      features: [
        t('services.development.features.project'),
        t('services.development.features.design'),
        t('services.development.features.construction'),
        t('services.development.features.quality')
      ],
      cta: t('services.development.cta'),
      href: "/services/development"
    },
    {
      icon: Shield,
      title: t('services.investments.title'),
      description: t('services.investments.description'),
      features: [
        t('services.investments.features.portfolio'),
        t('services.investments.features.risk'),
        t('services.investments.features.strategy'),
        t('services.investments.features.monitoring')
      ],
      cta: t('services.investments.cta'),
      href: "/services/investments"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${servicesHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('services.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('services.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('services.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-16">
            {services.map((service, index) => (
              <div 
                key={service.title} 
                id={index === 0 ? 'property-management' : index === 1 ? 'brokerage' : index === 2 ? 'consulting' : index === 3 ? 'development' : undefined}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
              >
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <service.icon className="h-10 w-10 text-primary" />
                    <h2 className="text-3xl font-bold">{service.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{t('common.keyFeatures')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button size="lg" asChild>
                    <Link to={service.href}>
                      {service.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                <Card className={`shadow-strong ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <CardContent className="p-8">
                    <div className="w-20 h-20 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 mx-auto">
                      <service.icon className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {t('services.card.description').replace('{service}', service.title.toLowerCase())}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t('services.news.title')}</CardTitle>
              <CardDescription className="text-center">{t('services.news.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                {t('services.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t('common.readyToStart')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('services.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">{t('common.contactTeam')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/financing/simulator">{t('common.trySimulator')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default Services;