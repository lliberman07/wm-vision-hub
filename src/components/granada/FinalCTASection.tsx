import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, MessageSquare } from "lucide-react";

const ctaCards = [
  {
    title: "Soy Inmobiliaria / Admin",
    description: "Administrá múltiples propiedades con eficiencia y profesionalismo",
    buttonText: "Quiero administrar con Granada",
    buttonLink: "/granada-platform/inmobiliarias-admin",
    icon: Building2,
  },
  {
    title: "Soy Propietario",
    description: "Dejá que profesionales gestionen tus propiedades con total transparencia",
    buttonText: "Quiero Gestionar con Granada",
    buttonLink: "/granada-platform/propietarios",
    icon: User,
  },
  {
    title: "Quiero hablar con el equipo",
    description: "Coordinamos una demo personalizada para tu caso específico",
    buttonText: "Agendar una demo",
    buttonLink: "/granada-platform/contacto",
    icon: MessageSquare,
  },
];

export function FinalCTASection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">
            Que tu propiedad trabaje para vos, no al revés
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              Si sos propietario, no tenés por qué seguir persiguiendo papeles, comprobantes y capturas de pantalla. 
              Podés delegar la gestión en una Inmobiliaria o Administrador que use Granada, y recibir cada mes un resumen 
              claro de lo que pasó con tu propiedad. Si preferís estar más encima, entrás a tu portal y ves en tiempo real 
              qué se cobró, qué se gastó, qué se hizo en mantenimiento y cómo va el contrato con tu inquilino.
            </p>
            <p className="text-base">
              Si sos Inmobiliaria o Property Manager, Granada te ayuda a ordenar procesos, crecer en propiedades y ofrecer 
              un servicio premium a tus clientes. Si sos Inquilino, tenés claridad: contrato, pagos y comunicaciones en un solo lugar.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {ctaCards.map((card) => (
            <Card key={card.title} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <card.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  {card.description}
                </p>
              </CardHeader>
              <CardContent>
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
