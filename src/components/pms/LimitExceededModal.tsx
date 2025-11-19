import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LimitExceededModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'property' | 'user' | 'contract';
  tenantId: string;
  onRetry?: () => void;
}

const typeConfig = {
  property: {
    label: 'Propiedad',
    plural: 'Propiedades',
    icon: Building2,
    route: '/pms/properties',
    getActiveQuery: (tenantId: string) =>
      supabase.rpc('get_tenant_active_properties', { p_tenant_id: tenantId }),
  },
  user: {
    label: 'Usuario',
    plural: 'Usuarios',
    icon: Users,
    route: '/client-admin/users',
    getActiveQuery: (tenantId: string) =>
      supabase
        .from('user_roles')
        .select('user_id, users(email)')
        .eq('tenant_id', tenantId)
        .eq('module', 'PMS')
        .eq('status', 'approved'),
  },
  contract: {
    label: 'Contrato',
    plural: 'Contratos',
    icon: FileText,
    route: '/pms/contracts',
    getActiveQuery: (tenantId: string) =>
      supabase
        .from('pms_contracts')
        .select('id, contract_number')
        .eq('tenant_id', tenantId)
        .eq('status', 'active'),
  },
};

export function LimitExceededModal({
  open,
  onOpenChange,
  resourceType,
  tenantId,
  onRetry,
}: LimitExceededModalProps) {
  const navigate = useNavigate();
  const config = typeConfig[resourceType];
  const Icon = config.icon;
  const [activeResources, setActiveResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadActiveResources();
    }
  }, [open, resourceType, tenantId]);

  const loadActiveResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await config.getActiveQuery(tenantId);
      if (!error && data) {
        setActiveResources(data);
      }
    } catch (error) {
      console.error('Error loading active resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResources = () => {
    navigate(config.route + '?filter=active');
    onOpenChange(false);
  };

  const handleUpgradePlan = () => {
    navigate('/client-admin/subscription');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Límite de {config.plural} Alcanzado
          </DialogTitle>
          <DialogDescription>
            Has alcanzado el límite de {config.plural.toLowerCase()} de tu plan de suscripción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Icon className="h-4 w-4" />
            <AlertDescription>
              Para agregar una nueva {config.label.toLowerCase()}, debes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Cambiar otra {config.label.toLowerCase()} a estado "No Activa" (no consume límite), o</li>
                <li>Actualizar tu plan de suscripción a uno superior</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!loading && activeResources.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">{config.plural} Activas ({activeResources.length})</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {activeResources.slice(0, 10).map((resource, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {resourceType === 'property' && `• ${resource.code} - ${resource.address}`}
                    {resourceType === 'user' && `• ${resource.users?.email || 'Usuario'}`}
                    {resourceType === 'contract' && `• Contrato ${resource.contract_number}`}
                  </div>
                ))}
                {activeResources.length > 10 && (
                  <p className="text-sm text-muted-foreground italic">
                    ... y {activeResources.length - 10} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleViewResources}>
            <Icon className="h-4 w-4 mr-2" />
            Administrar {config.plural}
          </Button>
          <Button className="gap-2" onClick={handleUpgradePlan}>
            <TrendingUp className="h-4 w-4" />
            Actualizar Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
