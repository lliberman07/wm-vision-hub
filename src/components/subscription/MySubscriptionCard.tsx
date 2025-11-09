import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Building2, FileText, GitBranch, Calendar, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function MySubscriptionCard() {
  const { subscriptionStatus, loading, getUsagePercentage } = useSubscriptionFeatures();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus?.has_subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Suscripción</CardTitle>
          <CardDescription>Activa una suscripción para usar el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/pms/subscription')}>Ver Planes</Button>
        </CardContent>
      </Card>
    );
  }

  const { subscription, plan, usage, pending_invoice } = subscriptionStatus;

  const getStatusBadge = () => {
    if (!subscription) return null;

    const statusConfig = {
      trial: { label: 'Prueba', variant: 'secondary' as const },
      active: { label: 'Activa', variant: 'default' as const },
      past_due: { label: 'Pago Atrasado', variant: 'destructive' as const },
      suspended: { label: 'Suspendida', variant: 'destructive' as const },
      cancelled: { label: 'Cancelada', variant: 'outline' as const },
    };

    const config = statusConfig[subscription.status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const usageItems = [
    { icon: Users, label: 'Usuarios', current: usage?.user_count || 0, limit: plan?.max_users, type: 'user' as const },
    { icon: Building2, label: 'Propiedades', current: usage?.property_count || 0, limit: plan?.max_properties, type: 'property' as const },
    { icon: FileText, label: 'Contratos', current: usage?.contract_count || 0, limit: plan?.max_contracts, type: 'contract' as const },
    { icon: GitBranch, label: 'Sucursales', current: usage?.branch_count || 0, limit: plan?.max_branches, type: 'branch' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Plan {plan?.name}
            </CardTitle>
            <CardDescription>
              {subscription?.billing_cycle === 'monthly' ? 'Facturación Mensual' : 'Facturación Anual'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Período actual */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Período actual</span>
          </div>
          <span className="font-medium">
            {subscription?.days_remaining} días restantes
          </span>
        </div>

        {/* Factura pendiente */}
        {pending_invoice && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">
                  {pending_invoice.status === 'overdue' ? 'Factura Vencida' : 'Próxima Factura'}
                </span>
              </div>
              <span className="text-sm font-bold">${pending_invoice.amount.toLocaleString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/pms/invoices')}
            >
              Ver Facturas
            </Button>
          </div>
        )}

        {/* Uso de recursos */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Uso de Recursos</h4>
          {usageItems.map((item) => {
            const percentage = getUsagePercentage(item.type);
            const isNearLimit = percentage >= 80;
            const isAtLimit = percentage >= 100;
            const isUnlimited = item.limit === null;

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : ''}`}>
                    {item.current} / {isUnlimited ? '∞' : item.limit}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isAtLimit ? '[&>*]:bg-destructive' : isNearLimit ? '[&>*]:bg-amber-500' : ''}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/pms/subscription')}
          >
            Ver Planes
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={() => navigate('/pms/subscription')}
          >
            Mejorar Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}