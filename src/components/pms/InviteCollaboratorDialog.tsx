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
  { value: 'GESTOR', label: 'Admin', description: 'Puede gestionar propiedades, contratos y pagos de tu cuenta' },
];

// Timeout helper para evitar operaciones colgadas
const withTimeout = <T,>(promise: Promise<T>, ms: number, operation: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} tardó demasiado. Intenta de nuevo.`)), ms)
    )
  ]);
};

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  onSuccess,
  tenantId,
}: InviteCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
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
    setProgressMessage('Verificando disponibilidad...');

    try {
      // 1. Verificar límites Y usuario existente EN PARALELO
      const [limitResult, existingUserResult] = await withTimeout(
        Promise.all([
          supabase.rpc('check_tenant_limits', {
            p_tenant_id: tenantId,
            p_resource_type: 'user'
          }),
          supabase.rpc('get_user_by_email', {
            email_param: formData.email
          })
        ]),
        15000,
        'Verificación inicial'
      );

      if (limitResult.error) throw limitResult.error;

      const limitCheck = limitResult.data as unknown as LimitResult;

      if (!limitCheck?.allowed) {
        toast({
          title: 'Límite alcanzado',
          description: limitCheck?.reason || 'No puedes agregar más usuarios',
          variant: 'destructive',
        });
        return;
      }

      const existingUser = existingUserResult.data;
      let userId: string;

      if (existingUser && Array.isArray(existingUser) && existingUser.length > 0) {
        userId = existingUser[0].user_id;
        setProgressMessage('Verificando permisos existentes...');

        // Verificar si ya tiene rol en este tenant
        const { data: existingRole } = await withTimeout(
          Promise.resolve(
            supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', userId)
              .eq('tenant_id', tenantId)
              .eq('module', 'PMS')
              .maybeSingle()
          ),
          10000,
          'Verificación de roles'
        );

        if (existingRole) {
          toast({
            title: 'Usuario ya existe',
            description: 'Este usuario ya tiene acceso a tu cuenta',
            variant: 'destructive',
          });
          return;
        }

        // Enviar email de notificación EN BACKGROUND (sin await)
        supabase.functions.invoke('send-approval-confirmation', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            role: formData.role,
            language: 'es'
          }
        }).catch(err => console.error('Error enviando email de confirmación:', err));

      } else {
        // 3. Crear nuevo usuario
        setProgressMessage('Creando cuenta de usuario...');
        
        const { data: userData, error: createError } = await withTimeout(
          supabase.functions.invoke('create-pms-user', {
            body: {
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
            }
          }),
          20000,
          'Creación de usuario'
        );

        if (createError || !userData) {
          throw new Error(createError?.message || 'No se pudo crear el usuario');
        }

        userId = userData.user_id;

        // 4. Enviar email de bienvenida EN BACKGROUND (sin await)
        supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            first_name: formData.first_name,
            password: userData.temp_password,
          }
        }).catch(err => console.error('Error enviando email de bienvenida:', err));
      }

      // 5. Crear rol
      setProgressMessage('Asignando permisos...');
      
      const { error: roleError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('user_roles')
            .insert([{
              user_id: userId,
              role: formData.role as any,
              module: 'PMS',
              tenant_id: tenantId,
              status: 'approved',
              approved_at: new Date().toISOString(),
            }])
        ),
        10000,
        'Asignación de rol'
      );

      if (roleError) throw roleError;

      // 6. Create pms_client_users entry for collaborator
      const clientUserData = {
        user_id: userId,
        tenant_id: tenantId,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: 'GESTOR' as const,
        is_active: true,
      };
      const { error: clientUserError } = await supabase
        .from('pms_client_users')
        .insert(clientUserData as any);

      if (clientUserError) {
        console.warn('Error creating pms_client_users entry:', clientUserError);
        // Non-blocking - the role was created successfully
      }

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'GESTOR',
      });

      toast({
        title: 'Invitación enviada',
        description: 'El colaborador recibirá un email con sus credenciales',
      });

      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error inviting collaborator:', error);
      
      const isTimeout = error.message?.includes('tardó demasiado') || 
                        error.message?.includes('timed out') ||
                        error.message?.includes('timeout');
      
      toast({
        title: isTimeout ? 'Conexión lenta' : 'Error',
        description: isTimeout 
          ? 'El servidor tardó en responder. Verifica la lista de usuarios antes de reintentar.'
          : (error.message || 'No se pudo invitar al colaborador'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Invitar Admin</DialogTitle>
          <DialogDescription>
            Invita a un administrador para que te ayude a gestionar tus propiedades.
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
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={value => setFormData({ ...formData, role: value })}
              disabled={loading}
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
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-xs">{progressMessage || 'Procesando...'}</span>
                </>
              ) : (
                'Enviar Invitación'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
