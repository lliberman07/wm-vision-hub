import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, UserPlus, Search, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

interface ClientUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
}

export function ClientUsersManagement() {
  const { clientData } = useClient();
  const { checkLimit } = useSubscriptionLimits();
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Form states
  const [userType, setUserType] = useState<'PROPIETARIO' | 'INQUILINO'>('PROPIETARIO');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    cuit_cuil: '',
  });

  useEffect(() => {
    loadUsers();
  }, [clientData]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType]);

  const loadUsers = async () => {
    if (!clientData) return;

    try {
      const { data, error } = await supabase
        .from('pms_client_users')
        .select('*')
        .eq('tenant_id', clientData.id)
        .in('user_type', ['PROPIETARIO', 'INQUILINO'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.user_type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (!clientData) return;

    // Validate
    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast.error('Completá todos los campos requeridos');
      return;
    }

    // Check limits
    const limitCheck = await checkLimit('user');
    if (!limitCheck.allowed) {
      toast.error(limitCheck.reason);
      return;
    }

    setCreatingUser(true);

    try {
      const edgeFunction = userType === 'PROPIETARIO' 
        ? 'auto-create-propietario-user'
        : 'auto-create-inquilino-user';

      const payload: any = {
        tenant_id: clientData.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        cuit_cuil: formData.cuit_cuil,
      };

      if (userType === 'PROPIETARIO') {
        // For PROPIETARIO, we need owner_id (will be created if doesn't exist)
        // Edge function will handle this
        const { data, error } = await supabase.functions.invoke(edgeFunction, {
          body: payload
        });

        if (error) throw error;
        
        toast.success('Usuario PROPIETARIO creado exitosamente');
      } else {
        // For INQUILINO, we need contract_id and tenant_renter_id
        // This requires a contract selection - simplified for now
        toast.error('Para crear INQUILINO, usa el flujo de contratos');
        setCreatingUser(false);
        return;
      }

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        cuit_cuil: '',
      });
      setCreateDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pms_client_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: userId }
      });

      if (error) throw error;
      
      toast.success('Contraseña reseteada. Se envió un email al usuario.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error al resetear contraseña');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Usuarios</h2>
          <p className="text-muted-foreground">Gestionar usuarios PROPIETARIO e INQUILINO</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Crea un usuario PROPIETARIO. Para INQUILINO, usa el flujo de contratos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Tipo de Usuario</Label>
                <Select value={userType} onValueChange={(v: any) => setUserType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPIETARIO">PROPIETARIO</SelectItem>
                    <SelectItem value="INQUILINO" disabled>INQUILINO (usar contratos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Apellido *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <Label>CUIT/CUIL</Label>
                <Input
                  value={formData.cuit_cuil}
                  onChange={(e) => setFormData({ ...formData, cuit_cuil: e.target.value })}
                  placeholder="20-12345678-9"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={creatingUser}>
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PROPIETARIO">PROPIETARIO</SelectItem>
                <SelectItem value="INQUILINO">INQUILINO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.user_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetPassword(user.user_id)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
