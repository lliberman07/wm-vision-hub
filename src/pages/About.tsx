import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
                  <Target className="h-8 w-8 text-primary" />
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
                <CardTitle className="text-2xl">News & Updates – March 2025</CardTitle>
                <CardDescription>Latest developments in our mission</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <strong>New Sustainability Benchmarks:</strong> We have refined our performance metrics to better reflect our commitment to responsible growth. Our latest initiatives ensure every project contributes to a sustainable future.
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
                <CardTitle>Leadership Team</CardTitle>
                <CardDescription>
                  Industry veterans with decades of combined experience in real estate management and investment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle>Strategy Experts</CardTitle>
                <CardDescription>
                  Data analysts and strategic planners who transform market insights into actionable opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Client Partners</CardTitle>
                <CardDescription>
                  Dedicated professionals who work side by side with clients to craft effective, innovative solutions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-12 shadow-strong bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Team Expansion – March 2025</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Growing our capabilities with new expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90">
                We are pleased to announce the addition of two new experts in data analytics and technology, further enhancing our ability to deliver strategic insights and innovative solutions.
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
                <CardTitle className="text-xl">Transparency</CardTitle>
                <CardDescription>
                  Clear communication and honest reporting in every interaction and transaction.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">Integrity</CardTitle>
                <CardDescription>
                  Ethical practices and principled decision-making that builds lasting trust.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">Excellence</CardTitle>
                <CardDescription>
                  Committed to delivering exceptional results through continuous improvement and innovation.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;