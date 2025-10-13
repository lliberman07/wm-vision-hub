import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PropertyForm } from '@/components/pms/PropertyForm';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { FilterBar } from '@/components/pms/FilterBar';
import { EmptyState } from '@/components/pms/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

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
  photos?: string[];
}

const Properties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }
    fetchProperties();
  }, [user, hasPMSAccess, navigate]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data || []).map(p => ({
        ...p,
        photos: Array.isArray(p.photos) ? (p.photos as string[]) : []
      })) as Property[]);
    } catch (error: any) {
      toast.error('Error al cargar propiedades', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'default',
      rented: 'secondary',
      maintenance: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Propiedades</h1>
              <p className="text-muted-foreground mt-1">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'inmueble registrado' : 'inmuebles registrados'}
              </p>
            </div>
            <Button onClick={() => { setSelectedProperty(undefined); setIsFormOpen(true); }} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Content */}
        <Card className="card-elevated">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 mb-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No hay propiedades registradas"
                description="Comienza agregando tu primera propiedad al sistema"
                actionLabel="+ Nueva Propiedad"
                onAction={() => { setSelectedProperty(undefined); setIsFormOpen(true); }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fotos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-mono">{property.code}</TableCell>
                        <TableCell className="font-medium">{property.address}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.property_type}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {property.bedrooms && `${property.bedrooms} hab`}
                            {property.bathrooms && ` • ${property.bathrooms} baños`}
                            {property.surface_total && ` • ${property.surface_total}m²`}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>
                          {property.photos && property.photos.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{property.photos.length}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProperty(property);
                              setIsFormOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <PropertyForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchProperties}
          property={selectedProperty}
        />
      </div>
    </PMSLayout>
  );
};

export default Properties;
