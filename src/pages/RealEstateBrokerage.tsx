import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import realEstateScreenOnly from "@/assets/real-estate-screen-only.jpg";
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  FileText,
  Search,
  Handshake,
  BarChart3,
  Users,
  Clock,
  PhoneCall
} from "lucide-react";

const RealEstateBrokerage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-white section-padding bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `url(${realEstateScreenOnly})`
        }}
      >
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="container mx-auto max-w-7xl relative z-10 container-padding">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge variant="secondary" className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-400/30 backdrop-blur-sm">
              Servicios de Gestión Inmobiliaria
            </Badge>
            <h1 className="h1 mb-8 text-white">
              Gestión Integral de Propiedades
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Conectamos compradores, vendedores e inquilinos con precisión, transparencia y un conocimiento profundo del mercado. Nuestro objetivo es que cada operación inmobiliaria sea una experiencia segura, rentable y sin contratiempos.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestros Servicios */}
      <section className="section-padding bg-gradient-surface">
        <div className="container mx-auto max-w-7xl container-padding">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="h2 mb-6">
              Nuestros Servicios
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Compra y Venta de Propiedades</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Lo acompañamos en todo el proceso, desde la valuación hasta la firma de la escritura, asegurando operaciones claras y eficientes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Alquiler y Administración de Inmuebles</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Nos ocupamos de la gestión completa: contratos, cobros, renovaciones y atención al inquilino, para que usted solo disfrute de la renta.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Análisis de Mercado</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Elaboramos estudios comparativos de precios, proyecciones de rentabilidad y tendencias para optimizar su inversión.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Negociaciones Expertas</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Representamos sus intereses para alcanzar las mejores condiciones comerciales en cada acuerdo.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Gestión de Transacciones</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Coordinamos todos los aspectos legales, financieros y operativos de la operación con profesionales especializados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Verificación de Antecedentes</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Revisamos documentación del inmueble e historial de inquilinos o compradores para minimizar riesgos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ¿Por qué elegirnos? */}
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-7xl container-padding">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <h2 className="h2">¿Por qué elegirnos?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">Transparencia en cada etapa del proceso.</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">Amplia red de contactos con escribanos, bancos, aseguradoras y brokers.</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">Conocimiento profundo del mercado local e internacional.</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">Soluciones adaptadas a personas físicas y jurídicas.</p>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="card-glass p-8 rounded-xl">
                <h3 className="text-xl font-semibold mb-6 text-primary">Casos en los que podemos ayudarle</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm italic">"Soy propietario y necesito alquilar mi departamento con administración confiable."</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm italic">"Busco comprar una propiedad como inversión y comparar rentabilidades."</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm italic">"Necesito vender rápido y quiero asegurarme de que toda la documentación esté en regla."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Proceso */}
      <section className="section-padding bg-gradient-surface">
        <div className="container mx-auto max-w-7xl container-padding">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="h2 mb-6">
              Nuestro Proceso
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="card-elevated text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PhoneCall className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Consulta Inicial</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Relevamos sus necesidades y objetivos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">2. Análisis y Presentación</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Mostramos alternativas con datos de mercado reales.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Handshake className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Negociación y Validación</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Acompañamos la parte legal, financiera y contractual.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">4. Cierre y Seguimiento</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Finalizamos la operación y brindamos soporte post-transacción.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center container-padding animate-fade-in">
          <h2 className="h2 mb-6">Comience Hoy</h2>
          <p className="text-xl mb-8 opacity-90">
            Dé el primer paso hacia una gestión inmobiliaria confiable y rentable.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
            <Link to="/contact">
              Solicitar Asesoramiento Inmobiliario
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default RealEstateBrokerage;