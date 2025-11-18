import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Shield,
  Home,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  UserCog
} from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Gestión Centralizada",
    description: "Administrá todas tus propiedades, contratos y pagos desde una única plataforma. Sin papeles, sin planillas dispersas."
  },
  {
    icon: Users,
    title: "Portal para Clientes",
    description: "Ofrecé a tus propietarios un portal personalizado donde ven reportes, gastos y el estado de sus propiedades en tiempo real."
  },
  {
    icon: TrendingUp,
    title: "Automatización Total",
    description: "Generá recibos, reportes mensuales y alertas automáticas. Enfocate en crecer, no en tareas repetitivas."
  },
  {
    icon: Shield,
    title: "Red de Proveedores",
    description: "Accedé a una red de proveedores verificados para mantenimientos. Cotizá, aprobá y seguí todo en un solo lugar."
  }
];

const modules = [
  {
    icon: Home,
    title: "Propiedades",
    description: "Registro completo con fotos, documentos y historial de cada inmueble."
  },
  {
    icon: FileText,
    title: "Contratos",
    description: "Creá contratos con ajustes por IPC/ICL, renovaciones y seguimiento automático."
  },
  {
    icon: CreditCard,
    title: "Pagos",
    description: "Calendario de vencimientos, carga de comprobantes y conciliación bancaria."
  },
  {
    icon: Wrench,
    title: "Mantenimientos",
    description: "Gestioná reparaciones, aprobaciones de propietarios y seguimiento de proveedores."
  },
  {
    icon: BarChart3,
    title: "Reportes",
    description: "Informes mensuales automáticos para propietarios con desglose de ingresos y gastos."
  },
  {
    icon: UserCog,
    title: "Multi-tenant",
    description: "Roles y permisos granulares. Cada inmobiliaria con su espacio aislado y seguro."
  }
];

export default function InmobiliariasAdmin() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                Para Inmobiliarias y Administradores
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Potenciá tu Inmobiliaria con Granada
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Centralizá toda la gestión de propiedades, contratos y pagos en una plataforma profesional. 
                Ofrecé un servicio premium a tus clientes con reportes automáticos y transparencia total.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/granada-platform/planes">Ver Planes</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link to="/granada-platform/contacto">Solicitar Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios Clave */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Por qué Granada para tu Inmobiliaria?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Dejá atrás las planillas de Excel, los WhatsApp desorganizados y las capturas de pantalla perdidas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Módulos Destacados */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Módulos que Potencian tu Gestión
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Todo lo que necesitás para administrar propiedades de forma profesional, en un solo lugar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
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
                  Empezá a profesionalizar tu gestión hoy
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Crecé en propiedades sin crecer en problemas. Granada escala con vos, 
                  desde las primeras 5 propiedades hasta cientos de unidades.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/granada-platform/planes">Ver Planes y Precios</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/granada-platform/contacto">Agendar Demo Gratuita</Link>
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
