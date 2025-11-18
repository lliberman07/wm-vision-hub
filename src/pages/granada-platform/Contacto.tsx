import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Contacto() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4">Contáctanos</Badge>
            <h1 className="text-4xl font-bold mb-4">¿Cómo podemos ayudarte?</h1>
            <p className="text-muted-foreground text-lg">
              Estamos aquí para responder tus consultas sobre Granada Platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Email</CardTitle>
                <CardDescription>Escríbenos y te responderemos pronto</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:contacto@granada-platform.com" className="text-primary hover:underline">
                  contacto@granada-platform.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Teléfono</CardTitle>
                <CardDescription>Llámanos en horario de atención</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="tel:+5491112345678" className="text-primary hover:underline">
                  +54 9 11 1234-5678
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Oficina</CardTitle>
                <CardDescription>Visítanos en nuestra ubicación</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Buenos Aires, Argentina
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Horarios</CardTitle>
                <CardDescription>Estamos disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Lunes a Viernes: 9:00 - 18:00<br />
                  Sábados: 9:00 - 13:00
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <GranadaFooter />
    </div>
  );
}
