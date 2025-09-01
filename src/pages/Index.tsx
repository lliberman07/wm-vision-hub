import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  Users, 
  Calculator,
  ArrowRight,
  CheckCircle,
  BarChart3
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                Real Estate Excellence
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Welcome to WM Management & Investments
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                At WM, we transform complexity into clarity. We are passionate about embracing your visions and challenges, transforming the way we live, work, and develop our communities.
              </p>
              <p className="text-lg text-primary-foreground/80">
                Our experienced team and digital solutions turn intricate real estate challenges into straightforward, actionable opportunities with measurable success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/services">
                    Explore Our Services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/financing">Discover Financing Solutions</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-strong">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>Property Management Excellence</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>Strategic Investment Solutions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>Real Estate Development</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span>Expert Consulting Services</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Integrated Solutions for Real Estate Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From property management to investment trust services, we deliver clarity and results across every aspect of real estate.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Property Management</CardTitle>
                <CardDescription>
                  Comprehensive property care from lease administration to strategic optimization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/property-management">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Brokerage</CardTitle>
                <CardDescription>
                  Expert guidance connecting opportunities with precision and transparency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/brokerage">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Consulting Services</CardTitle>
                <CardDescription>
                  Strategic insights that transform complex challenges into clear opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/consulting">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Real Estate Development</CardTitle>
                <CardDescription>
                  From vision to reality—comprehensive development management and execution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/development">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Trust & Investments</CardTitle>
                <CardDescription>
                  Secure, transparent investment frameworks with risk-adjusted returns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services/investments">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-all duration-300 bg-gradient-accent text-accent-foreground">
              <CardHeader>
                <Calculator className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Financing Solutions</CardTitle>
                <CardDescription className="text-accent-foreground/80">
                  Competitive financing with interest-free options for your remodeling projects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/financing/simulator">Try Our Simulator</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-muted py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-bold mb-4">News & Updates – March 2025</h3>
          <p className="text-lg text-muted-foreground">
            New Market Insights: Our latest research highlights emerging trends in property management that are revolutionizing the industry. Check back monthly for fresh updates and actionable strategies.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
