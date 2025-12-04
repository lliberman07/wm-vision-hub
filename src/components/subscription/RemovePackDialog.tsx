import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Package, Building2, Users, FileText, Loader2 } from 'lucide-react';

interface RemovePackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  planName: string;
  planLimits: {
    max_properties: number | null;
    max_contracts: number | null;
    max_users: number | null;
    max_branches: number | null;
  };
  tenantId: string;
  onSuccess?: () => void;
}

interface UsageData {
  properties: number;
  contracts: number;
  users: number;
  branches: number;
}

interface SimulatedLimits {
  total_max_properties: number;
  total_max_contracts: number;
  total_max_users: number;
  total_max_branches: number;
}

export function RemovePackDialog({
  open,
  onOpenChange,
  subscriptionId,
  planName,
  planLimits,
  tenantId,
  onSuccess
}: RemovePackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);
  const [simulatedLimits, setSimulatedLimits] = useState<SimulatedLimits | null>(null);
  const [canRemove, setCanRemove] = useState(false);
  const [exceededResources, setExceededResources] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, subscriptionId, tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current usage
      const [propsRes, contractsRes, usersRes, branchesRes] = await Promise.all([
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'property' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'contract' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'user' }),
        supabase.rpc('check_tenant_limits', { p_tenant_id: tenantId, p_resource_type: 'branch' }),
      ]);

      const usage: UsageData = {
        properties: (propsRes.data as any)?.current_count || 0,
        contracts: (contractsRes.data as any)?.current_count || 0,
        users: (usersRes.data as any)?.current_count || 0,
        branches: (branchesRes.data as any)?.current_count || 0,
      };
      setCurrentUsage(usage);

      // Simulate limits without this subscription
      const { data: simData, error: simError } = await supabase.rpc('simulate_limits_without_subscription', {
        p_tenant_id: tenantId,
        p_subscription_id: subscriptionId
      });

      if (simError) throw simError;

      const simLimits: SimulatedLimits = simData?.[0] || {
        total_max_properties: 0,
        total_max_contracts: 0,
        total_max_users: 0,
        total_max_branches: 0
      };
      setSimulatedLimits(simLimits);

      // Check if removal is allowed
      const exceeded: string[] = [];
      if (usage.properties > (simLimits.total_max_properties || 0)) exceeded.push('Propiedades');
      if (usage.contracts > (simLimits.total_max_contracts || 0)) exceeded.push('Contratos');
      if (usage.users > (simLimits.total_max_users || 0)) exceeded.push('Usuarios');
      if (usage.branches > (simLimits.total_max_branches || 0)) exceeded.push('Sucursales');

      setExceededResources(exceeded);
      setCanRemove(exceeded.length === 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canRemove) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('subscription_change_requests')
        .insert({
          tenant_id: tenantId,
          current_plan_id: null, // Not applicable for remove_addon
          requested_plan_id: null, // Not applicable for remove_addon
          change_type: 'remove_addon',
          addon_subscription_id: subscriptionId,
          reason: `Solicitud de eliminación del pack ${planName}`,
          requested_by: userData.user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Solicitud enviada. El pack será eliminado una vez aprobada.');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const formatLimit = (value: number | null) => {
    if (value === null || value >= 9999) return 'Ilimitado';
    return value.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Eliminar Pack Adicional
          </DialogTitle>
          <DialogDescription>
            Solicitar eliminación del pack <strong>{planName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Capacidad del pack a eliminar */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Capacidad del pack a eliminar:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(planLimits.max_properties)} propiedades</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(planLimits.max_contracts)} contratos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(planLimits.max_users)} usuarios</span>
                </div>
              </div>
            </div>

            {/* Comparación de límites */}
            {currentUsage && simulatedLimits && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Comparación de capacidad:</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Recurso</th>
                        <th className="text-center p-2">Uso Actual</th>
                        <th className="text-center p-2">Nuevo Límite</th>
                        <th className="text-center p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Propiedades', usage: currentUsage.properties, limit: simulatedLimits.total_max_properties },
                        { label: 'Contratos', usage: currentUsage.contracts, limit: simulatedLimits.total_max_contracts },
                        { label: 'Usuarios', usage: currentUsage.users, limit: simulatedLimits.total_max_users },
                        { label: 'Sucursales', usage: currentUsage.branches, limit: simulatedLimits.total_max_branches },
                      ].map(({ label, usage, limit }) => {
                        const exceeded = usage > (limit || 0);
                        return (
                          <tr key={label} className={exceeded ? 'bg-destructive/10' : ''}>
                            <td className="p-2">{label}</td>
                            <td className="text-center p-2">{usage}</td>
                            <td className="text-center p-2">{formatLimit(limit)}</td>
                            <td className="text-center p-2">
                              {exceeded ? (
                                <Badge variant="destructive">Excede</Badge>
                              ) : (
                                <Badge variant="outline">OK</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alert si no se puede eliminar */}
            {!canRemove && exceededResources.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No es posible eliminar este pack</AlertTitle>
                <AlertDescription>
                  Tu uso actual de <strong>{exceededResources.join(', ')}</strong> excede la capacidad que tendrías sin este pack.
                  <br />
                  <span className="text-sm">
                    Para eliminar este pack, primero reduce tu uso de estos recursos.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Alert de confirmación si se puede eliminar */}
            {canRemove && (
              <Alert>
                <AlertTitle>Confirmar eliminación</AlertTitle>
                <AlertDescription>
                  Al eliminar este pack, tu capacidad total se reducirá. Esta acción requiere aprobación de Granada.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canRemove || submitting || loading}
          >
            {submitting ? 'Enviando...' : 'Solicitar Eliminación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}