import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import contactHeroBackground from "@/assets/contact-hero-background.jpg";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set custom validation messages before submitting
    const form = e.target as HTMLFormElement;
    const firstNameInput = form.querySelector('#firstName') as HTMLInputElement;
    const lastNameInput = form.querySelector('#lastName') as HTMLInputElement;
    const emailInput = form.querySelector('#email') as HTMLInputElement;
    const messageInput = form.querySelector('#message') as HTMLTextAreaElement;

    // Set custom validation messages
    firstNameInput.setCustomValidity(firstNameInput.value ? '' : t('contact.form.validation.firstName'));
    lastNameInput.setCustomValidity(lastNameInput.value ? '' : t('contact.form.validation.lastName'));
    emailInput.setCustomValidity(emailInput.value ? '' : t('contact.form.validation.email'));
    messageInput.setCustomValidity(messageInput.value ? '' : t('contact.form.validation.message'));

    // Check if form is valid
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          message: formData.message
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

      toast({
        title: t('contact.form.success'),
        description: t('contact.form.successDesc'),
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your message. Please try again.",
        variant: "destructive"
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", message: "" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear custom validation message when user types
    (e.target as HTMLInputElement | HTMLTextAreaElement).setCustomValidity('');
  };

  // Set validation messages when language changes
  const handleInputInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'firstName' && !target.value) {
      target.setCustomValidity(t('contact.form.validation.firstName'));
    } else if (target.name === 'lastName' && !target.value) {
      target.setCustomValidity(t('contact.form.validation.lastName'));
    } else if (target.name === 'email' && !target.value) {
      target.setCustomValidity(t('contact.form.validation.email'));
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
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-strong">
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('contact.form.firstName')} *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onInvalid={handleInputInvalid}
                        required
                        placeholder={t('contact.form.firstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('contact.form.lastName')} *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onInvalid={handleInputInvalid}
                        required
                        placeholder={t('contact.form.lastNamePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.form.email')} *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onInvalid={handleInputInvalid}
                      required
                      placeholder={t('contact.form.emailPlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('contact.form.phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t('contact.form.phonePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">{t('contact.form.company')}</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder={t('contact.form.companyPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.message')} *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onInvalid={handleTextareaInvalid}
                      required
                      placeholder={t('contact.form.messagePlaceholder')}
                      rows={12}
                      className="min-h-[280px]"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      {t('contact.form.send')}
                    </Button>
                  </div>
                </form>
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
                        <h3 className="font-semibold text-lg">{t('contact.info.phone')}</h3>
                        <p className="text-muted-foreground">+1 (555) 123-4567</p>
                        <p className="text-sm text-muted-foreground">{t('contact.info.phoneHours')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.email')}</h3>
                        <p className="text-muted-foreground">info@wmmanagement.com</p>
                        <p className="text-sm text-muted-foreground">{t('contact.info.emailResponse')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{t('contact.info.address')}</h3>
                        <p className="text-muted-foreground">
                          123 Business District<br />
                          Suite 456<br />
                          City, State 12345
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
                <strong>Live Chat Now Available:</strong> {t('contact.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Contact;