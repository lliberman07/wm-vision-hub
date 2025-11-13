import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyManagementModules } from "./PropertyManagementModules";
import { Palmtree, BarChart3, Shield, FileCheck, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function OwnerDelegateSection() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Palmtree,
      title: "Inversión Pasiva Real",
      description: "Reciba su liquidación mensual sin mover un dedo. Verdadera inversión pasiva en real estate."
    },
    {
      icon: Shield,
      title: "Transparencia Garantizada",
      description: "Acceso 24/7 a toda la información de su propiedad. Vea movimientos, contratos y documentos cuando quiera."
    },
    {
      icon: BarChart3,
      title: "Análisis Profesional",
      description: "Reportes detallados para evaluar el rendimiento de su inversión con métricas financieras reales."
    },
    {
      icon: FileCheck,
      title: "Administradores Certificados",
      description: "Red de inmobiliarias y administradores verificados con garantía de gestión profesional."
    }
  ];

  const whatYouGet = [
    {
      icon: BarChart3,
      title: "Reportes Mensuales Automáticos",
      description: "Estado financiero completo de su propiedad: ingresos, gastos, rentabilidad y proyecciones."
    },
    {
      icon: Shield,
      title: "Portal Exclusivo",
      description: "Acceda cuando quiera a ver movimientos, contratos, documentos y el estado de su inversión."
    },
    {
      icon: CheckCircle,
      title: "Gestión Integral",
      description: "Cobros, mantenimiento, renovaciones - todo incluido. Usted solo ve los resultados."
    },
    {
      icon: FileCheck,
      title: "Soporte Legal",
      description: "Contratos profesionales y respaldo ante conflictos. Proteja su patrimonio."
    },
    {
      icon: TrendingUp,
      title: "Análisis de Inversión",
      description: "ROI, rentabilidad, proyecciones y comparativas para optimizar su cartera inmobiliaria."
    },
    {
      icon: Palmtree,
      title: "Tranquilidad Total",
      description: "Invierta en real estate sin el estrés de administrar. Disfrute de su tiempo libre."
    }
  ];

  const comparison = [
    {
      aspect: "Tiempo dedicado",
      autoAdmin: "5-10 hrs/mes",
      withGranada: "0 hrs/mes"
    },
    {
      aspect: "Reportes",
      autoAdmin: "Manual",
      withGranada: "Automáticos"
    },
    {
      aspect: "Seguimiento legal",
      autoAdmin: "Responsabilidad propia",
      withGranada: "Incluido"
    },
    {
      aspect: "Optimización fiscal",
      autoAdmin: "Limitada",
      withGranada: "Profesional"
    },
    {
      aspect: "Gestión de conflictos",
      autoAdmin: "Directa",
      withGranada: "Mediada y respaldada"
    }
  ];

  return (
    <section id="propietarios-delegacion" className="py-20 px-4 bg-gradient-to-b from-[hsl(var(--granada-cream))] to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-[hsl(var(--granada-gray))]/10 rounded-full">
            <span className="text-[hsl(var(--granada-gray))] font-semibold">Para Propietarios que Buscan Administración Profesional</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Invierta Tranquilo. Nosotros nos Encargamos de Todo.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Conectamos propietarios con inmobiliarias y administradores profesionales certificados. Usted solo recibe reportes mensuales y disfruta de su inversión.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[hsl(var(--granada-red))] hover:bg-[hsl(var(--granada-red-dark))] text-white"
              onClick={() => navigate('/contact')}
            >
              Encontrar Administrador
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Cómo Funciona
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
                  <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--granada-gray))] to-[hsl(var(--granada-navy))] flex items-center justify-center">
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
        <div className="bg-gradient-to-r from-[hsl(var(--granada-red))] to-[hsl(var(--granada-red-dark))] rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Verdadera Inversión Pasiva en Real Estate
            </h3>
            <p className="text-white/90 max-w-3xl mx-auto">
              Comprar una propiedad para alquilar debería ser una inversión pasiva. Pero la realidad es que termina siendo un trabajo de tiempo completo. Granada Platform lo conecta con profesionales certificados para que su inversión sea realmente pasiva.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Palmtree className="h-12 w-12 mx-auto text-[hsl(var(--granada-gold))] mb-2" />
                  <h4 className="font-semibold text-lg">Sin Administración</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>5-10 horas por mes gestionando</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Estrés por cobros y mantenimiento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Sin optimización fiscal profesional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Gestión directa de conflictos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 border-2 border-[hsl(var(--granada-gold))]">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Shield className="h-12 w-12 mx-auto text-[hsl(var(--granada-gold))] mb-2" />
                  <h4 className="font-semibold text-lg">Con Granada Platform</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-gold))] mt-0.5 flex-shrink-0" />
                    <span>0 horas - Todo delegado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-gold))] mt-0.5 flex-shrink-0" />
                    <span>Tranquilidad total y reportes claros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-gold))] mt-0.5 flex-shrink-0" />
                    <span>Análisis profesional de ROI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-gold))] mt-0.5 flex-shrink-0" />
                    <span>Administrador profesional mediando</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What You Get */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-4">
            Qué Obtiene como Propietario Inversor
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Mantenga el control de su inversión con total transparencia, pero sin el trabajo diario
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whatYouGet.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <Icon className="h-8 w-8 text-[hsl(var(--granada-red))]" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-4">
            Autogestión vs Administración Profesional
          </h3>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compare lo que implica autoadministrar versus delegar en profesionales
          </p>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">Aspecto</th>
                    <th className="text-center p-4 font-semibold">Autoadministración</th>
                    <th className="text-center p-4 font-semibold bg-[hsl(var(--granada-gold))]/10">
                      Con Granada Platform
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4 font-medium">{row.aspect}</td>
                      <td className="p-4 text-center text-muted-foreground">{row.autoAdmin}</td>
                      <td className="p-4 text-center bg-[hsl(var(--granada-gold))]/5 font-semibold text-[hsl(var(--granada-red))]">
                        {row.withGranada}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Access to Property Info */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            Portal del Propietario - Transparencia Total
          </h3>
          <PropertyManagementModules audience="delegate" />
        </div>

        {/* Network of Administrators */}
        <div className="bg-gradient-to-r from-[hsl(var(--granada-navy))] to-[hsl(var(--granada-navy-dark))] rounded-2xl p-8 md:p-12 text-white mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">
              Red de Administradores Certificados
            </h3>
            <p className="text-white/90 max-w-2xl mx-auto">
              Conectamos con inmobiliarias y administradores verificados en toda Argentina. Cada profesional en nuestra red cumple con estándares de calidad y usa Granada Platform para máxima transparencia.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">150+</div>
                <p className="text-sm text-muted-foreground">Administradores en la red</p>
              </CardContent>
            </Card>
            <Card className="border-0 text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">98%</div>
                <p className="text-sm text-muted-foreground">Satisfacción de propietarios</p>
              </CardContent>
            </Card>
            <Card className="border-0 text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">2.500+</div>
                <p className="text-sm text-muted-foreground">Propiedades gestionadas</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[hsl(var(--granada-cream))] to-white border-[hsl(var(--granada-red))]/20">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">
                ¿Listo para una Inversión Verdaderamente Pasiva?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cuéntenos sobre su propiedad y le conectaremos con los mejores administradores de su zona. Sin compromiso.
              </p>
              <Button 
                size="lg"
                className="bg-[hsl(var(--granada-red))] hover:bg-[hsl(var(--granada-red-dark))] text-white"
                onClick={() => navigate('/contact')}
              >
                Encontrar mi Administrador Ideal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Consulta gratuita • Sin compromiso • Respuesta en 24hs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
