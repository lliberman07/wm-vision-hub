import React from 'react';
import { Building2, TrendingUp, Users, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import developmentHeroBackground from "@/assets/real-estate-development-hero.jpg";

const RealEstateDevelopment = () => {
  const services = [
    {
      icon: TrendingUp,
      title: "Preventa y Comercialización en Pozo",
      description: "Estrategias de marketing y ventas desde la etapa inicial para generar liquidez anticipada y confianza en los inversores."
    },
    {
      icon: Building2,
      title: "Comercialización en Fases",
      description: "Acompañamos la venta en distintas etapas (en construcción, unidades terminadas) maximizando el valor de cada fase del proyecto."
    },
    {
      icon: Users,
      title: "Conexión Estratégica de Actores",
      description: "Facilitamos la vinculación entre desarrolladores, constructoras, financiadores e inversores institucionales."
    },
    {
      icon: FileText,
      title: "Estructuración Financiera y Apoyo en Inversión",
      description: "Asesoramos en esquemas de financiamiento, rondas de inversión y búsqueda de socios estratégicos."
    }
  ];

  const targetAudience = [
    "Desarrolladores inmobiliarios que buscan partners estratégicos para comercializar sus proyectos.",
    "Inversores interesados en participar en etapas tempranas (preventa en pozo o durante obra).",
    "Empresas constructoras que desean integrarse a proyectos ya estructurados.",
    "Desarrollistas que necesitan apoyo para conectar con constructoras o financistas confiables."
  ];

  const process = [
    {
      step: "1",
      title: "Evaluación del Proyecto",
      description: "Analizamos factibilidad, objetivos y modelo de negocio."
    },
    {
      step: "2",
      title: "Diseño de Estrategia Comercial y de Partners",
      description: "Definimos el mix de preventa, marketing y vínculos estratégicos."
    },
    {
      step: "3",
      title: "Ejecución Comercial y Gestión de Fases",
      description: "Activamos las estrategias de comercialización y acompañamos cada etapa."
    },
    {
      step: "4",
      title: "Cierre y Postventa",
      description: "Aseguramos entrega, documentación y satisfacción de inversores y clientes finales."
    }
  ];

  const differentialValues = [
    "Capacidad de activar ventas en pozo y construcción con estrategias probadas.",
    "Red de contactos con constructoras, bancos, inversores y brokers.",
    "Visión integral: financiera, legal y comercial.",
    "Modelo flexible: nos adaptamos a distintos tipos de desarrollos (residencial, comercial, mixto)."
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section 
          className="relative text-white section-padding bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{
            backgroundImage: `url(${developmentHeroBackground})`
          }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                Desarrollo Inmobiliario
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Desarrollo Inmobiliario con Enfoque Integral
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                De la visión a la realidad, acompañamos a desarrolladores inmobiliarios en todas las fases de su proyecto. 
                Nos enfocamos en potenciar la comercialización, la preventa y la conexión entre actores clave del mercado, 
                asegurando que cada etapa genere valor y liquidez.
              </p>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Card key={index} className="border border-border hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <service.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3 text-foreground">
                          {service.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              ¿A quién está dirigida nuestra propuesta?
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {targetAudience.map((audience, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground leading-relaxed">{audience}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              Proceso de Trabajo
            </h2>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {process.map((step, index) => (
                  <Card key={index} className="border border-border">
                    <CardContent className="p-6 text-center">
                      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                        {step.step}
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Differential Value Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
              Valor Diferencial
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {differentialValues.map((value, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <ArrowRight className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              "Convierta su proyecto inmobiliario en una realidad rentable y sostenible con un partner estratégico."
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Comience hoy mismo su proyecto de desarrollo inmobiliario con nuestro acompañamiento integral.
            </p>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Contactar sobre Desarrollo Inmobiliario
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default RealEstateDevelopment;