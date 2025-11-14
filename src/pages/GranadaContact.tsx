import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GranadaContact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Guardar en base de datos con source: 'granada'
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          message: formData.message,
          source: 'granada',
          status: 'new',
          priority: 'medium'
        });

      if (dbError) throw dbError;

      // 2. Enviar email de confirmación
      const { error: emailError } = await supabase.functions.invoke(
        'send-contact-confirmation',
        {
          body: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
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

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        message: ''
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
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--granada-navy))] via-[hsl(var(--granada-navy-dark))] to-[hsl(var(--granada-red))]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {language === 'es' ? 'Contáctanos' : 'Contact Us'}
            </h1>
            <p className="text-xl text-white/80 mb-8">
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">
                        {language === 'es' ? 'Nombre' : 'First Name'} *
                      </Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">
                        {language === 'es' ? 'Apellido' : 'Last Name'} *
                      </Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      {language === 'es' ? 'Teléfono' : 'Phone'}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">
                      {language === 'es' ? 'Empresa/Inmobiliaria' : 'Company/Real Estate Agency'}
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">
                      {language === 'es' ? 'Mensaje' : 'Message'} *
                    </Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder={language === 'es' 
                        ? 'Cuéntanos sobre tus necesidades...'
                        : 'Tell us about your needs...'}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'es' ? 'Enviando...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {language === 'es' ? 'Enviar Mensaje' : 'Send Message'}
                      </>
                    )}
                  </Button>
                </form>
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