import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, User, Trash2, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PMSUserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  created_at: string;
  user_email?: string;
  tenant_name?: string;
}

interface SystemUser {
  id: string;
  email: string;
}

const PMSRolesManagement = () => {
  const [roles, setRoles] = useState<PMSUserRole[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<PMSUserRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoleUserId, setNewRoleUserId] = useState('');
  const [newRoleType, setNewRoleType] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchSystemUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      // Get PMS roles from unified user_roles table
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('id, user_id, tenant_id, role, created_at')
        .eq('module', 'PMS')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails and tenant names
      if (rolesData && rolesData.length > 0) {
        const userIds = [...new Set(rolesData.map(r => r.user_id))];
        const tenantIds = [...new Set(rolesData.filter(r => r.tenant_id).map(r => r.tenant_id!))];

        const { data: users } = await supabase.from('users').select('id, email').in('id', userIds);
        const { data: tenants } = tenantIds.length > 0 
          ? await supabase.from('pms_tenants').select('id, name').in('id', tenantIds)
          : { data: [] };

        const userMap = new Map((users || []).map(u => [u.id, u.email]));
        const tenantMap = new Map((tenants || []).map(t => [t.id, t.name]));
        
        const enrichedData: PMSUserRole[] = rolesData.map(role => ({
          ...role,
          user_email: userMap.get(role.user_id) || role.user_id.substring(0, 8),
          tenant_name: role.tenant_id ? (tenantMap.get(role.tenant_id) || 'N/A') : 'N/A'
        }));

        setRoles(enrichedData);
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles PMS",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .order('email');

      if (error) throw error;
      setSystemUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleUserId || !newRoleType) {
      toast({
        title: "Error",
        description: "Debe seleccionar un usuario y un rol",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get default tenant
      const { data: tenantId, error: tenantError } = await supabase
        .rpc('get_default_tenant_id');

      if (tenantError || !tenantId) {
        throw new Error('No se pudo obtener el tenant predeterminado');
      }

      // Obtener info del tenant y límite de usuarios
      const { data: tenantInfo } = await supabase
        .from('pms_tenants')
        .select('slug, name')
        .eq('id', tenantId)
        .single();

      // Obtener límite de usuarios usando la función RPC
      const { data: maxUsersAllowed, error: limitError } = await supabase
        .rpc('get_tenant_user_limit', { tenant_id_param: tenantId });

      if (limitError || !maxUsersAllowed) {
        throw new Error('No se pudo obtener el límite de usuarios del tenant');
      }

      // VALIDACIÓN DE LÍMITE: Contar usuarios actuales en ese tenant
      const { count: currentUserCount, error: countError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      if (countError) throw countError;

      if (currentUserCount !== null && currentUserCount >= maxUsersAllowed) {
        toast({
          title: "Límite Alcanzado",
          description: `El tenant "${tenantInfo?.name}" ya tiene el máximo de ${maxUsersAllowed} usuarios permitidos`,
          variant: "destructive"
        });
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', newRoleUserId)
        .eq('role', newRoleType as any)
        .eq('tenant_id', tenantId)
        .eq('module', 'PMS')
        .single();

      if (existingRole) {
        toast({
          title: "Rol Duplicado",
          description: "El usuario ya tiene este rol asignado",
          variant: "destructive"
        });
        return;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: newRoleUserId,
          tenant_id: tenantId,
          role: newRoleType as any,
          module: 'PMS',
          status: 'approved',
          approved_at: new Date().toISOString()
        }]);

      if (error) throw error;

      const selectedUser = systemUsers.find(u => u.id === newRoleUserId);
      toast({
        title: "Rol Asignado",
        description: `Rol ${newRoleType} asignado a ${selectedUser?.email}. ${(currentUserCount || 0) + 1}/${maxUsersAllowed} usuarios en el tenant.`,
      });

      await fetchRoles();
      setShowAddDialog(false);
      setNewRoleUserId('');
      setNewRoleType('');
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', selectedRole.id);

      if (error) throw error;

      toast({
        title: "Rol Eliminado",
        description: `Rol ${selectedRole.role} eliminado exitosamente`,
      });

      await fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedRole(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'inmobiliaria':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'propietario':
        return 'outline';
      case 'inquilino':
        return 'outline';
      case 'proveedor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    return <Shield className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total de usuarios con acceso PMS: {roles.length}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Asignar Nuevo Rol
          </Button>
        </div>

        {roles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay roles PMS asignados</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rol PMS</TableHead>
                  <TableHead>Fecha de Asignación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.user_email?.split('@')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{role.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{role.tenant_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(role.role)} className="gap-1">
                        {getRoleIcon(role.role)}
                        {role.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(role.created_at), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Rol PMS?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el rol <strong>{selectedRole?.role}</strong> del usuario{' '}
              <strong>{selectedRole?.user_email}</strong>? Esta acción no se puede deshacer y el usuario perderá acceso al sistema PMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Nuevo Rol PMS</DialogTitle>
            <DialogDescription>
              Asigna un rol adicional a un usuario existente en el sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <Select value={newRoleUserId} onValueChange={setNewRoleUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Seleccionar usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {systemUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol PMS</Label>
              <Select value={newRoleType} onValueChange={setNewRoleType}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">SUPERADMIN</SelectItem>
                  <SelectItem value="inmobiliaria">INMOBILIARIA</SelectItem>
                  <SelectItem value="admin">ADMIN</SelectItem>
                  <SelectItem value="propietario">PROPIETARIO</SelectItem>
                  <SelectItem value="inquilino">INQUILINO</SelectItem>
                  <SelectItem value="proveedor">PROVEEDOR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setNewRoleUserId('');
              setNewRoleType('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddRole}>
              Asignar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PMSRolesManagement;
