import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, MoreVertical, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { CreatePMSUserDialog } from './CreatePMSUserDialog';
import { EditPMSUserDialog } from './EditPMSUserDialog';
import { RoleBadgeWithTooltip } from '@/lib/pmsRoleHelpers';
import { Skeleton } from '@/components/ui/skeleton';

export interface PMSUser {
  role_id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  status: 'approved' | 'denied';
  created_at: string;
  approved_at?: string;
}

interface ActionState {
  type: 'deny' | 'approve' | 'delete';
  user: PMSUser;
}

const PMSUsersManagement = () => {
  const [users, setUsers] = useState<PMSUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PMSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PMSUser | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchTenants();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterTenant, filterRole, filterStatus]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_tenants')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          tenant_id,
          status,
          created_at,
          approved_at,
          pms_tenants!inner (
            name,
            slug
          )
        `)
        .eq('module', 'PMS')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener información de usuarios de auth.users mediante consulta manual
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      
      let authUsersMap = new Map<string, any>();
      
      if (userIds.length > 0) {
        // Obtener usuarios de auth.users usando metadata
        const { data: { users: authUsersData }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsersData) {
          authUsersMap = new Map(
            authUsersData
              .filter((u: any) => userIds.includes(u.id))
              .map((u: any) => [
                u.id,
                {
                  email: u.email,
                  first_name: u.user_metadata?.first_name,
                  last_name: u.user_metadata?.last_name,
                }
              ])
          );
        }
      }

      const formattedUsers: PMSUser[] = (data || []).map(role => {
        const authUser = authUsersMap.get(role.user_id);
        return {
          role_id: role.id,
          user_id: role.user_id,
          email: authUser?.email || 'Sin email',
          first_name: authUser?.first_name,
          last_name: authUser?.last_name,
          role: role.role.toUpperCase(),
          tenant_id: role.tenant_id,
          tenant_name: (role.pms_tenants as any)?.name || 'Sin nombre',
          tenant_slug: (role.pms_tenants as any)?.slug || '',
          status: role.status as 'approved' | 'denied',
          created_at: role.created_at,
          approved_at: role.approved_at,
        };
      });

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email.toLowerCase().includes(term) ||
          u.first_name?.toLowerCase().includes(term) ||
          u.last_name?.toLowerCase().includes(term) ||
          u.tenant_name.toLowerCase().includes(term)
      );
    }

    // Tenant filter
    if (filterTenant !== 'all') {
      filtered = filtered.filter(u => u.tenant_id === filterTenant);
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleDenyAccess = async () => {
    if (!actionState || actionState.type !== 'deny') return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ status: 'denied' })
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: 'Acceso denegado',
        description: 'El usuario ha sido denegado correctamente',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo denegar el acceso: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setActionState(null);
    }
  };

  const handleApproveAccess = async () => {
    if (!actionState || actionState.type !== 'approve') return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: 'Acceso aprobado',
        description: 'El usuario ha sido aprobado correctamente',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo aprobar el acceso: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setActionState(null);
    }
  };

  const handleDeleteRole = async () => {
    if (!actionState || actionState.type !== 'delete') return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: 'Rol eliminado',
        description: 'El rol del usuario ha sido eliminado correctamente',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el rol: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setActionState(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'denied':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const isSelfAction = (user: PMSUser) => {
    return user.user_id === currentUserId;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nombre o tenant..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterTenant} onValueChange={setFilterTenant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tenants</SelectItem>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
              <SelectItem value="INMOBILIARIA">Inmobiliaria</SelectItem>
              <SelectItem value="GESTOR">Gestor</SelectItem>
              <SelectItem value="PROPIETARIO">Propietario</SelectItem>
              <SelectItem value="INQUILINO">Inquilino</SelectItem>
              <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="denied">Denegado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total: {filteredUsers.length}</span>
        <span>Aprobados: {filteredUsers.filter(u => u.status === 'approved').length}</span>
        <span>Denegados: {filteredUsers.filter(u => u.status === 'denied').length}</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.role_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <RoleBadgeWithTooltip role={user.role} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.tenant_name}</span>
                      <span className="text-xs text-muted-foreground">{user.tenant_slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status === 'approved' ? 'Aprobado' : 'Denegado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingUser(user)}
                          disabled={isSelfAction(user)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        {user.status === 'denied' && (
                          <DropdownMenuItem
                            onClick={() => setActionState({ type: 'approve', user })}
                            disabled={isSelfAction(user)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprobar
                          </DropdownMenuItem>
                        )}
                        
                        {user.status === 'approved' && (
                          <DropdownMenuItem
                            onClick={() => setActionState({ type: 'deny', user })}
                            disabled={isSelfAction(user)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Denegar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem
                          onClick={() => setActionState({ type: 'delete', user })}
                          className="text-destructive"
                          disabled={isSelfAction(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar Rol
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreatePMSUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchUsers}
        tenants={tenants}
      />

      {editingUser && (
        <EditPMSUserDialog
          user={editingUser}
          tenants={tenants}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchUsers}
        />
      )}

      {/* Action Confirmation Dialogs */}
      <AlertDialog open={actionState?.type === 'deny'} onOpenChange={() => setActionState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Denegar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario {actionState?.user.email} no podrá acceder al sistema con este rol.
              Podrás aprobarlo nuevamente más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDenyAccess} className="bg-destructive text-destructive-foreground">
              Denegar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionState?.type === 'approve'} onOpenChange={() => setActionState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario {actionState?.user.email} podrá acceder al sistema con el rol {actionState?.user.role}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveAccess}>
              Aprobar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionState?.type === 'delete'} onOpenChange={() => setActionState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el rol {actionState?.user.role} del usuario {actionState?.user.email} para el tenant {actionState?.user.tenant_name}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground">
              Eliminar Rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PMSUsersManagement;
