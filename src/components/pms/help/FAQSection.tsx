import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RoleData } from '@/data/pmsRolesData';

interface FAQSectionProps {
  roleData: RoleData;
}

export function FAQSection({ roleData }: FAQSectionProps) {
  if (!roleData.faqs || roleData.faqs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay preguntas frecuentes disponibles para este rol.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Preguntas Frecuentes - {roleData.role}</h3>
      <Accordion type="single" collapsible className="w-full">
        {roleData.faqs.map((faq, idx) => (
          <AccordionItem key={idx} value={`faq-${idx}`}>
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
  );
}
