import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Básico",
    slug: "basic",
    description: "Plan ideal para pequeños propietarios o administradores individuales",
    priceMonthly: 15000,
    priceYearly: 150000,
    maxProperties: 1,
    maxContracts: 2,
    maxUsers: 2,
    maxBranches: 0,
    features: [
      { text: "Hasta 1 propiedad", included: true },
      { text: "Hasta 2 contratos simultáneos", included: true },
      { text: "2 usuarios activos", included: true },
      { text: "Reportes básicos", included: true },
      { text: "5 GB almacenamiento", included: true },
      { text: "Soporte por email", included: true },
      { text: "Reportes avanzados", included: false },
      { text: "Analytics avanzados", included: false },
      { text: "API access", included: false },
      { text: "Operaciones masivas", included: false },
    ],
    cta: "Solicitar Plan Básico"
  },
  {
    name: "Profesional",
    slug: "professional",
    description: "Para inmobiliarias o administradoras medianas con múltiples propiedades",
    priceMonthly: 50000,
    priceYearly: 500000,
    maxProperties: 5,
    maxContracts: 10,
    maxUsers: 5,
    maxBranches: 2,
    features: [
      { text: "Hasta 5 propiedades", included: true },
      { text: "Hasta 10 contratos simultáneos", included: true },
      { text: "5 usuarios activos", included: true },
      { text: "Hasta 2 sucursales", included: true },
      { text: "Reportes avanzados", included: true },
      { text: "Analytics avanzados", included: true },
      { text: "API access (1000 calls/día)", included: true },
      { text: "Operaciones masivas", included: true },
      { text: "Branding personalizado", included: true },
      { text: "25 GB almacenamiento", included: true },
      { text: "Notificaciones personalizadas", included: true },
      { text: "Soporte prioritario", included: false },
    ],
    cta: "Solicitar Plan Profesional"
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Solución completa para grandes inmobiliarias y corporativos",
    priceMonthly: 120000,
    priceYearly: 1200000,
    maxProperties: 15,
    maxContracts: 30,
    maxUsers: 5,
    maxBranches: 10,
    features: [
      { text: "Hasta 15 propiedades", included: true },
      { text: "Hasta 30 contratos simultáneos", included: true },
      { text: "5 usuarios activos", included: true },
      { text: "Hasta 10 sucursales", included: true },
      { text: "Reportes avanzados ilimitados", included: true },
      { text: "Analytics avanzados con BI", included: true },
      { text: "API access ilimitado", included: true },
      { text: "Operaciones masivas", included: true },
      { text: "Branding personalizado", included: true },
      { text: "100 GB almacenamiento", included: true },
      { text: "Notificaciones personalizadas", included: true },
      { text: "Soporte prioritario 24/7", included: true },
      { text: "Whitelabel (sin marca Granada)", included: true },
    ],
    cta: "Solicitar Plan Enterprise"
  }
];

const calculateYearlySavings = (monthlyPrice: number) => {
  const yearlyWithoutDiscount = monthlyPrice * 12;
  const discountAmount = yearlyWithoutDiscount * 0.17;
  return {
    yearlyWithoutDiscount,
    discountAmount,
    percentageSaved: 17
  };
};

const faqs = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer: "Sí, podés upgradear o downgradear tu plan cuando quieras. Los cambios se aplican en el siguiente período de facturación."
  },
  {
    question: "¿Qué incluye cada plan?",
    answer: "Plan Básico: ideal para pequeños propietarios con hasta 1 propiedad y 2 contratos. Plan Profesional: para inmobiliarias medianas con hasta 5 propiedades, 10 contratos y funcionalidades avanzadas. Plan Enterprise: solución completa con hasta 15 propiedades, 30 contratos y soporte prioritario 24/7."
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer: "No, los precios mostrados no incluyen IVA. Se factura mensualmente con todos los comprobantes fiscales correspondientes."
  },
  {
    question: "¿Qué pasa si supero el límite de propiedades o contratos?",
    answer: "Te avisamos cuando te acerques al límite. Podés upgradear tu plan en cualquier momento para seguir agregando propiedades y contratos sin interrupciones."
  },
  {
    question: "¿Cómo funciona el soporte técnico?",
    answer: "Plan Básico: soporte por email. Plan Profesional: soporte por email con prioridad. Plan Enterprise: soporte prioritario 24/7 con atención personalizada."
  }
];

import { useState } from "react";

export default function Planes() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                Planes y Precios
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Planes flexibles que crecen con vos
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Empezá con plan mensual o ahorrá 17% con facturación anual. Sin sorpresas ni costos ocultos.
              </p>
              
              {/* Toggle Mensual/Anual */}
              <div className="flex items-center justify-center gap-4 pt-6">
                <span className={`font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
                  Mensual
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    billingPeriod === "yearly" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-background transition-transform ${
                      billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`font-medium ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                  Anual
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                    -17%
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparador de Planes */}
        <section className="py-20 px-4">
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
                  key={plan.name} 
                  className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-2"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          ${displayPrice.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{billingPeriod === "monthly" ? "mes" : "año"}
                        </span>
                      </div>
                      {yearlyEquivalent && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Equivalente a ${yearlyEquivalent.toLocaleString('es-AR')}/mes
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {plan.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${!feature.included && 'text-muted-foreground'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      asChild 
                      className="w-full" 
                      variant="outline"
                      size="lg"
                    >
                      <Link to={`/subscription-request?plan=${plan.slug}`}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Los valores expresados no incluyen IVA
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Preguntas Frecuentes
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
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
                  ¿No estás seguro qué plan elegir?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Hablá con nuestro equipo. Te ayudamos a encontrar el plan perfecto 
                  para tu inmobiliaria sin compromiso.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">Agendar Consultoría Gratuita</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform">Ver Demo</Link>
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
