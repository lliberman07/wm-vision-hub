import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Building2, 
  Calendar, 
  FileText, 
  Users, 
  Calculator, 
  DollarSign,
  User,
  CheckCircle,
  ArrowRight,
  Shield,
  BarChart3
} from "lucide-react";

const PropertyManagement = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Building2,
      title: "Administración de Propiedades en Alquiler",
      items: [
        "Control de disponibilidad y agenda por propiedad",
        "Actualización automática de tarifas",
        "Gestión de propiedades con múltiples propietarios",
        "Agrupación de propiedades por beneficiario",
        "Integración con portales de alquileres"
      ]
    },
    {
      icon: FileText,
      title: "Contratos",
      items: [
        "Creación y administración de contratos",
        "Alertas de vencimiento",
        "Seguimiento histórico por propiedad",
        "Gestión documental digitalizada"
      ]
    },
    {
      icon: Users,
      title: "CRM Inmobiliario",
      items: [
        "Registro y seguimiento de prospectos",
        "Automatización de comunicación",
        "Gestión de oportunidades"
      ]
    },
    {
      icon: Calculator,
      title: "Administración de Servicios y Gastos",
      items: [
        "Control de facturas de proveedores",
        "Administración de gastos comunes",
        "Reportes de ingresos y egresos",
        "Cálculo automático de rentabilidad"
      ]
    },
    {
      icon: DollarSign,
      title: "Finanzas y Contabilidad",
      items: [
        "Reportes contables consolidados",
        "Gestión multimoneda",
        "Estados financieros segmentados"
      ]
    },
    {
      icon: Shield,
      title: "Portal de Autogestión",
      items: [
        "Propietarios: reportes financieros y contratos",
        "Inquilinos: consulta de pagos y vencimientos",
        "Proveedores: carga y seguimiento de facturas"
      ]
    }
  ];

  const benefits = [
    "Optimización de procesos administrativos y financieros",
    "Transparencia en la relación entre propietarios, inquilinos y proveedores",
    "Reducción de errores y tiempos en la gestión",
    "Información consolidada en tiempo real",
    "Escalabilidad: desde una propiedad hasta portafolios completos"
  ];

  const serviceModalities = [
    {
      title: "Básico",
      description: "Funcionalidades esenciales para pequeñas administraciones"
    },
    {
      title: "Intermedio",
      description: "Gestión ampliada con reportes financieros y administración de servicios"
    },
    {
      title: "Full",
      description: "Incluye todas las capacidades, con portal de autogestión y gestión avanzada multimoneda"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Servicios Profesionales
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Property Management
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            Gestión integral, eficiente y escalable de inmuebles
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Introducción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                Nuestro servicio de Property Management está diseñado para que la gestión de inmuebles sea integral, 
                eficiente y escalable, centralizando en una única plataforma todos los procesos vinculados a propiedades 
                en alquiler, contratos, finanzas y servicios. La solución permite que propietarios, inquilinos y 
                proveedores interactúen de manera transparente, con información consolidada y accesible en tiempo real.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Funcionalidades Principales</h2>
            <p className="text-lg text-muted-foreground">
              Herramientas completas para la gestión inmobiliaria moderna
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-medium h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Beneficios del Servicio</h2>
          </div>
          
          <Card className="shadow-medium">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Service Modalities */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Modalidades de Servicio</h2>
            <p className="text-lg text-muted-foreground">
              El sistema puede adaptarse a distintos niveles de necesidad
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {serviceModalities.map((modality, index) => (
              <Card key={index} className="shadow-medium text-center">
                <CardHeader>
                  <CardTitle className="text-xl">{modality.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{modality.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-strong bg-gradient-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">
                Transforme la Administración de sus Propiedades
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                Descubra cómo nuestro servicio de Property Management puede transformar la administración 
                de sus propiedades y maximizar su rentabilidad. Contáctenos para una demostración personalizada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/contact">
                    Contactar para Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/financing/simulator">Simular Inversión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PropertyManagement;