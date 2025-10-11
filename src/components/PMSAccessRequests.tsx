import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, User, Briefcase, Phone, MapPin, FileText, Building } from 'lucide-react';
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
import { Eye } from 'lucide-react';

interface PMSAccessRequest {
  id: string;
  user_id: string;
  tenant_id: string;
  requested_role: string;
  reason: string;
  status: string;
  created_at: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  document_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  company_name?: string;
  tax_id?: string;
}

const PMSAccessRequests = () => {
  const [requests, setRequests] = useState<PMSAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PMSAccessRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PMSAccessRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Get access requests from unified access_requests table
      const { data: requestsData, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('module', 'PMS')
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Get user info from users table
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.user_id);
        const { data: users } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, phone, company_name')
          .in('id', userIds);

        const userMap = new Map((users || []).map(u => [u.id, u]));
        
        const enrichedData = requestsData.map(req => {
          const user = userMap.get(req.user_id);
          return {
            id: req.id,
            user_id: req.user_id,
            tenant_id: '', // Will be assigned on approval
            requested_role: req.requested_roles[0] || '',
            reason: req.reason || '',
            status: req.status,
            created_at: req.created_at,
            user_email: user?.email || req.user_id.substring(0, 8),
            first_name: user?.first_name,
            last_name: user?.last_name,
            phone: user?.phone,
            company_name: user?.company_name,
            // These fields will be empty in the new structure
            document_id: undefined,
            address: undefined,
            city: undefined,
            state: undefined,
            postal_code: undefined,
            tax_id: undefined,
          };
        });

        setRequests(enrichedData);
      } else {
        setRequests([]);
      }
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
        // Get default tenant ID
        const { data: tenantId, error: tenantError } = await supabase
          .rpc('get_default_tenant_id');

        if (tenantError || !tenantId) {
          throw new Error('No se pudo obtener el tenant predeterminado');
        }

        // Create user role in unified user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: selectedRequest.user_id,
            tenant_id: tenantId,
            role: selectedRequest.requested_role as any,
            module: 'PMS',
            status: 'approved',
            approved_at: new Date().toISOString()
          }]);

        if (roleError) throw roleError;

        // Update request status
        const { error: updateError } = await supabase
          .from('access_requests')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Solicitud Aprobada",
          description: `Acceso concedido a ${selectedRequest.user_email}`,
        });
      } else {
        // Reject request
        const { error } = await supabase
          .from('access_requests')
          .update({ 
            status: 'denied',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.id);

        if (error) throw error;

        toast({
          title: "Solicitud Rechazada",
          description: `Acceso denegado a ${selectedRequest.user_email}`,
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
      superadmin: 'bg-purple-500',
      inmobiliaria: 'bg-blue-500',
      admin: 'bg-indigo-500',
      propietario: 'bg-green-500',
      inquilino: 'bg-yellow-500',
      proveedor: 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colors[role] || 'bg-gray-500'} text-white`}>
        {role.toUpperCase()}
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
                <TableHead>Datos Personales</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{request.first_name} {request.last_name}</p>
                        <p className="text-xs text-muted-foreground">{request.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{request.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>DNI: {request.document_id}</span>
                      </div>
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
                                      <p className="font-medium">{viewingRequest.user_email}</p>
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
                                      onClick={() => {
                                        setSelectedRequest(viewingRequest);
                                        setActionType('approve');
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Aprobar Solicitud
                                    </Button>
                                    <Button
                                      className="flex-1"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedRequest(viewingRequest);
                                        setActionType('reject');
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Rechazar
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
                            variant="default"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('reject');
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!selectedRequest && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedRequest(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? (
                <>
                  ¿Estás seguro de que deseas aprobar la solicitud de <strong>{selectedRequest?.user_email}</strong> para el rol de <strong>{selectedRequest?.requested_role}</strong>?
                  <br /><br />
                  El usuario recibirá acceso inmediato al sistema PMS.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas rechazar la solicitud de <strong>{selectedRequest?.user_email}</strong>?
                  <br /><br />
                  El usuario no tendrá acceso al sistema PMS.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PMSAccessRequests;
