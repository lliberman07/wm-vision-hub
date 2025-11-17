import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface ChangeRequest {
  id: string;
  tenant_id: string;
  tenant_name: string;
  requested_by: string;
  requester_name: string;
  current_plan_id: string | null;
  current_plan_name: string;
  requested_plan_id: string;
  requested_plan_name: string;
  reason: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function SubscriptionChangeRequests() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subscription_change_requests')
        .select(`
          *,
          pms_tenants!subscription_change_requests_tenant_id_fkey(name),
          subscription_plans!subscription_change_requests_current_plan_id_fkey(name),
          subscription_plans!subscription_change_requests_requested_plan_id_fkey(name)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: ChangeRequest[] = await Promise.all(
        (data || []).map(async (req: any) => {
          // Get requester name
          const { data: userData } = await supabase
            .from('pms_client_users')
            .select('first_name, last_name')
            .eq('user_id', req.requested_by)
            .single();

          return {
            id: req.id,
            tenant_id: req.tenant_id,
            tenant_name: req.pms_tenants?.name || 'N/A',
            requested_by: req.requested_by,
            requester_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Usuario',
            current_plan_id: req.current_plan_id,
            current_plan_name: req.subscription_plans?.name || 'Sin plan',
            requested_plan_id: req.requested_plan_id,
            requested_plan_name: req.subscription_plans?.name || 'N/A',
            reason: req.reason,
            status: req.status || 'pending',
            requested_at: req.requested_at,
            reviewed_at: req.reviewed_at,
            reviewed_by: req.reviewed_by
          };
        })
      );

      setRequests(formattedRequests);
    } catch (error: any) {
      console.error('Error fetching change requests:', error);
      toast.error('Error al cargar solicitudes de cambio');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_subscription_request', {
        p_request_id: requestId,
        p_trial_days: 0
      });

      if (error) throw error;

      toast.success('Solicitud aprobada exitosamente');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_change_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud rechazada');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar la solicitud');
    } finally {
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Cambio de Plan</CardTitle>
          <CardDescription>
            Gestionar solicitudes de cambio de suscripción de los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay solicitudes de cambio registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Plan Actual</TableHead>
                  <TableHead>Plan Solicitado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.tenant_name}</TableCell>
                    <TableCell>{request.requester_name}</TableCell>
                    <TableCell>{request.current_plan_name}</TableCell>
                    <TableCell className="font-semibold text-primary">{request.requested_plan_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_at), "d 'de' MMM, yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                            }}
                          >
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
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {request.reviewed_at && format(new Date(request.reviewed_at), "d/MM/yy", { locale: es })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={actionType !== null} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? '¿Aprobar solicitud?' : '¿Rechazar solicitud?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? (
                <>
                  Se cambiará el plan de <strong>{selectedRequest?.tenant_name}</strong> de{' '}
                  <strong>{selectedRequest?.current_plan_name}</strong> a{' '}
                  <strong>{selectedRequest?.requested_plan_name}</strong>.
                </>
              ) : (
                <>
                  Se rechazará la solicitud de cambio de plan de <strong>{selectedRequest?.tenant_name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRequest) {
                  if (actionType === 'approve') {
                    handleApprove(selectedRequest.id);
                  } else {
                    handleReject(selectedRequest.id);
                  }
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
