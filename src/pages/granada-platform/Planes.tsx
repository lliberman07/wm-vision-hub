import { useState } from "react";
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Planes() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { t, language } = useGranadaLanguage();

  const plans = [
    {
      nameKey: 'planes.plan_basic',
      color: "text-[hsl(var(--granada-red))]",
      slug: "basic",
      descriptionKey: 'planes.plan_basic_desc',
      priceMonthly: 15000,
      priceYearly: 150000,
      features: [
        { textKey: 'planes.feature_properties', value: 1, included: true },
        { textKey: 'planes.feature_contracts', value: 2, included: true },
        { textKey: 'planes.feature_users', value: 2, included: true },
        { textKey: 'planes.feature_basic_reports', included: true },
        { textKey: 'planes.feature_storage', value: 5, included: true },
        { textKey: 'planes.feature_email_support', included: true },
        { textKey: 'planes.feature_advanced_reports', included: false },
        { textKey: 'planes.feature_analytics', included: false },
        { textKey: 'planes.feature_api', value: 0, included: false },
        { textKey: 'planes.feature_bulk', included: false },
      ]
    },
    {
      nameKey: 'planes.plan_professional',
      color: "text-[hsl(var(--granada-navy))]",
      slug: "professional",
      descriptionKey: 'planes.plan_professional_desc',
      priceMonthly: 50000,
      priceYearly: 500000,
      features: [
        { textKey: 'planes.feature_properties_plural', value: 5, included: true },
        { textKey: 'planes.feature_contracts', value: 10, included: true },
        { textKey: 'planes.feature_users', value: 5, included: true },
        { textKey: 'planes.feature_branches', value: 2, included: true },
        { textKey: 'planes.feature_advanced_reports', included: true },
        { textKey: 'planes.feature_analytics', included: true },
        { textKey: 'planes.feature_api', value: 1000, included: true },
        { textKey: 'planes.feature_bulk', included: true },
        { textKey: 'planes.feature_branding', included: true },
        { textKey: 'planes.feature_storage', value: 25, included: true },
        { textKey: 'planes.feature_notifications', included: true },
        { textKey: 'planes.feature_priority_support', included: false },
      ]
    },
    {
      nameKey: 'planes.plan_enterprise',
      color: "text-[hsl(var(--granada-gold))]",
      slug: "enterprise",
      descriptionKey: 'planes.plan_enterprise_desc',
      priceMonthly: 120000,
      priceYearly: 1200000,
      features: [
        { textKey: 'planes.feature_properties_plural', value: 15, included: true },
        { textKey: 'planes.feature_contracts', value: 30, included: true },
        { textKey: 'planes.feature_users', value: 5, included: true },
        { textKey: 'planes.feature_branches', value: 10, included: true },
        { textKey: 'planes.feature_advanced_reports_unlimited', included: true },
        { textKey: 'planes.feature_analytics_bi', included: true },
        { textKey: 'planes.feature_api_unlimited', included: true },
        { textKey: 'planes.feature_bulk', included: true },
        { textKey: 'planes.feature_branding', included: true },
        { textKey: 'planes.feature_storage', value: 100, included: true },
        { textKey: 'planes.feature_notifications', included: true },
        { textKey: 'planes.feature_priority_support_24', included: true },
        { textKey: 'planes.feature_whitelabel', included: true },
      ]
    }
  ];

  const faqs = [
    { questionKey: 'planes.faq1_q', answerKey: 'planes.faq1_a' },
    { questionKey: 'planes.faq2_q', answerKey: 'planes.faq2_a' },
    { questionKey: 'planes.faq3_q', answerKey: 'planes.faq3_a' },
    { questionKey: 'planes.faq4_q', answerKey: 'planes.faq4_a' },
    { questionKey: 'planes.faq5_q', answerKey: 'planes.faq5_a' }
  ];

  const formatFeatureText = (textKey: string, value?: number): string => {
    let text = t(textKey);
    if (value !== undefined) {
      text = text.replace('{n}', value.toString());
    }
    return text;
  };

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                {t('planes.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('planes.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('planes.subtitle')}
              </p>
              
              {/* Toggle Mensual/Anual */}
              <div className="flex flex-col items-center gap-3 pt-6">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t('planes.billing_label')}
                </span>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
                    {t('planes.monthly')}
                  </span>
                  <button
                    onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      billingPeriod === "yearly" ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-background transition-transform shadow-md ${
                        billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`font-medium ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                    {t('planes.yearly')}
                  </span>
                  {billingPeriod === "yearly" && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold border-0 animate-pulse">
                      17% {t('planes.off')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparador de Planes */}
        <section className="-mt-8 pb-20 px-4">
          <div className="container max-w-7xl">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const displayPrice = billingPeriod === "monthly" 
                  ? plan.priceMonthly 
                  : plan.priceYearly;
                const yearlyEquivalent = billingPeriod === "yearly" 
                  ? plan.priceYearly / 12 
                  : null;

                return (
                <Card 
                  key={plan.nameKey} 
                  className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 flex flex-col h-full"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-2xl mb-2 ${plan.color}`}>{t(plan.nameKey)}</CardTitle>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-3xl font-bold ${plan.color}`}>
                          ${displayPrice.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{billingPeriod === "monthly" ? t('planes.monthly').toLowerCase() : t('planes.yearly').toLowerCase()}
                        </span>
                        {billingPeriod === "yearly" && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xs border-0">
                            -17%
                          </Badge>
                        )}
                      </div>
                      {yearlyEquivalent && (
                        <p className="text-sm text-muted-foreground mt-1 font-bold">
                          {t('planes.equivalent')} ${Math.round(yearlyEquivalent).toLocaleString('es-AR')}{t('planes.per_month')}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {t(plan.descriptionKey)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0 flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${!feature.included && 'text-muted-foreground'}`}>
                            {formatFeatureText(feature.textKey, feature.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      asChild 
                      className="w-full mt-auto" 
                      variant="outline"
                      size="lg"
                    >
                      <Link to={`/subscription-request?plan=${plan.slug}`}>{t('planes.request_plan')} {t(plan.nameKey)}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8 font-bold">
              {t('planes.vat_note')}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('planes.faq_title')}
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {t(faq.questionKey)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(faq.answerKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('planes.cta_title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('planes.cta_subtitle')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">{t('planes.cta_demo')}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform">{t('planes.cta_trial')}</Link>
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
