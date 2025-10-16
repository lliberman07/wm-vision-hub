import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

interface Property {
  id: string;
  code: string;
  address: string;
  city: string;
  property_type: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_total?: number;
  surface_covered?: number;
  floor?: string;
  apartment?: string;
  notes?: string;
  photos?: string[];
}

interface PropertyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
}

export const PropertyDetailsDialog = ({ open, onOpenChange, property }: PropertyDetailsDialogProps) => {
  if (!property) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'default',
      rented: 'secondary',
      maintenance: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalles de la Propiedad
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Código</Label>
              <p className="font-mono font-medium">{property.code}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Estado</Label>
              <div>{getStatusBadge(property.status)}</div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Dirección</Label>
            <p className="font-medium">{property.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Ciudad</Label>
              <p className="font-medium">{property.city}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium">{property.property_type}</p>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-4">
            {property.bedrooms && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Habitaciones</Label>
                <p className="font-medium">{property.bedrooms}</p>
              </div>
            )}
            {property.bathrooms && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Baños</Label>
                <p className="font-medium">{property.bathrooms}</p>
              </div>
            )}
            {property.surface_total && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Superficie Total</Label>
                <p className="font-medium">{property.surface_total} m²</p>
              </div>
            )}
          </div>

          {(property.surface_covered || property.floor || property.apartment) && (
            <div className="grid grid-cols-3 gap-4">
              {property.surface_covered && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Superficie Cubierta</Label>
                  <p className="font-medium">{property.surface_covered} m²</p>
                </div>
              )}
              {property.floor && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Piso</Label>
                  <p className="font-medium">{property.floor}</p>
                </div>
              )}
              {property.apartment && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Departamento</Label>
                  <p className="font-medium">{property.apartment}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {property.notes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Notas</Label>
              <p className="text-sm">{property.notes}</p>
            </div>
          )}

          {/* Photos */}
          {property.photos && property.photos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Fotos ({property.photos.length})</Label>
              <div className="grid grid-cols-4 gap-2">
                {property.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
