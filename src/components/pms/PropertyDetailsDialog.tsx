import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, User, Building, FileText, MapPin, Home, DollarSign, 
  Percent, Camera, Check, X, Car, Bath, Bed, Square, Maximize2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  code: string;
  address: string;
  street_name?: string;
  street_number?: string;
  floor?: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  barrio?: string;
  property_type: string;
  categoria?: string;
  status: string;
  habitaciones?: number;
  bedrooms?: number;
  bathrooms?: number;
  cocheras?: number;
  balcon?: boolean;
  patio?: boolean;
  baulera?: boolean;
  tiene_amenidades?: boolean;
  surface_total?: number;
  surface_covered?: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  description?: string;
  photos?: string[];
  alias?: string;
  operacion?: string;
  monto_alquiler?: number;
  alquiler_moneda?: string;
  valor_venta?: number;
  estado_publicacion?: string;
  admin_commission_percentage?: number;
  admin_commission_fixed_amount?: number;
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (property?.id && open) {
      fetchOwners();
      fetchContracts();
      setCurrentPhotoIndex(0);
    }
  }, [property?.id, open]);

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
            phone,
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
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Activa' },
      available: { variant: 'default', label: 'Disponible' },
      rented: { variant: 'secondary', label: 'Alquilada' },
      maintenance: { variant: 'destructive', label: 'Mantenimiento' },
      inactive: { variant: 'outline', label: 'Inactiva' },
    };
    const { variant, label } = config[status] || { variant: 'outline', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getContractStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      pending: { variant: 'outline', label: 'Pendiente' },
      completed: { variant: 'secondary', label: 'Finalizado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const { variant, label } = config[status] || { variant: 'outline', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'ARS') => {
    if (!amount || amount === 0) return '-';
    const prefix = currency === 'USD' ? 'USD ' : '$';
    return `${prefix}${amount.toLocaleString('es-AR')}`;
  };

  const buildFullAddress = () => {
    const parts = [];
    if (property.street_name) {
      let street = property.street_name;
      if (property.street_number) street += ` ${property.street_number}`;
      parts.push(street);
    }
    if (property.floor) parts.push(`Piso ${property.floor}`);
    if (property.apartment) parts.push(`Depto ${property.apartment}`);
    return parts.length > 0 ? parts.join(', ') : property.address;
  };

  const photos = property.photos || [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const FeatureBadge = ({ value, label, icon: Icon }: { value: boolean | undefined, label: string, icon?: any }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      value 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
        : 'bg-muted text-muted-foreground'
    }`}>
      {value ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {label}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-mono">{property.code}</span>
                    {property.alias && (
                      <span className="text-muted-foreground font-normal ml-2">• {property.alias}</span>
                    )}
                  </div>
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(property.status)}
                  {property.estado_publicacion && (
                    <Badge variant="outline" className="capitalize">
                      {property.estado_publicacion}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* GALERÍA DE FOTOS */}
              {hasPhotos && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      Galería de Fotos ({photos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photos[currentPhotoIndex]}
                          alt={`Foto ${currentPhotoIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {photos.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                            onClick={prevPhoto}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                            onClick={nextPhoto}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {photos.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentPhotoIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  idx === currentPhotoIndex 
                                    ? 'bg-white' 
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Thumbnails */}
                    {photos.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {photos.map((photo, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                              idx === currentPhotoIndex 
                                ? 'border-primary' 
                                : 'border-transparent hover:border-muted-foreground/30'
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`Miniatura ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* UBICACIÓN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-medium">{buildFullAddress()}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Ciudad</p>
                        <p className="font-medium">{property.city || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Barrio</p>
                        <p className="font-medium">{property.barrio || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Provincia</p>
                        <p className="font-medium">{property.state || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Código Postal</p>
                        <p className="font-medium">{property.postal_code || '-'}</p>
                      </div>
                    </div>
                    {property.country && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">País</p>
                        <p className="font-medium">{property.country}</p>
                      </div>
                    )}
                    {(property.latitude || property.longitude) && (
                      <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                        <div>
                          <p className="text-muted-foreground">Latitud</p>
                          <p className="font-mono text-xs">{property.latitude || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Longitud</p>
                          <p className="font-mono text-xs">{property.longitude || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CARACTERÍSTICAS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Características
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium capitalize">{property.property_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Categoría</p>
                        <p className="font-medium capitalize">{property.categoria || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Operación</p>
                        <p className="font-medium capitalize">{property.operacion || '-'}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Números */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ambientes</p>
                          <p className="font-semibold">{property.habitaciones || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Dormitorios</p>
                          <p className="font-semibold">{property.bedrooms || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Baños</p>
                          <p className="font-semibold">{property.bathrooms || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Cocheras</p>
                          <p className="font-semibold">{property.cocheras || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sup. Total</p>
                          <p className="font-semibold">{property.surface_total ? `${property.surface_total} m²` : '-'}</p>
                        </div>
                      </div>
                    </div>

                    {property.surface_covered && property.surface_covered > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Superficie Cubierta: </span>
                        <span className="font-medium">{property.surface_covered} m²</span>
                      </div>
                    )}

                    <Separator />

                    {/* Booleanos - Solo mostrar los que están activos */}
                    <div className="flex flex-wrap gap-2">
                      {property.balcon && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3.5 w-3.5" />
                          Balcón
                        </div>
                      )}
                      {property.patio && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3.5 w-3.5" />
                          Patio
                        </div>
                      )}
                      {property.baulera && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3.5 w-3.5" />
                          Baulera
                        </div>
                      )}
                      {property.tiene_amenidades && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3.5 w-3.5" />
                          Amenidades
                        </div>
                      )}
                      {!property.balcon && !property.patio && !property.baulera && !property.tiene_amenidades && (
                        <p className="text-sm text-muted-foreground">Sin características adicionales</p>
                      )}
                    </div>

                    {/* Amenities list */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-2">Amenidades:</p>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity, index) => (
                            <Badge key={index} variant="outline">{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* VALORES Y OPERACIÓN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Valores y Operación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Monto Alquiler</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(property.monto_alquiler, property.alquiler_moneda)}
                      </p>
                      {property.monto_alquiler && property.monto_alquiler > 0 && (
                        <p className="text-xs text-muted-foreground">mensual</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor de Venta</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(property.valor_venta, 'USD')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado Publicación</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {property.estado_publicacion || 'Sin definir'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* COMISIONES DE ADMINISTRACIÓN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Comisiones de Administración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Con contrato activo</p>
                      <p className="text-xl font-bold">
                        {property.admin_commission_percentage || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">sobre renta mensual</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sin contrato</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(property.admin_commission_fixed_amount, 'ARS')}
                      </p>
                      <p className="text-xs text-muted-foreground">monto fijo mensual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PROPIETARIOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Propietarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingOwners && (
                    <p className="text-sm text-muted-foreground">Cargando propietarios...</p>
                  )}
                  
                  {!loadingOwners && owners.length === 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ⚠ Esta propiedad no tiene propietarios asignados
                      </p>
                    </div>
                  )}

                  {!loadingOwners && owners.length > 0 && (
                    <div className="space-y-3">
                      {owners.map((ownerRel: any, index: number) => {
                        const owner = ownerRel.pms_owners;
                        const isCompany = owner.owner_type === 'company';
                        
                        return (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
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
                                <p className="font-medium">{owner.full_name}</p>
                                <p className="text-sm text-muted-foreground">{owner.email}</p>
                                {owner.phone && (
                                  <p className="text-sm text-muted-foreground">{owner.phone}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-base font-bold px-3 py-1">
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
                      <div className="flex justify-end pt-2">
                        {owners.reduce((sum: number, o: any) => sum + o.share_percent, 0) === 100 ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            <span>Total: 100%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <span>⚠ Total: {owners.reduce((sum: number, o: any) => sum + o.share_percent, 0)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* HISTORIAL DE CONTRATOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Historial de Contratos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingContracts && (
                    <p className="text-sm text-muted-foreground">Cargando contratos...</p>
                  )}
                  
                  {!loadingContracts && contracts.length === 0 && (
                    <div className="p-4 bg-muted/50 rounded-lg">
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
                              </TableCell>
                              <TableCell className="text-sm">{tenant?.full_name || 'N/A'}</TableCell>
                              <TableCell className="text-sm">{startDate}</TableCell>
                              <TableCell className="text-sm">{endDate}</TableCell>
                              <TableCell>
                                {getContractStatusBadge(contract.status)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-medium">
                                {contract.currency} {contract.monthly_rent?.toLocaleString('es-AR')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* DESCRIPCIÓN */}
              {property.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Descripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
