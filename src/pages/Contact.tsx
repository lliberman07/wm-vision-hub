import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import contactHeroBackground from "@/assets/contact-hero-background.jpg";
import { DynamicContactForm } from "@/components/DynamicContactForm";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageSquare
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          message: data.message || data.issue_description || '',
          source: 'wm',
          status: 'new',
          priority: data.inquiry_type === 'support' ? 'high' : 'medium',
          inquiry_type: data.inquiry_type,
          dynamic_fields: data.dynamic_fields
        });

      if (error) {
        console.error('Error saving contact form:', error);
        toast({
          title: "Error",
          description: "There was a problem submitting your message. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-contact-confirmation', {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            language: language,
            source: 'wm'
          },
        });
        
        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaInvalid = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (target.name === 'message' && !target.value) {
      target.setCustomValidity(t('contact.form.validation.message'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${contactHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('contact.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('contact.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('contact.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <Card className="shadow-strong h-fit">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">{t('contact.form.title')}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {t('contact.form.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <DynamicContactForm 
                  source="wm" 
                  onSubmit={handleFormSubmit}
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">{t('contact.info.title')}</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t('contact.info.subtitle')}
                </p>
              </div>

              <div className="space-y-6">
                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Phone className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.phoneTitle')}</h3>
                        <p className="text-muted-foreground">+5411-1234-5678</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.emailTitle')}</h3>
                        <p className="text-muted-foreground">contacto@wmglobal.co</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.addressTitle')}</h3>
                        <p className="text-muted-foreground">
                          Buenos Aires<br />
                          Ciudad Autónoma de Buenos Aires<br />
                          Argentina
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.hours')}</h3>
                        <div className="text-muted-foreground space-y-1">
                          <p>{t('contact.info.hoursWeekday')}</p>
                          <p>{t('contact.info.hoursSaturday')}</p>
                          <p>{t('contact.info.hoursSunday')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t('contact.news.title')}</CardTitle>
              <CardDescription className="text-center">{t('contact.news.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                <strong>{t('contact.news.liveChat')}</strong> {t('contact.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <EnhancedChatbot />
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {t('contact.form.successMessage')}
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-4">
              {language === 'es' 
                ? 'Nuestro equipo se pondrá en contacto con usted pronto.'
                : 'Our team will contact you soon.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={() => setShowSuccessDialog(false)}>
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;