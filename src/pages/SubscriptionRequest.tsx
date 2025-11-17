import { SubscriptionRequestForm } from "@/components/granada/SubscriptionRequestForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionRequest() {
  return (
    <div className="min-h-screen bg-background">
      <div className="granada-theme bg-gradient-to-br from-primary via-primary/95 to-primary/80 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link to="/granada-platform">
              <Button variant="ghost" size="sm" className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Granada Platform
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-primary-foreground">
              Solicitar Suscripción
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Completa el formulario y nuestro equipo te contactará para activar tu cuenta
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <SubscriptionRequestForm />
        </div>
      </div>
    </div>
  );
}
