import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Owner {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_type: string;
  document_number: string;
  owner_type: string;
  is_active: boolean;
  address?: string;
  city?: string;
  tax_id?: string;
  notes?: string;
}

interface OwnerProperty {
  property_id: string;
  property_code: string;
  property_address: string;
  share_percent: number;
  has_active_contract: boolean;
  contract_id?: string;
  is_clone: boolean;
}

interface OwnerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: Owner | null;
}

export const OwnerDetailsDialog = ({ open, onOpenChange, owner }: OwnerDetailsDialogProps) => {
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const fetchOwnerProperties = async () => {
    if (!owner?.id) return;
    
    setLoadingProperties(true);
    try {
      const { data, error } = await supabase
        .from('pms_owner_properties')
        .select(`
          property_id,
          share_percent,
          pms_properties!inner (
            code,
            address,
            is_clone
          )
        `)
        .eq('owner_id', owner.id)
        .is('end_date', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const propertiesWithContracts = await Promise.all(
        (data || []).map(async (op) => {
          const { data: contract } = await supabase
            .from('pms_contracts')
            .select('id')
            .eq('property_id', op.property_id)
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString().split('T')[0])
            .gte('end_date', new Date().toISOString().split('T')[0])
            .maybeSingle();

          return {
            property_id: op.property_id,
            property_code: op.pms_properties.code,
            property_address: op.pms_properties.address,
            share_percent: op.share_percent,
            has_active_contract: !!contract,
            contract_id: contract?.id,
            is_clone: op.pms_properties.is_clone
          };
        })
      );

      setProperties(propertiesWithContracts);
    } catch (error) {
      console.error('Error fetching owner properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (open && owner?.id) {
      fetchOwnerProperties();
    }
  }, [open, owner?.id]);

  if (!owner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Propietario</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre Completo</Label>
              <p className="font-medium">{owner.full_name}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{owner.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Teléfono</Label>
              <p className="font-medium">{owner.phone || 'No especificado'}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo de Documento</Label>
              <p className="font-medium">{owner.document_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Número de Documento</Label>
              <p className="font-medium">{owner.document_number}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo de Propietario</Label>
              <p className="font-medium">{owner.owner_type}</p>
            </div>
          </div>

          {owner.tax_id && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">CUIT/CUIL</Label>
              <p className="font-medium">{owner.tax_id}</p>
            </div>
          )}

          {(owner.address || owner.city) && (
            <div className="grid grid-cols-2 gap-4">
              {owner.address && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{owner.address}</p>
                </div>
              )}
              
              {owner.city && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="font-medium">{owner.city}</p>
                </div>
              )}
            </div>
          )}

          {owner.notes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Notas</Label>
              <p className="font-medium">{owner.notes}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Estado</Label>
              <Badge variant={owner.is_active ? 'default' : 'secondary'}>
                {owner.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Propiedades del Propietario */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-muted-foreground font-semibold">
              Propiedades ({properties.length})
            </Label>
            
            {loadingProperties ? (
              <p className="text-sm text-muted-foreground">Cargando propiedades...</p>
            ) : properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este propietario no tiene propiedades asignadas actualmente.
              </p>
            ) : (
              <div className="space-y-2">
                {properties.map((prop) => (
                  <div 
                    key={prop.property_id} 
                    className="p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {prop.property_code}
                          </p>
                          {prop.is_clone && (
                            <Badge variant="outline" className="text-xs">
                              Clonada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {prop.property_address}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {prop.share_percent}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <Badge 
                        variant={prop.has_active_contract ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {prop.has_active_contract ? '✓ Contrato VIGENTE' : 'Sin contrato vigente'}
                      </Badge>
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
