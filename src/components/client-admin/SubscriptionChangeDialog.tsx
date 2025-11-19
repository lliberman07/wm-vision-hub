import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, TrendingUp, TrendingDown, Users, Building, FileText, Building2 } from 'lucide-react';

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
  onSuccess?: () => void;
}

export function SubscriptionChangeDialog({
  open,
  onOpenChange,
  currentPlanId,
  currentPlanName,
  tenantId,
  billingCycle,
  onSuccess
}: SubscriptionChangeDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

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

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_change_requests')
        .insert({
          tenant_id: tenantId,
          current_plan_id: currentPlanId,
          requested_plan_id: selectedPlanId,
          reason: reason.trim(),
          requested_by: userData.user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Solicitud enviada. Recibirás una notificación cuando sea revisada.');
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
    return limit === null ? 'Ilimitado' : limit.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Plan actual: <span className="font-semibold">{currentPlanName}</span>. Selecciona el nuevo plan deseado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando planes...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isSelected = plan.id === selectedPlanId;
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

                return (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isCurrent ? 'opacity-60' : 'hover:shadow-lg'}`}
                    onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
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

            {selectedPlanId && selectedPlanId !== currentPlanId && (
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
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Motivo del cambio *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Indica por qué necesitas cambiar de plan..."
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
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
