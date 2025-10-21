import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, User, Briefcase, Phone, MapPin, FileText, Building, Eye } from 'lucide-react';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PMSAccessRequest {
  id: string;
  user_id?: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone: string;
  document_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  requested_role: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  tax_id?: string;
}

const PMSAccessRequests = () => {
  const [requests, setRequests] = useState<PMSAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PMSAccessRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PMSAccessRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revert' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('pms_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // pms_access_requests ya tiene todos los campos necesarios
      setRequests((requests || []).map(req => ({
        id: req.id,
        user_id: req.user_id || undefined,
        email: req.email || 'Sin email',
        first_name: req.first_name || 'Sin nombre',
        last_name: req.last_name || '',
        company_name: req.company_name,
        phone: req.phone || '-',
        document_id: req.document_id || '-',
        address: req.address || '-',
        city: req.city || '-',
        state: req.state || '-',
        postal_code: req.postal_code || '-',
        tax_id: req.tax_id,
        requested_role: req.requested_role,
        reason: req.reason || '',
        status: req.status as 'pending' | 'approved' | 'denied',
        created_at: req.created_at,
        tenant_id: req.tenant_id,
      })));
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'approve') {
        let userId = selectedRequest.user_id;
        let isNewUser = false;
        const isPropietario = selectedRequest.requested_role === 'PROPIETARIO';
        const isInquilino = selectedRequest.requested_role === 'INQUILINO';
        const needsOwnTenant = isPropietario || isInquilino;

        // Verificar si el usuario ya existe en auth.users
        if (!userId) {
          const { data: existingAuthUser, error: checkError } = await supabase.rpc('get_user_by_email', {
            email_param: selectedRequest.email
          });

          if (checkError) {
            throw new Error('Error al verificar usuario existente: ' + checkError.message);
          }

          if (existingAuthUser && existingAuthUser.length > 0) {
            // Usuario existe: usar su ID directamente
            userId = existingAuthUser[0].user_id;
            
            // Enviar email de confirmación para usuario existente
            const { error: emailError } = await supabase.functions.invoke('send-approval-confirmation', {
              body: {
                email: selectedRequest.email,
                first_name: selectedRequest.first_name,
                role: selectedRequest.requested_role,
                language: 'es'
              }
            });

            if (emailError) {
              toast({
                title: "⚠️ Usuario asignado pero email falló",
                description: "El rol fue asignado correctamente, pero no se pudo enviar el email de confirmación. Por favor, notifica al usuario manualmente.",
                variant: "destructive"
              });
            }
            
            toast({
              title: "Usuario existente detectado",
              description: "Se asignó el rol y se envió email de confirmación",
            });
          } else {
            // Usuario NO existe: crearlo
            isNewUser = true;
            const { data: userData, error: createError } = await supabase.functions.invoke('create-pms-user', {
              body: {
                email: selectedRequest.email,
                first_name: selectedRequest.first_name,
                last_name: selectedRequest.last_name,
                company_name: selectedRequest.company_name,
              }
            });

            if (createError || !userData) {
              throw new Error('No se pudo crear la cuenta de usuario: ' + (createError?.message || 'Error desconocido'));
            }

            userId = userData.user_id;
            const tempPassword = userData.temp_password;

            // Enviar email SOLO si el usuario es nuevo
            const { error: welcomeError } = await supabase.functions.invoke('send-welcome-email', {
              body: {
                email: selectedRequest.email,
                first_name: selectedRequest.first_name,
                password: tempPassword,
              }
            });

            if (welcomeError) {
              toast({
                title: "⚠️ Usuario creado pero email falló",
                description: `Credenciales: ${selectedRequest.email} / ${tempPassword}. Por favor, envía estas credenciales manualmente.`,
                variant: "destructive",
                duration: 10000, // 10 segundos para que el admin pueda copiar
              });
            }
          }
        }

        // Si es PROPIETARIO o INQUILINO, crear tenant automáticamente
        let finalTenantId = selectedRequest.tenant_id;
        
        if (needsOwnTenant) {
          // Determinar el tipo de tenant
          const tenantType = isPropietario ? 'propietario' : 'inquilino';
          
          // Determinar el nombre del tenant
          let tenantName: string;
          if (selectedRequest.company_name && selectedRequest.company_name.trim()) {
            // Es una empresa
            tenantName = selectedRequest.company_name.trim();
          } else {
            // Es persona física
            tenantName = `${selectedRequest.first_name} ${selectedRequest.last_name}`.trim() || selectedRequest.email;
          }
          
          // Generar slug único
          const baseSlug = selectedRequest.company_name 
            ? selectedRequest.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            : `${selectedRequest.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          
          const tenantSlug = `${tenantType === 'propietario' ? 'prop' : 'inq'}-${baseSlug}`;
          
          // Intentar crear el tenant
          const { data: newTenant, error: tenantError } = await supabase
            .from('pms_tenants')
            .insert([{
              name: tenantName,
              slug: tenantSlug,
              tenant_type: tenantType,
              is_active: true,
              settings: {}
            }])
            .select()
            .single();
            
          if (tenantError) {
            // Si ya existe, buscar el tenant existente
            const { data: existingTenant } = await supabase
              .from('pms_tenants')
              .select('id')
              .eq('slug', tenantSlug)
              .single();
              
            finalTenantId = existingTenant?.id || selectedRequest.tenant_id;
          } else {
            finalTenantId = newTenant.id;
          }
        }

        // VALIDAR LÍMITE DE USUARIOS PARA EL TENANT
        const { data: tenantInfo } = await supabase
          .from('pms_tenants')
          .select('slug, name')
          .eq('id', finalTenantId)
          .single();

        // Obtener límite de usuarios usando la función RPC
        const { data: maxUsersAllowed, error: limitError } = await supabase
          .rpc('get_tenant_user_limit', { tenant_id_param: finalTenantId });

        if (limitError || !maxUsersAllowed) {
          throw new Error('No se pudo obtener el límite de usuarios del tenant');
        }

        const { count: currentUserCount, error: countError } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', finalTenantId)
          .eq('module', 'PMS')
          .eq('status', 'approved');

        if (countError) {
          throw new Error('Error al verificar límite de usuarios');
        }

        if (currentUserCount !== null && currentUserCount >= maxUsersAllowed) {
          toast({
            title: "Límite Alcanzado",
            description: `El tenant "${tenantInfo?.name}" ya alcanzó su límite de ${maxUsersAllowed} usuarios`,
            variant: "destructive"
          });
          return;
        }

        // Verificar si ya existe un rol para este usuario
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', selectedRequest.requested_role.toLowerCase() as any)
          .eq('module', 'PMS')
          .eq('tenant_id', finalTenantId)
          .maybeSingle();

        if (existingRole) {
          // Actualizar el rol existente
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
            })
            .eq('id', existingRole.id);

          if (roleError) throw roleError;
        } else {
          // Insertar nuevo rol
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: userId,
              role: selectedRequest.requested_role.toLowerCase() as any,
              module: 'PMS',
              tenant_id: finalTenantId,
              status: 'approved',
              approved_at: new Date().toISOString(),
            }]);

          if (roleError) throw roleError;
        }

        // Actualizar pms_access_requests
        const { error: updateError } = await supabase
          .from('pms_access_requests')
          .update({
            user_id: userId,
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Solicitud aprobada",
          description: needsOwnTenant
            ? `Tenant de ${isPropietario ? 'propietario' : 'inquilino'} creado automáticamente. Usuario ${(currentUserCount || 0) + 1}/${maxUsersAllowed} en el tenant.` 
            : isNewUser 
              ? `Cuenta creada y credenciales enviadas. Usuario ${(currentUserCount || 0) + 1}/${maxUsersAllowed} en el tenant.` 
              : `Usuario aprobado. ${(currentUserCount || 0) + 1}/${maxUsersAllowed} en el tenant.`,
        });
      } else if (actionType === 'revert') {
        // Revertir aprobación: cambiar estado a pending
        const { error: updateError } = await supabase
          .from('pms_access_requests')
          .update({
            status: 'pending',
            reviewed_at: null,
            reviewed_by: null,
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Aprobación revertida",
          description: "Ahora puedes volver a aprobar la solicitud para re-enviar el email",
        });
      } else {
        // Rechazar solicitud - también actualizar el rol a 'denied' si existe
        if (selectedRequest.user_id) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ status: 'denied' })
            .eq('user_id', selectedRequest.user_id)
            .eq('role', selectedRequest.requested_role.toLowerCase() as any)
            .eq('module', 'PMS')
            .eq('tenant_id', selectedRequest.tenant_id);
        }

        const { error: updateError } = await supabase
          .from('pms_access_requests')
          .update({
            status: 'denied',
            reviewed_at: new Date().toISOString(),
            reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Solicitud rechazada",
          description: "El usuario ha sido notificado",
        });
      }

      fetchRequests();
      setSelectedRequest(null);
      setActionType(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Aprobado</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPERADMIN: 'bg-purple-500',
      INMOBILIARIA: 'bg-blue-500',
      ADMINISTRADOR: 'bg-indigo-500',
      PROPIETARIO: 'bg-green-500',
      INQUILINO: 'bg-yellow-500',
      PROVEEDOR: 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colors[role] || 'bg-gray-500'} text-white`}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Solicitudes de Acceso al PMS</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las solicitudes de acceso de los usuarios al sistema PMS
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {requests.filter(r => r.status === 'pending').length} Pendientes
        </Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay solicitudes de acceso</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.first_name} {request.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(request.requested_role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(request.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
                          {viewingRequest && (
                            <>
                              <SheetHeader>
                                <SheetTitle>Detalle de Solicitud</SheetTitle>
                                <SheetDescription>
                                  Información completa del solicitante
                                </SheetDescription>
                              </SheetHeader>
                              
                              <div className="mt-6 space-y-6">
                                <div className="space-y-3">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Datos Personales
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Nombre</p>
                                      <p className="font-medium">{viewingRequest.first_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Apellido</p>
                                      <p className="font-medium">{viewingRequest.last_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Email</p>
                                      <p className="font-medium">{viewingRequest.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Teléfono</p>
                                      <p className="font-medium">{viewingRequest.phone}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">DNI</p>
                                      <p className="font-medium">{viewingRequest.document_id}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Dirección
                                  </h3>
                                  <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Dirección</p>
                                      <p className="font-medium">{viewingRequest.address}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <p className="text-muted-foreground">Ciudad</p>
                                        <p className="font-medium">{viewingRequest.city}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Provincia</p>
                                        <p className="font-medium">{viewingRequest.state}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">CP</p>
                                        <p className="font-medium">{viewingRequest.postal_code}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {viewingRequest.requested_role === 'INMOBILIARIA' && (
                                  <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      Datos de Empresa
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Empresa</p>
                                        <p className="font-medium">{viewingRequest.company_name}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">CUIT/CUIL</p>
                                        <p className="font-medium">{viewingRequest.tax_id}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Información de Solicitud
                                  </h3>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Rol Solicitado</p>
                                      {getRoleBadge(viewingRequest.requested_role)}
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Motivo</p>
                                      <p className="font-medium whitespace-pre-wrap">{viewingRequest.reason}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Fecha de Solicitud</p>
                                      <p className="font-medium">
                                        {format(new Date(viewingRequest.created_at), "dd/MM/yyyy 'a las' HH:mm")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Estado</p>
                                      {getStatusBadge(viewingRequest.status)}
                                    </div>
                                  </div>
                                </div>

                                {viewingRequest.status === 'pending' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      className="flex-1"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedRequest(viewingRequest);
                                        setActionType('reject');
                                      }}
                                    >
                                      Rechazar
                                    </Button>
                                    <Button
                                      className="flex-1"
                                      onClick={() => {
                                        setSelectedRequest(viewingRequest);
                                        setActionType('approve');
                                      }}
                                    >
                                      Aprobar
                                    </Button>
                                  </div>
                                )}
                                {viewingRequest.status === 'approved' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      className="flex-1"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedRequest(viewingRequest);
                                        setActionType('revert');
                                      }}
                                    >
                                      Revertir Aprobación
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </SheetContent>
                      </Sheet>

                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('reject');
                            }}
                          >
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                            }}
                          >
                            Aprobar
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('revert');
                          }}
                        >
                          Revertir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Aprobar Solicitud' : actionType === 'revert' ? 'Revertir Aprobación' : 'Rechazar Solicitud'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? `¿Confirmas que deseas aprobar la solicitud de ${selectedRequest?.first_name} ${selectedRequest?.last_name}? Se le otorgará acceso al sistema PMS.` 
                : actionType === 'revert'
                ? `¿Confirmas que deseas revertir la aprobación de ${selectedRequest?.first_name} ${selectedRequest?.last_name}? La solicitud volverá a estado pendiente y podrás aprobarla nuevamente para re-enviar el email de bienvenida.`
                : `¿Confirmas que deseas rechazar la solicitud de ${selectedRequest?.first_name} ${selectedRequest?.last_name}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionType === 'approve' ? 'Aprobar' : actionType === 'revert' ? 'Revertir' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PMSAccessRequests;
