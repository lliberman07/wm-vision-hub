import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Building2, Edit, Eye } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  slug: string;
  client_type: string;
  is_active: boolean;
  created_at: string;
  subscription_status?: string;
  parent_tenant_id?: string;
  parent_tenant?: {
    name: string;
  };
}

export function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    client_type: 'INMOBILIARIA' as 'INMOBILIARIA' | 'ADMINISTRADOR_INDEPENDIENTE' | 'PROPIETARIO',
    parent_tenant_id: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_tenants')
        .select(`
          id,
          name,
          slug,
          client_type,
          is_active,
          created_at,
          parent_tenant_id,
          parent_tenant:parent_tenant_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if slug already exists
      const { data: existing } = await supabase
        .from('pms_tenants')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existing) {
        toast({
          title: 'Error',
          description: 'Ya existe un cliente con ese identificador',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('pms_tenants')
        .insert({
          name: formData.name,
          slug: formData.slug,
          client_type: formData.client_type,
          parent_tenant_id: formData.parent_tenant_id || null,
          is_active: true,
          tenant_type: 'inmobiliaria', // Default for compatibility
        });

      if (error) throw error;

      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado exitosamente',
      });

      setDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        client_type: 'INMOBILIARIA',
        parent_tenant_id: '',
      });
      fetchClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'INMOBILIARIA':
        return 'default';
      case 'ADMINISTRADOR_INDEPENDIENTE':
        return 'secondary';
      case 'PROPIETARIO':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Clientes Suscriptores
            </CardTitle>
            <CardDescription>
              Gestionar inmobiliarias, administradores independientes y propietarios
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateClient}>
                <DialogHeader>
                  <DialogTitle>Crear Cliente Suscriptor</DialogTitle>
                  <DialogDescription>
                    Ingresa la información del nuevo cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Cliente *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej: Inmobiliaria ABC"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Identificador (Slug) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="inmobiliaria-abc"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Se genera automáticamente desde el nombre
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client_type">Tipo de Cliente *</Label>
                    <Select
                      value={formData.client_type}
                      onValueChange={(value: any) => setFormData({ ...formData, client_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INMOBILIARIA">Inmobiliaria</SelectItem>
                        <SelectItem value="ADMINISTRADOR_INDEPENDIENTE">
                          Administrador Independiente
                        </SelectItem>
                        <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="parent_tenant_id">Cliente Padre (Opcional)</Label>
                    <Select
                      value={formData.parent_tenant_id}
                      onValueChange={(value) => setFormData({ ...formData, parent_tenant_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cliente padre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin cliente padre</SelectItem>
                        {clients
                          .filter((c) => c.client_type === 'INMOBILIARIA')
                          .map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Para sucursales o sub-clientes
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Crear Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente Padre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.slug}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getClientTypeColor(client.client_type)}>
                    {client.client_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {client.parent_tenant?.name || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={client.is_active ? 'default' : 'destructive'}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(client.created_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {clients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay clientes registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
