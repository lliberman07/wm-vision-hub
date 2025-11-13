import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, Eye, Users, Building, FileText, Briefcase } from "lucide-react";
import { SubscriptionPlansComparator } from "./SubscriptionPlansComparator";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  features: Record<string, boolean>;
  additional_limits: Record<string, number>;
  sort_order: number;
}

const FEATURE_LABELS: Record<string, string> = {
  advanced_reports: 'Reportes Avanzados',
  multi_currency: 'Multi-Moneda',
  custom_branding: 'Marca Personalizada',
  api_access: 'Acceso API',
  priority_support: 'Soporte Prioritario',
  bulk_operations: 'Operaciones Masivas',
  advanced_analytics: 'Analytics Avanzado',
  white_label: 'White Label',
};

export default function PricingComparator() {
  const [isYearly, setIsYearly] = useState(false);
  const [showComparator, setShowComparator] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .neq('slug', 'legacy')
        .order('sort_order');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return limit.toLocaleString('es-AR');
  };

  const calculateDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const getFeaturesList = (plan: SubscriptionPlan) => {
    const features = [];
    
    // Core limits
    features.push({
      included: true,
      text: `${formatLimit(plan.max_users)} usuarios`,
      icon: Users,
    });
    features.push({
      included: true,
      text: `${formatLimit(plan.max_properties)} propiedades`,
      icon: Briefcase,
    });
    features.push({
      included: true,
      text: `${formatLimit(plan.max_contracts)} contratos`,
      icon: FileText,
    });
    features.push({
      included: true,
      text: `${formatLimit(plan.max_branches)} sucursales`,
      icon: Building,
    });

    // Feature flags
    if (plan.features) {
      Object.entries(plan.features).forEach(([key, value]) => {
        if (FEATURE_LABELS[key]) {
          features.push({
            included: value as boolean,
            text: FEATURE_LABELS[key],
            icon: null,
          });
        }
      });
    }

    return features;
  };

  const isPopularPlan = (slug: string) => {
    return slug === 'professional' || slug === 'profesional';
  };

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-muted-foreground">Cargando planes...</div>
        </div>
      </section>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-muted-foreground">No hay planes disponibles</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Planes que Crecen con tu Negocio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Comienza gratis por 14 días. Sin tarjeta de crédito requerida.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
              Mensual
            </Label>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Anual
              {plans[0] && calculateDiscount(plans[0].price_monthly, plans[0].price_yearly) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  Ahorrá hasta {calculateDiscount(plans[0].price_monthly, plans[0].price_yearly)}%
                </Badge>
              )}
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const features = getFeaturesList(plan);
            const price = isYearly ? plan.price_yearly : plan.price_monthly;
            const popular = isPopularPlan(plan.slug);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  popular
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(price)}
                    </span>
                    <span className="text-muted-foreground">
                      {isYearly ? '/año' : '/mes'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            Icon ? (
                              <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            )
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feature.included
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={popular ? "default" : "outline"}
                    onClick={() => window.location.href = `/pms/subscribe?plan=${plan.slug}`}
                  >
                    Suscribir
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* IVA Disclaimer */}
        <p className="text-center text-sm text-muted-foreground mb-6">
          Los valores expresados no incluyen IVA
        </p>

        {/* Full Comparison Button */}
        <div className="text-center mb-8">
          <Dialog open={showComparator} onOpenChange={setShowComparator}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <Eye className="mr-2 h-4 w-4" />
                Ver Comparación Completa de Planes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comparación Completa de Planes</DialogTitle>
                <DialogDescription>
                  Compara todas las características y límites de nuestros planes
                </DialogDescription>
              </DialogHeader>
              <SubscriptionPlansComparator />
            </DialogContent>
          </Dialog>
        </div>

        {/* Included in All Plans */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Incluido en Todos los Planes
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Gestión de propiedades completa",
              "Sistema de pagos y gastos",
              "Reportes automáticos mensuales",
              "Notificaciones por email",
              "Multi-moneda con tasas actualizadas",
              "Portal para propietarios",
              "Backups automáticos diarios",
              "Actualizaciones gratuitas",
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
