import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { useNavigate } from 'react-router-dom';

export function SubscriptionStatusBanner() {
  const { subscriptionStatus, loading } = useSubscriptionFeatures();
  const navigate = useNavigate();

  if (loading || !subscriptionStatus) return null;

  // No subscription
  if (!subscriptionStatus.has_subscription) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin suscripción activa</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Necesitas una suscripción activa para usar el sistema.</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/pms/subscription')}>
            Ver Planes
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { subscription, pending_invoice } = subscriptionStatus;

  // Suspended subscription
  if (subscription?.status === 'suspended') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Suscripción Suspendida</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Tu suscripción está suspendida por falta de pago. El acceso está limitado.</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/pms/invoices')}>
            Ver Facturas
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Past due invoice
  if (pending_invoice && pending_invoice.status === 'overdue') {
    return (
      <Alert variant="destructive" className="mb-4">
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Factura Vencida</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Tienes una factura vencida hace {pending_invoice.days_overdue} días por ${pending_invoice.amount.toLocaleString()}.
            {pending_invoice.days_overdue >= 10 && ' Tu cuenta será suspendida pronto.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/pms/invoices')}>
            Pagar Ahora
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Pending invoice (due soon)
  if (pending_invoice && pending_invoice.status === 'pending') {
    const daysUntilDue = new Date(pending_invoice.due_date).getTime() - new Date().getTime();
    const daysRemaining = Math.ceil(daysUntilDue / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 7) {
      return (
        <Alert className="mb-4 border-amber-500">
          <Clock className="h-4 w-4 text-amber-500" />
          <AlertTitle>Factura Próxima a Vencer</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Tienes una factura de ${pending_invoice.amount.toLocaleString()} que vence en {daysRemaining} días.
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/pms/invoices')}>
              Ver Detalles
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Trial ending soon
  if (subscription?.status === 'trial' && subscription.days_remaining <= 7) {
    return (
      <Alert className="mb-4 border-blue-500">
        <Clock className="h-4 w-4 text-blue-500" />
        <AlertTitle>Período de Prueba</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Quedan {subscription.days_remaining} días de tu período de prueba.
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/pms/subscription')}>
            Ver Planes
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}