import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Wrench, 
  Zap, 
  Paintbrush,
  Droplets,
  Scissors,
  Lock,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2
} from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export default function Proveedores() {
  const { t } = useGranadaLanguage();

  const categories = [
    { icon: Wrench, titleKey: 'proveedores.cat1_title', descriptionKey: 'proveedores.cat1_desc' },
    { icon: Zap, titleKey: 'proveedores.cat2_title', descriptionKey: 'proveedores.cat2_desc' },
    { icon: Paintbrush, titleKey: 'proveedores.cat3_title', descriptionKey: 'proveedores.cat3_desc' },
    { icon: Droplets, titleKey: 'proveedores.cat4_title', descriptionKey: 'proveedores.cat4_desc' },
    { icon: Scissors, titleKey: 'proveedores.cat5_title', descriptionKey: 'proveedores.cat5_desc' },
    { icon: Lock, titleKey: 'proveedores.cat6_title', descriptionKey: 'proveedores.cat6_desc' }
  ];

  const benefits = [
    {
      icon: Users,
      titleKey: 'proveedores.for_agencies',
      descriptionKey: 'proveedores.for_agencies_desc',
      features: [
        'proveedores.agency_feature1',
        'proveedores.agency_feature2',
        'proveedores.agency_feature3',
        'proveedores.agency_feature4'
      ]
    },
    {
      icon: TrendingUp,
      titleKey: 'proveedores.for_providers',
      descriptionKey: 'proveedores.for_providers_desc',
      features: [
        'proveedores.provider_feature1',
        'proveedores.provider_feature2',
        'proveedores.provider_feature3',
        'proveedores.provider_feature4'
      ]
    }
  ];

  const howItWorks = [
    { number: "1", titleKey: 'proveedores.step1_title', descriptionKey: 'proveedores.step1_desc' },
    { number: "2", titleKey: 'proveedores.step2_title', descriptionKey: 'proveedores.step2_desc' },
    { number: "3", titleKey: 'proveedores.step3_title', descriptionKey: 'proveedores.step3_desc' },
    { number: "4", titleKey: 'proveedores.step4_title', descriptionKey: 'proveedores.step4_desc' }
  ];

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="container max-w-5xl relative z-10">
            <div className="text-center space-y-6">
              <Badge className="mb-4 bg-accent hover:bg-accent/90" variant="secondary">
                {t('proveedores.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                {t('proveedores.title')}
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                {t('proveedores.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('proveedores.categories_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('proveedores.categories_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.titleKey} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t(category.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(category.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('proveedores.benefits_title')}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit) => (
                <Card key={benefit.titleKey} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <CardHeader>
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{t(benefit.titleKey)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {t(benefit.descriptionKey)}
                    </p>
                    <ul className="space-y-2">
                      {benefit.features.map((featureKey, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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

        {/* Cómo Funciona */}
        <section className="py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('proveedores.how_title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('proveedores.how_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {howItWorks.map((step) => (
                <Card key={step.number} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Badge 
                        variant="secondary" 
                        className="text-2xl font-bold h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
                      >
                        {step.number}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{t(step.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t(step.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center space-y-6">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('proveedores.cta_title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('proveedores.cta_subtitle')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">{t('proveedores.cta_register')}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/partners-directory">{t('proveedores.cta_directory')}</Link>
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
