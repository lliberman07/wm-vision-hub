import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, MessageSquare } from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export function FinalCTASection() {
  const { t } = useGranadaLanguage();

  const ctaCards = [
    {
      title: t('cta.card1_title'),
      description: t('cta.card1_desc'),
      buttonText: t('cta.card1_button'),
      buttonLink: "/granada-platform/inmobiliarias-admin",
      icon: Building2,
    },
    {
      title: t('cta.card2_title'),
      description: t('cta.card2_desc'),
      buttonText: t('cta.card2_button'),
      buttonLink: "/granada-platform/propietarios",
      icon: User,
    },
    {
      title: t('cta.card3_title'),
      description: t('cta.card3_desc'),
      buttonText: t('cta.card3_button'),
      buttonLink: "/granada-platform/contacto",
      icon: MessageSquare,
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('cta.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {ctaCards.map((card) => (
            <Card key={card.title} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
              <CardHeader className="flex-1">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <card.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  {card.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0 mt-auto">
                <Button asChild className="w-full" size="lg">
                  <Link to={card.buttonLink}>{card.buttonText}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
