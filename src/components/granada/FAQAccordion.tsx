import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Necesito instalar algo?",
    answer: "No, Granada Platform es 100% cloud. Solo necesitas un navegador web moderno y conexión a internet. Funciona en computadoras, tablets y celulares.",
  },
  {
    question: "¿Cómo migro mis datos actuales?",
    answer: "Ofrecemos un servicio de migración asistida sin costo en todos los planes Professional y Enterprise. Nuestro equipo te ayuda a importar tus propiedades, propietarios, inquilinos y contratos existentes.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer: "Sí, no hay contratos de permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración. Si cancelas, tendrás acceso hasta el final del período pagado.",
  },
  {
    question: "¿Ofrecen capacitación?",
    answer: "Sí, incluimos onboarding y capacitación para todo tu equipo. Además tenemos una extensa documentación, videos tutoriales y un centro de ayuda disponible 24/7.",
  },
  {
    question: "¿Cómo es el soporte técnico?",
    answer: "Plan Starter: Soporte por email con respuesta en 24hs. Plan Professional: Soporte prioritario en 4hs. Plan Enterprise: Soporte dedicado 24/7 con Slack/WhatsApp directo.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Absolutamente. Usamos encriptación AES-256 (nivel bancario), backups automáticos diarios, servidores en múltiples regiones y cumplimos con normativas internacionales de protección de datos. Cada cliente tiene aislamiento total de datos (multi-tenancy).",
  },
  {
    question: "¿Puedo probar antes de contratar?",
    answer: "Sí, ofrecemos 14 días de prueba gratuita sin necesidad de tarjeta de crédito. Tendrás acceso completo a todas las funcionalidades del plan que elijas.",
  },
  {
    question: "¿Hay costos de setup o implementación?",
    answer: "No, no hay costos ocultos. Los planes Starter y Professional no tienen cargo de setup. En el plan Enterprise podemos incluir desarrollo de integraciones personalizadas que se presupuestan aparte.",
  },
];

export default function FAQAccordion() {
  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Preguntas Frecuentes
          </h2>
          <p className="text-xl text-muted-foreground">
            Todo lo que necesitas saber sobre Granada Platform
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-foreground">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
