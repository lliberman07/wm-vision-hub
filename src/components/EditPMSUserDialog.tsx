import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { PMSRole } from '@/lib/pmsRoleHelpers';

interface PMSUser {
  role_id: string;
  user_id: string;
  email: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  status: string;
  created_at: string;
  approved_at: string;
}

interface EditPMSUserDialogProps {
  user: PMSUser;
  tenants: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPMSUserDialog({
  user,
  tenants,
  onClose,
  onSuccess,
}: EditPMSUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: user.role as PMSRole,
    tenant_id: user.tenant_id,
    status: user.status as 'approved' | 'denied',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Si cambia el tenant o rol, validar límite de usuarios administrativos
      if ((formData.tenant_id !== user.tenant_id || formData.role !== user.role) && formData.status === 'approved') {
        const { data: maxUsersAllowed, error: limitError } = await supabase
          .rpc('get_tenant_user_limit', { tenant_id_param: formData.tenant_id });

        if (limitError) {
          throw new Error('No se pudo obtener el límite de usuarios del tenant');
        }

        const { data: tenantInfo, error: tenantError } = await supabase
          .from('pms_tenants')
          .select('name, tenant_type')
          .eq('id', formData.tenant_id)
          .single();

        if (tenantError || !tenantInfo) {
          throw new Error('No se pudo obtener información del tenant');
        }

        // Determinar si el rol cuenta para el límite según tenant_type
        const roleCountsForLimit = (role: string, tenantType: string) => {
          if (role === 'inquilino') return false;
          
          if (tenantType === 'propietario') {
            return role === 'propietario' || role === 'admin';
          } else if (['inmobiliaria', 'administrador', 'sistema'].includes(tenantType)) {
            return role === 'inmobiliaria' || role === 'admin';
          }
          return role !== 'inquilino';
        };

        if (roleCountsForLimit(formData.role.toLowerCase(), tenantInfo.tenant_type)) {
          const { data: currentAdminCount, error: countError } = await supabase
            .rpc('get_tenant_admin_user_count', { tenant_id_param: formData.tenant_id });

          if (countError) {
            throw new Error('Error al verificar límite de usuarios administrativos');
          }

          if (currentAdminCount !== null && currentAdminCount >= maxUsersAllowed) {
            const roleLabel = tenantInfo.tenant_type === 'propietario' 
              ? 'PROPIETARIO/ADMINISTRADOR' 
              : 'INMOBILIARIA/ADMINISTRADOR';

            toast({
              title: 'Límite Alcanzado',
              description: `El tenant "${tenantInfo.name}" ya alcanzó su límite de ${maxUsersAllowed} usuarios administrativos (${roleLabel})`,
              variant: 'destructive',
            });
            return;
          }
        }
      }

      // Actualizar el rol
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: formData.role.toLowerCase() as any,
          tenant_id: formData.tenant_id,
          status: formData.status,
          ...(formData.status === 'approved' && !user.approved_at ? { approved_at: new Date().toISOString() } : {})
        })
        .eq('id', user.role_id);

      if (error) throw error;

      toast({
        title: '✅ Usuario actualizado',
        description: 'Los cambios se han guardado correctamente',
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario PMS</DialogTitle>
          <DialogDescription>
            Modifica el rol, tenant o estado del usuario {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email (no editable)</Label>
            <div className="p-2 bg-muted rounded-md text-sm">{user.email}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={value => setFormData({ ...formData, role: value as PMSRole })}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                <SelectItem value="INMOBILIARIA">Inmobiliaria</SelectItem>
                <SelectItem value="GESTOR">Gestor</SelectItem>
                <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                <SelectItem value="INQUILINO">Inquilino</SelectItem>
                <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tenant">
              Tenant <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tenant_id}
              onValueChange={value => setFormData({ ...formData, tenant_id: value })}
            >
              <SelectTrigger id="edit-tenant">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">
              Estado <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={value => setFormData({ ...formData, status: value as 'approved' | 'denied' })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="denied">Denegado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
