import { SubscriptionRequestForm } from "@/components/granada/SubscriptionRequestForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionRequest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to="/granada-platform">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Granada Platform
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Solicitar Suscripción
            </h1>
            <p className="text-lg text-muted-foreground">
              Completa el formulario y nuestro equipo te contactará para activar tu cuenta
            </p>
          </div>

          <SubscriptionRequestForm />
        </div>
      </div>
    </div>
  );
}
