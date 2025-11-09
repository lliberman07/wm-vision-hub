import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { SubscriptionPlansComparator } from "@/components/SubscriptionPlansComparator";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, formatNumber } from "@/utils/numberFormat";
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
  ExternalLink,
  Eye,
  Briefcase,
  Zap
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  additional_limits: any;
  features: any;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  sort_order: number;
}

const PropertyManagement = () => {
  const { t } = useLanguage();
  const [isYearly, setIsYearly] = useState(false);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .neq('slug', 'legacy')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Generate dynamic description based on plan features and limits
  const generatePlanDescription = (plan: SubscriptionPlan): string => {
    const features: string[] = [];
    const limits = [];

    // Add user limit
    limits.push(`${plan.max_users} usuarios`);

    // Add property limit
    if (plan.max_properties === null || plan.max_properties >= 999999) {
      limits.push('propiedades ilimitadas');
    } else {
      limits.push(`${plan.max_properties} propiedades`);
    }

    // Add contract limit
    if (plan.max_contracts === null || plan.max_contracts >= 999999) {
      limits.push('contratos ilimitados');
    } else {
      limits.push(`${plan.max_contracts} contratos`);
    }

    // Add featured features
    if (plan.features?.advanced_reports) features.push('reportes avanzados');
    if (plan.features?.multi_currency) features.push('multi-moneda');
    if (plan.features?.bulk_operations) features.push('operaciones masivas');
    if (plan.features?.api_access) features.push('acceso API');
    if (plan.features?.white_label) features.push('white label');
    if (plan.features?.priority_support) features.push('soporte prioritario');

    // Build description
    let description = `Plan diseñado para gestionar hasta ${limits.join(', ')}.`;
    
    if (features.length > 0) {
      description += ` Incluye ${features.join(', ')}.`;
    }

    return description;
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit >= 999999) return '∞';
    return formatNumber(limit, 'es');
  };

  const calculateYearlyDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

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
        className="relative text-primary-foreground py-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.4)), url(${propertyManagementHero})`,
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
              <Link to="/pms" className="font-bold">
                {t('propertyManagement.pms.access')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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

      {/* Subscription Plans */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Planes de Suscripción</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Elige el plan que mejor se adapte a las necesidades de tu negocio
            </p>
            
            {/* Pricing Toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Mensual
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Anual
              </span>
            </div>
          </div>
          
          {plansLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-medium">
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className="border-2 border-primary shadow-medium transition-all duration-300 hover:shadow-strong hover:scale-105 hover:-translate-y-2 hover:border-primary"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        {plan.name}
                      </Badge>
                      {index === 1 && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl transition-all duration-300 flex items-center gap-3">
                      <span className="animate-fade-in">
                        {formatCurrency(isYearly ? plan.price_yearly : plan.price_monthly, 'es', 'ARS')}
                      </span>
                      <span className="text-base font-normal text-muted-foreground">
                        {isYearly ? '/año' : '/mes'}
                      </span>
                      {isYearly && calculateYearlyDiscount(plan.price_monthly, plan.price_yearly) > 0 && (
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-base px-3 py-1 animate-fade-in">
                          {calculateYearlyDiscount(plan.price_monthly, plan.price_yearly)}% OFF
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dynamic Description */}
                    <p className="text-sm text-muted-foreground">
                      {generatePlanDescription(plan)}
                    </p>

                    {/* Key Limits */}
                    <div className="space-y-3 py-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Usuarios</span>
                        </div>
                        <span className="font-semibold">{formatLimit(plan.max_users)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Propiedades</span>
                        </div>
                        <span className="font-semibold">{formatLimit(plan.max_properties)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Contratos</span>
                        </div>
                        <span className="font-semibold">{formatLimit(plan.max_contracts)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Sucursales</span>
                        </div>
                        <span className="font-semibold">{formatLimit(plan.max_branches)}</span>
                      </div>
                    </div>

                    {/* Featured Features */}
                    <div className="space-y-2 border-t pt-4">
                      {plan.features?.advanced_reports && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Reportes Avanzados</span>
                        </div>
                      )}
                      {plan.features?.multi_currency && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Multi-Moneda</span>
                        </div>
                      )}
                      {plan.features?.bulk_operations && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Operaciones Masivas</span>
                        </div>
                      )}
                      {plan.features?.api_access && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Acceso API</span>
                        </div>
                      )}
                      {plan.features?.white_label && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>White Label</span>
                        </div>
                      )}
                      {plan.features?.priority_support && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Soporte Prioritario</span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      asChild 
                      className="w-full" 
                      variant="outline"
                    >
                      <Link to="/pms">
                        Comenzar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Ver Planes Detallados Button */}
          <div className="flex justify-center mt-12">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="gap-2">
                  <Eye className="h-5 w-5" />
                  Ver Comparación Completa de Planes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Comparación Detallada de Planes</DialogTitle>
                </DialogHeader>
                <SubscriptionPlansComparator />
              </DialogContent>
            </Dialog>
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