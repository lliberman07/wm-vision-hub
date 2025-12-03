import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Mail, Loader2, Trash2 } from 'lucide-react';
import { InviteCollaboratorDialog } from './InviteCollaboratorDialog';
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

interface LimitResult {
  allowed: boolean;
  reason: string;
  current_count: number;
  limit: number | null;
}

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  userInfo?: {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export function PropietarioUsersManagement() {
  const { currentTenant } = usePMS();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

  // Fetch current users for this tenant
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['tenant-users', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      // Get user roles for this tenant
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          approved_at
        `)
        .eq('tenant_id', currentTenant.id)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      if (error) throw error;

      // Get user details from pms_client_users
      const userIds = [...new Set(roles.map(r => r.user_id))];
      
      const { data: clientUsers } = await supabase
        .from('pms_client_users')
        .select('user_id, email, first_name, last_name')
        .eq('tenant_id', currentTenant.id)
        .in('user_id', userIds);

      return roles.map(role => ({
        ...role,
        userInfo: clientUsers?.find(u => u.user_id === role.user_id)
      })) as UserWithRole[];
    },
    enabled: !!currentTenant?.id,
  });

  // Fetch user limits
  const { data: limits } = useQuery({
    queryKey: ['tenant-limits', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return null;
      
      const { data, error } = await supabase
        .rpc('check_tenant_limits', {
          p_tenant_id: currentTenant.id,
          p_resource_type: 'user'
        });

      if (error) throw error;
      return data as unknown as LimitResult;
    },
    enabled: !!currentTenant?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (user: UserWithRole) => {
      // Delete from user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', user.id);

      if (roleError) throw roleError;

      // Also delete from pms_client_users if exists
      if (user.userInfo) {
        await supabase
          .from('pms_client_users')
          .delete()
          .eq('user_id', user.user_id)
          .eq('tenant_id', currentTenant?.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', currentTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['tenant-limits', currentTenant?.id] });
      toast({
        title: 'Usuario eliminado',
        description: 'El administrador ha sido eliminado de tu cuenta.',
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    },
  });

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'GESTOR': return 'ADMIN';
      case 'PROPIETARIO': return 'PROPIETARIO';
      default: return role.toUpperCase();
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'PROPIETARIO': return 'default';
      case 'GESTOR': return 'secondary';
      default: return 'outline';
    }
  };

  const canDeleteUser = (user: UserWithRole) => {
    // Can't delete the owner (PROPIETARIO)
    if (user.role === 'PROPIETARIO') return false;
    // Can delete GESTOR users
    return user.role === 'GESTOR';
  };

  const handleDeleteClick = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  const canInviteMore = limits ? limits.allowed : false;
  const currentCount = limits?.current_count || 0;
  const maxLimit = limits?.limit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los administradores de tu cuenta
          </p>
        </div>
        <Button 
          onClick={() => setInviteDialogOpen(true)}
          disabled={!canInviteMore}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Admin
        </Button>
      </div>

      {/* Usage Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Uso de Licencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">
              {currentCount} / {maxLimit === null ? '∞' : maxLimit}
            </div>
            <div className="text-sm text-muted-foreground">
              usuarios activos
            </div>
            {!canInviteMore && maxLimit !== null && (
              <Badge variant="destructive" className="ml-auto">
                Límite alcanzado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Activos</CardTitle>
          <CardDescription>
            Lista de todos los usuarios con acceso a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Alta</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.userInfo?.first_name || 'N/A'}{' '}
                      {user.userInfo?.last_name || ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.userInfo?.email || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600">
                        Activo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.approved_at 
                        ? new Date(user.approved_at).toLocaleDateString('es-AR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {canDeleteUser(user) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteCollaboratorDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          refetch();
          toast({
            title: 'Admin invitado',
            description: 'Se ha enviado un email de invitación al nuevo administrador.'
          });
        }}
        tenantId={currentTenant?.id || ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (
                <>
                  Estás a punto de eliminar a <strong>{userToDelete.userInfo?.first_name} {userToDelete.userInfo?.last_name}</strong> ({userToDelete.userInfo?.email}) de tu cuenta.
                  <br /><br />
                  Esta persona perderá acceso inmediatamente a todas las propiedades y datos de tu cuenta. Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
