import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FranchiseSimulator from "@/components/FranchiseSimulator";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Calculator, 
  PiggyBank, 
  UserPlus,
  ArrowRight,
  CheckCircle,
  Percent,
  Clock,
  Shield
} from "lucide-react";

const Financing = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t('financing.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {t('financing.hero.title')}
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            {t('financing.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* The Program */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <PiggyBank className="h-10 w-10 text-primary" />
                <h2 className="text-3xl font-bold">The Program</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our financing program is designed with simplicity and efficiency in mind. With competitive setup fees and interest-free financing for 50% of your remodeling costs, we remove obstacles and empower you to move forward with confidence.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe in creating clear pathways to success by eliminating unnecessary financial complexity.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Percent className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">0% Interest</div>
                    <div className="text-sm text-muted-foreground">On approved financing</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">Flexible Terms</div>
                    <div className="text-sm text-muted-foreground">Up to 60 months</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">Secure Process</div>
                    <div className="text-sm text-muted-foreground">Fast approval</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">50% Coverage</div>
                    <div className="text-sm text-muted-foreground">Of remodeling costs</div>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link to="/financing/program">
                  Discover the Program
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl">Program Benefits</CardTitle>
                <CardDescription>Why choose our financing solution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">No Hidden Fees</div>
                      <div className="text-sm text-muted-foreground">Transparent pricing with competitive setup costs</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Quick Approval</div>
                      <div className="text-sm text-muted-foreground">Streamlined process with fast decision making</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Flexible Payments</div>
                      <div className="text-sm text-muted-foreground">Customized payment schedules to fit your cash flow</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calculator className="h-10 w-10 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">Interactive Simulator</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparency is key to smart financing. Our interactive simulator lets you experiment with different financing scenarios in real-time.
            </p>
          </div>

          <FranchiseSimulator />
        </div>
      </section>

      {/* Sign Up Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="shadow-strong">
              <CardHeader>
                <UserPlus className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
                <CardDescription>
                  Whether you're an investor, franchisee, or property owner, sign up for our financing program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ready to turn potential into performance? Sign up for our financing program and receive personalized guidance from our experts. We're committed to making your vision a reality through clear, supportive steps.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Personalized consultation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Custom financing solutions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Expert guidance throughout the process</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Sign Up Today</h2>
              <p className="text-lg text-muted-foreground">
                Join our financing program and take the first step toward achieving your real estate goals with confidence and clarity.
              </p>
              
              <div className="space-y-4">
                <Button size="lg" className="w-full" asChild>
                  <Link to="/financing/signup">
                    Sign Up for Financing Program
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link to="/financing/simulator">
                    Try the Simulator First
                    <Calculator className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary-foreground">
                News & Updates – March 2025
              </CardTitle>
              <CardDescription className="text-center text-primary-foreground/80">
                Latest enhancements to our financing solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90 text-center">
                <strong>Enhanced Simulator:</strong> Our tool now includes the latest economic data to provide even more precise investment projections. Explore the new features and see the difference today!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Financing;