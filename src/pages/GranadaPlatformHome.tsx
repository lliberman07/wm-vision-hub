import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  Users, 
  ArrowRight,
  CheckCircle,
  BarChart3,
  Globe,
  Lock,
  Zap
} from "lucide-react";
import granadaLogo from "@/assets/granada-logo-full.jpg";

const GranadaPlatformHome = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={granadaLogo} 
              alt="Granada Platform" 
              className="h-16 w-auto object-contain"
            />
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/pms/login">Acceso Clientes</Link>
              </Button>
              <Button asChild>
                <Link to="/granada-admin/login">Admin Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative text-foreground py-20 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="w-fit">
                SaaS Property Management
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Gestión de Propiedades en la Nube
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Granada Platform es la solución integral para empresas de gestión inmobiliaria. 
                Administra propiedades, contratos, pagos y reportes desde una única plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="group" asChild>
                  <Link to="/pms/request-access">
                    Solicitar Acceso
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pms/login">Iniciar Sesión</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <Card className="border-border/50 shadow-xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium">Multi-tenant & escalable</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium">Reportes automáticos mensuales</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium">Gestión completa de pagos</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium">Control de accesos por roles</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Características Principales</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu cartera de propiedades de forma profesional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Gestión de Propiedades</CardTitle>
                <CardDescription>
                  Administra propiedades, propietarios, inquilinos y contratos en un solo lugar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Reportes Automáticos</CardTitle>
                <CardDescription>
                  Generación automática de reportes mensuales para propietarios con toda la información financiera
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Control Financiero</CardTitle>
                <CardDescription>
                  Gestión completa de pagos, gastos, distribuciones y control de morosidad
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multi-usuario</CardTitle>
                <CardDescription>
                  Sistema de roles y permisos para todo tu equipo: administradores, staff y propietarios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multi-moneda</CardTitle>
                <CardDescription>
                  Soporte para múltiples monedas con conversión automática y tasas de cambio actualizadas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Seguridad & Privacidad</CardTitle>
                <CardDescription>
                  Aislamiento completo de datos por cliente con encriptación y backups automáticos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Uptime garantizado</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-primary">&lt;2s</div>
              <div className="text-muted-foreground">Tiempo de respuesta</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Soporte técnico</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Tecnología de Vanguardia</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Construido sobre infraestructura moderna y escalable
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Alto Rendimiento</CardTitle>
                <CardDescription>
                  Infraestructura en la nube con CDN global para máxima velocidad
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Seguridad Avanzada</CardTitle>
                <CardDescription>
                  Encriptación end-to-end y cumplimiento con estándares internacionales
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Acceso Global</CardTitle>
                <CardDescription>
                  Accede desde cualquier dispositivo, en cualquier momento y lugar
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold">
            ¿Listo para transformar tu gestión inmobiliaria?
          </h2>
          <p className="text-xl opacity-90">
            Únete a las empresas que ya confían en Granada Platform para gestionar sus propiedades
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link to="/pms/request-access">
                Solicitar Demo Gratuita
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/pms/login">Ya soy cliente</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Granada Platform. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                WM Global
              </Link>
              <Link to="/pms/request-access" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/granada-admin/login">Admin</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GranadaPlatformHome;
