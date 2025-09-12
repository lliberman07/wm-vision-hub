import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import faqHeroBackground from "@/assets/faq-hero-background.jpg";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FAQ = () => {
  const { t } = useLanguage();

  const faqCategories = [
    {
      category: t('faq.services.category'),
      questions: [
        {
          question: t('faq.services.q1.question'),
          answer: t('faq.services.q1.answer')
        },
        {
          question: t('faq.services.q2.question'),
          answer: t('faq.services.q2.answer')
        },
        {
          question: t('faq.services.q3.question'),
          answer: t('faq.services.q3.answer')
        }
      ]
    },
    {
      category: t('faq.financing.category'),
      questions: [
        {
          question: t('faq.financing.q1.question'),
          answer: t('faq.financing.q1.answer')
        },
        {
          question: t('faq.financing.q2.question'),
          answer: t('faq.financing.q2.answer')
        },
        {
          question: t('faq.financing.q3.question'),
          answer: t('faq.financing.q3.answer')
        }
      ]
    },
    {
      category: t('faq.investments.category'),
      questions: [
        {
          question: t('faq.investments.q1.question'),
          answer: t('faq.investments.q1.answer')
        },
        {
          question: t('faq.investments.q2.question'),
          answer: t('faq.investments.q2.answer')
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative text-primary-foreground py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${faqHeroBackground})`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('faq.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('faq.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('faq.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center space-x-3">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, questionIndex) => (
                      <AccordionItem 
                        key={questionIndex} 
                        value={`${categoryIndex}-${questionIndex}`}
                      >
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">{t('faq.support.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('faq.support.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Button size="lg" asChild>
              <Link to="/contact">
                <MessageSquare className="mr-2 h-5 w-5" />
                {t('faq.support.contact')}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                <MessageSquare className="mr-2 h-5 w-5" />
                {t('faq.support.chat')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary-foreground">
                {t('faq.news.title')}
              </CardTitle>
              <CardDescription className="text-center text-primary-foreground/80">
                {t('faq.news.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90 text-center">
                {t('faq.news.content')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;