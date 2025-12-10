import { useState } from 'react';
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGranadaLanguage } from '@/contexts/GranadaLanguageContext';
import { DynamicContactForm } from '@/components/DynamicContactForm';

export default function Contacto() {
  const { toast } = useToast();
  const { t, language } = useGranadaLanguage();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
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

      toast({
        title: t('contacto.toast_success'),
        description: t('contacto.toast_success_desc'),
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('contacto.toast_error'),
        description: t('contacto.toast_error_desc'),
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
            <Badge className="mb-4">{t('contacto.badge')}</Badge>
            <h1 className="text-4xl font-bold mb-4">{t('contacto.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('contacto.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t('contacto.form_title')}</h2>
              <DynamicContactForm 
                source="granada" 
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">{t('contacto.info_title')}</h2>
              
              <Card>
                <CardHeader>
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{t('contacto.email')}</CardTitle>
                  <CardDescription>{t('contacto.email_desc')}</CardDescription>
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
                  <CardTitle>{t('contacto.phone')}</CardTitle>
                  <CardDescription>{t('contacto.phone_desc')}</CardDescription>
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
                  <CardTitle>{t('contacto.office')}</CardTitle>
                  <CardDescription>{t('contacto.office_desc')}</CardDescription>
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
                  <CardTitle>{t('contacto.hours')}</CardTitle>
                  <CardDescription>{t('contacto.hours_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {t('contacto.hours_weekdays')}<br />
                    {t('contacto.hours_saturday')}
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
