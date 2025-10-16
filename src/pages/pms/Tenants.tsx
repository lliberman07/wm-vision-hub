import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TenantForm } from '@/components/pms/TenantForm';
import { TenantDetailsDialog } from '@/components/pms/TenantDetailsDialog';
import { PMSLayout } from '@/components/pms/PMSLayout';

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

const Tenants = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTenant, setDetailsTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }
    fetchTenants();
  }, [user, hasPMSAccess, navigate]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_tenants_renters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast.error('Error al cargar inquilinos', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.document_number.includes(searchTerm)
  );

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inquilinos</h1>
            <p className="text-muted-foreground">{currentTenant?.name}</p>
          </div>
          <Button onClick={() => { setSelectedTenant(undefined); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Inquilino
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Inquilinos</CardTitle>
            <CardDescription>Administra información de los arrendatarios</CardDescription>
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
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron inquilinos
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
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.full_name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phone || '-'}</TableCell>
                      <TableCell>{tenant.document_type} {tenant.document_number}</TableCell>
                      <TableCell>{tenant.tenant_type}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                          {tenant.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setDetailsTenant(tenant); 
                            setIsDetailsOpen(true); 
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTenant(tenant); setIsFormOpen(true); }}>
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

        <TenantForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchTenants}
          tenant={selectedTenant}
        />

        <TenantDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          tenant={detailsTenant}
        />
      </div>
    </PMSLayout>
  );
};

export default Tenants;
