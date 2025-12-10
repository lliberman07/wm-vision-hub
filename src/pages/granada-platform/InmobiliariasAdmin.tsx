import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Shield,
  Home,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  UserCog,
  ClipboardCheck,
  CheckCircle2
} from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export default function InmobiliariasAdmin() {
  const { t } = useGranadaLanguage();

  const benefits = [
    { icon: Building2, titleKey: 'inmobiliarias.benefit1_title', descriptionKey: 'inmobiliarias.benefit1_desc' },
    { icon: Users, titleKey: 'inmobiliarias.benefit2_title', descriptionKey: 'inmobiliarias.benefit2_desc' },
    { icon: TrendingUp, titleKey: 'inmobiliarias.benefit3_title', descriptionKey: 'inmobiliarias.benefit3_desc' },
    { icon: Shield, titleKey: 'inmobiliarias.benefit4_title', descriptionKey: 'inmobiliarias.benefit4_desc' },
    { icon: ClipboardCheck, titleKey: 'inmobiliarias.benefit5_title', descriptionKey: 'inmobiliarias.benefit5_desc' }
  ];

  const modules = [
    { icon: Home, titleKey: 'inmobiliarias.module1_title', descriptionKey: 'inmobiliarias.module1_desc' },
    { icon: FileText, titleKey: 'inmobiliarias.module2_title', descriptionKey: 'inmobiliarias.module2_desc' },
    { icon: CreditCard, titleKey: 'inmobiliarias.module3_title', descriptionKey: 'inmobiliarias.module3_desc' },
    { icon: Wrench, titleKey: 'inmobiliarias.module4_title', descriptionKey: 'inmobiliarias.module4_desc' },
    { icon: BarChart3, titleKey: 'inmobiliarias.module5_title', descriptionKey: 'inmobiliarias.module5_desc' },
    { icon: UserCog, titleKey: 'inmobiliarias.module6_title', descriptionKey: 'inmobiliarias.module6_desc' }
  ];

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                {t('inmobiliarias.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('inmobiliarias.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('inmobiliarias.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/granada-platform/planes">{t('inmobiliarias.view_plans')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link to="/granada-platform/contacto">{t('inmobiliarias.request_demo')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios Clave */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('inmobiliarias.why_granada')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('inmobiliarias.why_granada_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <Card 
                  key={benefit.titleKey} 
                  className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                    index === benefits.length - 1 && benefits.length % 2 !== 0 
                      ? 'md:col-span-2 md:max-w-2xl md:mx-auto' 
                      : ''
                  }`}
                >
                  <CardHeader>
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{t(benefit.titleKey)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t(benefit.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciador: Administración Sin Pausas */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container max-w-5xl">
            <div className="text-center mb-8">
              <Badge className="mb-4" variant="outline">
                {t('inmobiliarias.differentiator_badge')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('inmobiliarias.differentiator_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('inmobiliarias.differentiator_subtitle')}
              </p>
            </div>

            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Home className="h-6 w-6 text-primary" />
                      {t('inmobiliarias.problem_title')}
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span>{t('inmobiliarias.problem1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span>{t('inmobiliarias.problem2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span>{t('inmobiliarias.problem3')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span>{t('inmobiliarias.problem4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      {t('inmobiliarias.solution_title')}
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('inmobiliarias.solution1_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inmobiliarias.solution1_desc')}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('inmobiliarias.solution2_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inmobiliarias.solution2_desc')}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('inmobiliarias.solution3_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inmobiliarias.solution3_desc')}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('inmobiliarias.solution4_title')}</p>
                          <p className="text-sm text-muted-foreground">{t('inmobiliarias.solution4_desc')}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-center text-lg font-medium">
                    <strong>{t('inmobiliarias.result')}</strong> {t('inmobiliarias.result_desc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Módulos Destacados */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('inmobiliarias.modules_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('inmobiliarias.modules_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.titleKey} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t(module.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(module.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('inmobiliarias.cta_title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('inmobiliarias.cta_subtitle')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/planes">{t('inmobiliarias.view_plans_prices')}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">{t('inmobiliarias.schedule_demo')}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <GranadaFooter />
    </div>
  );
}
