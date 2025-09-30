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

      {/* The Program */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <PiggyBank className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('financing.program.title')}
              </h2>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t('financing.program.description1')}
              </p>
              <p className="text-lg text-muted-foreground/80 leading-relaxed">
                {t('financing.program.description2')}
              </p>
            </div>
          </div>

          {/* Features and Benefits Grid */}
          <div className="grid lg:grid-cols-5 gap-8 mb-16">
            {/* Left Column - Features (3 columns) */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.program.features.interest')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.program.features.interest.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.program.features.terms')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.program.features.terms.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.program.features.secure')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.program.features.secure.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3 text-foreground">{t('financing.program.features.coverage')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.program.features.coverage.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Benefits (2 columns) */}
            <div className="lg:col-span-2">
              <Card className="h-full shadow-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12"></div>
                <CardHeader className="relative z-10 pb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-primary rounded-xl shadow-lg">
                      <CheckCircle className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-foreground">{t('financing.program.benefits.title')}</CardTitle>
                      <CardDescription className="text-base mt-1">{t('financing.program.benefits.subtitle')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  <div className="space-y-5">
                    <div className="flex items-start space-x-4 p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/10 hover:border-primary/20 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2 text-foreground">{t('financing.program.benefits.noFees')}</h4>
                        <p className="text-muted-foreground">{t('financing.program.benefits.noFees.desc')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/10 hover:border-primary/20 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2 text-foreground">{t('financing.program.benefits.quickApproval')}</h4>
                        <p className="text-muted-foreground">{t('financing.program.benefits.quickApproval.desc')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/10 hover:border-primary/20 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2 text-foreground">{t('financing.program.benefits.flexible')}</h4>
                        <p className="text-muted-foreground">{t('financing.program.benefits.flexible.desc')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Button size="lg" className="px-8 py-6 text-lg hover-scale" asChild>
              <Link to="/financing/apply">
                {t('financing.program.cta')}
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Simulator & Project Folder Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calculator className="h-10 w-10 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">{t('financing.simulator.title')}</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('financing.simulator.description')}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            {/* Left Column - Benefits Cards (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card className="shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary rounded-xl">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{t('financing.twoColumn.left.title')}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {t('financing.twoColumn.left.description')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Benefit Cards */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{t('financing.twoColumn.left.benefit1.title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.twoColumn.left.benefit1.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{t('financing.twoColumn.left.benefit2.title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.twoColumn.left.benefit2.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{t('financing.twoColumn.left.benefit3.title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.twoColumn.left.benefit3.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{t('financing.twoColumn.left.benefit4.title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t('financing.twoColumn.left.benefit4.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer Card */}
              <Card className="shadow-lg bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {t('financing.twoColumn.left.footer')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Simulator/Project Folder (60%) */}
            <div className="lg:col-span-3">
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