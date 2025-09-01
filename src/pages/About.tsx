import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Target, Eye, Users, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            About WM Management
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Transforming Real Estate Challenges into Opportunities
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            We leverage data-driven insights and deep industry expertise to deliver solutions that add real value to every client relationship.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At WM Management & Investments, our mission is to convert real estate challenges into tangible opportunities. We leverage data-driven insights and deep industry expertise to deliver solutions that add real value.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                  We believe that by embracing transparency, integrity, and a pragmatic approach, we can empower every investor to reach their full potential.
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Eye className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">Our Vision</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our vision is to be the trusted partner that simplifies the complex world of real estate, enabling our clients to make informed decisions and achieve lasting success.
                </p>
              </div>
            </div>

            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl">News & Updates – March 2025</CardTitle>
                <CardDescription>Latest developments in our mission</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <strong>New Sustainability Benchmarks:</strong> We have refined our performance metrics to better reflect our commitment to responsible growth. Our latest initiatives ensure every project contributes to a sustainable future.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">Meet Our Team</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our team is our cornerstone. Composed of industry veterans and innovative strategists, we bring together a wealth of experience and fresh ideas to drive success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-2xl">WM</span>
                </div>
                <CardTitle>Leadership Team</CardTitle>
                <CardDescription>
                  Industry veterans with decades of combined experience in real estate management and investment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle>Strategy Experts</CardTitle>
                <CardDescription>
                  Data analysts and strategic planners who transform market insights into actionable opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Client Partners</CardTitle>
                <CardDescription>
                  Dedicated professionals who work side by side with clients to craft effective, innovative solutions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-12 shadow-strong bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Team Expansion – March 2025</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Growing our capabilities with new expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90">
                We are pleased to announce the addition of two new experts in data analytics and technology, further enhancing our ability to deliver strategic insights and innovative solutions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide every decision and drive our success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">Transparency</CardTitle>
                <CardDescription>
                  Clear communication and honest reporting in every interaction and transaction.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">Integrity</CardTitle>
                <CardDescription>
                  Ethical practices and principled decision-making that builds lasting trust.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium text-center">
              <CardHeader>
                <CardTitle className="text-xl">Excellence</CardTitle>
                <CardDescription>
                  Committed to delivering exceptional results through continuous improvement and innovation.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;