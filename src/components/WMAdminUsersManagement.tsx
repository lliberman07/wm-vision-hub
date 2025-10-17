import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck, Trash2, User } from "lucide-react";
import { format } from "date-fns";

interface WMAdminUser {
  role_id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'superadmin';
  status: string;
  created_at: string;
  approved_at: string | null;
}

interface ActionState {
  type: 'change_role' | 'deny' | 'delete' | null;
  user: WMAdminUser | null;
  newRole?: 'admin' | 'superadmin';
}

export default function WMAdminUsersManagement() {
  const [users, setUsers] = useState<WMAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>({ type: null, user: null });
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWMAdminUsers();
  }, []);

  const fetchWMAdminUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          approved_at,
          users!inner(email)
        `)
        .eq('module', 'WM')
        .in('role', ['admin', 'superadmin'])
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: WMAdminUser[] = (data || []).map((item: any) => ({
        role_id: item.id,
        user_id: item.user_id,
        email: item.users.email,
        role: item.role,
        status: item.status,
        created_at: item.created_at,
        approved_at: item.approved_at,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching WM admin users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!actionState.user || !actionState.newRole) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: actionState.newRole })
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: `Usuario ${actionState.user.email} ahora es ${actionState.newRole}`,
      });

      fetchWMAdminUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el rol",
        variant: "destructive",
      });
    } finally {
      setActionState({ type: null, user: null });
    }
  };

  const handleDenyAccess = async () => {
    if (!actionState.user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ status: 'denied' })
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: "Acceso denegado",
        description: `Acceso a /admin bloqueado para ${actionState.user.email}`,
      });

      fetchWMAdminUsers();
    } catch (error) {
      console.error('Error denying access:', error);
      toast({
        title: "Error",
        description: "No se pudo denegar el acceso",
        variant: "destructive",
      });
    } finally {
      setActionState({ type: null, user: null });
    }
  };

  const handleDeleteRole = async () => {
    if (!actionState.user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', actionState.user.role_id);

      if (error) throw error;

      toast({
        title: "Rol eliminado",
        description: `Rol WM eliminado para ${actionState.user.email}. Ya no tiene acceso a /admin`,
      });

      fetchWMAdminUsers();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive",
      });
    } finally {
      setActionState({ type: null, user: null });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'superadmin' ? 'default' : 'secondary';
  };

  const getRoleIcon = (role: string) => {
    return role === 'superadmin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios admin configurados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Aprobado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.user_id === currentUser?.id;
                
                return (
                  <TableRow key={user.role_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                        {isSelf && (
                          <Badge variant="outline" className="text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.approved_at ? format(new Date(user.approved_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.role === 'admin' ? (
                              <DropdownMenuItem
                                onClick={() => setActionState({ 
                                  type: 'change_role', 
                                  user, 
                                  newRole: 'superadmin' 
                                })}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Cambiar a Superadmin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setActionState({ 
                                  type: 'change_role', 
                                  user, 
                                  newRole: 'admin' 
                                })}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Cambiar a Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setActionState({ type: 'deny', user })}
                            >
                              <ShieldAlert className="h-4 w-4 mr-2" />
                              Denegar Acceso
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setActionState({ type: 'delete', user })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Rol WM
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Change Role Confirmation */}
      <AlertDialog open={actionState.type === 'change_role'} onOpenChange={() => setActionState({ type: null, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Rol</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cambiar el rol de <strong>{actionState.user?.email}</strong> a <strong>{actionState.newRole}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deny Access Confirmation */}
      <AlertDialog open={actionState.type === 'deny'} onOpenChange={() => setActionState({ type: null, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Denegar Acceso a /admin</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres denegar el acceso a /admin para <strong>{actionState.user?.email}</strong>?
              <br /><br />
              El registro se mantendrá pero el usuario no podrá acceder al panel de administración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDenyAccess} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Denegar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={actionState.type === 'delete'} onOpenChange={() => setActionState({ type: null, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Rol WM</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar completamente el rol WM de <strong>{actionState.user?.email}</strong>?
              <br /><br />
              Esta acción es <strong>permanente</strong> y el usuario perderá todo acceso a /admin. 
              Si el usuario tiene otros roles (ej: PMS), esos se mantendrán intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
