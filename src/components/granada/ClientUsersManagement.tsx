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
import { Loader2, Plus, UserPlus, Users, Ban } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

interface ClientUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'CLIENT_ADMIN' | 'PROPIETARIO' | 'INQUILINO';
  is_active: boolean;
  created_at: string;
  tenant: {
    id: string;
    name: string;
    client_type: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  client_type: string;
}

export function ClientUsersManagement() {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    tenant_id: '',
    phone: '',
    cuit_cuil: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('pms_tenants')
        .select('id, name, client_type')
        .order('name');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Fetch client users
      const { data: usersData, error: usersError } = await supabase
        .from('pms_client_users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          is_active,
          created_at,
          tenant:tenant_id (
            id,
            name,
            client_type
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClientAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create auth user
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          user_type: 'CLIENT_ADMIN',
        },
      });

      if (authError) throw authError;

      // Create client user record
      const { error: clientUserError } = await supabase
        .from('pms_client_users')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          tenant_id: formData.tenant_id,
          user_type: 'CLIENT_ADMIN',
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          cuit_cuil: formData.cuit_cuil || null,
          is_active: true,
        });

      if (clientUserError) throw clientUserError;

      // Send welcome email
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: formData.email,
          first_name: formData.first_name,
          password: tempPassword,
        },
      });

      toast({
        title: 'Usuario creado',
        description: 'Se envió un correo con las credenciales de acceso',
      });

      setDialogOpen(false);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        tenant_id: '',
        phone: '',
        cuit_cuil: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pms_client_users')
        .update({ 
          is_active: !currentStatus,
          deactivated_at: !currentStatus ? null : new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
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
              <Users className="h-5 w-5" />
              Gestión de Usuarios de Clientes
            </CardTitle>
            <CardDescription>
              Administrar usuarios CLIENT_ADMIN, PROPIETARIO e INQUILINO
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Admin Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateClientAdmin}>
                <DialogHeader>
                  <DialogTitle>Crear Usuario CLIENT_ADMIN</DialogTitle>
                  <DialogDescription>
                    El usuario recibirá un correo con sus credenciales de acceso
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tenant">Cliente Suscriptor *</Label>
                    <Select
                      value={formData.tenant_id}
                      onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.client_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last_name">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cuit_cuil">CUIT/CUIL</Label>
                    <Input
                      id="cuit_cuil"
                      value={formData.cuit_cuil}
                      onChange={(e) => setFormData({ ...formData, cuit_cuil: e.target.value })}
                    />
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
                    Crear Usuario
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
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.tenant?.name}
                  <div className="text-xs text-muted-foreground">
                    {user.tenant?.client_type}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.user_type === 'CLIENT_ADMIN'
                        ? 'default'
                        : user.user_type === 'PROPIETARIO'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {user.user_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.user_type === 'CLIENT_ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay usuarios registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
