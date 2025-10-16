import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

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

interface TenantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export const TenantDetailsDialog = ({ open, onOpenChange, tenant }: TenantDetailsDialogProps) => {
  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
