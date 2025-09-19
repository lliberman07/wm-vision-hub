import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import { Target, Eye, Users, TrendingUp } from "lucide-react";
import aboutHeroBackground from "@/assets/about-hero-background.jpg";

const About = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${aboutHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('about.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('about.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="h-8 w-8 text-cyan-500" />
                  <h2 className="text-3xl font-bold">{t('about.mission.title')}</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('about.mission.content1')}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                  {t('about.mission.content2')}
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Eye className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">{t('about.vision.title')}</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('about.vision.content')}
                </p>
              </div>
            </div>

            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl">{t('about.news.title')}</CardTitle>
                <CardDescription>{t('about.news.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('about.news.content')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">{t('about.team.title')}</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-2xl">WM</span>
                </div>
                <CardTitle>{t('about.team.leadership')}</CardTitle>
                <CardDescription>
                  {t('about.team.leadership.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle>{t('about.team.strategy')}</CardTitle>
                <CardDescription>
                  {t('about.team.strategy.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>{t('about.team.client')}</CardTitle>
                <CardDescription>
                  {t('about.team.client.desc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-12 shadow-strong bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">{t('about.expansion.title')}</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {t('about.expansion.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90">
                {t('about.expansion.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('about.values.title')}</h2>
            <p className="text-xl text-muted-foreground">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">{t('about.values.transparency')}</CardTitle>
                <CardDescription>
                  {t('about.values.transparency.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">{t('about.values.integrity')}</CardTitle>
                <CardDescription>
                  {t('about.values.integrity.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">{t('about.values.excellence')}</CardTitle>
                <CardDescription>
                  {t('about.values.excellence.desc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default About;