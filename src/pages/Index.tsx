import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import cityBackground from "@/assets/city-background.jpg";
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
      <section 
        className="relative text-white section-padding bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url(${cityBackground})`
        }}
      >
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="container mx-auto max-w-7xl relative z-10 container-padding">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge variant="secondary" className="w-fit bg-cyan-500/20 text-cyan-400 border-cyan-400/30 backdrop-blur-sm">
                {t('home.hero.badge')}
              </Badge>
              <h1 className="h1 text-white">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                {t('home.hero.subtitle')}
              </p>
              <p className="text-lg text-white/80 leading-relaxed">
                {t('home.hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group" asChild>
                  <Link to="/services">
                    {t('home.hero.cta1')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" className="btn-glass group" asChild>
                  <Link to="/financing">
                    {t('home.hero.cta2')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="card-glass p-8 rounded-xl">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-white font-medium">{t('home.hero.feature1')}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-white font-medium">{t('home.hero.feature2')}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-white font-medium">{t('home.hero.feature3')}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-white font-medium">{t('home.hero.feature4')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section-padding bg-gradient-surface">
        <div className="container mx-auto max-w-7xl container-padding">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="h2 mb-6">
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('home.services.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('home.services.property.title')}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t('home.services.property.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/services/property-management">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('home.services.brokerage.title')}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t('home.services.brokerage.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/services/brokerage">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('home.services.consulting.title')}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t('home.services.consulting.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/services/consulting">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('home.services.development.title')}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t('home.services.development.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/services/development">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('home.services.investments.title')}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t('home.services.investments.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/services/investments">{t('home.learnMore')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-accent text-accent-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-white">{t('home.services.financing.title')}</CardTitle>
                <CardDescription className="text-white/90 leading-relaxed">
                  {t('home.services.financing.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white hover:text-accent transition-all" asChild>
                  <Link to="/financing/simulator">{t('home.simulator.cta')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted section-padding">
        <div className="container mx-auto max-w-5xl text-center container-padding animate-fade-in">
          <h3 className="h3 mb-6">{t('home.news.title')}</h3>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {t('home.news.content')}
          </p>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default Index;
