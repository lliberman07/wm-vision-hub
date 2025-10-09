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

interface Owner {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_type: string;
  document_number: string;
  owner_type: string;
  is_active: boolean;
}

const Owners = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }
    fetchOwners();
  }, [user, hasPMSAccess, navigate]);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_owners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOwners(data || []);
    } catch (error: any) {
      toast.error('Error al cargar propietarios', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOwners = owners.filter(owner =>
    owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.document_number.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/pms')} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Propietarios</h1>
            <p className="text-muted-foreground">{currentTenant?.name}</p>
          </div>
          <Button onClick={() => toast.info('Funcionalidad en desarrollo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Propietario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Propietarios</CardTitle>
            <CardDescription>Administra información de los dueños de propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredOwners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron propietarios
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.full_name}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.phone || '-'}</TableCell>
                      <TableCell>{owner.document_type} {owner.document_number}</TableCell>
                      <TableCell>{owner.owner_type}</TableCell>
                      <TableCell>
                        <Badge variant={owner.is_active ? 'default' : 'secondary'}>
                          {owner.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
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

export default Owners;
