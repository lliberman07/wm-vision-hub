import React from "react";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  FileText, 
  Shield, 
  BarChart3,
  Target,
  Building,
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import consultingHeroBackground from "@/assets/consulting-strategy-hero.jpg";

const Consulting = () => {
  const services = [
    {
      icon: FileText,
      title: "Estudios de Factibilidad",
      description: "Evaluamos viabilidad financiera, técnica y legal de proyectos inmobiliarios para determinar riesgos y potenciales retornos."
    },
    {
      icon: TrendingUp,
      title: "Planificación Estratégica",
      description: "Diseñamos planes personalizados para maximizar rentabilidad de portafolios, considerando horizontes de inversión y objetivos del cliente."
    },
    {
      icon: Shield,
      title: "Cumplimiento Legal",
      description: "Brindamos asesoramiento sobre normativas locales e internacionales, regulaciones de zonificación, contratos y obligaciones fiscales."
    },
    {
      icon: BarChart3,
      title: "Investigación de Mercado",
      description: "Realizamos análisis de tendencias, comportamiento de la demanda y proyecciones que permiten anticiparse a oportunidades o amenazas."
    }
  ];

  const targetAudience = [
    "Inversores que desean diversificar o expandir su portafolio inmobiliario.",
    "Empresas que necesitan optimizar el uso de sus activos inmobiliarios.",
    "Desarrolladores que requieren estudios de factibilidad previos a un proyecto.",
    "Propietarios que evalúan estrategias de venta, alquiler o reconversión de inmuebles."
  ];

  const process = [
    {
      step: "01",
      title: "Diagnóstico Inicial",
      description: "Relevamos sus objetivos, situación actual y expectativas."
    },
    {
      step: "02",
      title: "Análisis Profundo",
      description: "Estudiamos viabilidad, riesgos y alternativas de mercado."
    },
    {
      step: "03",
      title: "Diseño de Estrategia",
      description: "Presentamos un plan con escenarios comparativos y recomendaciones."
    },
    {
      step: "04",
      title: "Implementación y Seguimiento",
      description: "Acompañamos la ejecución y realizamos ajustes estratégicos según evolución del mercado."
    }
  ];

  const differentialValues = [
    "Enfoque consultivo y a medida.",
    "Equipo interdisciplinario (abogados, economistas, brokers, urbanistas).",
    "Reportes claros y herramientas de simulación de escenarios.",
    "Visión integral: corto, mediano y largo plazo."
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-white section-padding bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url(${consultingHeroBackground})`
        }}
      >
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Consultoría Estratégica Inmobiliaria
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
              Le ofrecemos perspectivas estratégicas y orientación experta para navegar decisiones inmobiliarias complejas, optimizar portafolios y detectar nuevas oportunidades de inversión. Nuestro objetivo es ayudarle a tomar decisiones informadas que generen valor sostenible en el tiempo.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Nuestros Servicios de Consultoría
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card-elevated group hover:card-hover transition-all duration-300">
                <div className="p-8">
                  <service.icon className="h-12 w-12 text-primary mb-6" />
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="section-padding">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            ¿A quién está dirigida esta consultoría?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {targetAudience.map((audience, index) => (
              <div key={index} className="flex items-start space-x-4">
                <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {audience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Proceso de Consultoría
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differential Value Section */}
      <section className="section-padding">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Valor Diferencial
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {differentialValues.map((value, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Transforme su visión inmobiliaria en una estrategia rentable y sostenible.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button 
              asChild 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-3"
            >
              <Link to="/contact" className="flex items-center gap-2">
                Solicitar Consultoría Estratégica Inmobiliaria
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default Consulting;