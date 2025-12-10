import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  UserCheck, 
  Building2, 
  BarChart3, 
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  Home
} from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export default function Propietarios() {
  const { t } = useGranadaLanguage();

  const pathways = [
    {
      icon: UserCheck,
      titleKey: 'propietarios.self_title',
      subtitleKey: 'propietarios.self_subtitle',
      descriptionKey: 'propietarios.self_desc',
      features: [
        'propietarios.self_feature1',
        'propietarios.self_feature2',
        'propietarios.self_feature3',
        'propietarios.self_feature4'
      ]
    },
    {
      icon: Building2,
      titleKey: 'propietarios.delegate_title',
      subtitleKey: 'propietarios.delegate_subtitle',
      descriptionKey: 'propietarios.delegate_desc',
      features: [
        'propietarios.delegate_feature1',
        'propietarios.delegate_feature2',
        'propietarios.delegate_feature3',
        'propietarios.delegate_feature4'
      ]
    }
  ];

  const benefits = [
    { icon: BarChart3, titleKey: 'propietarios.benefit1_title', descriptionKey: 'propietarios.benefit1_desc' },
    { icon: DollarSign, titleKey: 'propietarios.benefit2_title', descriptionKey: 'propietarios.benefit2_desc' },
    { icon: CheckCircle2, titleKey: 'propietarios.benefit3_title', descriptionKey: 'propietarios.benefit3_desc' },
    { icon: FileText, titleKey: 'propietarios.benefit4_title', descriptionKey: 'propietarios.benefit4_desc' },
    { icon: Clock, titleKey: 'propietarios.benefit5_title', descriptionKey: 'propietarios.benefit5_desc' },
    { icon: Shield, titleKey: 'propietarios.benefit6_title', descriptionKey: 'propietarios.benefit6_desc' },
    { icon: Home, titleKey: 'propietarios.benefit7_title', descriptionKey: 'propietarios.benefit7_desc' }
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
                {t('propietarios.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('propietarios.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('propietarios.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Dos Caminos */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('propietarios.two_ways_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('propietarios.two_ways_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {pathways.map((pathway) => (
                <Card key={pathway.titleKey} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2">
                  <CardHeader className="pb-4">
                    <div className="mb-4 p-4 bg-primary/10 rounded-xl w-fit mx-auto">
                      <pathway.icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">{t(pathway.titleKey)}</CardTitle>
                    <p className="text-center text-muted-foreground font-medium">
                      {t(pathway.subtitleKey)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground text-center">
                      {t(pathway.descriptionKey)}
                    </p>
                    <ul className="space-y-3">
                      {pathway.features.map((featureKey, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{t(featureKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Administración Sin Pausas */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container max-w-4xl">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Home className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">
                    {t('propietarios.vacancy_title')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  <strong>{t('propietarios.vacancy_intro')}</strong>{t('propietarios.vacancy_intro_detail')}
                </p>
                <p className="text-muted-foreground">
                  {t('propietarios.vacancy_desc')} <strong>{t('propietarios.vacancy_highlight')}</strong>{t('propietarios.vacancy_highlight_detail')}
                </p>
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('propietarios.vacancy_item1_title')}</p>
                      <p className="text-sm text-muted-foreground">{t('propietarios.vacancy_item1_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('propietarios.vacancy_item2_title')}</p>
                      <p className="text-sm text-muted-foreground">{t('propietarios.vacancy_item2_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('propietarios.vacancy_item3_title')}</p>
                      <p className="text-sm text-muted-foreground">{t('propietarios.vacancy_item3_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('propietarios.vacancy_item4_title')}</p>
                      <p className="text-sm text-muted-foreground">{t('propietarios.vacancy_item4_desc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Beneficios del Portal */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('propietarios.portal_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('propietarios.portal_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card 
                  key={benefit.titleKey} 
                  className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                    index === benefits.length - 1 && benefits.length % 3 !== 0 
                      ? 'md:col-span-2 lg:col-span-3 md:max-w-md md:mx-auto' 
                      : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t(benefit.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(benefit.descriptionKey)}
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
                  {t('propietarios.cta_title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('propietarios.cta_subtitle')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">{t('propietarios.cta_access')}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform/inmobiliarias-admin">{t('propietarios.cta_agency')}</Link>
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
