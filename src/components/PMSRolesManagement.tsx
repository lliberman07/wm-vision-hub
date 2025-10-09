import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, User, Trash2, Calendar } from 'lucide-react';
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

interface PMSUserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  created_at: string;
  user_email?: string;
  tenant_name?: string;
}

const PMSRolesManagement = () => {
  const [roles, setRoles] = useState<PMSUserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<PMSUserRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data: rolesData, error } = await supabase
        .from('pms_user_roles')
        .select('*, pms_tenants!fk_pms_user_roles_tenant(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from profiles table
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        
        const enrichedData = rolesData.map(role => ({
          ...role,
          user_email: profileMap.get(role.user_id) || role.user_id.substring(0, 8),
          tenant_name: (role.pms_tenants as any)?.name || 'N/A'
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

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('pms_user_roles')
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
      case 'SUPERADMIN':
        return 'destructive';
      case 'INMOBILIARIA':
        return 'default';
      case 'ADMINISTRADOR':
        return 'secondary';
      case 'PROPIETARIO':
        return 'outline';
      case 'INQUILINO':
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
    </>
  );
};

export default PMSRolesManagement;
