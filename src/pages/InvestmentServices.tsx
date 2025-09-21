import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import realEstatePortfolioHero from "@/assets/real-estate-portfolio-hero.jpg";
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Building,
  DollarSign,
  Users,
  ArrowRight
} from "lucide-react";

const InvestmentServices = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: BarChart3,
      title: "Gestión de Portafolio",
      description: "Administración integral de inversiones en proyectos inmobiliarios diversificados."
    },
    {
      icon: TrendingUp,
      title: "Estrategia de Inversión",
      description: "Definición de planes personalizados según horizonte de inversión, perfil de riesgo y objetivos de rentabilidad."
    },
    {
      icon: Shield,
      title: "Evaluación de Riesgo",
      description: "Análisis de cada oportunidad de inversión, asegurando transparencia y mitigación de riesgos."
    },
    {
      icon: FileText,
      title: "Monitoreo de Rendimiento",
      description: "Reportes periódicos con métricas de desempeño, proyecciones y ajustes estratégicos."
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Seguridad Jurídica",
      description: "respaldo en estructuras legales reguladas."
    },
    {
      icon: TrendingUp,
      title: "Diversificación",
      description: "acceso a portafolios inmobiliarios variados."
    },
    {
      icon: DollarSign,
      title: "Accesibilidad",
      description: "posibilidad de participar con distintos niveles de capital."
    },
    {
      icon: FileText,
      title: "Transparencia",
      description: "reportes claros, seguimiento y comunicación continua."
    },
    {
      icon: Building,
      title: "Rentabilidad Sostenida",
      description: "retornos generados por activos reales y de alta demanda."
    }
  ];

  const trustTypes = [
    {
      title: "Fideicomisos de Desarrollo",
      description: "Participación en proyectos desde la etapa inicial para obtener mayores retornos en fases tempranas."
    },
    {
      title: "Fideicomisos de Renta",
      description: "Inversiones en propiedades destinadas a generar ingresos constantes por alquiler."
    },
    {
      title: "Fideicomisos Mixtos",
      description: "Combina desarrollo y renta, equilibrando riesgo y liquidez."
    }
  ];

  const process = [
    {
      step: "1",
      title: "Análisis Inicial",
      description: "Relevamos perfil y objetivos del inversor."
    },
    {
      step: "2", 
      title: "Selección de Oportunidades",
      description: "Presentamos proyectos disponibles según su estrategia."
    },
    {
      step: "3",
      title: "Constitución de la Inversión",
      description: "Formalización legal y estructuración de participación."
    },
    {
      step: "4",
      title: "Seguimiento y Reportes",
      description: "Informes periódicos sobre desempeño y avances."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9)), url(${realEstatePortfolioHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            <Shield className="w-4 h-4 mr-2" />
            Servicios de Inversión
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Servicios de Fideicomiso e Inversión
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
            Ofrecemos marcos de inversión confiables y transparentes a través de fideicomisos inmobiliarios, 
            diseñados para proporcionar retornos consistentes mientras se minimiza el riesgo. Nuestras estructuras 
            permiten que tanto inversores individuales como corporativos participen en proyectos sólidos con respaldo 
            legal y gestión profesional.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Nuestros Servicios</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center shadow-medium hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <service.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">¿Por qué Invertir en Fideicomisos Inmobiliarios?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}:</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Types Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tipos de Fideicomisos que ofrecemos</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {trustTypes.map((type, index) => (
              <Card key={index} className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Nuestro Proceso</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary-foreground">{step.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-primary rounded-2xl p-12 text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">Llamado a la Acción</h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              "Descubra cómo invertir de manera segura, diversificada y con respaldo legal."
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">
                Explorar Opciones de Inversión
                <ArrowRight className="ml-2 h-4 w-4" />
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

export default InvestmentServices;