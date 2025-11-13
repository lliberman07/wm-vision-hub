import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyManagementModules } from "./PropertyManagementModules";
import { Briefcase, TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function RealEstateSection() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Ingresos Recurrentes",
      description: "No se limite a vender. Genere ingresos mensuales predecibles administrando las propiedades que comercializa."
    },
    {
      icon: Briefcase,
      title: "Cierre Más Negocios",
      description: "Ofrezca un servicio completo: venta + administración integral. Diferencíese de la competencia."
    },
    {
      icon: Users,
      title: "Retención de Clientes",
      description: "Mantenga relación con propietarios después de la venta. Convierta transacciones únicas en clientes recurrentes."
    },
    {
      icon: BarChart3,
      title: "Gestión Escalable",
      description: "Administre desde 1 hasta 1000+ propiedades con la misma eficiencia. Tecnología que crece con usted."
    }
  ];

  return (
    <section id="inmobiliarias" className="py-20 px-4 bg-gradient-to-b from-background to-[hsl(var(--granada-cream))]">
      <div className="container mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-[hsl(var(--granada-red))]/10 rounded-full">
            <span className="text-[hsl(var(--granada-red))] font-semibold">Para Inmobiliarias</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Complete el Ciclo de Vida de las Propiedades
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Desde la captación hasta la administración completa. Una plataforma que acompaña todo el proceso y genera ingresos recurrentes para su inmobiliaria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[hsl(var(--granada-red))] hover:bg-[hsl(var(--granada-red-dark))] text-white"
              onClick={() => navigate('/contact')}
            >
              Solicitar Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Planes
            </Button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--granada-red))] to-[hsl(var(--granada-red-dark))] flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-[hsl(var(--granada-navy))] to-[hsl(var(--granada-navy-dark))] rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Potencie su Inmobiliaria con Gestión Integral
              </h3>
              <p className="text-white/90 mb-6">
                Granada Platform le permite ofrecer servicios de administración profesional sin necesidad de infraestructura adicional. Gestione múltiples propiedades de terceros con herramientas enterprise.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--granada-gold))] mt-1">✓</span>
                  <span>Reportes automáticos mensuales para sus clientes propietarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--granada-gold))] mt-1">✓</span>
                  <span>Portal exclusivo donde propietarios ven el estado de sus inversiones 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--granada-gold))] mt-1">✓</span>
                  <span>Liquidaciones automáticas con trazabilidad total y cumplimiento normativo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--granada-gold))] mt-1">✓</span>
                  <span>Branding profesional que fortalece la imagen de su inmobiliaria</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-5xl font-bold text-[hsl(var(--granada-gold))] mb-2">300%</div>
                <p className="text-white/90">Aumento promedio en ingresos recurrentes al agregar servicios de administración</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-center mb-4">
            Herramientas Profesionales para Inmobiliarias
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Todo lo que necesita para administrar propiedades de terceros con el más alto nivel de profesionalismo
          </p>
          <PropertyManagementModules audience="inmobiliarias" />
        </div>

        {/* CTA Final */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-[hsl(var(--granada-cream))] to-white border-[hsl(var(--granada-gold))]/20">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">
                ¿Listo para transformar su inmobiliaria?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Agende una demo personalizada y descubra cómo Granada Platform puede ayudarle a generar ingresos recurrentes mientras ofrece un servicio de clase mundial.
              </p>
              <Button 
                size="lg"
                className="bg-[hsl(var(--granada-red))] hover:bg-[hsl(var(--granada-red-dark))] text-white"
                onClick={() => navigate('/contact')}
              >
                Agendar Demo Personalizada
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
