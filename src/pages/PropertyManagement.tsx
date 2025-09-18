import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import propertyManagementHero from "@/assets/property-management-hero-background.jpg";
import { 
  Building2, 
  Calendar, 
  FileText, 
  Users, 
  Calculator, 
  DollarSign,
  User,
  CheckCircle,
  ArrowRight,
  Shield,
  BarChart3,
  ExternalLink
} from "lucide-react";

const PropertyManagement = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Building2,
      title: t('propertyManagement.features.rental.title'),
      items: [
        t('propertyManagement.features.rental.item1'),
        t('propertyManagement.features.rental.item2'),
        t('propertyManagement.features.rental.item3'),
        t('propertyManagement.features.rental.item4'),
        t('propertyManagement.features.rental.item5')
      ]
    },
    {
      icon: FileText,
      title: t('propertyManagement.features.contracts.title'),
      items: [
        t('propertyManagement.features.contracts.item1'),
        t('propertyManagement.features.contracts.item2'),
        t('propertyManagement.features.contracts.item3'),
        t('propertyManagement.features.contracts.item4')
      ]
    },
    {
      icon: Users,
      title: t('propertyManagement.features.crm.title'),
      items: [
        t('propertyManagement.features.crm.item1'),
        t('propertyManagement.features.crm.item2'),
        t('propertyManagement.features.crm.item3')
      ]
    },
    {
      icon: Calculator,
      title: t('propertyManagement.features.services.title'),
      items: [
        t('propertyManagement.features.services.item1'),
        t('propertyManagement.features.services.item2'),
        t('propertyManagement.features.services.item3'),
        t('propertyManagement.features.services.item4')
      ]
    },
    {
      icon: DollarSign,
      title: t('propertyManagement.features.finance.title'),
      items: [
        t('propertyManagement.features.finance.item1'),
        t('propertyManagement.features.finance.item2'),
        t('propertyManagement.features.finance.item3')
      ]
    },
    {
      icon: Shield,
      title: t('propertyManagement.features.portal.title'),
      items: [
        t('propertyManagement.features.portal.item1'),
        t('propertyManagement.features.portal.item2'),
        t('propertyManagement.features.portal.item3')
      ]
    }
  ];

  const benefits = [
    t('propertyManagement.benefits.item1'),
    t('propertyManagement.benefits.item2'),
    t('propertyManagement.benefits.item3'),
    t('propertyManagement.benefits.item4'),
    t('propertyManagement.benefits.item5')
  ];

  const serviceModalities = [
    {
      title: t('propertyManagement.modalities.basic.title'),
      description: t('propertyManagement.modalities.basic.description')
    },
    {
      title: t('propertyManagement.modalities.intermediate.title'),
      description: t('propertyManagement.modalities.intermediate.description')
    },
    {
      title: t('propertyManagement.modalities.full.title'),
      description: t('propertyManagement.modalities.full.description')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-primary text-primary-foreground py-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.5)), url(${propertyManagementHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="secondary" className="mb-4">
            {t('propertyManagement.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('propertyManagement.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed mb-8">
            {t('propertyManagement.hero.subtitle')}
          </p>
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a 
                href="https://persiscalconsulting-property-manager-test.odoo.com/es_AR/web/login#action=menu&cids=1&menu_id=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('propertyManagement.pms.access')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t('propertyManagement.intro.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                {t('propertyManagement.intro.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('propertyManagement.features.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('propertyManagement.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-medium h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('propertyManagement.benefits.title')}</h2>
          </div>
          
          <Card className="shadow-medium">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Service Modalities */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('propertyManagement.modalities.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('propertyManagement.modalities.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {serviceModalities.map((modality, index) => (
              <Card key={index} className="shadow-medium text-center">
                <CardHeader>
                  <CardTitle className="text-xl">{modality.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{modality.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-strong bg-gradient-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">
                {t('propertyManagement.cta.title')}
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                {t('propertyManagement.cta.subtitle')}
              </p>
              <div className="flex justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/contact">
                    {t('propertyManagement.cta.contact')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default PropertyManagement;