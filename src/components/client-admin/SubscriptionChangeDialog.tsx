import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, TrendingUp, TrendingDown, Users, Building, FileText, Building2, AlertTriangle, Plus, RefreshCw } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency?: string;
  max_users: number | null;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number | null;
  features: any;
}

interface SubscriptionChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId: string;
  currentPlanName: string;
  tenantId: string;
  billingCycle: 'monthly' | 'yearly';
  initialChangeType?: 'replacement' | 'addon';
  onSuccess?: () => void;
}

interface UsageData {
  properties: { current: number; limit: number };
  contracts: { current: number; limit: number };
  users: { current: number; limit: number };
  branches: { current: number; limit: number };
}

export function SubscriptionChangeDialog({
  open,
  onOpenChange,
  currentPlanId,
  currentPlanName,
  tenantId,
  billingCycle,
  initialChangeType = 'replacement',
  onSuccess
}: SubscriptionChangeDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [changeType, setChangeType] = useState<'replacement' | 'addon'>(initialChangeType);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);
  const [downgradeBlocked, setDowngradeBlocked] = useState(false);
  const [exceededResources, setExceededResources] = useState<{ resource: string; current: number; newLimit: number }[]>([]);

  useEffect(() => {
    if (open) {
      setChangeType(initialChangeType);
      fetchPlans();
      fetchCurrentUsage();
    }
  }, [open, initialChangeType]);

  useEffect(() => {
    // Recalculate downgrade validation when selected plan or change type changes
    if (selectedPlanId && currentUsage && changeType === 'replacement') {
      validateDowngrade();
    } else {
      setDowngradeBlocked(false);
      setExceededResources([]);
    }
  }, [selectedPlanId, changeType, currentUsage]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUsage = async () => {
    try {
      const [propsRes, contractsRes, usersRes, branchesRes] = await Promise.all([
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'property' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'contract' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'user' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'branch' }),
      ]);

      setCurrentUsage({
        properties: { current: (propsRes.data as any)?.current_count || 0, limit: (propsRes.data as any)?.limit || 0 },
        contracts: { current: (contractsRes.data as any)?.current_count || 0, limit: (contractsRes.data as any)?.limit || 0 },
        users: { current: (usersRes.data as any)?.current_count || 0, limit: (usersRes.data as any)?.limit || 0 },
        branches: { current: (branchesRes.data as any)?.current_count || 0, limit: (branchesRes.data as any)?.limit || 0 },
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const validateDowngrade = () => {
    if (!selectedPlanId || !currentUsage) return;

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    const exceeded: { resource: string; current: number; newLimit: number }[] = [];

    // For replacement, check if usage exceeds new plan limits
    if ((selectedPlan.max_properties ?? 9999) < currentUsage.properties.current) {
      exceeded.push({ resource: 'Propiedades', current: currentUsage.properties.current, newLimit: selectedPlan.max_properties ?? 9999 });
    }
    if ((selectedPlan.max_contracts ?? 9999) < currentUsage.contracts.current) {
      exceeded.push({ resource: 'Contratos', current: currentUsage.contracts.current, newLimit: selectedPlan.max_contracts ?? 9999 });
    }
    if ((selectedPlan.max_users ?? 9999) < currentUsage.users.current) {
      exceeded.push({ resource: 'Usuarios', current: currentUsage.users.current, newLimit: selectedPlan.max_users ?? 9999 });
    }
    if ((selectedPlan.max_branches ?? 9999) < currentUsage.branches.current) {
      exceeded.push({ resource: 'Sucursales', current: currentUsage.branches.current, newLimit: selectedPlan.max_branches ?? 9999 });
    }

    setExceededResources(exceeded);
    setDowngradeBlocked(exceeded.length > 0);
  };

  const getCurrentPlan = () => plans.find(p => p.id === currentPlanId);
  const getSelectedPlan = () => plans.find(p => p.id === selectedPlanId);

  const isUpgrade = () => {
    const current = getCurrentPlan();
    const selected = getSelectedPlan();
    if (!current || !selected) return false;
    
    const currentPrice = billingCycle === 'monthly' ? current.price_monthly : current.price_yearly;
    const selectedPrice = billingCycle === 'monthly' ? selected.price_monthly : selected.price_yearly;
    
    return selectedPrice > currentPrice;
  };

  const getPriceDifference = () => {
    const current = getCurrentPlan();
    const selected = getSelectedPlan();
    if (!current || !selected) return 0;
    
    const currentPrice = billingCycle === 'monthly' ? current.price_monthly : current.price_yearly;
    const selectedPrice = billingCycle === 'monthly' ? selected.price_monthly : selected.price_yearly;
    
    return Math.abs(selectedPrice - currentPrice);
  };

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error('Selecciona un plan');
      return;
    }

    if (!reason.trim()) {
      toast.error('Indica el motivo del cambio');
      return;
    }

    if (changeType === 'replacement' && downgradeBlocked) {
      toast.error('No puedes cambiar a este plan con tu uso actual');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_change_requests')
        .insert({
          tenant_id: tenantId,
          current_plan_id: currentPlanId,
          requested_plan_id: selectedPlanId,
          change_type: changeType,
          reason: reason.trim(),
          requested_by: userData.user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(
        changeType === 'addon' 
          ? 'Solicitud de pack adicional enviada. Recibirás notificación cuando sea aprobada.'
          : 'Solicitud de cambio de plan enviada. Recibirás notificación cuando sea revisada.'
      );
      onOpenChange(false);
      setSelectedPlanId(null);
      setReason('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting change request:', error);
      toast.error('Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const getLimitIcon = (type: string) => {
    switch (type) {
      case 'users': return Users;
      case 'properties': return Building;
      case 'contracts': return FileText;
      case 'branches': return Building2;
      default: return Users;
    }
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit >= 9999) return 'Ilimitado';
    return limit.toString();
  };

  const selectedPlan = getSelectedPlan();
  const currentPlan = getCurrentPlan();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {changeType === 'addon' ? 'Agregar Capacidad (Pack Adicional)' : 'Cambiar Plan de Suscripción'}
          </DialogTitle>
          <DialogDescription>
            Plan actual: <span className="font-semibold">{currentPlanName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando planes...</div>
        ) : (
          <div className="space-y-6">
            {/* Selector de tipo de cambio */}
            <div className="space-y-3">
              <Label>Tipo de cambio</Label>
              <RadioGroup 
                value={changeType} 
                onValueChange={(value) => setChangeType(value as 'replacement' | 'addon')}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${changeType === 'replacement' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                  <RadioGroupItem value="replacement" id="replacement" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="replacement" className="cursor-pointer flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Cambiar plan base
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reemplaza tu plan actual por el seleccionado
                    </p>
                  </div>
                </div>
                <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${changeType === 'addon' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                  <RadioGroupItem value="addon" id="addon" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="addon" className="cursor-pointer flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar como pack adicional
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Suma capacidad a tu plan actual
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Grid de planes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isSelected = plan.id === selectedPlanId;
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

                // For addon mode, don't show current plan as selectable
                const isDisabled = changeType === 'replacement' ? isCurrent : false;

                return (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}`}
                    onClick={() => !isDisabled && setSelectedPlanId(plan.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.name}
                            {isCurrent && <Badge variant="outline">Actual</Badge>}
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {plan.description || 'Sin descripción'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-3xl font-bold mt-4">
                        {plan.currency || 'ARS'} ${price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'mes' : 'año'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { type: 'users', label: 'Usuarios', value: plan.max_users },
                          { type: 'properties', label: 'Propiedades', value: plan.max_properties },
                          { type: 'contracts', label: 'Contratos', value: plan.max_contracts },
                          { type: 'branches', label: 'Sucursales', value: plan.max_branches }
                        ].map(({ type, label, value }) => {
                          const Icon = getLimitIcon(type);
                          return (
                            <div key={type} className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{label}: {formatLimit(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Downgrade blocked alert */}
            {changeType === 'replacement' && downgradeBlocked && exceededResources.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No es posible cambiar a este plan</AlertTitle>
                <AlertDescription className="mt-2">
                  Tu uso actual excede los límites del plan seleccionado:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {exceededResources.map(({ resource, current, newLimit }) => (
                      <li key={resource}>
                        <strong>{resource}:</strong> {current} activos (límite: {newLimit}) - 
                        <span className="text-destructive font-medium"> reducir {current - newLimit}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Addon calculation preview */}
            {changeType === 'addon' && selectedPlan && currentPlan && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Nueva Capacidad Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {[
                      { label: 'Propiedades', current: currentPlan.max_properties, added: selectedPlan.max_properties },
                      { label: 'Contratos', current: currentPlan.max_contracts, added: selectedPlan.max_contracts },
                      { label: 'Usuarios', current: currentPlan.max_users, added: selectedPlan.max_users },
                      { label: 'Sucursales', current: currentPlan.max_branches, added: selectedPlan.max_branches },
                    ].map(({ label, current, added }) => {
                      const currentVal = current ?? 9999;
                      const addedVal = added ?? 9999;
                      const total = currentVal >= 9999 || addedVal >= 9999 ? null : currentVal + addedVal;
                      return (
                        <div key={label} className="p-2 bg-background rounded">
                          <p className="text-muted-foreground text-xs">{label}</p>
                          <p className="font-medium">
                            {formatLimit(current)} + {formatLimit(added)} = <span className="text-primary font-bold">{formatLimit(total)}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Replacement change summary */}
            {changeType === 'replacement' && selectedPlanId && selectedPlanId !== currentPlanId && !downgradeBlocked && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isUpgrade() ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Upgrade de Plan
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                        Downgrade de Plan
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Diferencia: ${getPriceDifference().toLocaleString()} {getCurrentPlan()?.currency || 'ARS'} por {billingCycle === 'monthly' ? 'mes' : 'año'}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Reason and submit */}
            {selectedPlanId && (changeType === 'addon' || (changeType === 'replacement' && !downgradeBlocked)) && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Motivo del cambio *</Label>
                  <Textarea
                    id="reason"
                    placeholder={changeType === 'addon' 
                      ? "Indica por qué necesitas capacidad adicional..."
                      : "Indica por qué necesitas cambiar de plan..."
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Proceso de cambio:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Tu solicitud será revisada por el equipo de Granada</li>
                    <li>Recibirás una notificación por email con la decisión</li>
                    <li>Si se aprueba, el cambio será efectivo inmediatamente</li>
                    <li>La facturación se ajustará en el próximo ciclo</li>
                  </ol>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}