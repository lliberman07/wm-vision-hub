import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import BusinessSimulator from "@/components/BusinessSimulator";
import { useLanguage } from "@/contexts/LanguageContext";
import financingHeroBackground from "@/assets/financing-hero-background.jpg";
import { 
  Calculator, 
  PiggyBank, 
  UserPlus,
  ArrowRight,
  CheckCircle,
  Percent,
  Clock,
  Shield
} from "lucide-react";

const Financing = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${financingHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('financing.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('financing.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('financing.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* The Program */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <PiggyBank className="h-10 w-10 text-primary" />
                <h2 className="text-3xl font-bold">{t('financing.program.title')}</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('financing.program.description1')}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('financing.program.description2')}
              </p>
              
                <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Percent className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">{t('financing.program.features.interest')}</div>
                    <div className="text-sm text-muted-foreground">{t('financing.program.features.interest.desc')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">{t('financing.program.features.terms')}</div>
                    <div className="text-sm text-muted-foreground">{t('financing.program.features.terms.desc')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">{t('financing.program.features.secure')}</div>
                    <div className="text-sm text-muted-foreground">{t('financing.program.features.secure.desc')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">{t('financing.program.features.coverage')}</div>
                    <div className="text-sm text-muted-foreground">{t('financing.program.features.coverage.desc')}</div>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link to="/financing/apply">
                  Apply for Financing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl">{t('financing.program.benefits.title')}</CardTitle>
                <CardDescription>{t('financing.program.benefits.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">{t('financing.program.benefits.noFees')}</div>
                      <div className="text-sm text-muted-foreground">{t('financing.program.benefits.noFees.desc')}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">{t('financing.program.benefits.quickApproval')}</div>
                      <div className="text-sm text-muted-foreground">{t('financing.program.benefits.quickApproval.desc')}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">{t('financing.program.benefits.flexible')}</div>
                      <div className="text-sm text-muted-foreground">{t('financing.program.benefits.flexible.desc')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calculator className="h-10 w-10 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">{t('financing.simulator.title')}</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('financing.simulator.description')}
            </p>
          </div>

          <BusinessSimulator />
        </div>
      </section>

      {/* Sign Up Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="shadow-strong">
              <CardHeader>
                <UserPlus className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-2xl">{t('financing.signup.ready')}</CardTitle>
                <CardDescription>
                  {t('financing.signup.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t('financing.signup.description2')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('financing.signup.benefits.consultation')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('financing.signup.benefits.solutions')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('financing.signup.benefits.guidance')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">{t('financing.signup.title')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('financing.signup.description')}
              </p>
              
              <div className="space-y-4">
                <Button size="lg" className="w-full" asChild>
                  <Link to="/financing/apply">
                    Apply for Financing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary-foreground">
                {t('financing.news.title')}
              </CardTitle>
              <CardDescription className="text-center text-primary-foreground/80">
                {t('financing.news.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90 text-center">
                {t('financing.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default Financing;