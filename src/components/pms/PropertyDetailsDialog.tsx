import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

interface Property {
  id: string;
  code: string;
  address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  property_type: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_total?: number;
  surface_covered?: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  description?: string;
  photos?: string[];
  alias?: string;
  categoria?: string;
  barrio?: string;
  operacion?: string;
  monto_alquiler?: number;
  valor_venta?: number;
  estado_publicacion?: string;
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

          {/* Alias */}
          {property.alias && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Alias</Label>
              <p className="font-medium">{property.alias}</p>
            </div>
          )}

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
            {property.barrio && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Barrio</Label>
                <p className="font-medium">{property.barrio}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {property.state && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Provincia/Estado</Label>
                <p className="font-medium">{property.state}</p>
              </div>
            )}
            {property.postal_code && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Código Postal</Label>
                <p className="font-medium">{property.postal_code}</p>
              </div>
            )}
            {property.country && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">País</Label>
                <p className="font-medium">{property.country}</p>
              </div>
            )}
          </div>

          {/* Property Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium">{property.property_type}</p>
            </div>
            {property.categoria && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Categoría</Label>
                <p className="font-medium">{property.categoria}</p>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-4">
            {property.bedrooms && property.bedrooms > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Habitaciones</Label>
                <p className="font-medium">{property.bedrooms}</p>
              </div>
            )}
            {property.bathrooms && property.bathrooms > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Baños</Label>
                <p className="font-medium">{property.bathrooms}</p>
              </div>
            )}
          </div>

          {/* Surfaces */}
          {(property.surface_total && property.surface_total > 0) || (property.surface_covered && property.surface_covered > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              {property.surface_total && property.surface_total > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Superficie Total</Label>
                  <p className="font-medium">{property.surface_total} m²</p>
                </div>
              )}
              {property.surface_covered && property.surface_covered > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Superficie Cubierta</Label>
                  <p className="font-medium">{property.surface_covered} m²</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Operation & Prices */}
          {property.operacion && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Operación</Label>
              <p className="font-medium">{property.operacion}</p>
            </div>
          )}

          {(property.monto_alquiler && property.monto_alquiler > 0) || (property.valor_venta && property.valor_venta > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              {property.monto_alquiler && property.monto_alquiler > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Monto Alquiler</Label>
                  <p className="font-medium">${property.monto_alquiler.toLocaleString()}</p>
                </div>
              )}
              {property.valor_venta && property.valor_venta > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Valor Venta</Label>
                  <p className="font-medium">${property.valor_venta.toLocaleString()}</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Estado Publicación */}
          {property.estado_publicacion && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Estado de Publicación</Label>
              <p className="font-medium capitalize">{property.estado_publicacion}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline">{amenity}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Descripción</Label>
              <p className="text-sm">{property.description}</p>
            </div>
          )}

          {/* Coordinates */}
          {((property.latitude && property.latitude !== 0) || (property.longitude && property.longitude !== 0)) && (
            <div className="grid grid-cols-2 gap-4">
              {property.latitude && property.latitude !== 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Latitud</Label>
                  <p className="font-mono text-sm">{property.latitude}</p>
                </div>
              )}
              {property.longitude && property.longitude !== 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Longitud</Label>
                  <p className="font-mono text-sm">{property.longitude}</p>
                </div>
              )}
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
