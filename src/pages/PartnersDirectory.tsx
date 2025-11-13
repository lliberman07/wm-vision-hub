import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnersDirectory as PartnersDirectoryComponent } from "@/components/granada/PartnersDirectory";
import { Building2, Users, ArrowLeft, Star } from "lucide-react";
import granadaLogo from "@/assets/granada-logo-new.jpg";

export default function PartnersDirectory() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={granadaLogo} alt="Granada Property Management" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
            <Button asChild>
              <Link to="/pms-login">Acceso PMS</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-br from-[hsl(var(--granada-navy))] to-[hsl(var(--granada-navy-dark))] text-white">
        <div className="container max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-[hsl(var(--granada-gold))]">Red de Partners</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Inmobiliarias y Administradores que Confían en Granada
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Conecta con profesionales verificados en toda Argentina que utilizan Granada Platform para gestionar propiedades
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 bg-[hsl(var(--granada-cream))]">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--granada-red))] flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Partners Verificados</h3>
                <p className="text-sm text-muted-foreground">
                  Todos los profesionales en nuestra red están verificados y utilizan Granada Platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--granada-navy))] flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Cobertura Nacional</h3>
                <p className="text-sm text-muted-foreground">
                  Encuentra profesionales en todas las provincias de Argentina
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--granada-gold))] flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Gestión Transparente</h3>
                <p className="text-sm text-muted-foreground">
                  Tecnología que garantiza transparencia total en la administración
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Directory Tabs */}
      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="real_estate">Inmobiliarias</TabsTrigger>
              <TabsTrigger value="independent">Administradores</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Todos los Partners</h2>
                <p className="text-muted-foreground">
                  Explora inmobiliarias y administradores independientes en toda Argentina
                </p>
              </div>
              <PartnersDirectoryComponent type="all" />
            </TabsContent>

            <TabsContent value="real_estate" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Inmobiliarias</h2>
                <p className="text-muted-foreground">
                  Empresas inmobiliarias que utilizan Granada Platform para gestión profesional
                </p>
              </div>
              <PartnersDirectoryComponent type="real_estate_agency" />
            </TabsContent>

            <TabsContent value="independent" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Administradores Independientes</h2>
                <p className="text-muted-foreground">
                  Property managers profesionales que confían en nuestra tecnología
                </p>
              </div>
              <PartnersDirectoryComponent type="independent_manager" />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[hsl(var(--granada-red))] to-[hsl(var(--granada-red-dark))] text-white">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Quieres aparecer en este directorio?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a Granada Platform y forma parte de nuestra red de profesionales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white text-[hsl(var(--granada-red))] hover:bg-white/90" asChild>
              <Link to="/contact">Contactar Ventas</Link>
            </Button>
            <Button size="lg" className="bg-[hsl(var(--granada-navy))] hover:bg-[hsl(var(--granada-navy-dark))]" asChild>
              <Link to="/contact">Contactar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-8 px-4">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="text-sm text-secondary-foreground/80">
            &copy; 2024 Granada Platform. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
