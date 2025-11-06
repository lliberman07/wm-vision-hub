import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePMS } from '@/contexts/PMSContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, User, Trash2, Calendar, Plus, Building2, ChevronRight, AlertCircle, Info, Network } from 'lucide-react';
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

interface PMSTenant {
  id: string;
  name: string;
  slug: string;
  tenant_type: string;
  settings?: any;
  parent_tenant_id?: string;
  is_headquarters?: boolean;
  children?: PMSTenant[];
}

interface TenantUserLimit {
  tenant_id: string;
  tenant_name: string;
  current_users: number;
  max_users: number;
  is_at_limit: boolean;
}

const PMSRolesManagement = () => {
  const { userRole } = usePMS();
  const [roles, setRoles] = useState<PMSUserRole[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [tenants, setTenants] = useState<PMSTenant[]>([]);
  const [hierarchicalTenants, setHierarchicalTenants] = useState<PMSTenant[]>([]);
  const [userLimits, setUserLimits] = useState<Map<string, TenantUserLimit>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<PMSUserRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoleUserId, setNewRoleUserId] = useState('');
  const [newRoleTenantId, setNewRoleTenantId] = useState('');
  const [newRoleType, setNewRoleType] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterEmail, setFilterEmail] = useState<string>('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissions();
    fetchRoles();
    fetchSystemUsers();
    fetchTenants();
  }, []);

  useEffect(() => {
    if (newRoleTenantId) {
      updateAvailableRoles(newRoleTenantId);
      fetchUserLimit(newRoleTenantId);
    }
  }, [newRoleTenantId]);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      const isSuperAdmin = roles?.some(r => r.role.toUpperCase() === 'SUPERADMIN');
      setIsSuperAdmin(isSuperAdmin || false);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const updateAvailableRoles = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      setAvailableRoles([]);
      return;
    }

    // SUPERADMIN puede asignar todos los roles
    if (isSuperAdmin) {
      setAvailableRoles(['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO', 'PROVEEDOR']);
      return;
    }

    // Roles permitidos según tipo de tenant
    const isBranch = tenant.parent_tenant_id !== null;
    
    if (isBranch) {
      // Sucursales NO pueden tener rol INMOBILIARIA ni SUPERADMIN
      setAvailableRoles(['ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO', 'PROVEEDOR']);
    } else {
      // Casa Matriz puede tener todos excepto SUPERADMIN (si no eres SUPERADMIN)
      setAvailableRoles(['INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO', 'PROVEEDOR']);
    }
  };

  const fetchUserLimit = async (tenantId: string) => {
    try {
      const { data: maxUsers } = await supabase
        .rpc('get_tenant_user_limit', { tenant_id_param: tenantId });

      const { count: currentCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      const tenant = tenants.find(t => t.id === tenantId);
      
      if (tenant) {
        const limit: TenantUserLimit = {
          tenant_id: tenantId,
          tenant_name: tenant.name,
          current_users: currentCount || 0,
          max_users: maxUsers || 0,
          is_at_limit: (currentCount || 0) >= (maxUsers || 0)
        };
        
        setUserLimits(prev => new Map(prev).set(tenantId, limit));
      }
    } catch (error) {
      console.error('Error fetching user limit:', error);
    }
  };

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

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_tenants')
        .select('id, name, slug, tenant_type, settings')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const tenantsData = (data || []).map((t: any) => ({
        ...t,
        parent_tenant_id: t.settings?.parent_tenant_id || null,
        is_headquarters: t.settings?.is_headquarters || false,
      }));
      
      setTenants(tenantsData);
      
      // Construir jerarquía
      const hierarchical = buildTenantHierarchy(tenantsData);
      setHierarchicalTenants(hierarchical);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
    }
  };

  const buildTenantHierarchy = (allTenants: PMSTenant[]): PMSTenant[] => {
    const headquarters = allTenants.filter(t => !t.parent_tenant_id);
    const branches = allTenants.filter(t => t.parent_tenant_id);

    return headquarters.map(hq => ({
      ...hq,
      children: branches.filter(b => b.parent_tenant_id === hq.id)
    }));
  };

  const handleAddRole = async () => {
    if (!newRoleUserId || !newRoleType || !newRoleTenantId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un usuario, un tenant y un rol",
        variant: "destructive"
      });
      return;
    }

    try {
      const tenantId = newRoleTenantId;

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
      setNewRoleTenantId('');
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

  const filteredRoles = roles.filter((role) => {
    if (filterTenant !== 'all' && role.tenant_id !== filterTenant) return false;
    if (filterRole !== 'all' && role.role !== filterRole) return false;
    if (filterEmail && !role.user_email?.toLowerCase().includes(filterEmail.toLowerCase())) return false;
    return true;
  });

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
              Mostrando {filteredRoles.length} de {roles.length} usuarios
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Asignar Nuevo Rol
          </Button>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="filter-tenant">Filtrar por Tenant</Label>
            <Select value={filterTenant} onValueChange={setFilterTenant}>
              <SelectTrigger id="filter-tenant">
                <SelectValue placeholder="Todos los tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="filter-role">Filtrar por Rol</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger id="filter-role">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                <SelectItem value="INMOBILIARIA">INMOBILIARIA</SelectItem>
                <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
                <SelectItem value="PROPIETARIO">PROPIETARIO</SelectItem>
                <SelectItem value="INQUILINO">INQUILINO</SelectItem>
                <SelectItem value="PROVEEDOR">PROVEEDOR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="filter-email">Buscar por Email</Label>
            <input
              id="filter-email"
              type="text"
              placeholder="email@ejemplo.com"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {roles.length === 0 ? 'No hay roles PMS asignados' : 'No se encontraron roles con los filtros aplicados'}
            </p>
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
                {filteredRoles.map((role) => (
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
              <Label htmlFor="tenant" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Organización / Tenant
              </Label>
              <Select value={newRoleTenantId} onValueChange={setNewRoleTenantId}>
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Seleccionar tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {hierarchicalTenants.map((hq) => (
                    <>
                      <SelectItem key={hq.id} value={hq.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="font-semibold">{hq.name}</span>
                          <Badge variant="secondary" className="text-xs">Casa Matriz</Badge>
                        </div>
                      </SelectItem>
                      {hq.children?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2 pl-4">
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <span>{branch.name}</span>
                            <Badge variant="outline" className="text-xs">Sucursal</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  ))}
                </SelectContent>
              </Select>
              
              {newRoleTenantId && userLimits.has(newRoleTenantId) && (
                <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                  userLimits.get(newRoleTenantId)?.is_at_limit 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {userLimits.get(newRoleTenantId)?.is_at_limit ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <span>
                    Usuarios: {userLimits.get(newRoleTenantId)?.current_users} / {userLimits.get(newRoleTenantId)?.max_users}
                    {userLimits.get(newRoleTenantId)?.is_at_limit && ' (Límite alcanzado)'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol PMS</Label>
              <Select 
                value={newRoleType} 
                onValueChange={setNewRoleType}
                disabled={!newRoleTenantId}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={newRoleTenantId ? "Seleccionar rol..." : "Primero selecciona un tenant"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {newRoleTenantId && availableRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay roles disponibles para asignar a este tenant
                </p>
              )}
              
              {newRoleTenantId && !isSuperAdmin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {tenants.find(t => t.id === newRoleTenantId)?.parent_tenant_id 
                    ? 'Las sucursales no pueden tener roles INMOBILIARIA ni SUPERADMIN'
                    : 'Solo SUPERADMIN puede asignar el rol SUPERADMIN'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setNewRoleUserId('');
              setNewRoleTenantId('');
              setNewRoleType('');
              setAvailableRoles([]);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddRole}
              disabled={!newRoleUserId || !newRoleTenantId || !newRoleType || userLimits.get(newRoleTenantId)?.is_at_limit}
            >
              Asignar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PMSRolesManagement;
