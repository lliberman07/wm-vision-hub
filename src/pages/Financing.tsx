import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import BusinessSimulator from "@/components/BusinessSimulator";
import { ProjectFolder } from "@/components/financing/ProjectFolder";
import { useLanguage } from "@/contexts/LanguageContext";
import financingHeroBackground from "@/assets/financing-hero-background.jpg";
import { 
  Calculator, 
  PiggyBank, 
  UserPlus,
  ArrowRight,
  CheckCircle,
  Brain,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Clock,
  FileText,
  Sparkles
} from "lucide-react";

const Financing = () => {
  const { t } = useLanguage();
  const [simulatorCompleted, setSimulatorCompleted] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showProjectFolder, setShowProjectFolder] = useState(false);
  const projectFolderRef = useRef<HTMLDivElement>(null);

  const handleSimulatorComplete = (results: any) => {
    setSimulatorCompleted(true);
    setSimulationResults(results);
  };

  const handleStartProjectFolder = () => {
    setShowProjectFolder(true);
    setTimeout(() => {
      projectFolderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBackToSimulator = () => {
    setShowProjectFolder(false);
  };
  
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

      {/* Simulator & Project Folder Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl px-8 lg:px-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calculator className="h-10 w-10 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">{t('financing.simulator.title')}</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('financing.simulator.description')}
            </p>
          </div>

          {/* Header Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('financing.consolidated.section.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('financing.consolidated.section.description')}
            </p>
          </div>

          {/* Benefits Grid - 6 Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Card 1 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card1.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card1.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card2.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card2.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card3.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card3.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card4.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card4.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card5.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card5.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.consolidated.card6.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{t('financing.consolidated.card6.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulator Container - Centered */}
          <div className="max-w-5xl mx-auto">

            {!showProjectFolder ? (
              <BusinessSimulator onComplete={handleSimulatorComplete} />
            ) : (
              <div ref={projectFolderRef}>
                <ProjectFolder 
                  simulationResults={simulationResults}
                  onBack={handleBackToSimulator}
                />
              </div>
            )}
          </div>

          {/* Transition CTA - Shows after simulator completion */}
          {simulatorCompleted && !showProjectFolder && (
            <div className="animate-fade-in">
              <Card className="shadow-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/10">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-4 bg-primary rounded-2xl">
                        <FileText className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{t('financing.transition.title')}</h3>
                        <p className="text-muted-foreground">{t('financing.transition.description')}</p>
                      </div>
                    </div>
                    <Button 
                      size="lg" 
                      className="px-8 py-6 text-lg hover-scale whitespace-nowrap"
                      onClick={handleStartProjectFolder}
                    >
                      {t('financing.transition.cta')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
                    {t('financing.program.cta')}
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