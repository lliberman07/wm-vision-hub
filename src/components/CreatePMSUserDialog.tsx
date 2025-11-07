import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface CreatePMSUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tenants: { id: string; name: string }[];
}

export function CreatePMSUserDialog({
  open,
  onOpenChange,
  onSuccess,
  tenants,
}: CreatePMSUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_name: '',
    tenant_id: '',
    role: '' as PMSRole | '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.tenant_id || !formData.role) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Validar límite de usuarios del tenant
      const { data: maxUsersAllowed, error: limitError } = await supabase
        .rpc('get_tenant_user_limit', { tenant_id_param: formData.tenant_id });

      if (limitError) {
        throw new Error('No se pudo obtener el límite de usuarios del tenant');
      }

      const { count: currentUserCount, error: countError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', formData.tenant_id)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      if (countError) {
        throw new Error('Error al verificar límite de usuarios');
      }

      if (currentUserCount !== null && currentUserCount >= maxUsersAllowed) {
        const { data: tenantInfo } = await supabase
          .from('pms_tenants')
          .select('name')
          .eq('id', formData.tenant_id)
          .single();

        toast({
          title: 'Límite Alcanzado',
          description: `El tenant "${tenantInfo?.name}" ya alcanzó su límite de ${maxUsersAllowed} usuarios`,
          variant: 'destructive',
        });
        return;
      }

      // 2. Verificar si el email ya existe para este tenant y rol
      const { data: existingAuthUser, error: checkError } = await supabase.rpc('get_user_by_email', {
        email_param: formData.email
      });

      if (checkError) {
        throw new Error('Error al verificar usuario existente: ' + checkError.message);
      }

      let userId: string;

      if (existingAuthUser && existingAuthUser.length > 0) {
        // Usuario ya existe en auth.users
        userId = existingAuthUser[0].user_id;

        // Verificar si ya tiene este rol para este tenant
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id, status')
          .eq('user_id', userId)
          .eq('role', formData.role.toLowerCase() as any)
          .eq('module', 'PMS')
          .eq('tenant_id', formData.tenant_id)
          .maybeSingle();

        if (existingRole) {
          toast({
            title: 'Usuario ya existe',
            description: `Este usuario ya tiene el rol ${formData.role} para este tenant (Estado: ${existingRole.status})`,
            variant: 'destructive',
          });
          return;
        }

        // Enviar email de confirmación para usuario existente
        const { error: emailError } = await supabase.functions.invoke('send-approval-confirmation', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            role: formData.role,
            language: 'es'
          }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

      } else {
        // 3. Crear nuevo usuario usando la edge function
        const { data: userData, error: createError } = await supabase.functions.invoke('create-pms-user', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            company_name: formData.company_name || undefined,
          }
        });

        if (createError || !userData) {
          throw new Error('No se pudo crear la cuenta de usuario: ' + (createError?.message || 'Error desconocido'));
        }

        userId = userData.user_id;
        const tempPassword = userData.temp_password;

        // 4. Enviar email de bienvenida
        const { error: welcomeError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            password: tempPassword,
          }
        });

        if (welcomeError) {
          toast({
            title: '⚠️ Usuario creado pero email falló',
            description: `Credenciales: ${formData.email} / ${tempPassword}. Por favor, envía estas credenciales manualmente.`,
            variant: 'destructive',
            duration: 10000,
          });
        }
      }

      // 5. Insertar rol en user_roles con status 'approved'
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: formData.role.toLowerCase() as any,
          module: 'PMS',
          tenant_id: formData.tenant_id,
          status: 'approved',
          approved_at: new Date().toISOString(),
        }]);

      if (roleError) throw roleError;

      // 6. Mostrar mensaje de éxito
      const newCount = (currentUserCount || 0) + 1;
      toast({
        title: '✅ Usuario creado exitosamente',
        description: `Usuario ${newCount}/${maxUsersAllowed} en el tenant. Se ha enviado un email de bienvenida.`,
      });

      // Limpiar formulario y cerrar
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        company_name: '',
        tenant_id: '',
        role: '',
      });
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario PMS</DialogTitle>
          <DialogDescription>
            Crea un usuario y asigna un rol automáticamente. El usuario recibirá un email con sus credenciales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Empresa (opcional)</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={e => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Mi Empresa S.A."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant_id">
              Tenant <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tenant_id}
              onValueChange={value => setFormData({ ...formData, tenant_id: value })}
            >
              <SelectTrigger id="tenant_id">
                <SelectValue placeholder="Selecciona un tenant" />
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
            <Label htmlFor="role">
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={value => setFormData({ ...formData, role: value as any })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
