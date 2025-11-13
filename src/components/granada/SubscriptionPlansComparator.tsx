import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, DollarSign, Users, Building, FileText, Briefcase } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  additional_limits: Record<string, number>;
  features: Record<string, boolean>;
  price_monthly: number;
  price_yearly: number;
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

export function SubscriptionPlansComparator() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans-comparator'],
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

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return limit.toLocaleString('es-AR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateYearlyDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const getAllFeatures = () => {
    if (!plans) return [];
    const allFeatures = new Set<string>();
    plans.forEach(plan => {
      if (plan.features) {
        Object.keys(plan.features).forEach(key => allFeatures.add(key));
      }
    });
    return Array.from(allFeatures);
  };

  const getAllAdditionalLimits = () => {
    if (!plans) return [];
    const allLimits = new Set<string>();
    plans.forEach(plan => {
      if (plan.additional_limits) {
        Object.keys(plan.additional_limits).forEach(key => allLimits.add(key));
      }
    });
    return Array.from(allLimits);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando planes...</div>;
  }

  if (!plans || plans.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay planes disponibles</div>;
  }

  const features = getAllFeatures();
  const additionalLimits = getAllAdditionalLimits();

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Característica</TableHead>
              {plans.map((plan) => (
                <TableHead key={plan.id} className="text-center">
                  <div className="font-bold text-lg">{plan.name}</div>
                  <div className="text-xs text-muted-foreground font-normal mt-1">
                    {plan.description}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Pricing Section */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={plans.length + 1} className="font-semibold">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Precios
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Precio Mensual</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center">
                  <div className="font-bold text-lg">{formatCurrency(plan.price_monthly)}</div>
                  <div className="text-xs text-muted-foreground">/mes</div>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Precio Anual</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center">
                  <div className="font-bold text-lg">{formatCurrency(plan.price_yearly)}</div>
                  <div className="text-xs text-muted-foreground">/año</div>
                  {plan.price_monthly > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {calculateYearlyDiscount(plan.price_monthly, plan.price_yearly)}% desc.
                    </Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Core Limits Section */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={plans.length + 1} className="font-semibold">
                Límites Principales
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Users className="inline h-4 w-4 mr-2" />
                Usuarios
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center font-medium">
                  {formatLimit(plan.max_users)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Briefcase className="inline h-4 w-4 mr-2" />
                Propiedades
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center font-medium">
                  {formatLimit(plan.max_properties)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <FileText className="inline h-4 w-4 mr-2" />
                Contratos
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center font-medium">
                  {formatLimit(plan.max_contracts)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Building className="inline h-4 w-4 mr-2" />
                Sucursales
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center font-medium">
                  {formatLimit(plan.max_branches)}
                </TableCell>
              ))}
            </TableRow>

            {/* Additional Limits Section */}
            {additionalLimits.length > 0 && (
              <>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={plans.length + 1} className="font-semibold">
                    Límites Adicionales
                  </TableCell>
                </TableRow>
                {additionalLimits.map((limitKey) => (
                  <TableRow key={limitKey}>
                    <TableCell className="font-medium">{limitKey}</TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        {plan.additional_limits && plan.additional_limits[limitKey] ? (
                          <span className="font-medium">
                            {formatLimit(plan.additional_limits[limitKey])}
                          </span>
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {/* Features Section */}
            {features.length > 0 && (
              <>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={plans.length + 1} className="font-semibold">
                    Características
                  </TableCell>
                </TableRow>
                {features.map((featureKey) => (
                  <TableRow key={featureKey}>
                    <TableCell className="font-medium">
                      {FEATURE_LABELS[featureKey] || featureKey}
                    </TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        {plan.features && plan.features[featureKey] ? (
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Plan Cards Summary */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(plan.price_monthly)}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </div>
              <div className="text-sm text-muted-foreground">
                o {formatCurrency(plan.price_yearly)}/año
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
