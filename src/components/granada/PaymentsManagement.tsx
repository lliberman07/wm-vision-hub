import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Plus, CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  proof_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  subscription: {
    tenant: {
      name: string;
    };
    plan: {
      name: string;
    };
  };
}

interface Subscription {
  id: string;
  tenant_id: string;
  billing_cycle: string;
  subscription_code: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  tenant: {
    name: string;
  };
  plan: {
    name: string;
    price_monthly?: number;
    price_yearly?: number;
    currency?: string;
  };
}

export function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    subscription_id: '',
    amount: '',
    currency: 'ARS',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch active subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('tenant_subscriptions' as any)
        .select(`
          id,
          tenant_id,
          billing_cycle,
          subscription_code,
          current_period_start,
          current_period_end,
          tenant:tenant_id (
            name
          ),
          plan:plan_id (
            name,
            price_monthly,
            price_yearly
          )
        `)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscriptions(subsData as any || []);

      // Fetch payments/invoices
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_invoices' as any)
        .select(`
          id,
          subscription_id,
          amount,
          currency,
          due_date,
          payment_method,
          paid_date,
          notes,
          status,
          created_at,
          subscription:subscription_id (
            tenant:tenant_id (
              name
            ),
            plan:plan_id (
              name
            )
          )
        `)
        .order('due_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      
      // Map to Payment interface
      const mappedPayments = (paymentsData as any || []).map((invoice: any) => ({
        id: invoice.id,
        subscription_id: invoice.subscription_id,
        amount: invoice.amount,
        currency: invoice.currency || 'ARS',
        payment_date: invoice.paid_date || invoice.due_date,
        payment_method: invoice.payment_method || 'pendiente',
        proof_url: invoice.payment_proof_url || null,
        notes: invoice.notes,
        status: invoice.status,
        created_at: invoice.created_at,
        subscription: invoice.subscription
      }));
      
      setPayments(mappedPayments);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const subscription = subscriptions.find(s => s.id === formData.subscription_id);
      if (!subscription) throw new Error('Suscripción no encontrada');

      // Validación estricta: el monto debe ser exacto, no se permiten pagos parciales
      const expectedPrice = subscription.billing_cycle === 'yearly' 
        ? (subscription.plan.price_yearly || 0) 
        : (subscription.plan.price_monthly || 0);
      
      if (parseFloat(formData.amount) !== expectedPrice) {
        toast({
          title: 'Monto incorrecto',
          description: `El pago ${subscription.billing_cycle === 'yearly' ? 'anual' : 'mensual'} debe ser exactamente $${expectedPrice.toLocaleString()}. No se permiten pagos parciales.`,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate billing period based on billing_cycle
      const periodStart = new Date(formData.payment_date);
      const periodEnd = new Date(periodStart);
      if (subscription.billing_cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        // Default to monthly
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const { error } = await supabase
        .from('subscription_invoices' as any)
        .insert({
          subscription_id: formData.subscription_id,
          tenant_id: subscription.tenant_id,
          invoice_number: invoiceNumber,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          status: 'paid',
          issue_date: formData.payment_date,
          due_date: formData.payment_date,
          paid_date: formData.payment_date,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          billing_period_start: periodStart.toISOString().split('T')[0],
          billing_period_end: periodEnd.toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({
        title: 'Pago registrado',
        description: 'El pago ha sido registrado exitosamente',
      });

      setDialogOpen(false);
      setFormData({
        subscription_id: '',
        amount: '',
        currency: 'ARS',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transferencia',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error registering payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el pago',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('subscription_invoices' as any)
        .update({ 
          status: newStatus === 'confirmed' ? 'paid' : 'cancelled',
          paid_date: newStatus === 'confirmed' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Pago ${newStatus === 'confirmed' ? 'confirmado' : 'rechazado'} correctamente`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pagado',
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gestión de Pagos
            </CardTitle>
            <CardDescription>
              Historial de pagos de suscripciones
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleRegisterPayment}>
                <DialogHeader>
                  <DialogTitle>Registrar Pago</DialogTitle>
                  <DialogDescription>
                    Registrar un pago de suscripción
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subscription">Suscripción *</Label>
                    <Select
                      value={formData.subscription_id}
                      onValueChange={(value) => {
                        const sub = subscriptions.find(s => s.id === value);
                        const price = sub?.billing_cycle === 'yearly' 
                          ? (sub?.plan.price_yearly || 0) 
                          : (sub?.plan.price_monthly || 0);
                        setFormData({ 
                          ...formData, 
                          subscription_id: value,
                          amount: price.toString(),
                          currency: 'ARS',
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar suscripción" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {subscriptions.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            <span className="font-mono text-xs mr-2">{sub.subscription_code || 'N/A'}</span>
                            {sub.tenant.name} - {sub.plan.name} ({sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.subscription_id && (() => {
                      const selectedSub = subscriptions.find(s => s.id === formData.subscription_id);
                      const expectedPrice = selectedSub?.billing_cycle === 'yearly' 
                        ? (selectedSub?.plan.price_yearly || 0) 
                        : (selectedSub?.plan.price_monthly || 0);
                      return (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Ciclo: {selectedSub?.billing_cycle === 'yearly' ? 'Anual (365 días)' : 'Mensual (30 días)'}
                          </p>
                          <p className="text-xs font-medium text-green-600">
                            💰 Monto del plan: ${expectedPrice.toLocaleString()} ARS
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        El monto se fija automáticamente según el plan. No se permiten pagos parciales.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="currency">Moneda *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment_date">Fecha de Pago *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment_method">Método de Pago *</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Información adicional del pago"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar Pago
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Fecha Pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-xs">
                  {subscriptions.find(s => s.id === payment.subscription_id)?.subscription_code || 'N/A'}
                </TableCell>
                <TableCell className="font-medium">
                  {payment.subscription?.tenant?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  {payment.subscription?.plan?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  {payment.currency} ${payment.amount.toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">{payment.payment_method}</TableCell>
                <TableCell>
                  {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(payment.status)}>
                    {getStatusLabel(payment.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(payment.id, 'confirmed')}
                        title="Confirmar"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(payment.id, 'rejected')}
                        title="Rechazar"
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {payments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay pagos registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
