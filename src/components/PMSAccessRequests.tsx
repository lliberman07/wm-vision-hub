import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, User, Briefcase } from 'lucide-react';
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

interface PMSAccessRequest {
  id: string;
  user_id: string;
  tenant_id: string;
  requested_role: string;
  reason: string;
  status: string;
  created_at: string;
  user_email?: string;
}

const PMSAccessRequests = () => {
  const [requests, setRequests] = useState<PMSAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PMSAccessRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('pms_access_requests')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Get user emails from profiles table
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        
        const enrichedData = requestsData.map(req => ({
          ...req,
          user_email: profileMap.get(req.user_id) || req.user_id.substring(0, 8)
        }));

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
        // Create user role
        const { error: roleError } = await supabase
          .from('pms_user_roles')
          .insert([{
            user_id: selectedRequest.user_id,
            tenant_id: selectedRequest.tenant_id,
            role: selectedRequest.requested_role as any,
          }]);

        if (roleError) throw roleError;

        // Update request status
        const { error: updateError } = await supabase
          .from('pms_access_requests')
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
          .from('pms_access_requests')
          .update({ 
            status: 'rejected',
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
      SUPERADMIN: 'bg-purple-500',
      INMOBILIARIA: 'bg-blue-500',
      ADMINISTRADOR: 'bg-indigo-500',
      PROPIETARIO: 'bg-green-500',
      INQUILINO: 'bg-yellow-500',
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
                <TableHead>Rol Solicitado</TableHead>
                <TableHead>Motivo</TableHead>
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
                      <span className="font-medium">Usuario #{request.user_id.substring(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{request.user_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(request.requested_role)}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
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
