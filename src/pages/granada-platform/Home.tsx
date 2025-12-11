import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { PropertyLifecycleStory } from "@/components/granada/PropertyLifecycleStory";
import { RoleViewsSection } from "@/components/granada/RoleViewsSection";
import { FinalCTASection } from "@/components/granada/FinalCTASection";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";
import granadaHeroBackground from "@/assets/granada-hero-background.jpg";
import {
  CheckCircle2,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function GranadaHome() {
  const { t } = useGranadaLanguage();
  
  const heroItems = [
    {
      icon: CheckCircle2,
      titleKey: 'home.benefit1',
      descKey: 'home.benefit1_desc',
    },
    {
      icon: Shield,
      titleKey: 'home.benefit2',
      descKey: 'home.benefit2_desc',
    },
    {
      icon: TrendingUp,
      titleKey: 'home.benefit3',
      descKey: 'home.benefit3_desc',
    },
  ];
  
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      {/* BLOQUE 1 - Hero Holístico */}
      <section 
        className="relative py-20 px-4 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${granadaHeroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-secondary/70 to-primary/60" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent hover:bg-accent/90 text-lg px-4 py-2" variant="secondary">
              {t('home.badge')}
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary-foreground">
              {t('home.title')}
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-primary-foreground/90 leading-relaxed">
              {t('home.subtitle')}
            </p>

            {/* 3 Bullets con íconos */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: CheckCircle2,
                  title: t('home.benefit1'),
                },
                {
                  icon: Shield,
                  title: t('home.benefit2'),
                },
                {
                  icon: TrendingUp,
                  title: t('home.benefit3'),
                },
              ].map((item, index) => (
                <div key={index} className="bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 rounded-lg p-6 text-left hover:bg-primary-foreground/15 transition-all">
                  <item.icon className="h-10 w-10 text-accent mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-primary-foreground">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>

            {/* Doble CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/granada-platform/inmobiliarias-admin">
                  {t('home.cta_inmobiliaria')}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                asChild
              >
                <Link to="/granada-platform/propietarios">
                  {t('home.cta_propietario')}
                </Link>
              </Button>
            </div>

            {/* Tagline */}
            <p className="text-sm text-primary-foreground/70">
              Granada Platform · Property Management System
            </p>
          </div>
        </div>
      </section>

      {/* BLOQUE 2 - Storytelling del Ciclo de Vida */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              {t('lifecycle.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('lifecycle.subtitle')}
            </p>
          </div>

          {/* 7 Pasos del ciclo de vida */}
          <PropertyLifecycleStory />

          {/* Sub-sección: Una vista para cada rol */}
          <RoleViewsSection />
        </div>
      </section>

      {/* BLOQUE 3 - CTA Final */}
      <FinalCTASection />

      <GranadaFooter />
    </div>
  );
}
