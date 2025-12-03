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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tenantId: string;
}

interface LimitResult {
  allowed: boolean;
  reason: string;
  current_count: number;
  limit: number | null;
}

// Roles disponibles para invitar como colaborador (limitado)
const AVAILABLE_ROLES = [
  { value: 'GESTOR', label: 'Gestor', description: 'Puede gestionar propiedades, contratos y pagos' },
];

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  onSuccess,
  tenantId,
}: InviteCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'GESTOR',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

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
      // 1. Verificar límites del tenant
      const { data: limitData, error: limitError } = await supabase
        .rpc('check_tenant_limits', {
          p_tenant_id: tenantId,
          p_resource_type: 'user'
        });

      if (limitError) throw limitError;

      const limitCheck = limitData as unknown as LimitResult;

      if (!limitCheck?.allowed) {
        toast({
          title: 'Límite alcanzado',
          description: limitCheck?.reason || 'No puedes agregar más usuarios',
          variant: 'destructive',
        });
        return;
      }

      // 2. Verificar si el usuario ya existe
      const { data: existingUser } = await supabase.rpc('get_user_by_email', {
        email_param: formData.email
      });

      let userId: string;

      if (existingUser && existingUser.length > 0) {
        userId = existingUser[0].user_id;

        // Verificar si ya tiene rol en este tenant
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('tenant_id', tenantId)
          .eq('module', 'PMS')
          .maybeSingle();

        if (existingRole) {
          toast({
            title: 'Usuario ya existe',
            description: 'Este usuario ya tiene acceso a tu cuenta',
            variant: 'destructive',
          });
          return;
        }

        // Enviar email de notificación
        await supabase.functions.invoke('send-approval-confirmation', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            role: formData.role,
            language: 'es'
          }
        });
      } else {
        // 3. Crear nuevo usuario
        const { data: userData, error: createError } = await supabase.functions.invoke('create-pms-user', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
          }
        });

        if (createError || !userData) {
          throw new Error(createError?.message || 'No se pudo crear el usuario');
        }

        userId = userData.user_id;

        // 4. Enviar email de bienvenida
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            password: userData.temp_password,
          }
        });
      }

      // 5. Crear rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: formData.role as any,
          module: 'PMS',
          tenant_id: tenantId,
          status: 'approved',
          approved_at: new Date().toISOString(),
        }]);

      if (roleError) throw roleError;

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'GESTOR',
      });

      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error inviting collaborator:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo invitar al colaborador',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Invitar Colaborador</DialogTitle>
          <DialogDescription>
            Invita a un colaborador para que te ayude a gestionar tus propiedades.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El colaborador recibirá un email con sus credenciales de acceso.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="colaborador@ejemplo.com"
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
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={value => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
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
              Enviar Invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
