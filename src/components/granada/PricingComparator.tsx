import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface PlanFeature {
  included: boolean;
  text: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/mes",
    description: "Perfecto para administradores independientes que comienzan",
    features: [
      { included: true, text: "Hasta 50 propiedades" },
      { included: true, text: "3 usuarios incluidos" },
      { included: true, text: "Reportes básicos" },
      { included: true, text: "Soporte por email" },
      { included: true, text: "Multi-moneda" },
      { included: true, text: "Portal propietarios" },
      { included: false, text: "Analytics avanzados" },
      { included: false, text: "API access" },
    ],
    cta: "Iniciar Prueba Gratuita",
  },
  {
    name: "Professional",
    price: "$149",
    period: "/mes",
    description: "Ideal para inmobiliarias en crecimiento",
    features: [
      { included: true, text: "Hasta 200 propiedades" },
      { included: true, text: "10 usuarios incluidos" },
      { included: true, text: "Reportes avanzados" },
      { included: true, text: "Soporte prioritario" },
      { included: true, text: "Multi-moneda + Analytics" },
      { included: true, text: "Portal propietarios + inquilinos" },
      { included: true, text: "Dashboard analytics" },
      { included: false, text: "API access" },
    ],
    cta: "Iniciar Prueba Gratuita",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Contactar",
    period: "",
    description: "Solución completa para grandes operaciones",
    features: [
      { included: true, text: "Propiedades ilimitadas" },
      { included: true, text: "Usuarios ilimitados" },
      { included: true, text: "Reportes personalizados" },
      { included: true, text: "Soporte dedicado 24/7" },
      { included: true, text: "Todo incluido + API" },
      { included: true, text: "Onboarding personalizado" },
      { included: true, text: "Analytics completo" },
      { included: true, text: "Integración API REST" },
    ],
    cta: "Contactar Ventas",
  },
];

export default function PricingComparator() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Planes que Crecen con tu Negocio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comienza gratis por 14 días. Sin tarjeta de crédito requerida.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Incluido en Todos los Planes
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Gestión de propiedades completa",
              "Sistema de pagos y gastos",
              "Reportes automáticos mensuales",
              "Notificaciones por email",
              "Multi-moneda con tasas actualizadas",
              "Portal para propietarios",
              "Backups automáticos diarios",
              "Actualizaciones gratuitas",
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
