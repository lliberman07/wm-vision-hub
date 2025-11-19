import { useState } from 'react';
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DynamicContactForm } from '@/components/DynamicContactForm';

export default function Contacto() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Guardar en base de datos con source: 'granada'
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          message: data.message || data.issue_description || '',
          source: 'granada',
          status: 'new',
          priority: data.inquiry_type === 'support' ? 'high' : 'medium',
          inquiry_type: data.inquiry_type,
          dynamic_fields: data.dynamic_fields
        });

      if (dbError) throw dbError;

      // 2. Enviar email de confirmación
      const { error: emailError } = await supabase.functions.invoke(
        'send-contact-confirmation',
        {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            language: language,
            source: 'granada'
          }
        }
      );

      if (emailError) console.error('Email error:', emailError);

      // 3. Mostrar éxito
      toast({
        title: language === 'es' ? '¡Mensaje enviado!' : 'Message sent!',
        description: language === 'es' 
          ? 'Te contactaremos en las próximas 24-48 horas.'
          : 'We will contact you within 24-48 hours.',
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4">Contáctanos</Badge>
            <h1 className="text-4xl font-bold mb-4">¿Cómo podemos ayudarte?</h1>
            <p className="text-muted-foreground text-lg">
              Estamos aquí para responder tus consultas sobre Granada Platform
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Formulario de contacto */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
              <DynamicContactForm 
                source="granada" 
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>

            {/* Información de contacto */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Otras formas de contacto</h2>
              
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
        </div>
      </main>

      <GranadaFooter />
    </div>
  );
}
