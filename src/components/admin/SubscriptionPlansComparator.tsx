import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, GitCompare, DollarSign, Users, Building, FileText, Briefcase, ArrowRight } from "lucide-react";
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
      
      // Auto-select first 3 active plans for comparison
      if (data && data.length > 0) {
        setSelectedPlans(data.slice(0, Math.min(3, data.length)).map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return formatNumber(limit, 'es');
  };

  const calculateYearlyDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const togglePlanSelection = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      setSelectedPlans(selectedPlans.filter(id => id !== planId));
    } else {
      if (selectedPlans.length >= 4) {
        toast({
          title: "Máximo alcanzado",
          description: "Solo puedes comparar hasta 4 planes a la vez",
          variant: "destructive"
        });
        return;
      }
      setSelectedPlans([...selectedPlans, planId]);
    }
  };

  const getComparisonPlans = () => {
    return plans.filter(p => selectedPlans.includes(p.id));
  };

  const getAllFeatures = () => {
    const comparisonPlans = getComparisonPlans();
    const allFeatures = new Set<string>();
    comparisonPlans.forEach(plan => {
      if (plan.features) {
        Object.keys(plan.features).forEach(key => allFeatures.add(key));
      }
    });
    return Array.from(allFeatures);
  };

  const getAllAdditionalLimits = () => {
    const comparisonPlans = getComparisonPlans();
    const allLimits = new Set<string>();
    comparisonPlans.forEach(plan => {
      if (plan.additional_limits) {
        Object.keys(plan.additional_limits).forEach(key => allLimits.add(key));
      }
    });
    return Array.from(allLimits);
  };

  const comparisonPlans = getComparisonPlans();
  const allFeatures = getAllFeatures();
  const allAdditionalLimits = getAllAdditionalLimits();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompare className="h-4 w-4 mr-2" />
          Comparar Planes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparador de Planes</DialogTitle>
          <DialogDescription>
            Compara características y límites de diferentes planes lado a lado
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Selecciona planes para comparar (máximo 4):</p>
          <div className="flex flex-wrap gap-2">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center space-x-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => togglePlanSelection(plan.id)}
              >
                <Checkbox
                  checked={selectedPlans.includes(plan.id)}
                  onCheckedChange={() => togglePlanSelection(plan.id)}
                />
                <label className="text-sm font-medium cursor-pointer">
                  {plan.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {comparisonPlans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Selecciona al menos un plan para comparar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] font-bold sticky left-0 bg-background z-10">
                    Característica
                  </TableHead>
                  {comparisonPlans.map(plan => (
                    <TableHead key={plan.id} className="text-center min-w-[180px]">
                      <div className="space-y-1">
                        <p className="font-bold">{plan.name}</p>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                          {plan.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Pricing Section */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={comparisonPlans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Precios
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">Precio Mensual</TableCell>
                  {comparisonPlans.map(plan => (
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
                  {comparisonPlans.map(plan => (
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
                  <TableCell colSpan={comparisonPlans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                    <Building className="h-4 w-4 inline mr-2" />
                    Límites Principales
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    <Users className="h-4 w-4 inline mr-2 text-muted-foreground" />
                    Usuarios
                  </TableCell>
                  {comparisonPlans.map(plan => (
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
                  {comparisonPlans.map(plan => (
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
                  {comparisonPlans.map(plan => (
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
                  {comparisonPlans.map(plan => (
                    <TableCell key={plan.id} className="text-center font-semibold">
                      {formatLimit(plan.max_branches)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Additional Limits */}
                {allAdditionalLimits.length > 0 && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={comparisonPlans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                        Límites Adicionales
                      </TableCell>
                    </TableRow>
                    {allAdditionalLimits.map(limitKey => (
                      <TableRow key={limitKey}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10 capitalize">
                          {limitKey.replace(/_/g, ' ')}
                        </TableCell>
                        {comparisonPlans.map(plan => (
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
                      <TableCell colSpan={comparisonPlans.length + 1} className="font-bold sticky left-0 bg-muted/50 z-10">
                        Características
                      </TableCell>
                    </TableRow>
                    {allFeatures.map(featureKey => (
                      <TableRow key={featureKey}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                          {FEATURE_LABELS[featureKey] || featureKey.replace(/_/g, ' ')}
                        </TableCell>
                        {comparisonPlans.map(plan => (
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
        )}

        {/* Recommendation Cards */}
        {comparisonPlans.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Recomendaciones:</p>
            <div className="grid gap-3">
              {comparisonPlans.map(plan => (
                <Card key={plan.id} className="border-2">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Desde</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(plan.price_monthly, 'es', 'ARS')}/mes
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
