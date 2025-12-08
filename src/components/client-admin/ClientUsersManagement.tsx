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
import { Plus, Search, ToggleLeft, ToggleRight, Key, Star } from 'lucide-react';
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
  const { clientData, refreshClientData } = useClient();
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
  const [mainContactAlert, setMainContactAlert] = useState<{ open: boolean; user: ClientUser | null }>({ 
    open: false, 
    user: null 
  });
  const [settingMainContact, setSettingMainContact] = useState(false);
  
  // Track main contact locally for immediate UI update
  const [localMainContactId, setLocalMainContactId] = useState<string | null>(
    clientData?.settings?.main_contact_user_id || null
  );

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
      // Para tenant tipo propietario, cargar tanto CLIENT_ADMIN como PROPIETARIO
      const isPropietario = clientData.tenant_type === 'propietario';
      
      let query = supabase
        .from('pms_client_users')
        .select('*')
        .eq('tenant_id', clientData.id)
        .order('created_at', { ascending: false });
      
      if (isPropietario) {
        // Para propietarios, mostrar tanto CLIENT_ADMIN como PROPIETARIO
        query = query.in('user_type', ['CLIENT_ADMIN', 'PROPIETARIO']);
      } else {
        query = query.eq('user_type', 'CLIENT_ADMIN');
      }

      const { data, error } = await query;

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
      // First check if this email already exists as CLIENT_ADMIN for this tenant
      const { data: existingClientUser } = await supabase
        .from('pms_client_users')
        .select('id')
        .eq('tenant_id', clientData.id)
        .eq('email', formData.email)
        .eq('user_type', 'CLIENT_ADMIN')
        .maybeSingle();

      if (existingClientUser) {
        toast.error('Este email ya está registrado como usuario administrativo');
        setCreatingUser(false);
        return;
      }

      // Create or get user via edge function
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

      // Send appropriate email based on whether user is new or existing
      if (data.is_existing) {
        // User already has an account, send notification email (no credentials)
        toast.success('Usuario agregado como administrador. Ya tiene cuenta en el sistema.');
      } else {
        // New user, send welcome email with credentials
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

  const confirmSetMainContact = () => {
    if (!mainContactAlert.user) return;
    setAsMainContact(mainContactAlert.user);
    setMainContactAlert({ open: false, user: null });
  };

  const setAsMainContact = async (user: ClientUser) => {
    if (!clientData) {
      console.error('No clientData available');
      toast.error('Error: No hay datos del cliente');
      return;
    }
    
    console.log('Setting main contact:', { tenantId: clientData.id, userEmail: user.email, userId: user.id });
    
    setSettingMainContact(true);
    try {
      const updatedSettings = {
        ...(clientData.settings || {}),
        email: user.email,
        main_contact_user_id: user.id
      };
      
      console.log('Updating settings to:', updatedSettings);

      const { data, error } = await supabase
        .from('pms_tenants')
        .update({ settings: updatedSettings })
        .eq('id', clientData.id)
        .select('settings');

      console.log('Update result:', { data, error });

      if (error) throw error;

      // Actualizar estado local inmediatamente para UI
      setLocalMainContactId(user.id);
      
      toast.success(`${user.first_name} ${user.last_name} es ahora el Contacto Principal`);
      
      // Forzar actualización del contexto para que ClientSettings reciba el email
      await refreshClientData();
      
      console.log('refreshClientData completed');
    } catch (error: any) {
      console.error('Error setting main contact:', error);
      toast.error(`Error al asignar contacto principal: ${error?.message || 'Error desconocido'}`);
    } finally {
      setSettingMainContact(false);
    }
  };

  // Sync local state with clientData
  useEffect(() => {
    setLocalMainContactId(clientData?.settings?.main_contact_user_id || null);
  }, [clientData?.settings?.main_contact_user_id]);

  const isMainContact = (userId: string) => {
    return localMainContactId === userId;
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
                  <TableHead className="w-12"></TableHead>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={!user.is_active ? 'bg-muted/30' : ''}
                    >
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => !isMainContact(user.id) && setMainContactAlert({ open: true, user })}
                              disabled={settingMainContact}
                              className={isMainContact(user.id) ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}
                            >
                              <Star className={`h-4 w-4 ${isMainContact(user.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isMainContact(user.id) ? 'Contacto Principal' : 'Marcar como Contacto Principal'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.first_name} {user.last_name}
                          {isMainContact(user.id) && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                              Contacto Principal
                            </Badge>
                          )}
                        </div>
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

      {/* Alert Dialog - Set Main Contact */}
      <AlertDialog open={mainContactAlert.open} onOpenChange={(open) => !open && setMainContactAlert({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ⭐ ¿Designar como Contacto Principal?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mainContactAlert.user && (
                <>
                  El email de{' '}
                  <span className="font-semibold">
                    {mainContactAlert.user.first_name} {mainContactAlert.user.last_name}
                  </span>{' '}
                  ({mainContactAlert.user.email}) se usará como email de contacto de la organización.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetMainContact}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
