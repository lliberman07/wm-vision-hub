import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, DollarSign, Users, Building, FileText, Briefcase } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/numberFormat";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  additional_limits: any;
  features: any;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
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
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .neq('slug', 'legacy')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return formatNumber(limit, 'es');
  };

  const calculateYearlyDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const getAllFeatures = () => {
    const allFeatures = new Set<string>();
    plans.forEach(plan => {
      if (plan.features) {
        Object.keys(plan.features).forEach(key => allFeatures.add(key));
      }
    });
    return Array.from(allFeatures);
  };

  const getAllAdditionalLimits = () => {
    const allLimits = new Set<string>();
    plans.forEach(plan => {
      if (plan.additional_limits) {
        Object.keys(plan.additional_limits).forEach(key => allLimits.add(key));
      }
    });
    return Array.from(allLimits);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay planes disponibles en este momento
      </div>
    );
  }

  const allFeatures = getAllFeatures();
  const allAdditionalLimits = getAllAdditionalLimits();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] font-bold sticky left-0 bg-background z-10">
              Característica
            </TableHead>
            {plans.map(plan => (
              <TableHead key={plan.id} className="text-center min-w-[180px]">
                <div className="space-y-1">
                  <p className="font-bold">{plan.name}</p>
                  <Badge variant="default" className="text-xs">
                    Activo
                  </Badge>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Pricing Section */}
          <TableRow className="bg-muted/50">
            <TableCell colSpan={plans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Precios
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">Precio Mensual</TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center">
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(plan.price_monthly, 'es', 'ARS')}
                </p>
                <p className="text-xs text-muted-foreground">/mes</p>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">Precio Anual</TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center">
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(plan.price_yearly, 'es', 'ARS')}
                </p>
                <div className="text-xs text-muted-foreground">
                  <p>/año</p>
                  {calculateYearlyDiscount(plan.price_monthly, plan.price_yearly) > 0 && (
                    <Badge variant="outline" className="mt-1">
                      {calculateYearlyDiscount(plan.price_monthly, plan.price_yearly)}% OFF
                    </Badge>
                  )}
                </div>
              </TableCell>
            ))}
          </TableRow>

          {/* Core Limits Section */}
          <TableRow className="bg-muted/50">
            <TableCell colSpan={plans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
              <Building className="h-4 w-4 inline mr-2" />
              Límites Principales
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">
              <Users className="h-4 w-4 inline mr-2 text-muted-foreground" />
              Usuarios
            </TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center font-semibold">
                {formatLimit(plan.max_users)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">
              <Building className="h-4 w-4 inline mr-2 text-muted-foreground" />
              Propiedades
            </TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center font-semibold">
                {formatLimit(plan.max_properties)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">
              <FileText className="h-4 w-4 inline mr-2 text-muted-foreground" />
              Contratos
            </TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center font-semibold">
                {formatLimit(plan.max_contracts)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">
              <Briefcase className="h-4 w-4 inline mr-2 text-muted-foreground" />
              Sucursales
            </TableCell>
            {plans.map(plan => (
              <TableCell key={plan.id} className="text-center font-semibold">
                {formatLimit(plan.max_branches)}
              </TableCell>
            ))}
          </TableRow>

          {/* Additional Limits */}
          {allAdditionalLimits.length > 0 && (
            <>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={plans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                  Límites Adicionales
                </TableCell>
              </TableRow>
              {allAdditionalLimits.map(limitKey => (
                <TableRow key={limitKey}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10 capitalize">
                    {limitKey.replace(/_/g, ' ')}
                  </TableCell>
                  {plans.map(plan => (
                    <TableCell key={plan.id} className="text-center">
                      {plan.additional_limits?.[limitKey] !== undefined ? (
                        <span className="font-semibold">
                          {formatLimit(plan.additional_limits[limitKey])}
                        </span>
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          {/* Features Section */}
          {allFeatures.length > 0 && (
            <>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={plans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                  Características
                </TableCell>
              </TableRow>
              {allFeatures.map(featureKey => (
                <TableRow key={featureKey}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {FEATURE_LABELS[featureKey] || featureKey.replace(/_/g, ' ')}
                  </TableCell>
                  {plans.map(plan => (
                    <TableCell key={plan.id} className="text-center">
                      {plan.features?.[featureKey] ? (
                        <Check className="h-5 w-5 mx-auto text-green-600" />
                      ) : (
                        <X className="h-5 w-5 mx-auto text-muted-foreground" />
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
  );
}
