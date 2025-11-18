import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { PropertyLifecycleStory } from "@/components/granada/PropertyLifecycleStory";
import { RoleViewsSection } from "@/components/granada/RoleViewsSection";
import { FinalCTASection } from "@/components/granada/FinalCTASection";
import {
  CheckCircle2,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function GranadaHome() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      {/* BLOQUE 1 - Hero Holístico */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent hover:bg-accent/90 text-lg px-4 py-2" variant="secondary">
              Property Management System
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary-foreground">
              La forma simple de administrar propiedades complejas
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-primary-foreground/90 leading-relaxed">
              Granada es un Property Management System que conecta Propietarios, Propiedades, Inquilinos, 
              Contratos, Pagos y Proveedores en una sola plataforma, para que la gestión sea predecible, 
              trazable y sin dolores de cabeza.
            </p>

            {/* 3 Bullets con íconos */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: CheckCircle2,
                  title: "Todo el ciclo de alquiler en un solo lugar",
                  description: "Desde la captación y publicación hasta la renovación del contrato o la salida del inquilino",
                },
                {
                  icon: Shield,
                  title: "Transparencia para propietarios e inquilinos",
                  description: "Cada pago, gasto y evento queda registrado y disponible en su propio portal",
                },
                {
                  icon: TrendingUp,
                  title: "Herramienta para Inmobiliarias y Property Managers",
                  description: "Pensado para que puedas escalar tu cartera de propiedades sin perder el control",
                },
              ].map((item, index) => (
                <div key={index} className="bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 rounded-lg p-6 text-left hover:bg-primary-foreground/15 transition-all">
                  <item.icon className="h-10 w-10 text-accent mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-primary-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-primary-foreground/80">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Doble CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/granada-platform/inmobiliarias-admin">
                  Soy Inmobiliaria / Admin y quiero ver Granada
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                asChild
              >
                <Link to="/granada-platform/propietarios">
                  Soy Propietario y quiero saber cómo funciona
                </Link>
              </Button>
            </div>

            {/* Tagline */}
            <p className="text-sm text-primary-foreground/70">
              Granada Platform · Property Management System para alquileres anuales, temporarios y mixtos
            </p>
          </div>
        </div>
      </section>

      {/* BLOQUE 2 - Storytelling del Ciclo de Vida */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Del aviso al contrato renovado, en una sola plataforma
            </h2>
            <p className="text-xl text-muted-foreground">
              Granada ordena la relación entre Propietario, Propiedad, Inquilino, Contrato, Firmas, Pagos, 
              Cobros, Renovaciones y Proveedores. Un flujo claro, sin depender de 20 Excels y 15 grupos de WhatsApp.
            </p>
          </div>

          {/* 7 Pasos del ciclo de vida */}
          <PropertyLifecycleStory />

          {/* Sub-sección: Una vista para cada rol */}
          <RoleViewsSection />
        </div>
      </section>

      {/* BLOQUE 3 - CTA Final */}
      <FinalCTASection />

      <GranadaFooter />
    </div>
  );
}
