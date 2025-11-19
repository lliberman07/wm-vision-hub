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
    question: "¿Puedo cancelar en cualquier momento?",
    answer: "Sí, no hay contratos de permanencia. Podés cancelar tu suscripción en cualquier momento desde tu panel de configuración. Si cancelás, tendrás acceso hasta el final del período pagado.",
  },
  {
    question: "¿Cómo es el soporte técnico?",
    answer: "Plan Básico: Soporte por email. Plan Profesional: Soporte por email con prioridad. Plan Enterprise: Soporte prioritario 24/7 con atención personalizada.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Absolutamente. Usamos encriptación de nivel bancario, backups automáticos diarios, servidores en múltiples regiones y cumplimos con normativas internacionales de protección de datos. Cada cliente tiene aislamiento total de datos.",
  },
  {
    question: "¿Qué incluye cada plan?",
    answer: "Plan Básico: hasta 1 propiedad, 2 contratos y 2 usuarios. Plan Profesional: hasta 5 propiedades, 10 contratos, 5 usuarios y 2 sucursales con reportes avanzados. Plan Enterprise: hasta 15 propiedades, 30 contratos, 5 usuarios y 10 sucursales con soporte 24/7.",
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer: "No, los precios mostrados no incluyen IVA. Se factura mensualmente con todos los comprobantes fiscales correspondientes.",
  },
  {
    question: "¿Hay costos de implementación?",
    answer: "No, no hay costos adicionales de implementación. La configuración inicial está incluida en todos los planes.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer: "Sí, podés upgradear o downgradear tu plan en cualquier momento. Los cambios se aplican en el siguiente período de facturación.",
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
