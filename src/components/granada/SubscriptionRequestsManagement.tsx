import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Clock, Building2, User, Mail, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
}

interface SubscriptionRequest {
  id: string;
  applicant_type: string;
  company_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  cuit_cuil?: string;
  province?: string;
  city?: string;
  requested_plan_id: SubscriptionPlan;
  billing_cycle: string;
  estimated_properties?: number;
  current_system?: string;
  comments?: string;
  status: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
}

export function SubscriptionRequestsManagement() {
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activationType, setActivationType] = useState<'trial' | 'direct' | 'scheduled'>("direct");
  const [trialDays, setTrialDays] = useState("14");
  const [activationDate, setActivationDate] = useState("");
  
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["subscription-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select(`
          *,
          requested_plan_id:subscription_plans!requested_plan_id(id, name, price_monthly, price_yearly)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any as SubscriptionRequest[];
    },
  });

  const processRequestMutation = useMutation({
    mutationFn: async (params: {
      request_id: string;
      action: 'approve' | 'reject';
      review_notes?: string;
      rejection_reason?: string;
      activation_type?: string;
      trial_days?: number;
      activation_date?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'process-subscription-request-approval',
        { body: params }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-requests"] });
      toast.success("Solicitud procesada exitosamente");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error("Error al procesar solicitud", {
        description: error.message,
      });
    },
  });

  const handleOpenDialog = (request: SubscriptionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setReviewNotes("");
    setRejectionReason("");
    setActivationType("direct");
    setTrialDays("14");
    setActivationDate("");
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setReviewNotes("");
    setRejectionReason("");
  };

  const handleProcess = () => {
    if (!selectedRequest || !actionType) return;

    processRequestMutation.mutate({
      request_id: selectedRequest.id,
      action: actionType,
      review_notes: reviewNotes,
      rejection_reason: actionType === 'reject' ? rejectionReason : undefined,
      activation_type: actionType === 'approve' ? activationType : undefined,
      trial_days: actionType === 'approve' && activationType === 'trial' ? parseInt(trialDays) : undefined,
      activation_date: actionType === 'approve' && activationType === 'scheduled' ? activationDate : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      in_review: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      approved: "bg-green-500/10 text-green-700 dark:text-green-400",
      rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
      cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };

    const labels = {
      pending: "Pendiente",
      in_review: "En Revisión",
      approved: "Aprobada",
      rejected: "Rechazada",
      cancelled: "Cancelada",
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const pendingRequests = requests?.filter(r => r.status === 'pending' || r.status === 'in_review');
  const processedRequests = requests?.filter(r => r.status === 'approved' || r.status === 'rejected' || r.status === 'cancelled');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingRequests?.length || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">
                  {requests?.filter(r => r.status === 'approved').length || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold">
                  {requests?.filter(r => r.status === 'rejected').length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{requests?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tables */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes ({pendingRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Procesadas ({processedRequests?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Pendientes</CardTitle>
              <CardDescription>
                Solicitudes que requieren tu revisión y aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.company_name || `${request.first_name} ${request.last_name}`}
                            </p>
                            {request.company_name && (
                              <p className="text-sm text-muted-foreground">
                                {request.first_name} {request.last_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.applicant_type === 'inmobiliaria' && 'Inmobiliaria'}
                            {request.applicant_type === 'administrador_independiente' && 'Administrador'}
                            {request.applicant_type === 'propietario' && 'Propietario'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.requested_plan_id.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${request.billing_cycle === 'annual' 
                                ? request.requested_plan_id.price_yearly 
                                : request.requested_plan_id.price_monthly}
                              /{request.billing_cycle === 'annual' ? 'año' : 'mes'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                            {request.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {request.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(request, 'approve')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Procesadas</CardTitle>
              <CardDescription>
                Historial de solicitudes aprobadas y rechazadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!processedRequests || processedRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay solicitudes procesadas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Fecha Solicitud</TableHead>
                      <TableHead>Fecha Procesado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.company_name || `${request.first_name} ${request.last_name}`}
                            </p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{request.requested_plan_id.name}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.reviewed_at 
                            ? new Date(request.reviewed_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {request.review_notes || request.rejection_reason || '-'}
                          </div>
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

      {/* Process Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'} Solicitud
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.company_name || `${selectedRequest?.first_name} ${selectedRequest?.last_name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalles de la Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="font-medium">{selectedRequest.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ubicación:</span>
                      <p className="font-medium">
                        {selectedRequest.city && selectedRequest.province
                          ? `${selectedRequest.city}, ${selectedRequest.province}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CUIT/CUIL:</span>
                      <p className="font-medium">{selectedRequest.cuit_cuil || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Propiedades estimadas:</span>
                      <p className="font-medium">{selectedRequest.estimated_properties || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sistema actual:</span>
                      <p className="font-medium">{selectedRequest.current_system || '-'}</p>
                    </div>
                  </div>
                  {selectedRequest.comments && (
                    <div>
                      <span className="text-muted-foreground">Comentarios:</span>
                      <p className="mt-1">{selectedRequest.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {actionType === 'approve' && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Activación</Label>
                    <Select value={activationType} onValueChange={(v: any) => setActivationType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial Gratuito</SelectItem>
                        <SelectItem value="direct">Activación Directa (requiere pago)</SelectItem>
                        <SelectItem value="scheduled">Activación Programada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {activationType === 'trial' && (
                    <div className="space-y-2">
                      <Label>Días de Trial</Label>
                      <Input
                        type="number"
                        value={trialDays}
                        onChange={(e) => setTrialDays(e.target.value)}
                        placeholder="14"
                      />
                    </div>
                  )}

                  {activationType === 'scheduled' && (
                    <div className="space-y-2">
                      <Label>Fecha de Activación</Label>
                      <Input
                        type="date"
                        value={activationDate}
                        onChange={(e) => setActivationDate(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>
                  {actionType === 'approve' ? 'Notas de Revisión' : 'Motivo de Rechazo *'}
                </Label>
                <Textarea
                  value={actionType === 'approve' ? reviewNotes : rejectionReason}
                  onChange={(e) => actionType === 'approve' 
                    ? setReviewNotes(e.target.value)
                    : setRejectionReason(e.target.value)
                  }
                  placeholder={
                    actionType === 'approve'
                      ? "Notas internas sobre la aprobación..."
                      : "Explica el motivo del rechazo..."
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processRequestMutation.isPending || (actionType === 'reject' && !rejectionReason)}
            >
              {processRequestMutation.isPending ? "Procesando..." : (
                actionType === 'approve' ? 'Aprobar y Crear Cuenta' : 'Rechazar Solicitud'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
