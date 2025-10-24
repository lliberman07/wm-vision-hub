import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { parseDateFromDB } from '@/utils/dateUtils';

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_type: string;
  document_number: string;
  tenant_type: string;
  is_active: boolean;
}

interface TenantContract {
  id: string;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
}

interface TenantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export const TenantDetailsDialog = ({ open, onOpenChange, tenant }: TenantDetailsDialogProps) => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<TenantContract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant && open) {
      fetchTenantContracts();
    }
  }, [tenant, open]);

  const fetchTenantContracts = async () => {
    if (!tenant) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pms_contracts')
        .select('id, contract_number, status, start_date, end_date, monthly_rent, currency')
        .eq('tenant_renter_id', tenant.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      draft: { variant: 'secondary', label: 'Borrador' },
      expired: { variant: 'outline', label: 'Vencido' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const config = configs[status] || { variant: 'outline' as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isActiveContract = (contract: TenantContract) => {
    return contract.status === 'active' && 
           new Date(contract.start_date) <= new Date() && 
           new Date(contract.end_date) >= new Date();
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Inquilino</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre Completo</Label>
              <p className="font-medium">{tenant.full_name}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{tenant.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Teléfono</Label>
              <p className="font-medium">{tenant.phone || 'No especificado'}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo de Documento</Label>
              <p className="font-medium">{tenant.document_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Número de Documento</Label>
              <p className="font-medium">{tenant.document_number}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo de Inquilino</Label>
              <p className="font-medium">{tenant.tenant_type}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Estado</Label>
            <div>
              <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                {tenant.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Sección de Contratos */}
          <div className="col-span-2 border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Contratos Asociados</Label>
            </div>
            
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando contratos...</p>
            ) : contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay contratos registrados</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`border rounded-lg p-3 ${
                      isActiveContract(contract) 
                        ? 'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{contract.contract_number}</p>
                          {getStatusBadge(contract.status)}
                          {isActiveContract(contract) && (
                            <Badge variant="outline" className="text-xs bg-sky-100 dark:bg-sky-900 border-sky-300">
                              Vigente
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseDateFromDB(contract.start_date), 'dd/MM/yyyy')} → {format(parseDateFromDB(contract.end_date), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {contract.currency} {contract.monthly_rent.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate(`/pms/contracts?highlight=${contract.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
