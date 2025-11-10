import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Eye, Clock, Package, Award, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionRequest {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  tax_id: string;
  billing_cycle: string;
  payment_method: string;
  reason: string;
  status: string;
  desired_plan_id: string;
  subscription_plans: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    currency: string;
  };
}

export default function SubscriptionRequestsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [trialDays, setTrialDays] = useState('14');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['subscription-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_access_requests')
        .select(`
          *,
          subscription_plans:desired_plan_id (
            id,
            name,
            slug,
            description,
            price_monthly,
            price_yearly,
            currency
          )
        `)
        .not('desired_plan_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, days }: { requestId: string; days: number }) => {
      const { data, error } = await supabase.rpc('approve_subscription_request', {
        p_request_id: requestId,
        p_trial_days: days
      });

      if (error) throw error;

      // Send approval email
      const request = requests?.find(r => r.id === requestId);
      if (request) {
        const result: any = data;
        await supabase.functions.invoke('send-subscription-approval', {
          body: {
            email: request.email,
            name: `${request.first_name} ${request.last_name}`,
            company_name: request.company_name || request.email,
            plan_name: request.subscription_plans.name,
            trial_days: days,
            amount: request.billing_cycle === 'yearly' 
              ? request.subscription_plans.price_yearly 
              : request.subscription_plans.price_monthly,
            billing_cycle: request.billing_cycle,
            due_date: result.trial_end
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Suscripción aprobada",
        description: "El tenant ha sido creado con período de prueba"
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      setApproveDialogOpen(false);
      setDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('pms_access_requests')
        .update({ status: 'denied', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada"
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al rechazar la solicitud",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanIcon = (slug: string) => {
    if (slug.includes('basico')) return Package;
    if (slug.includes('profesional')) return Award;
    return Rocket;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Suscripción</CardTitle>
          <CardDescription>
            Gestiona las solicitudes de suscripción al sistema PMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((request) => {
                const IconComponent = getPlanIcon(request.subscription_plans.slug);
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {request.first_name} {request.last_name}
                      {request.company_name && (
                        <div className="text-xs text-muted-foreground">{request.company_name}</div>
                      )}
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span>{request.subscription_plans.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {requests?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes de suscripción
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de suscripción
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Empresa</Label>
                  <p className="font-medium">{selectedRequest.company_name || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Plan Solicitado</Label>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const IconComponent = getPlanIcon(selectedRequest.subscription_plans.slug);
                    return <IconComponent className="h-5 w-5 text-primary" />;
                  })()}
                  <span className="font-bold">{selectedRequest.subscription_plans.name}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedRequest.billing_cycle === 'yearly' 
                    ? `${selectedRequest.subscription_plans.currency} $${(selectedRequest.subscription_plans.price_yearly || 0).toLocaleString()} /año`
                    : `${selectedRequest.subscription_plans.currency} $${(selectedRequest.subscription_plans.price_monthly || 0).toLocaleString()} /mes`
                  }
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Método de Pago</Label>
                <p className="font-medium">{selectedRequest.payment_method}</p>
              </div>

              {selectedRequest.reason && (
                <div>
                  <Label className="text-muted-foreground">Comentarios</Label>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(selectedRequest.id)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Rechazar
                </Button>
                <Button
                  onClick={() => setApproveDialogOpen(true)}
                >
                  Aprobar Suscripción
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Suscripción</DialogTitle>
            <DialogDescription>
              Configurar período de prueba y aprobar la suscripción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trial_days">Días de Prueba Gratis</Label>
              <Input
                id="trial_days"
                type="number"
                min="0"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se creará el tenant y la suscripción en estado "trial"
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  approveMutation.mutate({
                    requestId: selectedRequest.id,
                    days: parseInt(trialDays)
                  });
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aprobar y Crear Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
