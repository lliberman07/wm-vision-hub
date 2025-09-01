import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import industriesHeroBackground from "@/assets/industries-hero-background.jpg";
import { 
  Building2, 
  Heart, 
  Factory, 
  Truck, 
  Building,
  Home,
  ArrowRight,
  TrendingUp,
  Users,
  Target
} from "lucide-react";

const Industries = () => {
  const { t } = useLanguage();

  const industries = [
    {
      icon: Home,
      title: t('industries.residential.title'),
      description: t('industries.residential.description'),
      cta: t('industries.residential.cta'),
      href: "/industries/residential"
    },
    {
      icon: Building2,
      title: t('industries.commercial.title'),
      description: t('industries.commercial.description'),
      cta: t('industries.commercial.cta'),
      href: "/industries/commercial"
    },
    {
      icon: Heart,
      title: t('industries.health.title'),
      description: t('industries.health.description'),
      cta: t('industries.health.cta'),
      href: "/industries/health"
    },
    {
      icon: Factory,
      title: t('industries.industrial.title'),
      description: t('industries.industrial.description'),
      cta: t('industries.industrial.cta'),
      href: "/industries/industrial"
    },
    {
      icon: Truck,
      title: t('industries.logistics.title'),
      description: t('industries.logistics.description'),
      cta: t('industries.logistics.cta'),
      href: "/industries/logistics"
    },
    {
      icon: Building,
      title: t('industries.governments.title'),
      description: t('industries.governments.description'),
      cta: t('industries.governments.cta'),
      href: "/industries/governments"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${industriesHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('industries.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('industries.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('industries.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              {t('industries.overview.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t('industries.overview.subtitle')}
            </p>
            <div className="bg-gradient-subtle p-8 rounded-lg">
              <p className="text-lg text-foreground leading-relaxed">
                {t('industries.overview.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              {t('industries.sectors.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('industries.sectors.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <Card key={index} className="shadow-strong hover:shadow-glow transition-all duration-300 group">
                  <CardHeader>
                    <div className="mb-4">
                      <Icon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-xl">{industry.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {industry.description}
                    </p>
                    <Button asChild className="w-full">
                      <Link to={industry.href}>
                        {industry.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              {t('industries.stats.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('industries.stats.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-medium">
              <CardContent className="p-8">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">{t('industries.stats.projects')}</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-medium">
              <CardContent className="p-8">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">{t('industries.stats.clients')}</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-medium">
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">15</div>
                <div className="text-muted-foreground">{t('industries.stats.years')}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary-foreground">
                {t('industries.news.title')}
              </CardTitle>
              <CardDescription className="text-center text-primary-foreground/80">
                {t('industries.news.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90 text-center">
                {t('industries.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Industries;