import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  UserCheck, 
  Building2, 
  BarChart3, 
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield
} from "lucide-react";

const pathways = [
  {
    icon: UserCheck,
    title: "Auto-Gestión",
    subtitle: "Administrá vos mismo",
    description: "Accedé a tu portal Granada para gestionar tus propiedades de forma directa. Creá contratos, cargá pagos, aprobá mantenimientos y generá reportes.",
    features: [
      "Control total de tus alquileres",
      "Sin comisiones de administración",
      "Todas las herramientas profesionales",
      "Soporte técnico incluido"
    ]
  },
  {
    icon: Building2,
    title: "Delegación",
    subtitle: "Dejá que profesionales lo hagan",
    description: "Asignale la gestión a una Inmobiliaria que use Granada. Vos monitoreás todo en tiempo real desde tu portal, sin perder visibilidad.",
    features: [
      "Inmobiliarias profesionales verificadas",
      "Transparencia total en tiempo real",
      "Reportes mensuales automáticos",
      "Menos estrés, más tranquilidad"
    ]
  }
];

const benefits = [
  {
    icon: BarChart3,
    title: "Reportes Automáticos",
    description: "Recibí cada mes un informe detallado con ingresos, gastos y el estado de tu propiedad."
  },
  {
    icon: DollarSign,
    title: "Historial de Pagos",
    description: "Consultá todos los pagos históricos, comprobantes y estado de cuenta en un solo lugar."
  },
  {
    icon: CheckCircle2,
    title: "Aprobación de Gastos",
    description: "Revisá y aprobá mantenimientos y gastos extraordinarios desde tu portal."
  },
  {
    icon: FileText,
    title: "Documentación Central",
    description: "Contratos, recibos, fotos y documentos de tu propiedad siempre disponibles."
  },
  {
    icon: Clock,
    title: "Actualizaciones en Tiempo Real",
    description: "Seguí el estado de tu propiedad y contratos sin llamadas ni mensajes."
  },
  {
    icon: Shield,
    title: "Seguridad y Privacidad",
    description: "Tus datos protegidos con encriptación y acceso exclusivo para vos."
  }
];

export default function Propietarios() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                Para Propietarios
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Gestioná o Delegá tus Propiedades con Transparencia Total
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Elegí tu camino: administrá vos mismo con todas las herramientas profesionales, 
                o delegá en una inmobiliaria y monitoreá todo en tiempo real.
              </p>
            </div>
          </div>
        </section>

        {/* Dos Caminos */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Dos Formas de Usar Granada
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                La tecnología es la misma. Vos elegís el nivel de involucramiento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {pathways.map((pathway) => (
                <Card key={pathway.title} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2">
                  <CardHeader className="pb-4">
                    <div className="mb-4 p-4 bg-primary/10 rounded-xl w-fit mx-auto">
                      <pathway.icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">{pathway.title}</CardTitle>
                    <p className="text-center text-muted-foreground font-medium">
                      {pathway.subtitle}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground text-center">
                      {pathway.description}
                    </p>
                    <ul className="space-y-3">
                      {pathway.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios del Portal */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tu Portal de Propietario
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Todo lo que necesitás saber sobre tu propiedad, en un solo lugar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Empezá a gestionar con claridad
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Dejá atrás los papeles perdidos y las dudas. Con Granada, todo está claro, 
                  ordenado y disponible cuando lo necesitás.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">Solicitar Acceso</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform/inmobiliarias-admin">¿Sos Inmobiliaria?</Link>
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
