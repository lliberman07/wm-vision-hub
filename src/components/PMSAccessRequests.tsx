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
  status: 'pending' | 'approved' | 'rejected';
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
        status: req.status as 'pending' | 'approved' | 'rejected',
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

        // Si el usuario no existe en auth.users, crearlo
        if (!userId) {
          const { data: userData, error: createError } = await supabase.functions.invoke('create-pms-user', {
            body: {
              email: selectedRequest.email,
              first_name: selectedRequest.first_name,
              last_name: selectedRequest.last_name,
              company_name: selectedRequest.company_name,
            }
          });

          if (createError || !userData) {
            console.error('Error creating user:', createError);
            throw new Error('No se pudo crear la cuenta de usuario: ' + (createError?.message || 'Error desconocido'));
          }

          userId = userData.user_id;
          const tempPassword = userData.temp_password;

          // Enviar email con credenciales
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: selectedRequest.email,
              first_name: selectedRequest.first_name,
              password: tempPassword,
            }
          });
        }

        // Insertar rol en user_roles con module='PMS'
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: selectedRequest.requested_role.toLowerCase() as any,
            module: 'PMS',
            tenant_id: selectedRequest.tenant_id,
            status: 'approved',
            approved_at: new Date().toISOString(),
          }]);

        if (roleError) throw roleError;

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
          description: userId === selectedRequest.user_id 
            ? "El usuario ahora tiene acceso al sistema PMS" 
            : "Se creó la cuenta y se enviaron las credenciales por email",
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
        // Rechazar solicitud
        const { error: updateError } = await supabase
          .from('pms_access_requests')
          .update({
            status: 'rejected',
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
      console.error('Error processing request:', error);
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
      case 'rejected':
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
