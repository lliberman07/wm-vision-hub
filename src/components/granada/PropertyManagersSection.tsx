import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyManagementModules } from "./PropertyManagementModules";
import { Shield, Zap, BarChart3, Users, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PropertyManagersSection() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Transparencia Total",
      description: "Sus clientes propietarios confían en usted porque pueden ver todo en tiempo real. Cero dudas, máxima confianza."
    },
    {
      icon: Zap,
      title: "Automatización Inteligente",
      description: "Dedique menos tiempo a tareas administrativas y más a crecer su negocio. La plataforma trabaja por usted."
    },
    {
      icon: BarChart3,
      title: "Reportes Profesionales",
      description: "Impresione a sus clientes con reportes mensuales detallados y análisis de inversión automáticos."
    },
    {
      icon: Users,
      title: "Gestión Multi-Propiedad",
      description: "Administre todas las propiedades de sus clientes desde una sola plataforma centralizada y eficiente."
    }
  ];

  const useCases = [
    {
      title: "Gestión de Cobros",
      description: "Seguimiento automático de pagos con recordatorios inteligentes a inquilinos. Alertas de morosidad proactivas."
    },
    {
      title: "Liquidaciones Automáticas",
      description: "Cálculo automático de comisiones y gastos deducibles. Envío de liquidaciones con un solo click."
    },
    {
      title: "Control de Vencimientos",
      description: "Alertas automáticas de renovaciones de contratos, vencimientos de seguros y fechas importantes."
    }
  ];

  const differentiators = [
    "Sin inversión inicial alta en software",
    "Configuración en minutos, no semanas",
    "Soporte personalizado incluido",
    "Escalable según su crecimiento",
    "Acceso móvil completo",
    "Actualizaciones automáticas sin costo"
  ];

  return (
    <section id="property-managers" className="py-20 px-4 bg-gradient-to-b from-background to-[hsl(var(--granada-navy))]/5">
      <div className="container mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-[hsl(var(--granada-navy))]/10 rounded-full">
            <span className="text-[hsl(var(--granada-navy))] font-semibold">Para Administradores Independientes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Profesionalice su Servicio de Administración
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Herramientas enterprise al alcance de administradores independientes. Gestione múltiples propiedades con transparencia total hacia sus clientes propietarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-[hsl(var(--granada-navy))] hover:bg-[hsl(var(--granada-navy-dark))] text-white"
              onClick={() => navigate('/pms/subscribe?plan=basic')}
            >
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Badge variant="outline" className="text-base py-2 px-4">
              14 días de prueba • Sin tarjeta requerida
            </Badge>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--granada-navy))] to-[hsl(var(--granada-navy-dark))] flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Use Cases */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-4">
            Casos de Uso Específicos para Property Managers
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Resuelva los desafíos diarios de administración con herramientas diseñadas específicamente para su trabajo
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-[hsl(var(--granada-navy))]/20 hover:border-[hsl(var(--granada-navy))]/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <CheckCircle className="h-8 w-8 text-[hsl(var(--granada-navy))]" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{useCase.title}</h4>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-[hsl(var(--granada-gold))] to-[hsl(var(--granada-gold-light))] rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Herramientas Enterprise sin Costo Enterprise
              </h3>
              <p className="text-foreground/80 mb-6">
                Como administrador independiente, usted necesita la misma tecnología que las grandes inmobiliarias pero sin los costos prohibitivos. Granada Platform democratiza el acceso a herramientas profesionales.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {differentiators.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-navy))] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-[hsl(var(--granada-navy))] mb-2">90%</div>
                    <p className="text-muted-foreground">Reducción en tiempo dedicado a tareas administrativas</p>
                  </div>
                  <div className="border-t pt-6">
                    <div className="text-3xl font-bold text-[hsl(var(--granada-navy))] mb-2">10 min/mes</div>
                    <p className="text-muted-foreground">Es todo el tiempo que necesita por propiedad administrada</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-center mb-4">
            Módulos Diseñados para Property Managers
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Cada funcionalidad pensada para facilitar su trabajo diario y profesionalizar su servicio
          </p>
          <PropertyManagementModules audience="property-managers" />
        </div>

        {/* Testimonial (Optional) */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-border/50 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--granada-navy))] flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-lg italic text-muted-foreground mb-4">
                "Granada Platform transformó mi negocio. Antes dedicaba 20 horas semanales a tareas administrativas. Ahora la plataforma hace todo automáticamente y yo me enfoco en conseguir más clientes."
              </p>
              <div>
                <p className="font-semibold">María González</p>
                <p className="text-sm text-muted-foreground">Property Manager Independiente • 15 propiedades gestionadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[hsl(var(--granada-navy))]/5 to-[hsl(var(--granada-navy))]/10 border-[hsl(var(--granada-navy))]/20">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">
                Comience a Profesionalizar su Servicio Hoy
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                14 días de prueba gratuita. Sin tarjeta de crédito. Cancele cuando quiera.
              </p>
              <Button 
                size="lg"
                className="bg-[hsl(var(--granada-navy))] hover:bg-[hsl(var(--granada-navy-dark))] text-white"
                onClick={() => navigate('/pms/subscribe?plan=basic')}
              >
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
