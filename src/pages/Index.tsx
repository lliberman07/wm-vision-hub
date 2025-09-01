import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  Users, 
  Calculator,
  ArrowRight,
  CheckCircle,
  BarChart3
} from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                {t('home.hero.badge')}
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              <p className="text-lg text-primary-foreground/80">
                {t('home.hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/services">
                    {t('home.hero.cta1')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/financing">
                    {t('home.hero.cta2')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-strong">
                  <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>{t('home.hero.feature1')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>{t('home.hero.feature2')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>{t('home.hero.feature3')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>{t('home.hero.feature4')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('home.services.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.services.property.title')}</CardTitle>
                <CardDescription>
                  {t('home.services.property.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/property-management">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.services.brokerage.title')}</CardTitle>
                <CardDescription>
                  {t('home.services.brokerage.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/brokerage">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.services.consulting.title')}</CardTitle>
                <CardDescription>
                  {t('home.services.consulting.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/consulting">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.services.development.title')}</CardTitle>
                <CardDescription>
                  {t('home.services.development.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/development">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t('home.services.investments.title')}</CardTitle>
                <CardDescription>
                  {t('home.services.investments.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/investments">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300 bg-gradient-accent text-accent-foreground">
              <CardHeader>
                <Calculator className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>{t('home.services.financing.title')}</CardTitle>
                <CardDescription className="text-accent-foreground/80">
                  {t('home.services.financing.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/financing/simulator">{t('home.simulator.cta')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-bold mb-4">{t('home.news.title')}</h3>
          <p className="text-lg text-muted-foreground">
            {t('home.news.content')}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
