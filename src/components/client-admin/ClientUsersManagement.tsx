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
import { Plus, Search, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Alert dialog states
  const [toggleAlert, setToggleAlert] = useState<{ open: boolean; user: ClientUser | null }>({ 
    open: false, 
    user: null 
  });
  const [resetPasswordAlert, setResetPasswordAlert] = useState<{ open: boolean; user: ClientUser | null }>({ 
    open: false, 
    user: null 
  });

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    loadUsers();
  }, [clientData]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadUsers = async () => {
    if (!clientData) return;

    try {
      const { data, error } = await supabase
        .from('pms_client_users')
        .select('*')
        .eq('tenant_id', clientData.id)
        .eq('user_type', 'CLIENT_ADMIN')
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
      // Create CLIENT_ADMIN user via edge function
      const { data, error } = await supabase.functions.invoke('create-pms-user', {
        body: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      });

      if (error) throw error;

      // Insert into pms_client_users as CLIENT_ADMIN
      const { error: insertError } = await supabase
        .from('pms_client_users')
        .insert({
          user_id: data.user_id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          tenant_id: clientData.id,
          user_type: 'CLIENT_ADMIN',
          is_active: true,
        });

      if (insertError) throw insertError;

      // Send welcome email with temporary password
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: formData.email,
          name: `${formData.first_name} ${formData.last_name}`,
          password: data.temp_password,
          platform: 'pms',
        },
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        toast.warning('Usuario creado pero no se pudo enviar el email de bienvenida');
      } else {
        toast.success('Usuario administrativo creado. Se envió un email con las credenciales.');
      }

      setCreateDialogOpen(false);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear usuario administrativo');
    } finally {
      setCreatingUser(false);
    }
  };

  const confirmToggleUserStatus = () => {
    if (!toggleAlert.user) return;
    toggleUserStatus(toggleAlert.user.id, toggleAlert.user.is_active);
    setToggleAlert({ open: false, user: null });
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pms_client_users')
        .update({ 
          is_active: !currentStatus,
          deactivated_at: !currentStatus ? null : new Date().toISOString(),
          deactivated_by: !currentStatus ? null : (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const confirmResetPassword = () => {
    if (!resetPasswordAlert.user) return;
    resetPassword(resetPasswordAlert.user.email);
    setResetPasswordAlert({ open: false, user: null });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { email }
      });

      if (error) throw error;

      toast.success('Contraseña reseteada. Se envió un email al usuario.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error al resetear contraseña');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Equipo Administrativo</span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gestor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Agregar Usuario Administrativo</DialogTitle>
                  <DialogDescription>
                    Creá un nuevo usuario con acceso administrativo a tu organización. 
                    Este usuario podrá gestionar propiedades, contratos y ver todos los reportes.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Juan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Pérez"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
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
          </CardTitle>
          <CardDescription>
            Gestioná los usuarios administrativos que tienen acceso al panel de gestión
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={!user.is_active ? 'bg-muted/30' : ''}
                    >
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setToggleAlert({ open: true, user })}
                              >
                                {user.is_active ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.is_active ? 'Desactivar usuario' : 'Activar usuario'}</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResetPasswordAlert({ open: true, user })}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Resetear contraseña</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog - Toggle User Status */}
      <AlertDialog open={toggleAlert.open} onOpenChange={(open) => !open && setToggleAlert({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ⚠️ ¿Confirmar cambio de estado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleAlert.user && (
                <>
                  ¿Estás seguro de que querés{' '}
                  <span className="font-semibold">
                    {toggleAlert.user.is_active ? 'desactivar' : 'activar'}
                  </span>{' '}
                  al usuario{' '}
                  <span className="font-semibold">
                    {toggleAlert.user.first_name} {toggleAlert.user.last_name}
                  </span>
                  ?
                  {toggleAlert.user.is_active && (
                    <span className="block mt-2 text-destructive">
                      El usuario no podrá acceder al sistema hasta ser reactivado.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleUserStatus}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog - Reset Password */}
      <AlertDialog open={resetPasswordAlert.open} onOpenChange={(open) => !open && setResetPasswordAlert({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              🔑 ¿Resetear contraseña?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetPasswordAlert.user && (
                <>
                  Se generará una nueva contraseña temporal y se enviará por email a{' '}
                  <span className="font-semibold">{resetPasswordAlert.user.email}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              Resetear Contraseña
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
