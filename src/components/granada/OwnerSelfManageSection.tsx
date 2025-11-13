import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyManagementModules } from "./PropertyManagementModules";
import { Clock, DollarSign, Smartphone, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function OwnerSelfManageSection() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Clock,
      title: "Más Tiempo Libre",
      description: "Automatice cobros, recordatorios y reportes. Dedique solo 10 minutos al mes por propiedad."
    },
    {
      icon: Shield,
      title: "Control Total",
      description: "Usted toma todas las decisiones, pero con información clara y organizada al instante."
    },
    {
      icon: DollarSign,
      title: "Ahorro en Comisiones",
      description: "Sin intermediarios. Gestione directamente y ahorre hasta un 30% en honorarios de administración."
    },
    {
      icon: Smartphone,
      title: "Interfaz Intuitiva",
      description: "Diseñado para ser usado por cualquier persona, sin conocimientos técnicos ni curva de aprendizaje."
    }
  ];

  const timeStats = [
    {
      before: "5-10 hrs/mes",
      after: "10 min/mes",
      task: "Gestión administrativa"
    },
    {
      before: "2-3 hrs",
      after: "2 min",
      task: "Envío de liquidaciones"
    },
    {
      before: "1 hr",
      after: "0 min",
      task: "Recordatorios de pago"
    }
  ];

  const features = [
    "Acceso móvil: gestione desde cualquier lugar",
    "Notificaciones inteligentes: solo cuando necesita actuar",
    "Archivo digital: todos sus documentos seguros en la nube",
    "Sin contratos de permanencia",
    "Soporte incluido vía WhatsApp",
    "Actualizaciones automáticas"
  ];

  return (
    <section id="propietarios-autogestion" className="py-20 px-4 bg-gradient-to-b from-background to-[hsl(var(--granada-gold))]/5">
      <div className="container mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-[hsl(var(--granada-gold))]/10 rounded-full">
            <span className="text-[hsl(var(--granada-gold-light))] font-semibold">Para Propietarios que Autogestionan</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Gestione sus Alquileres sin Estrés
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Una plataforma intuitiva que le permite administrar sus propiedades como un profesional, sin necesidad de contratar a nadie. Más control, menos tiempo invertido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-[hsl(var(--granada-gold))] hover:bg-[hsl(var(--granada-gold-light))] text-white"
              onClick={() => navigate('/contact')}
            >
              Contactar para Empezar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Badge variant="outline" className="text-base py-2 px-4">
              Sin tarjeta • Cancele cuando quiera
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
                  <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--granada-gold))] to-[hsl(var(--granada-gold-light))] flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Time Savings Comparison */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-4">
            Recupere su Tiempo Valioso
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Vea cuánto tiempo puede ahorrar automatizando la gestión de sus propiedades
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {timeStats.map((stat, index) => (
              <Card key={index} className="border-[hsl(var(--granada-gold))]/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{stat.task}</p>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div>
                      <div className="text-2xl font-bold text-destructive line-through">{stat.before}</div>
                      <div className="text-xs text-muted-foreground">Antes</div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-[hsl(var(--granada-gold))]" />
                    <div>
                      <div className="text-2xl font-bold text-[hsl(var(--granada-gold))]">{stat.after}</div>
                      <div className="text-xs text-muted-foreground">Con Granada</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-[hsl(var(--granada-navy))] to-[hsl(var(--granada-navy-dark))] rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                La Plataforma Trabaja por Usted
              </h3>
              <p className="text-white/90 mb-6">
                No más perseguir inquilinos por WhatsApp ni hojas de Excel desorganizadas. Granada Platform automatiza todo el proceso mientras usted mantiene el control total.
              </p>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--granada-gold))] mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-center mb-6 pb-6 border-b">
                    <div className="text-5xl font-bold text-[hsl(var(--granada-gold))] mb-2">30%</div>
                    <p className="text-muted-foreground">Ahorro promedio en honorarios de administración</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--granada-gold))] mb-2">$45.000</div>
                    <p className="text-sm text-muted-foreground">Ahorro anual en una propiedad de $150.000/mes de alquiler</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-center mb-4">
            Herramientas Simples pero Poderosas
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Todo lo que necesita para administrar sus propiedades, sin complicaciones ni funciones innecesarias
          </p>
          <PropertyManagementModules audience="self-manage" />
        </div>

        {/* Social Proof */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-border/50">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">4.8/5</div>
              <p className="text-sm text-muted-foreground">Calificación promedio de usuarios</p>
            </CardContent>
          </Card>
          <Card className="text-center border-border/50">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">500+</div>
              <p className="text-sm text-muted-foreground">Propietarios confían en Granada</p>
            </CardContent>
          </Card>
          <Card className="text-center border-border/50">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-[hsl(var(--granada-gold))] mb-2">95%</div>
              <p className="text-sm text-muted-foreground">Renovación después del trial</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[hsl(var(--granada-gold))]/10 to-[hsl(var(--granada-gold))]/5 border-[hsl(var(--granada-gold))]/30">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">
                Recupere su Tiempo, Ahorre Dinero
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Pruebe Granada Platform gratis durante 14 días. Configure sus propiedades en minutos y empiece a ahorrar tiempo hoy mismo.
              </p>
              <Button 
                size="lg"
                className="bg-[hsl(var(--granada-gold))] hover:bg-[hsl(var(--granada-gold-light))] text-white"
                onClick={() => navigate('/contact')}
              >
                Contactar para Empezar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Sin tarjeta de crédito • Sin contratos • Cancele cuando quiera
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
