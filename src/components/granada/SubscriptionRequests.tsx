import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, Plus, RefreshCw } from 'lucide-react';
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

interface TrialSubscription {
  id: string;
  tenant_id: string;
  tenant_name: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: string;
  status: string;
  created_at: string;
  trial_end_date: string | null;
  current_period_start: string;
  current_period_end: string;
}

export function SubscriptionRequests() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [trialSubscriptions, setTrialSubscriptions] = useState<TrialSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<TrialSubscription | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [dialogContext, setDialogContext] = useState<'change' | 'trial'>('change');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchChangeRequests(), fetchTrialSubscriptions()]);
    setLoading(false);
  };

  const fetchChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_change_requests')
        .select(`
          *,
          pms_tenants!subscription_change_requests_tenant_id_fkey(name),
          current_plan:subscription_plans!subscription_change_requests_current_plan_id_fkey(name),
          requested_plan:subscription_plans!subscription_change_requests_requested_plan_id_fkey(name)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: ChangeRequest[] = await Promise.all(
        (data || []).map(async (req: any) => {
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
            current_plan_name: req.current_plan?.name || 'Sin plan',
            requested_plan_id: req.requested_plan_id,
            requested_plan_name: req.requested_plan?.name || 'N/A',
            reason: req.reason,
            status: req.status || 'pending',
            requested_at: req.requested_at,
            reviewed_at: req.reviewed_at,
            reviewed_by: req.reviewed_by
          };
        })
      );

      setChangeRequests(formattedRequests);
    } catch (error: any) {
      console.error('Error fetching change requests:', error);
      toast.error('Error al cargar solicitudes de cambio');
    }
  };

  const fetchTrialSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          pms_tenants(name),
          subscription_plans(name)
        `)
        .or('status.eq.trial,status.eq.pending')
        .not('trial_end_date', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trial subscriptions:', error);
        throw error;
      }

      const formatted: TrialSubscription[] = (data || []).map((sub: any) => ({
        id: sub.id,
        tenant_id: sub.tenant_id,
        tenant_name: sub.pms_tenants?.name || 'N/A',
        plan_id: sub.plan_id,
        plan_name: sub.subscription_plans?.name || 'N/A',
        billing_cycle: sub.billing_cycle,
        status: sub.status,
        created_at: sub.created_at,
        trial_end_date: sub.trial_end_date,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
      }));

      setTrialSubscriptions(formatted);
    } catch (error: any) {
      console.error('Error fetching trial subscriptions:', error);
      toast.error(`Error al cargar suscripciones: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleApproveChange = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_subscription_request', {
        p_request_id: requestId,
        p_trial_days: 0
      });

      if (error) throw error;

      toast.success('Solicitud de cambio aprobada');
      fetchChangeRequests();
    } catch (error: any) {
      console.error('Error approving change:', error);
      toast.error('Error al aprobar cambio');
    } finally {
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleRejectChange = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_change_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud de cambio rechazada');
      fetchChangeRequests();
    } catch (error: any) {
      console.error('Error rejecting change:', error);
      toast.error('Error al rechazar cambio');
    } finally {
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleActivateTrial = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Suscripción activada exitosamente');
      fetchTrialSubscriptions();
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      toast.error('Error al activar suscripción');
    } finally {
      setSelectedTrial(null);
      setActionType(null);
    }
  };

  const handleCancelTrial = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_reason: 'Trial cancelado por administrador'
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Trial cancelado');
      fetchTrialSubscriptions();
    } catch (error: any) {
      console.error('Error canceling trial:', error);
      toast.error('Error al cancelar trial');
    } finally {
      setSelectedTrial(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string, trialEndDate?: string | null) => {
    if (status === 'trial' && trialEndDate) {
      const daysLeft = Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return <Badge variant="outline" className="gap-1 bg-primary text-primary-foreground"><Clock className="h-3 w-3" /> Trial ({daysLeft} días)</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'trial':
        return <Badge variant="outline" className="gap-1 bg-primary text-primary-foreground"><Clock className="h-3 w-3" /> Trial</Badge>;
      case 'approved':
      case 'active':
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingChanges = changeRequests.filter(r => r.status === 'pending').length;
  const approvedChanges = changeRequests.filter(r => r.status === 'approved').length;
  const trialsCount = trialSubscriptions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials Activos</CardTitle>
            <Plus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialsCount}</div>
            <p className="text-xs text-muted-foreground">Periodo de prueba</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios Pendientes</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChanges}</div>
            <p className="text-xs text-muted-foreground">Por revisar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedChanges}</div>
            <p className="text-xs text-muted-foreground">Procesados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeRequests.length}</div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trials" className="gap-2">
            <Plus className="h-4 w-4" />
            Suscripciones en Trial ({trialsCount})
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Cambios de Plan ({pendingChanges})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones en Periodo de Prueba</CardTitle>
              <CardDescription>
                Clientes en periodo de prueba que pueden ser activados o cancelados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialSubscriptions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Plus className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay suscripciones en periodo de prueba</p>
                  <p className="text-sm text-muted-foreground">
                    Las nuevas suscripciones de prueba aparecerán aquí automáticamente
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inicio Trial</TableHead>
                      <TableHead>Fin Trial</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialSubscriptions.map((sub) => {
                      const daysLeft = sub.trial_end_date 
                        ? Math.ceil((new Date(sub.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.tenant_name}</TableCell>
                          <TableCell className="font-semibold text-primary">{sub.plan_name}</TableCell>
                          <TableCell className="capitalize">
                            {sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status, sub.trial_end_date)}</TableCell>
                          <TableCell>
                            {format(new Date(sub.current_period_start), "d 'de' MMM, yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{sub.trial_end_date ? format(new Date(sub.trial_end_date), "d 'de' MMM, yyyy", { locale: es }) : '-'}</span>
                              {daysLeft > 0 && (
                                <span className={`text-xs ${daysLeft <= 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  {daysLeft} días restantes
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedTrial(sub);
                                  setActionType('approve');
                                  setDialogContext('trial');
                                }}
                              >
                                Activar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedTrial(sub);
                                  setActionType('reject');
                                  setDialogContext('trial');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Cambio de Plan</CardTitle>
              <CardDescription>
                Gestionar solicitudes de cambio de suscripción de los clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeRequests.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay solicitudes de cambio registradas</p>
                  <p className="text-sm text-muted-foreground">
                    Las solicitudes de cambio de plan aparecerán aquí cuando los clientes las envíen
                  </p>
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
                    {changeRequests.map((request) => (
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
                                  setDialogContext('change');
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
                                  setDialogContext('change');
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
        </TabsContent>
      </Tabs>

      <AlertDialog open={actionType !== null} onOpenChange={() => {
        setSelectedRequest(null);
        setSelectedTrial(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? '¿Aprobar solicitud?' : '¿Rechazar solicitud?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContext === 'trial' ? (
                actionType === 'approve' ? (
                  <>
                    Se activará permanentemente la suscripción de <strong>{selectedTrial?.tenant_name}</strong> al plan{' '}
                    <strong>{selectedTrial?.plan_name}</strong>, finalizando el periodo de prueba.
                  </>
                ) : (
                  <>
                    Se cancelará la suscripción en trial de <strong>{selectedTrial?.tenant_name}</strong>. 
                    El cliente perderá acceso al finalizar el periodo de prueba.
                  </>
                )
              ) : (
                actionType === 'approve' ? (
                  <>
                    Se cambiará el plan de <strong>{selectedRequest?.tenant_name}</strong> de{' '}
                    <strong>{selectedRequest?.current_plan_name}</strong> a{' '}
                    <strong>{selectedRequest?.requested_plan_name}</strong>.
                  </>
                ) : (
                  <>
                    Se rechazará la solicitud de cambio de plan de <strong>{selectedRequest?.tenant_name}</strong>.
                  </>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogContext === 'trial' && selectedTrial) {
                  if (actionType === 'approve') {
                    handleActivateTrial(selectedTrial.id);
                  } else {
                    handleCancelTrial(selectedTrial.id);
                  }
                } else if (dialogContext === 'change' && selectedRequest) {
                  if (actionType === 'approve') {
                    handleApproveChange(selectedRequest.id);
                  } else {
                    handleRejectChange(selectedRequest.id);
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
