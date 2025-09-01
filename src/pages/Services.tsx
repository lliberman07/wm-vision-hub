import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Hammer, 
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Services = () => {
  const { t } = useLanguage();
  
  const services = [
    {
      icon: Building2,
      title: "Property Management",
      description: "Managing your property shouldn't be complicated. Our property management service covers everything from lease administration and routine maintenance to strategic performance optimization.",
      features: [
        "Lease Administration",
        "Maintenance Management", 
        "Performance Optimization",
        "Financial Reporting"
      ],
      cta: "Learn How We Maximize Property Value",
      href: "/services/property-management"
    },
    {
      icon: TrendingUp,
      title: "Brokerage",
      description: "Real estate transactions demand precision and transparency. Our brokerage services connect buyers, sellers, and lessees with the best opportunities available.",
      features: [
        "Market Analysis",
        "Transaction Management",
        "Expert Negotiations",
        "Due Diligence Support"
      ],
      cta: "Explore Current Opportunities",
      href: "/services/brokerage"
    },
    {
      icon: Users,
      title: "Consulting Services",
      description: "When complexity meets clarity, success follows. Our consulting services break down real estate challenges into clear, actionable strategies.",
      features: [
        "Feasibility Studies",
        "Legal Advisory",
        "Strategic Planning",
        "Market Research"
      ],
      cta: "Request Your Consultation",
      href: "/services/consulting"
    },
    {
      icon: Hammer,
      title: "Real Estate Development",
      description: "Turning vision into reality—our real estate development team manages projects from concept through completion with innovative design and strategic planning.",
      features: [
        "Project Management",
        "Design Integration",
        "Construction Oversight",
        "Quality Assurance"
      ],
      cta: "Discover Our Development Projects",
      href: "/services/development"
    },
    {
      icon: Shield,
      title: "Trust & Investments",
      description: "Invest with assurance. Our trust and investment services provide a secure and transparent framework for managing real estate assets.",
      features: [
        "Portfolio Management",
        "Risk Assessment",
        "Investment Strategy",
        "Performance Monitoring"
      ],
      cta: "Find Out More About Our Investment Solutions",
      href: "/services/investments"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('services.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('services.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('services.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-16">
            {services.map((service, index) => (
              <div key={service.title} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <service.icon className="h-10 w-10 text-primary" />
                    <h2 className="text-3xl font-bold">{service.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{t('common.keyFeatures')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button size="lg" asChild>
                    <Link to={service.href}>
                      {service.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                <Card className={`shadow-strong ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <CardContent className="p-8">
                    <div className="w-20 h-20 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 mx-auto">
                      <service.icon className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        Professional {service.title.toLowerCase()} services tailored to your specific needs and objectives.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">News & Updates – March 2025</CardTitle>
              <CardDescription className="text-center">Latest developments in our services</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                <strong>Case Study Release:</strong> Discover our new case study on digital transformation in property management, showcasing how innovative solutions drive efficiency and value.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t('common.readyToStart')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Permítanos ayudarle a transformar sus desafíos inmobiliarios en oportunidades estratégicas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">{t('common.contactTeam')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/financing/simulator">{t('common.trySimulator')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;