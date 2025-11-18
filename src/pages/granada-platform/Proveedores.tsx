import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Wrench, 
  Zap, 
  Paintbrush,
  Droplets,
  Scissors,
  Lock,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2
} from "lucide-react";

const categories = [
  {
    icon: Wrench,
    title: "Plomería",
    description: "Reparaciones, instalaciones y mantenimiento de sistemas de agua"
  },
  {
    icon: Zap,
    title: "Electricidad",
    description: "Instalaciones eléctricas, reparaciones y emergencias"
  },
  {
    icon: Paintbrush,
    title: "Pintura",
    description: "Pintura interior/exterior, empapelado y revestimientos"
  },
  {
    icon: Droplets,
    title: "Limpieza",
    description: "Limpieza profunda, mantenimiento y desinfección"
  },
  {
    icon: Scissors,
    title: "Jardinería",
    description: "Mantenimiento de espacios verdes y parquización"
  },
  {
    icon: Lock,
    title: "Cerrajería",
    description: "Cambio de cerraduras, llaves y sistemas de seguridad"
  }
];

const benefits = [
  {
    icon: Users,
    title: "Para Inmobiliarias",
    description: "Accedé a proveedores verificados y confiables. Cotizá, aprobá y seguí todos los trabajos desde Granada sin llamadas ni mensajes.",
    features: [
      "Proveedores pre-verificados",
      "Comparación de presupuestos",
      "Seguimiento en tiempo real",
      "Historial de trabajos"
    ]
  },
  {
    icon: TrendingUp,
    title: "Para Proveedores",
    description: "Recibí más trabajo de inmobiliarias profesionales. Gestioná pedidos, presupuestos y pagos de forma ordenada.",
    features: [
      "Acceso a múltiples inmobiliarias",
      "Agenda de trabajos organizada",
      "Pagos seguros y en tiempo",
      "Reputación verificable"
    ]
  }
];

const howItWorks = [
  {
    number: "1",
    title: "Registro y Verificación",
    description: "El proveedor se registra con su especialidad y documentación. Granada verifica credenciales y experiencia."
  },
  {
    number: "2",
    title: "Solicitud de Cotización",
    description: "La inmobiliaria carga un mantenimiento necesario. Los proveedores de la categoría reciben la notificación."
  },
  {
    number: "3",
    title: "Presupuesto y Aprobación",
    description: "El proveedor envía presupuesto. La inmobiliaria compara y aprueba. El propietario autoriza el gasto."
  },
  {
    number: "4",
    title: "Ejecución y Pago",
    description: "El proveedor ejecuta el trabajo, sube fotos del resultado. Se procesa el pago a través de Granada."
  }
];

export default function Proveedores() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                Red de Proveedores
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Red de Proveedores Confiables
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Conectamos inmobiliarias con proveedores verificados. Más trabajo para profesionales, 
                mejor servicio para las propiedades.
              </p>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Categorías de Servicios
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Encontrá el proveedor indicado para cada tipo de mantenimiento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Un Ecosistema que Beneficia a Todos
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <CardHeader>
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                    <ul className="space-y-2">
                      {benefit.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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

        {/* Cómo Funciona */}
        <section className="py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Cómo Funciona el Sistema?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un proceso simple y transparente para todos los involucrados.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {howItWorks.map((step) => (
                <Card key={step.number} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Badge 
                        variant="secondary" 
                        className="text-2xl font-bold h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
                      >
                        {step.number}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center space-y-6">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  Unite a la Red Granada
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  ¿Sos proveedor de servicios para propiedades? Registrate y accedé a más trabajo 
                  con inmobiliarias profesionales que usan Granada.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">Registrarme como Proveedor</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/partners-directory">Ver Directorio de Proveedores</Link>
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
