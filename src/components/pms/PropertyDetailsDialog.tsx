import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, User, Building, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  alquiler_moneda?: string;
  valor_venta?: number;
  estado_publicacion?: string;
}

interface PropertyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
}

export const PropertyDetailsDialog = ({ open, onOpenChange, property }: PropertyDetailsDialogProps) => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  useEffect(() => {
    if (property?.id) {
      fetchOwners();
      fetchContracts();
    }
  }, [property?.id]);

  const fetchOwners = async () => {
    if (!property?.id) return;
    
    setLoadingOwners(true);
    try {
      const { data, error } = await supabase
        .from('pms_owner_properties')
        .select(`
          share_percent,
          start_date,
          end_date,
          pms_owners!inner(
            id,
            full_name,
            email,
            owner_type
          )
        `)
        .eq('property_id', property.id)
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0])
        .order('share_percent', { ascending: false });

      if (error) throw error;
      setOwners(data || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  const fetchContracts = async () => {
    if (!property?.id) return;
    
    setLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('pms_contracts')
        .select(`
          id,
          contract_number,
          start_date,
          end_date,
          status,
          monthly_rent,
          currency,
          tenant_renter_id,
          pms_tenants_renters!inner(full_name)
        `)
        .eq('property_id', property.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

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
                  <p className="font-medium">
                    {property.alquiler_moneda === 'USD' ? 'USD ' : '$'}
                    {property.monto_alquiler.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </p>
                </div>
              )}
              {property.valor_venta && property.valor_venta > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Valor Venta</Label>
                  <p className="font-medium">
                    USD ${property.valor_venta.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </p>
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

          {/* Propietarios */}
          {owners.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Propietarios
              </Label>
              <div className="space-y-2">
                {owners.map((ownerRel: any, index: number) => {
                  const owner = ownerRel.pms_owners;
                  const isCompany = owner.owner_type === 'company';
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          {isCompany ? (
                            <Building className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {owner.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {owner.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-semibold">
                          {ownerRel.share_percent}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isCompany ? 'Empresa' : 'Persona'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Total Check */}
                {owners.reduce((sum: number, o: any) => sum + o.share_percent, 0) === 100 ? (
                  <div className="flex items-center justify-end gap-2 text-xs text-green-600 dark:text-green-400">
                    <span>✓ Total: 100%</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <span>⚠ Total: {owners.reduce((sum: number, o: any) => sum + o.share_percent, 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {loadingOwners && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-muted-foreground">Propietarios</Label>
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          )}

          {!loadingOwners && owners.length === 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-muted-foreground">Propietarios</Label>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠ Esta propiedad no tiene propietarios asignados
                </p>
              </div>
            </div>
          )}

          {/* FASE 4: Historial de Contratos */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Historial de Contratos
            </Label>
            
            {loadingContracts && (
              <p className="text-sm text-muted-foreground">Cargando contratos...</p>
            )}
            
            {!loadingContracts && contracts.length === 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Esta propiedad no tiene contratos registrados
                </p>
              </div>
            )}
            
            {!loadingContracts && contracts.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const isActive = contract.status === 'active';
                    const startDate = new Date(contract.start_date).toLocaleDateString('es-AR');
                    const endDate = new Date(contract.end_date).toLocaleDateString('es-AR');
                    const tenant = contract.pms_tenants_renters;
                    
                    return (
                      <TableRow 
                        key={contract.id}
                        className={isActive ? 'bg-green-50 dark:bg-green-950/20' : ''}
                      >
                        <TableCell className="font-mono text-sm">
                          {contract.contract_number}
                          {isActive && (
                            <Badge variant="default" className="ml-2">Activo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{tenant?.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{startDate}</TableCell>
                        <TableCell className="text-sm">{endDate}</TableCell>
                        <TableCell>
                          <Badge variant={
                            isActive ? 'default' :
                            contract.status === 'completed' ? 'secondary' :
                            'destructive'
                          }>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {contract.currency} {contract.monthly_rent?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

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
