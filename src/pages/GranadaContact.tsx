import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { DynamicContactForm } from '@/components/DynamicContactForm';
import granadaLogo from '@/assets/granada-logo-new.jpg';

export default function GranadaContact() {
  const navigate = useNavigate();
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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/granada-platform" className="flex items-center gap-2">
            <img src={granadaLogo} alt="Granada Property Management" className="h-12 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/granada-platform#inmobiliarias" className="text-sm font-medium hover:text-primary transition-colors">Para Inmobiliarias</Link>
            <Link to="/granada-platform#propietarios" className="text-sm font-medium hover:text-primary transition-colors">Para Propietarios</Link>
            <Link to="/partners-directory" className="text-sm font-medium hover:text-primary transition-colors">Directorio</Link>
            <Link to="/granada-platform#planes" className="text-sm font-medium hover:text-primary transition-colors">Planes</Link>
            <Link to="/granada-platform#proveedores" className="text-sm font-medium hover:text-primary transition-colors">Proveedores</Link>
            <Link to="/granada-platform/contact" className="text-sm font-medium text-primary transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild><Link to="/pms-login">Acceso PMS</Link></Button>
            <Button asChild><Link to="/granada-platform#demo">Solicitar Demo</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              {language === 'es' ? 'Contáctanos' : 'Contact Us'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'es' 
                ? 'Estamos aquí para ayudarte a revolucionar tu gestión inmobiliaria'
                : 'We are here to help you revolutionize your real estate management'}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form + Info Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            
            {/* Contact Form */}
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <DynamicContactForm 
                  source="granada" 
                  onSubmit={handleFormSubmit}
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <a href="mailto:contacto@granadaplatform.com" className="text-accent hover:underline">
                      contacto@granadaplatform.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === 'es' ? 'Teléfono' : 'Phone'}
                    </h3>
                    <a href="tel:+5491112345678" className="text-accent hover:underline">
                      +54 911 1234-5678
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === 'es' ? 'Horario de Atención' : 'Business Hours'}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === 'es' 
                        ? 'Lunes a Viernes: 9:00 - 18:00 hs'
                        : 'Monday to Friday: 9:00 AM - 6:00 PM'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === 'es' ? 'Dirección' : 'Address'}
                    </h3>
                    <p className="text-muted-foreground">
                      Buenos Aires, Argentina
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-accent/10 border-accent/20">
                <h3 className="font-semibold mb-2">
                  {language === 'es' ? '¿Necesitas soporte técnico?' : 'Need technical support?'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'es'
                    ? 'Si ya eres cliente, accede a tu panel PMS para soporte directo.'
                    : 'If you are already a client, access your PMS panel for direct support.'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/pms/login')}
                  className="w-full"
                >
                  {language === 'es' ? 'Acceder al PMS' : 'Access PMS'}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}