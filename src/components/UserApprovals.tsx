import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Clock, Trash2 } from 'lucide-react';
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

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
  status: string;
}

const UserApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    try {
      // Get pending admin roles from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at, status')
        .eq('role', 'admin')
        .eq('module', 'WM')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      if (roles && roles.length > 0) {
        // Get user emails from users table
        const userIds = roles.map(r => r.user_id);
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        const userMap = new Map(users?.map(u => [u.id, u.email]) || []);
        
        setPendingUsers(roles.map(role => ({
          id: role.user_id,
          email: userMap.get(role.user_id) || 'Unknown',
          created_at: role.created_at,
          status: role.status
        })));
      } else {
        setPendingUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      // Call approve_user RPC
      const { error: rpcError } = await supabase.rpc('approve_user', {
        user_id_param: userId
      });

      if (rpcError) throw rpcError;

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          email,
          action: 'approved',
          language: 'en' // You could get this from context if needed
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw here, approval already succeeded
        toast({
          title: "User Approved",
          description: "User approved successfully, but email notification failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "User Approved",
          description: "User approved and notification email sent",
        });
      }

      // Refresh the list
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      // Call deny_user RPC
      const { error: rpcError } = await supabase.rpc('deny_user', {
        user_id_param: userId
      });

      if (rpcError) throw rpcError;

      // Send denial email
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          email,
          action: 'denied',
          language: 'en' // You could get this from context if needed
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw here, denial already succeeded
        toast({
          title: "User Denied",
          description: "User denied successfully, but email notification failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "User Denied",
          description: "User denied and notification email sent",
        });
      }

      // Refresh the list
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error denying user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deny user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (userId: string, email: string) => {
    setUserToDelete({ id: userId, email });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setActionLoading(userToDelete.id);
    setDeleteDialogOpen(false);
    
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.id }
      });

      if (error) throw error;

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h2 className="text-2xl font-bold">User Approvals</h2>
        <Badge variant="secondary">{pendingUsers.length} pending</Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No pending user approvals at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.email}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {user.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    className="flex-1"
                    variant="default"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDeny(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    className="flex-1"
                    variant="destructive"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Deny
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    variant="outline"
                    size="icon"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{' '}
              <strong>{userToDelete?.email}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserApprovals;