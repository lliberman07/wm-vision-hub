import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

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

interface OwnerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: Owner | null;
}

export const OwnerDetailsDialog = ({ open, onOpenChange, owner }: OwnerDetailsDialogProps) => {
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
            <Label className="text-muted-foreground">Estado</Label>
            <div>
              <Badge variant={owner.is_active ? 'default' : 'secondary'}>
                {owner.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
