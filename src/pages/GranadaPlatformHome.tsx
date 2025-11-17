import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Lock,
  TrendingUp,
  Users,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
} from "lucide-react";
import granadaLogo from "@/assets/granada-logo-new.jpg";

import PricingComparator from "@/components/granada/PricingComparator";
import FeatureShowcase from "@/components/granada/FeatureShowcase";
import { FeaturedPartnersSection } from "@/components/granada/FeaturedPartnersSection";
import ProviderRegistrationForm from "@/components/granada/ProviderRegistrationForm";
import FAQAccordion from "@/components/granada/FAQAccordion";
import StatsCounter from "@/components/granada/StatsCounter";
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function GranadaPlatformHome() {
  const { toast } = useToast();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  const handleDemoRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "¡Solicitud Enviada!",
      description: "Nos pondremos en contacto contigo dentro de las próximas 24 horas.",
    });
    setDemoDialogOpen(false);
  };

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />

      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent hover:bg-accent/90" variant="secondary">Tecnología Cloud de Nueva Generación</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary-foreground">La Plataforma de Gestión Inmobiliaria que Revoluciona el Sector</h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">Tecnología inteligente para inmobiliarias, administradores independientes y propietarios</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
                <DialogTrigger asChild><Button size="lg" className="text-lg px-8">Solicitar Demo Gratuita</Button></DialogTrigger>
              </Dialog>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" asChild>
                <a href="#planes">Ver Planes y Precios</a>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Shield, text: "99.9% Uptime" },
                { icon: Zap, text: "Reportes Automáticos" },
                { icon: Globe, text: "Multi-moneda" },
                { icon: Lock, text: "Seguridad Bancaria" },
              ].map((badge, index) => (
                <Card 
                  key={index} 
                  className="bg-primary-foreground/10 backdrop-blur border-primary-foreground/20 transition-all duration-300 hover:bg-primary-foreground/20 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-1 group animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4 flex items-center gap-2 justify-center">
                    <badge.icon className="h-5 w-5 text-accent transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                    <span className="text-sm font-semibold text-primary-foreground group-hover:text-accent transition-colors duration-300">{badge.text}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section className="py-20 px-4 bg-background">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">¿Quién es Granada Platform?</h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>Somos la solución tecnológica que los profesionales del real estate necesitan. Granada Platform nació de la experiencia real en administración de propiedades.</p>
            <p>Construida con tecnología de vanguardia, nuestra plataforma escala desde pequeños administradores independientes hasta grandes corporaciones inmobiliarias.</p>
          </div>
        </div>
      </section>

      <section id="inmobiliarias" className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">Para Profesionales</Badge>
            <h2 className="text-4xl font-bold mb-4 text-foreground">Herramientas Profesionales para Gestión Inmobiliaria de Alto Nivel</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Granada Platform es la columna vertebral tecnológica de inmobiliarias exitosas.</p>
          </div>
          <FeatureShowcase />
          
          {/* Escalabilidad Garantizada - Centered Card */}
          <div className="mt-12 flex justify-center">
            <Card className="max-w-2xl w-full bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 flex items-start gap-6">
                <div className="shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Escalabilidad Garantizada
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    De 10 a 10,000+ propiedades. Performance consistente e infraestructura cloud elástica.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Featured Partners for Real Estate Agencies */}
          <FeaturedPartnersSection 
            type="real_estate_agency"
            title="Inmobiliarias que confían en Granada Platform"
            description="Profesionales destacados que ya están revolucionando su gestión"
          />
          
          <div className="mt-12 text-center">
            <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
              <DialogTrigger asChild><Button size="lg">Agenda una Demo Personalizada</Button></DialogTrigger>
            </Dialog>
          </div>
        </div>
      </section>

      <section id="propietarios" className="py-20 px-4 bg-secondary/5">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">Para Propietarios</Badge>
            <h2 className="text-4xl font-bold mb-4 text-foreground">Confíe en Profesionales que Usan Tecnología de Punta</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Transparencia total, reportes mensuales automáticos y acceso 24/7.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Smartphone, title: "Acceso en Línea 24/7", description: "Portal web personalizado" },
              { icon: Mail, title: "Reportes Mensuales Automáticos", description: "Desglose completo por email" },
              { icon: CheckCircle2, title: "Transparencia Financiera", description: "Cada peso justificado" },
              { icon: Shield, title: "Notificaciones Proactivas", description: "Confirmación de pagos" },
              { icon: Lock, title: "Seguridad y Respaldo", description: "Datos encriptados" },
              { icon: TrendingUp, title: "Visibilidad Total", description: "Acceso desde cualquier dispositivo" },
            ].map((benefit, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Featured Partners for Independent Managers */}
          <FeaturedPartnersSection
            type="independent_manager"
            title="Administradores Independientes Certificados"
            description="Profesionales verificados que utilizan Granada Platform para ofrecer el mejor servicio"
          />
        </div>
      </section>

      <section id="planes"><PricingComparator /></section>

      <section id="proveedores" className="py-20 px-4 bg-gradient-to-b from-muted/20 to-background">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">Red de Proveedores</Badge>
            <h2 className="text-4xl font-bold mb-4 text-foreground">Únete a Nuestra Red de Proveedores de Confianza</h2>
          </div>
          <Card>
            <CardContent className="p-8">
              <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                <DialogTrigger asChild><Button size="lg" className="w-full">Registrarse como Proveedor</Button></DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registro de Proveedor de Servicios</DialogTitle>
                    <DialogDescription>Completa el formulario para unirte a nuestra red</DialogDescription>
                  </DialogHeader>
                  <ProviderRegistrationForm />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4 bg-secondary/5">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">Tecnología</Badge>
            <h2 className="text-4xl font-bold mb-4 text-foreground">Tecnología de Vanguardia</h2>
          </div>
          <div className="mb-12">
            <StatsCounter stats={[
              { value: 99.9, suffix: "%", label: "Uptime Garantizado" },
              { value: 2, suffix: "s", label: "Tiempo de Respuesta" },
              { value: 256, prefix: "AES-", label: "Encriptación" },
              { value: 24, suffix: "/7", label: "Disponibilidad" },
            ]} />
          </div>
        </div>
      </section>

      <FAQAccordion />

      <section className="py-20 px-4 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Transformá tu Gestión Inmobiliaria Hoy</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
              <DialogTrigger asChild><Button size="lg" className="text-lg px-8 bg-background text-foreground hover:bg-background/90">Solicitar Demo</Button></DialogTrigger>
            </Dialog>
          </div>
        </div>
      </section>

      <GranadaFooter />
    </div>
  );
}
