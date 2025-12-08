import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Building2, Mail, UserPlus, CheckCircle2, Info } from 'lucide-react';

interface EmailRecipient {
  name: string;
  email: string;
  role: 'owner' | 'tenant' | 'admin';
  hasExistingUser: boolean;
  sharePercent?: number;
}

interface PreviewData {
  owners: EmailRecipient[];
  tenant: EmailRecipient | null;
  admin: EmailRecipient | null;
  property: { code: string; address: string } | null;
  contract: { monthly_rent: number; currency: string } | null;
}

interface ActivateContractDialogProps {
  contractId: string;
  contractNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ActivateContractDialog({
  contractId,
  contractNumber,
  open,
  onOpenChange,
  onSuccess,
}: ActivateContractDialogProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Cargar datos de preview cuando se abre el dialog
  useEffect(() => {
    if (open && contractId) {
      fetchPreviewData();
    } else {
      setPreviewData(null);
    }
  }, [open, contractId]);

  const fetchPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      // Obtener datos del contrato con propiedad e inquilino
      const { data: contract } = await supabase
        .from('pms_contracts')
        .select(`
          id,
          monthly_rent,
          currency,
          tenant_id,
          property_id,
          pms_properties!inner(id, code, address),
          pms_tenants_renters!inner(id, full_name, email, user_id)
        `)
        .eq('id', contractId)
        .single();

      if (!contract) {
        throw new Error('Contrato no encontrado');
      }

      // Obtener propietarios de la propiedad
      const { data: ownerProperties } = await supabase
        .from('pms_owner_properties')
        .select(`
          share_percent,
          pms_owners!inner(id, full_name, email, user_id)
        `)
        .eq('property_id', contract.property_id)
        .is('end_date', null);

      // Obtener administrador del tenant (inmobiliaria)
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          users!inner(email)
        `)
        .eq('tenant_id', contract.tenant_id)
        .in('role', ['admin', 'inmobiliaria']);

      // También obtener el nombre del tenant
      const { data: tenantInfo } = await supabase
        .from('pms_tenants')
        .select('name')
        .eq('id', contract.tenant_id)
        .single();

      // Construir datos de preview
      const owners: EmailRecipient[] = (ownerProperties || []).map((op: any) => ({
        name: op.pms_owners.full_name,
        email: op.pms_owners.email,
        role: 'owner' as const,
        hasExistingUser: !!op.pms_owners.user_id,
        sharePercent: op.share_percent,
      }));

      const tenant: EmailRecipient | null = contract.pms_tenants_renters ? {
        name: contract.pms_tenants_renters.full_name,
        email: contract.pms_tenants_renters.email,
        role: 'tenant' as const,
        hasExistingUser: !!contract.pms_tenants_renters.user_id,
      } : null;

      const admin: EmailRecipient | null = adminUsers && adminUsers.length > 0 ? {
        name: tenantInfo?.name || 'Administrador',
        email: (adminUsers[0] as any).users?.email || '',
        role: 'admin' as const,
        hasExistingUser: true,
      } : null;

      setPreviewData({
        owners,
        tenant,
        admin,
        property: contract.pms_properties ? {
          code: (contract.pms_properties as any).code,
          address: (contract.pms_properties as any).address,
        } : null,
        contract: {
          monthly_rent: contract.monthly_rent,
          currency: contract.currency || 'ARS',
        },
      });
    } catch (error) {
      console.error('Error fetching preview data:', error);
      toast.error('Error al cargar la previsualización');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      // Pre-validar que la propiedad no esté inactive
      const { data: contract } = await supabase
        .from('pms_contracts')
        .select('property_id, pms_properties!inner(status)')
        .eq('id', contractId)
        .single();
      
      if (contract?.pms_properties?.status === 'inactive') {
        toast.error('No se puede activar el contrato', {
          description: 'La propiedad está inactiva. Active la propiedad primero.',
        });
        setIsActivating(false);
        return;
      }

      const { error } = await supabase.rpc('activate_contract', {
        contract_id_param: contractId,
      });

      if (error) throw error;

      // Enviar notificaciones en segundo plano (no bloqueante)
      supabase.functions.invoke('send-contract-activation-notification', {
        body: { contract_id: contractId }
      }).then(({ error: notifError }) => {
        if (notifError) {
          console.warn('Error enviando notificaciones de activación:', notifError);
        }
      }).catch(err => {
        console.warn('Error enviando notificaciones:', err);
      });

      toast.success('Contrato activado correctamente');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error activating contract:', error);
      
      // Mensajes de error mejorados
      if (error.message?.includes('inactive') || error.message?.includes('inactiva')) {
        toast.error('Propiedad Inactiva', {
          description: 'Esta propiedad está inactiva. Para activarla, verifica el límite de tu suscripción o actualiza tu plan.',
        });
      } else {
        toast.error(error.message || 'Error al activar contrato');
      }
    } finally {
      setIsActivating(false);
    }
  };

  const RecipientCard = ({ recipient, icon: Icon }: { recipient: EmailRecipient; icon: React.ElementType }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{recipient.name}</span>
          {recipient.sharePercent && (
            <Badge variant="outline" className="text-xs">
              {recipient.sharePercent}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {recipient.role === 'admin' ? (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <Info className="h-3 w-3" />
              Solo notificación informativa
            </span>
          ) : recipient.hasExistingUser ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Ya tiene cuenta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <UserPlus className="h-3 w-3" />
              Se creará usuario con credenciales
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Activar contrato {contractNumber}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewData ? (
                <ScrollArea className="max-h-[50vh]">
                  <div className="space-y-4 pr-4">
                    {/* Info de la propiedad */}
                    {previewData.property && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Propiedad:</span>{' '}
                        <span className="font-medium">{previewData.property.code}</span>
                        <span className="text-muted-foreground"> - {previewData.property.address}</span>
                      </div>
                    )}

                    <Separator />

                    {/* Sección de emails */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-foreground">
                          Emails que se enviarán:
                        </h4>
                      </div>

                      {/* Propietarios */}
                      {previewData.owners.length > 0 && (
                        <Card className="border-border/50">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              PROPIETARIOS ({previewData.owners.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-3 pb-3 space-y-2">
                            {previewData.owners.map((owner, idx) => (
                              <RecipientCard key={idx} recipient={owner} icon={User} />
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Inquilino */}
                      {previewData.tenant && (
                        <Card className="border-border/50">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              INQUILINO
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-3 pb-3">
                            <RecipientCard recipient={previewData.tenant} icon={User} />
                          </CardContent>
                        </Card>
                      )}

                      {/* Inmobiliaria */}
                      {previewData.admin && (
                        <Card className="border-border/50">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5" />
                              INMOBILIARIA
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-3 pb-3">
                            <RecipientCard recipient={previewData.admin} icon={Building2} />
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Separator />

                    {/* Otras acciones */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">También se realizará:</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        <li>Generación de proyecciones mensuales de pagos</li>
                        <li>Creación del calendario de pagos</li>
                        <li>Cambio de estado de propiedad a "Alquilada"</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Al activar este contrato se generarán las proyecciones de pago y se notificará a las partes.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isActivating}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleActivate} disabled={isActivating || isLoadingPreview}>
            {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activar Contrato
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
