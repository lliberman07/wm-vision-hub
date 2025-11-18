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
    name: "Prueba",
    price: "Gratis",
    period: "15 días",
    description: "Probá todas las funcionalidades sin compromiso",
    features: [
      { text: "Hasta 3 propiedades", included: true },
      { text: "1 usuario admin", included: true },
      { text: "Contratos básicos", included: true },
      { text: "Calendario de pagos", included: true },
      { text: "Reportes básicos", included: true },
      { text: "Soporte por email", included: true },
      { text: "Portal propietarios", included: false },
      { text: "Multi-usuario", included: false },
    ],
    highlighted: false,
    cta: "Empezar Prueba"
  },
  {
    name: "Básico",
    price: "$12.000",
    period: "/mes",
    description: "Para inmobiliarias que recién arrancan",
    features: [
      { text: "Hasta 20 propiedades", included: true },
      { text: "2 usuarios activos", included: true },
      { text: "Contratos con ajustes", included: true },
      { text: "Gestión de pagos completa", included: true },
      { text: "Reportes mensuales automáticos", included: true },
      { text: "Portal para propietarios", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Red de proveedores", included: false },
    ],
    highlighted: false,
    cta: "Solicitar Plan"
  },
  {
    name: "Profesional",
    price: "$28.000",
    period: "/mes",
    description: "El más elegido por inmobiliarias en crecimiento",
    features: [
      { text: "Hasta 100 propiedades", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Todos los módulos incluidos", included: true },
      { text: "Roles y permisos granulares", included: true },
      { text: "Red de proveedores completa", included: true },
      { text: "API para integraciones", included: true },
      { text: "Soporte prioritario + WhatsApp", included: true },
      { text: "Capacitación incluida", included: true },
    ],
    highlighted: true,
    cta: "Solicitar Plan"
  },
  {
    name: "Enterprise",
    price: "Consultar",
    period: "",
    description: "Para grandes administradores con necesidades específicas",
    features: [
      { text: "Propiedades ilimitadas", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Infraestructura dedicada", included: true },
      { text: "Integraciones personalizadas", included: true },
      { text: "SLA garantizado", included: true },
      { text: "Account manager dedicado", included: true },
      { text: "Capacitación on-site", included: true },
      { text: "Desarrollo a medida", included: true },
    ],
    highlighted: false,
    cta: "Contactar Ventas"
  }
];

const faqs = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer: "Sí, podés upgradear o downgradear tu plan cuando quieras. Los cambios se aplican en el siguiente período de facturación."
  },
  {
    question: "¿Qué pasa cuando termine mi prueba gratuita?",
    answer: "Al finalizar los 15 días, podés elegir el plan que más se adapte a tus necesidades. No te cobramos automáticamente sin tu confirmación."
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer: "Los precios mostrados son más IVA. Se factura mensualmente con todos los comprobantes fiscales correspondientes."
  },
  {
    question: "¿Qué pasa si supero el límite de propiedades?",
    answer: "Te avisamos cuando te acerques al límite. Podés upgradear tu plan en cualquier momento para seguir agregando propiedades sin interrupciones."
  },
  {
    question: "¿Hay costos de implementación?",
    answer: "No. La configuración inicial y la carga de datos están incluidas. Te acompañamos en el proceso de migración sin costos adicionales."
  }
];

export default function Planes() {
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
                Empezá gratis. Escalá cuando necesites. Sin sorpresas ni costos ocultos.
              </p>
            </div>
          </div>
        </section>

        {/* Comparador de Planes */}
        <section className="py-20 px-4">
          <div className="container max-w-7xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`hover:shadow-xl transition-all duration-300 ${
                    plan.highlighted 
                      ? 'border-primary border-2 shadow-lg scale-105' 
                      : 'hover:-translate-y-1'
                  }`}
                >
                  <CardHeader>
                    {plan.highlighted && (
                      <Badge className="w-fit mb-2" variant="default">
                        Más Popular
                      </Badge>
                    )}
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground ml-1">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
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
                      variant={plan.highlighted ? "default" : "outline"}
                      size="lg"
                    >
                      <Link to="/granada-platform/contacto">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
