import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Eye, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

const Properties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      setProperties(data || []);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/pms')} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Propiedades</h1>
            <p className="text-muted-foreground">{currentTenant?.name}</p>
          </div>
          <Button onClick={() => toast.info('Funcionalidad en desarrollo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Propiedad
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Propiedades</CardTitle>
            <CardDescription>Administra el portafolio de inmuebles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, dirección o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron propiedades
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Dormitorios</TableHead>
                    <TableHead>Superficie</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.code}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>{property.city}</TableCell>
                      <TableCell>{property.property_type}</TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell>{property.bedrooms || '-'}</TableCell>
                      <TableCell>{property.surface_total ? `${property.surface_total} m²` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toast.info('Ver detalles')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('Editar')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Properties;
